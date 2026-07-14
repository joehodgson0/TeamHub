/**
 * Payment Provider Interface
 * 
 * Abstract interface that all payment providers must implement.
 * This allows swapping payment providers without changing business logic.
 */

import type { CreateCheckoutParams, CheckoutResult, WebhookEvent } from "./types.js";

/**
 * Payment provider interface
 * 
 * Implementations:
 * - StripeProvider (server/payments/stripe-provider.ts)
 * - SumUpProvider (server/payments/sumup-provider.ts) - future
 */
export interface IPaymentProvider {
  /** Provider name for logging and database records */
  readonly name: "stripe" | "sumup";

  /**
   * Create a hosted checkout session
   * Customer will be redirected to the provider's checkout page
   * 
   * @param params - Checkout parameters
   * @returns Checkout URL and session ID
   */
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>;

  /**
   * Parse and verify a webhook event from the provider
   * 
   * @param body - Raw request body (Buffer or string)
   * @param signature - Webhook signature header
   * @returns Parsed webhook event
   * @throws Error if signature is invalid
   */
  parseWebhook(body: Buffer | string, signature: string): Promise<WebhookEvent>;

  /**
   * Get receipt URL for a completed payment
   * 
   * @param sessionId - Provider's session ID
   * @returns Receipt URL or null if not available
   */
  getReceiptUrl(sessionId: string): Promise<string | null>;
}
