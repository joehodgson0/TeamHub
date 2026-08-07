import type { IEmailProvider, SendEmailParams, SendEmailResult } from "./types";

/**
 * Resend email provider - sends real email via the Resend HTTP API.
 * Only used when RESEND_API_KEY is set; otherwise the console
 * provider is used instead. No extra npm dependency required since
 * it uses the global fetch API (Node 18+).
 */
export class ResendEmailProvider implements IEmailProvider {
  name = "resend";
  private apiKey: string;
  private fromAddress: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || "TeamHub <noreply@teamhub.app>";
    if (!this.apiKey) {
      throw new Error("RESEND_API_KEY is required to use the Resend email provider");
    }
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[email:resend] Failed to send (${response.status}): ${errorBody}`);
        return { success: false, error: `Resend API error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error("[email:resend] Error sending email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
}
