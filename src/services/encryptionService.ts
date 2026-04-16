/**
 * Encryption Service
 * Handles client-side AES-256-GCM encryption and decryption.
 * The encryption key never leaves the user's machine.
 */

export class EncryptionService {
  private static ALGORITHM = 'AES-GCM';
  private static KEY_LENGTH = 256;

  /**
   * Generates a random AES-256 key.
   */
  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Exports a CryptoKey to a base64 string.
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Imports a CryptoKey from a base64 string.
   */
  static async importKey(base64Key: string): Promise<CryptoKey> {
    const binary = atob(base64Key);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return await window.crypto.subtle.importKey(
      'raw',
      bytes,
      this.ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts a file using AES-256-GCM.
   * Returns the encrypted blob (IV + ciphertext).
   */
  static async encryptFile(file: File, key: CryptoKey): Promise<Blob> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileData = await file.arrayBuffer();

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      fileData
    );

    // Combine IV and ciphertext into a single blob
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return new Blob([combined], { type: 'application/octet-stream' });
  }

  /**
   * Decrypts an encrypted blob using AES-256-GCM.
   * Returns the original file data as a Blob.
   */
  static async decryptFile(encryptedBlob: Blob, key: CryptoKey): Promise<Blob> {
    const encryptedData = await encryptedBlob.arrayBuffer();
    const iv = new Uint8Array(encryptedData.slice(0, 12));
    const ciphertext = encryptedData.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );

    return new Blob([decrypted]);
  }

  /**
   * Encrypts a string (e.g., the file key) for a recipient using a shared secret or public key.
   * For this DApp, we'll use a simplified version where the owner encrypts the file key
   * with a secret that the recipient can derive or access via the secure token.
   */
  static async encryptKeyForRecipient(fileKey: string, recipientSecret: string): Promise<string> {
    // This is a placeholder for a more advanced asymmetric encryption flow.
    // For now, we'll use AES-GCM with the recipient's secret (token).
    const encoder = new TextEncoder();
    const secretKey = await this.deriveKeyFromSecret(recipientSecret);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const data = encoder.encode(fileKey);

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      secretKey,
      data
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decryptKeyForRecipient(encryptedKeyBase64: string, recipientSecret: string): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedKeyBase64).split('').map((c) => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const secretKey = await this.deriveKeyFromSecret(recipientSecret);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      secretKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  private static async deriveKeyFromSecret(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return await window.crypto.subtle.importKey(
      'raw',
      hash,
      this.ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );
  }
}
