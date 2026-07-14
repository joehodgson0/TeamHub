/**
 * Payment Provider Types
 * 
 * These interfaces define the contract for payment providers.
 * They are provider-agnostic, allowing easy switching between
 * Stripe, SumUp, or other payment processors.
 */

/**
 * Parameters for creating a checkout session
 */
export interface CreateCheckoutParams {
  /** Amount in smallest currency unit (e.g., pence for GBP) */
  amount: number;
  /** ISO currency code (e.g., "gbp") */
  currency: string;
  /** Description shown to customer (fee name) */
  description: string;
  /** Customer's email address */
  customerEmail: string;
  /** Metadata to attach to the payment for reconciliation */
  metadata: {
    feeAssignmentId: string;
    feeId: string;
    playerId: string;
    userId: string;
  };
  /** URL to redirect on successful payment */
  successUrl: string;
  /** URL to redirect on cancelled payment */
  cancelUrl: string;
}

/**
 * Result from creating a checkout session
 */
export interface CheckoutResult {
  /** URL to redirect customer to for hosted checkout */
  checkoutUrl: string;
  /** Provider's unique session/transaction ID */
  sessionId: string;
}

/**
 * Parsed webhook event from payment provider
 */
export interface WebhookEvent {
  /** Event type */
  type: "payment.succeeded" | "payment.failed" | "payment.refunded";
  /** Provider's session/checkout ID */
  sessionId: string;
  /** Payment amount in smallest currency unit */
  amount: number;
  /** Metadata attached when checkout was created */
  metadata: Record<string, string>;
  /** Provider's payment/charge ID (for refunds) */
  paymentId?: string;
  /** Receipt URL if available */
  receiptUrl?: string;
}

/**
 * Supported payment providers
 */
export type PaymentProviderType = "stripe" | "sumup" | "manual";
