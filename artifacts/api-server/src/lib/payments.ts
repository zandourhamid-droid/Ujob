import { randomUUID } from "node:crypto";

export type PaymentProvider = "sandbox" | "cmi" | "payzone" | "naps" | "stripe";

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: "pending" | "succeeded" | "failed" | "refunded";
  clientSecret: string | null;
  externalId?: string | null;
}

export interface PaymentGateway {
  createPaymentIntent(input: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<PaymentIntent>;
  handleWebhook(payload: unknown, signature?: string): Promise<PaymentIntent>;
  refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentIntent>;
  getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent>;
}

export class SandboxPaymentGateway implements PaymentGateway {
  private readonly intents = new Map<string, PaymentIntent>();

  async createPaymentIntent(input: {
    amount: number;
    currency: string;
  }): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: randomUUID(),
      amount: input.amount,
      currency: input.currency,
      provider: "sandbox",
      status: "pending",
      clientSecret: `sandbox_${randomUUID()}`,
    };
    this.intents.set(intent.id, intent);
    return intent;
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = this.requireIntent(paymentIntentId);
    const confirmed = { ...intent, status: "succeeded" as const };
    this.intents.set(paymentIntentId, confirmed);
    return confirmed;
  }

  async handleWebhook(payload: unknown): Promise<PaymentIntent> {
    if (!payload || typeof payload !== "object" || !("paymentIntentId" in payload)) {
      throw new Error("Invalid sandbox webhook");
    }
    return this.confirmPayment(String(payload.paymentIntentId));
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentIntent> {
    const intent = this.requireIntent(paymentIntentId);
    const refunded = { ...intent, amount: amount ?? intent.amount, status: "refunded" as const };
    this.intents.set(paymentIntentId, refunded);
    return refunded;
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent> {
    return this.requireIntent(paymentIntentId);
  }

  private requireIntent(paymentIntentId: string): PaymentIntent {
    const intent = this.intents.get(paymentIntentId);
    if (!intent) throw new Error("Payment intent not found");
    return intent;
  }
}

export const paymentGateway: PaymentGateway = new SandboxPaymentGateway();