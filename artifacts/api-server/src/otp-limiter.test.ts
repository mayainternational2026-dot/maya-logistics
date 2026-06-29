/**
 * Integration tests for OTP rate-limit middleware.
 *
 * These tests spin up a lightweight express app that applies the same
 * keyGenerator functions and limiter configuration used in app.ts —
 * including email-case normalisation — and then fires real HTTP requests
 * via supertest to verify that:
 *
 *  1. /api/auth/register-otp returns 429 after the per-email threshold.
 *  2. /api/auth/forgot-password returns 429 after the per-email threshold.
 *  3. Mixed-case email variants ("User@…" vs "user@…") share one bucket.
 *  4. The per-IP limiter fires independently of the email limiter.
 */

import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import { rateLimit, type Options } from "express-rate-limit";
import request from "supertest";

// ── Replica of the getRealIp helper from app.ts ──────────────────────────────
// (Kept in sync: any change there must be reflected here.)
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function getRealIp(req: express.Request): string {
  const socketIp = req.socket.remoteAddress ?? "unknown";
  if (!LOOPBACK.has(socketIp)) return socketIp;
  const xff = req.headers["x-forwarded-for"];
  if (!xff) return socketIp;
  const chain = (Array.isArray(xff) ? xff.join(",") : xff).split(",");
  const proxied = chain[chain.length - 1]?.trim();
  return proxied || socketIp;
}

// ── Test-app builder ──────────────────────────────────────────────────────────
// Builds an express app that mirrors the production middleware stack for a
// given route, but with configurable limits so tests finish quickly.

interface LimiterConfig {
  /** Per-IP request limit for this route. */
  ipLimit: number;
  /** Per-email request limit for this route. */
  emailLimit: number;
  /** Key prefix used by the email limiter (e.g. "reg-email:" or "fp-email:"). */
  emailKeyPrefix: string;
  /** Key prefix used for the IP fallback in the email limiter. */
  ipFallbackPrefix: string;
}

