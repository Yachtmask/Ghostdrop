/**
 * Email Service
 * Handles sending secure recipient links.
 * In production, this would integrate with a real email provider.
 */

export class EmailService {
  /**
   * Sends a secure vault access link to a recipient.
   */
  static async sendAccessLink(
    recipientEmail: string,
    vaultName: string,
    accessToken: string,
    vaultId: string
  ): Promise<boolean> {
    const accessUrl = `${window.location.origin}/vault/${vaultId}/access?token=${accessToken}`;

    console.log(`>>> Sending email to ${recipientEmail}...`);
    console.log(`>>> Vault: ${vaultName}`);
    console.log(`>>> Access Link: ${accessUrl}`);

    // Mocking the email sending process
    // In a real app, this would be a server-side call to an email provider
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Secure Vault Access: ${vaultName}`,
          body: `You have been granted access to a secure vault: ${vaultName}. 
                 Please use the following link to access and decrypt the files: ${accessUrl}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email.');
      }

      return true;
    } catch (error) {
      console.error('Email service failed:', error);
      // For demo purposes, we'll return true even if the mock API fails
      return true;
    }
  }
}
