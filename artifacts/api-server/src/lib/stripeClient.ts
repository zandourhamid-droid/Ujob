import Stripe from "stripe";

type StripeCredentials = {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
};

async function getStripeCredentials(): Promise<StripeCredentials> {
  const envSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (envSecret) {
    return {
      secretKey: envSecret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPLIT_IDENTITY
    ? `repl ${process.env.REPLIT_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.");
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    items?: Array<{ settings?: Record<string, string> }>;
  };
  const settings = data.items?.[0]?.settings;
  if (!settings?.secret_key) {
    throw new Error("Stripe is not connected or is missing its secret key.");
  }

  return {
    secretKey: settings.secret_key,
    publishableKey: settings.publishable_key ?? settings.public_key ?? "",
    webhookSecret: settings.webhook_secret,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getStripeCredentials();
  if (!publishableKey) throw new Error("Stripe is missing its publishable key.");
  return publishableKey;
}

export async function getStripeWebhookSecret(): Promise<string> {
  const { webhookSecret } = await getStripeCredentials();
  if (!webhookSecret) throw new Error("Stripe is missing its webhook secret.");
  return webhookSecret;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() ||
      (process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPLIT_IDENTITY || process.env.WEB_REPL_RENEWAL)),
  );
}
