import type Stripe from "stripe";
import { getStripeWebhookSecret, getUncachableStripeClient } from "./stripeClient";
import { creditSucceededStripeTopup } from "./stripeTopup";
import { logger } from "./logger";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error("Stripe webhook payload must be a Buffer.");
    }
    const stripe = await getUncachableStripeClient();
    const webhookSecret = await getStripeWebhookSecret();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await creditSucceededStripeTopup(paymentIntent.id);
      logger.info({ paymentIntentId: paymentIntent.id }, "Credited Stripe wallet top-up");
    }
  }
}
