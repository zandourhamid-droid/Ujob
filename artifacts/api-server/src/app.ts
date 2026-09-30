import path from "node:path";
import { existsSync } from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimit, securityHeaders } from "./middlewares/security";
import { WebhookHandlers } from "./lib/webhookHandlers";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(securityHeaders);
app.use(rateLimit);

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      await WebhookHandlers.processWebhook(
        req.body as Buffer,
        Array.isArray(signature) ? signature[0] : signature,
      );
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ error }, "Stripe webhook processing failed");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const publicDir = path.resolve(process.cwd(), "artifacts/ujobs/dist/public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
