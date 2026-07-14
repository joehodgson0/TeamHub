/**
 * SumUp Payment Provider (Stub)
 * 
 * Placeholder implementation for future SumUp integration.
 * 
 * SumUp API Documentation: https://developer.sumup.com/
 * 
 * To implement:
 * 1. Install SumUp SDK or use REST API directly
 * 2. Configure SUMUP_API_KEY and SUMUP_MERCHANT_CODE env vars
 * 3. Implement createCheckoutSession using SumUp Checkouts API
 * 4. Implement parseWebhook for SumUp webhook events
 * 
 * SumUp Checkouts API:
 * POST https://api.sumup.com/v0.1/checkouts
 * {
 *   "checkout_reference": "unique-ref",
 *   "amount": 20.00,
 *   "currency": "GBP",
 *   "pay_to_email": "merchant@example.com",
 *   "description": "Fee payment"
 * }
 */

import type { IPaymentProvider } from "./payment-provider.js";
import type { CreateCheckoutParams, CheckoutResult, WebhookEvent } from "./types.js";

export class SumUpProvider implements IPaymentProvider {
  readonly name = "sumup" as const;

  constructor() {
    const apiKey = process.env.SUMUP_API_KEY;
    const merchantCode = process.env.SUMUP_MERCHANT_CODE;

    if (!apiKey) {
      throw new Error("SUMUP_API_KEY environment variable is required");
    }
    if (!merchantCode) {
      throw new Error("SUMUP_MERCHANT_CODE environment variable is required");
    }

    // TODO: Initialize SumUp API client
    throw new Error(
      "SumUp payment provider is not yet implemented. " +
      "To contribute, implement the methods in server/payments/sumup-provider.ts"
    );
  }

  async createCheckoutSession(_params: CreateCheckoutParams): Promise<CheckoutResult> {
    // TODO: Implement SumUp Checkouts API
    // POST https://api.sumup.com/v0.1/checkouts
    //
    // const response = await fetch("https://api.sumup.com/v0.1/checkouts", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${this.apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     checkout_reference: params.metadata.feeAssignmentId,
    //     amount: params.amount / 100, // SumUp uses decimal (£20.00, not 2000)
    //     currency: params.currency.toUpperCase(),
    //     pay_to_email: process.env.SUMUP_MERCHANT_EMAIL,
    //     description: params.description,
    //     redirect_url: params.successUrl,
    //   }),
    // });
    // 
    // const checkout = await response.json();
    // return {
    //   checkoutUrl: `https://checkout.sumup.com/pay/${checkout.id}`,
    //   sessionId: checkout.id,
    // };

    throw new Error("SumUp createCheckoutSession not implemented");
  }

  async parseWebhook(_body: Buffer | string, _signature: string): Promise<WebhookEvent> {
    // TODO: Implement SumUp webhook parsing
    // SumUp webhooks: https://developer.sumup.com/docs/webhooks/
    //
    // Verify signature using SUMUP_WEBHOOK_SECRET
    // Parse event type: "CHECKOUT_COMPLETED", "CHECKOUT_FAILED", etc.

    throw new Error("SumUp parseWebhook not implemented");
  }

  async getReceiptUrl(_sessionId: string): Promise<string | null> {
    // TODO: Implement receipt URL retrieval
    // SumUp may not provide receipt URLs via API - check documentation

    throw new Error("SumUp getReceiptUrl not implemented");
  }
}
