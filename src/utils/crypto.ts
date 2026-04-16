export async function encryptFile(file: File): Promise<{ ciphertext: Uint8Array, aesKey: string, iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const arrayBuffer = await file.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    arrayBuffer
  );

  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const aesKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    ciphertext: new Uint8Array(encryptedBuffer),
    aesKey: aesKeyBase64,
    iv: ivBase64
  };
}

export async function decryptFile(ciphertext: Uint8Array, aesKeyBase64: string, ivBase64: string): Promise<Uint8Array> {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const rawKey = Uint8Array.from(atob(aesKeyBase64), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new Uint8Array(decryptedBuffer);
}

// Simple password-based encryption for the key package
export async function encryptKeyPackage(aesKeyBase64: string, ivBase64: string, password: string, personalMessage?: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataToEncrypt = enc.encode(JSON.stringify({ aesKey: aesKeyBase64, iv: ivBase64, personalMessage }));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataToEncrypt
  );

  const encryptedArray = new Uint8Array(encrypted);
  
  // Combine salt, iv, and ciphertext into a single base64 string
  const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(encryptedArray, salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptKeyPackage(encryptedPackageBase64: string, password: string): Promise<{ aesKey: string, iv: string, personalMessage?: string }> {
  const combined = Uint8Array.from(atob(encryptedPackageBase64), c => c.charCodeAt(0));
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}
