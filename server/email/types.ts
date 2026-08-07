/**
 * Email Provider Types
 *
 * Provider-agnostic contract for sending transactional emails
 * (payment reminders, chaser emails, etc). Mirrors the payment
 * provider abstraction in server/payments/types.ts.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  /** Plain-text body */
  text: string;
  /** Optional HTML body */
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  /** Provider message id, if available */
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  name: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}

export type EmailProviderType = "console" | "resend";
