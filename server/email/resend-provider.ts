import type { IEmailProvider, SendEmailParams, SendEmailResult } from "./types";
import { ReplitConnectors } from "@replit/connectors-sdk";

/**
 * Uses the attached Replit Resend connector when available, with a direct
 * API-key fallback for environments outside Replit.
 */
export class ResendEmailProvider implements IEmailProvider {
  name = "resend";
  private fromAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || "TeamHub <onboarding@resend.dev>";
    if (!process.env.REPL_ID && !process.env.REPLIT_CONNECTORS_HOSTNAME && !process.env.RESEND_API_KEY) {
      throw new Error("A Resend connector or RESEND_API_KEY is required");
    }
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const payload = {
        from: this.fromAddress,
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html,
      };

      const response = process.env.REPL_ID || process.env.REPLIT_CONNECTORS_HOSTNAME
        ? await new ReplitConnectors().proxy("resend", "/emails", {
            method: "POST",
            body: payload,
          })
        : await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
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
