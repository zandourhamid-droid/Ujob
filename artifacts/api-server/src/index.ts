import app from "./app";
import { logger } from "./lib/logger";
import { ensureSeedData } from "./lib/seed";
import { isStripeConfigured } from "./lib/stripeClient";

const port = Number(process.env.PORT || 5000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

async function initializeStripe() {
  if (!isStripeConfigured()) {
    logger.warn("Stripe keys are not set. Wallet top-ups will use sandbox until STRIPE_SECRET_KEY is provided.");
    return;
  }
  logger.info("Stripe is configured for wallet top-ups.");
}

async function bootstrap() {
  await ensureSeedData();
  await initializeStripe();
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to initialize Ujobs API");
  process.exit(1);
});
