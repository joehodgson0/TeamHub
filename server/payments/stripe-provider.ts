/**
 * Stripe Payment Provider
 * 
 * Implementation of IPaymentProvider using Stripe SDK.
 * Uses Stripe Checkout for hosted payment pages.
 */

import Stripe from "stripe";
import type { IPaymentProvider } from "./payment-provider.js";
import type { CreateCheckoutParams, CheckoutResult, WebhookEvent } from "./types.js";

export class StripeProvider implements IPaymentProvider {
  readonly name = "stripe" as const;
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
    }

    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      metadata: params.metadata,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session URL");
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async parseWebhook(body: Buffer | string, signature: string): Promise<WebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(
      body,
      signature,
      this.webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: "payment.succeeded",
          sessionId: session.id,
          amount: session.amount_total || 0,
          metadata: (session.metadata as Record<string, string>) || {},
          paymentId: session.payment_intent as string | undefined,
          receiptUrl: undefined, // Will be fetched separately if needed
        };
      }

      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
        return {
          type: "payment.failed",
          sessionId: "id" in session ? session.id : "",
          amount: 0,
          metadata: (session.metadata as Record<string, string>) || {},
        };
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        return {
          type: "payment.refunded",
          sessionId: charge.payment_intent as string || "",
          amount: charge.amount_refunded,
          metadata: (charge.metadata as Record<string, string>) || {},
          paymentId: charge.id,
        };
      }

      default:
        throw new Error(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  async getReceiptUrl(sessionId: string): Promise<string | null> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent.latest_charge"],
      });

      const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
      if (!paymentIntent) return null;

      const charge = paymentIntent.latest_charge as Stripe.Charge | null;
      return charge?.receipt_url || null;
    } catch (error) {
      console.error("Failed to get Stripe receipt URL:", error);
      return null;
    }
  }
}
