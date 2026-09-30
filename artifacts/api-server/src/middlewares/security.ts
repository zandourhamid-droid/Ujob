import type { NextFunction, Request, Response } from "express";

const windowMs = 60_000;
const maxRequests = 120;
const requests = new Map<string, { startedAt: number; count: number }>();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || now - current.startedAt > windowMs) {
    requests.set(key, { startedAt: now, count: 1 });
    next();
    return;
  }
  current.count += 1;
  if (current.count > maxRequests) {
    res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    return;
  }
  next();
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}