function buildApp(
  route: string,
  { ipLimit, emailLimit, emailKeyPrefix, ipFallbackPrefix }: LimiterConfig,
  overrideOptions: Partial<Options> = {},
) {
  const app = express();
  app.use(express.json());

  // Per-IP limiter — identical keyGenerator to production.
  const ipLimiter = rateLimit({
    windowMs: 60_000,
    limit: ipLimit,
    keyGenerator: getRealIp,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many registration attempts. Please try again later." },
    ...overrideOptions,
  });

  // Per-email limiter — normalises to lowercase + trim, same as production.
  const emailLimiter = rateLimit({
    windowMs: 60_000,
    limit: emailLimit,
    keyGenerator: (req) => {
      const email = (typeof req.body?.email === "string" ? req.body.email : "")
        .toLowerCase()
        .trim();
      return email ? `${emailKeyPrefix}${email}` : `${ipFallbackPrefix}${getRealIp(req)}`;
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many OTP requests for this email address. Please try again later." },
    ...overrideOptions,
  });

  // Apply in the same order as production (IP limiter first, then email).
  app.use(route, ipLimiter);
  app.use(route, emailLimiter);

  // Stub handler — always 200; we only care about the middleware response.
  app.post(route, (_req, res) => res.json({ ok: true }));

  return app;
}

// ── Helper: post to route ─────────────────────────────────────────────────────
function post(app: express.Express, route: string, email: string) {
  return request(app)
    .post(route)
    .set("Content-Type", "application/json")
    .send({ email, name: "Test", phone: "0000000000", password: "Test@1234" });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. /api/auth/register-otp — per-email limit
// ─────────────────────────────────────────────────────────────────────────────
describe("/api/auth/register-otp — per-email rate limit", () => {
  const ROUTE = "/api/auth/register-otp";
  const EMAIL_LIMIT = 3; // mirrors production
  let app: express.Express;

  beforeEach(() => {
    // Fresh MemoryStore on each test — no cross-test state leakage.
    app = buildApp(ROUTE, {
      ipLimit: 100,          // high enough not to interfere
      emailLimit: EMAIL_LIMIT,
      emailKeyPrefix: "reg-email:",
      ipFallbackPrefix: "reg-ip:",
    });
  });

  it("returns 200 for the first requests up to the email threshold", async () => {
    for (let i = 0; i < EMAIL_LIMIT; i++) {
      const res = await post(app, ROUTE, "test@example.com");
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }
  });

  it("returns 429 on the request that exceeds the per-email threshold", async () => {
    // Exhaust the bucket.
    for (let i = 0; i < EMAIL_LIMIT; i++) {
      await post(app, ROUTE, "limit-test@example.com");
    }
    // The next request must be blocked.
    const blocked = await post(app, ROUTE, "limit-test@example.com");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. /api/auth/forgot-password — per-email limit
// ─────────────────────────────────────────────────────────────────────────────
describe("/api/auth/forgot-password — per-email rate limit", () => {
  const ROUTE = "/api/auth/forgot-password";
  const EMAIL_LIMIT = 3; // mirrors production
  let app: express.Express;

  beforeEach(() => {
    app = buildApp(ROUTE, {
      ipLimit: 100,
      emailLimit: EMAIL_LIMIT,
      emailKeyPrefix: "fp-email:",
      ipFallbackPrefix: "fp-ip:",
    });
  });

  it("returns 200 for the first requests up to the email threshold", async () => {
    for (let i = 0; i < EMAIL_LIMIT; i++) {
      const res = await post(app, ROUTE, "fp-user@example.com");
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }
  });

  it("returns 429 on the request that exceeds the per-email threshold", async () => {
    for (let i = 0; i < EMAIL_LIMIT; i++) {
      await post(app, ROUTE, "fp-limit@example.com");
    }
    const blocked = await post(app, ROUTE, "fp-limit@example.com");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Email-case normalisation — mixed-case variants share a single bucket
// ─────────────────────────────────────────────────────────────────────────────
describe("email-case normalisation — mixed-case addresses share one bucket", () => {
  const ROUTE = "/api/auth/register-otp";
  const EMAIL_LIMIT = 3;
  let app: express.Express;

  beforeEach(() => {
    app = buildApp(ROUTE, {
      ipLimit: 100,
      emailLimit: EMAIL_LIMIT,
      emailKeyPrefix: "reg-email:",
      ipFallbackPrefix: "reg-ip:",
    });
  });

  it("treats 'User@Example.com' and 'user@example.com' as the same bucket", async () => {
    // Send EMAIL_LIMIT - 1 requests with mixed case to leave one slot.
    for (let i = 0; i < EMAIL_LIMIT - 1; i++) {
      const res = await post(app, ROUTE, "User@Example.com");
      expect(res.status, `mixed-case request ${i + 1}`).toBe(200);
    }

    // Send one more with the canonical lowercase form — should consume the
    // last slot (still 200).
    const lastAllowed = await post(app, ROUTE, "user@example.com");
    expect(lastAllowed.status).toBe(200);

    // Now both variants must be blocked — bucket is exhausted.
    const blockedLower = await post(app, ROUTE, "user@example.com");
    expect(blockedLower.status).toBe(429);

    const blockedMixed = await post(app, ROUTE, "USER@EXAMPLE.COM");
    expect(blockedMixed.status).toBe(429);
  });

  it("two different emails do not share a bucket", async () => {
    // Exhaust the bucket for one address.
    for (let i = 0; i < EMAIL_LIMIT; i++) {
      await post(app, ROUTE, "alice@example.com");
    }

    // A different address must still have its own fresh bucket.
    const res = await post(app, ROUTE, "bob@example.com");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. IP limiter fires independently of the email limiter
// ─────────────────────────────────────────────────────────────────────────────
describe("IP limiter fires independently of the email limiter", () => {
  const ROUTE = "/api/auth/register-otp";
  const IP_LIMIT = 5;
  let app: express.Express;

  beforeEach(() => {
    app = buildApp(ROUTE, {
      ipLimit: IP_LIMIT,
      // Use a high email limit so the IP limit is always the one that fires.
      emailLimit: 1000,
      emailKeyPrefix: "reg-email:",
      ipFallbackPrefix: "reg-ip:",
    });
  });

  it("returns 429 when the per-IP threshold is exceeded across different emails", async () => {
    // Use a unique email per request so the email limiter never fires.
    for (let i = 0; i < IP_LIMIT; i++) {
      const res = await post(app, ROUTE, `unique-ip-test-${i}@example.com`);
      expect(res.status, `IP request ${i + 1}`).toBe(200);
    }

    // The next request — even with a brand-new email — must be blocked by
    // the IP limiter since the IP bucket is now exhausted.
    const blocked = await post(app, ROUTE, "brand-new-email@example.com");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });

  it("IP limiter blocks before the email limiter when IP is exhausted", async () => {
    // Exhaust the IP bucket with distinct emails.
    for (let i = 0; i < IP_LIMIT; i++) {
      await post(app, ROUTE, `seq-${i}@example.com`);
    }

    // Even a fresh email must get 429 from the IP layer.
    const res = await post(app, ROUTE, "completely-fresh@example.com");
    expect(res.status).toBe(429);
  });
});
