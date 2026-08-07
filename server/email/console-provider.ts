import type { IEmailProvider, SendEmailParams, SendEmailResult } from "./types";

/**
 * Console email provider - logs emails instead of sending them.
 * Used by default in development/test, or whenever no real email
 * provider is configured, so the reminder service always has
 * somewhere safe to "deliver" to.
 */
export class ConsoleEmailProvider implements IEmailProvider {
  name = "console";

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    console.log(`[email:console] To: ${params.to} | Subject: ${params.subject}`);
    console.log(`[email:console] Body: ${params.text}`);
    return { success: true, messageId: `console_${Date.now()}` };
  }
}
