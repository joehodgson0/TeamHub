/**
 * Payment Provider Factory
 * 
 * Returns the configured payment provider based on PAYMENT_PROVIDER env var.
 * Defaults to Stripe if not specified.
 */

import type { IPaymentProvider } from "./payment-provider";
import type { PaymentProviderType } from "./types";
import { StripeProvider } from "./stripe-provider";
// import { SumUpProvider } from "./sumup-provider"; // Future

// Singleton instance
let providerInstance: IPaymentProvider | null = null;

/**
 * Get the configured payment provider
 * 
 * Uses PAYMENT_PROVIDER env var to determine which provider to use.
 * Defaults to "stripe" if not set.
 * 
 * @returns Payment provider instance (singleton)
 */
export function getPaymentProvider(): IPaymentProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const providerType = (process.env.PAYMENT_PROVIDER || "stripe") as PaymentProviderType;

  switch (providerType) {
    case "stripe":
      providerInstance = new StripeProvider();
      break;

    case "sumup":
      // Future: Uncomment when SumUpProvider is implemented
      // providerInstance = new SumUpProvider();
      throw new Error("SumUp payment provider is not yet implemented. Set PAYMENT_PROVIDER=stripe");

    case "manual":
      throw new Error("Manual payments don't use a payment provider");

    default:
      throw new Error(`Unknown payment provider: ${providerType}. Supported: stripe, sumup`);
  }

  console.log(`Payment provider initialized: ${providerInstance.name}`);
  return providerInstance;
}

/**
 * Get the current payment provider type from environment
 */
export function getPaymentProviderType(): PaymentProviderType {
  return (process.env.PAYMENT_PROVIDER || "stripe") as PaymentProviderType;
}

/**
 * Check if payment provider is configured and available
 */
export function isPaymentProviderConfigured(): boolean {
  try {
    // Check required env vars based on provider type
    const providerType = getPaymentProviderType();

    if (providerType === "stripe") {
      return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    }

    if (providerType === "sumup") {
      return !!(process.env.SUMUP_API_KEY && process.env.SUMUP_MERCHANT_CODE);
    }

    return false;
  } catch {
    return false;
  }
}

// Re-export types for convenience
export type { IPaymentProvider } from "./payment-provider";
export type { CreateCheckoutParams, CheckoutResult, WebhookEvent, PaymentProviderType } from "./types";
