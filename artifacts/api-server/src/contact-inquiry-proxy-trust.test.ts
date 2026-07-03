/**
 * Proxy-trust tests for the contact form and inquiry submission rate limiters.
 *
 * Scenarios covered:
 *
 *  1. /api/contact — IP limiter (contactLimiter)
 *     — spoofed XFF on a direct connection is ignored; socket IP is used
 *     — multiple rotating XFF values all map to the same socket bucket
 *     — two direct-connected clients on different socket IPs have independent buckets
 *
 *  2. /api/contact — email limiter (contactEmailLimiter)
 *     — per-email key is used when an email is present
 *     — two different emails have independent per-email buckets
 *     — no-email requests on a direct connection fall back to socket IP, not XFF
 *     — no-email requests via a loopback proxy fall back to XFF IP
 *     — spoofed XFF on a direct connection is still ignored in the IP fallback
 *
 *  3. POST /api/inquiries — IP limiter (inquiryLimiter)
 *     — spoofed XFF on a direct connection is ignored; socket IP is used
 *     — multiple rotating XFF values all map to the same socket bucket
 *     — two direct-connected clients on different socket IPs have independent buckets
 *
 * NOTE: supertest connects via the loopback address (::ffff:127.0.0.1),
 * so by default every supertest request goes through the "proxy-mediated"
 * code path. To exercise the "direct connection" path, tests use a middleware
 * shim that overrides req.socket.remoteAddress to a non-loopback IP before
 * the keyGenerator runs.
 */

import { describe, it, expect } from "vitest";
import express from "express";
import { rateLimit } from "express-rate-limit";
import request from "supertest";
import { getRealIp } from "./lib/get-real-ip";

// ── Helper: middleware that overrides socket.remoteAddress ────────────────────
function mockSocketIpMiddleware(ip: string): express.RequestHandler {
  return (req, _res, next) => {
    Object.defineProperty(req.socket, "remoteAddress", {
      value: ip,
      configurable: true,
      writable: true,
    });
    next();
  };
}

// ── Helper: build a contact-style IP-limited test app ────────────────────────
function buildContactIpLimitedApp(
  route: string,
  limit: number,
  socketIpOverride?: string,
): express.Express {
  const app = express();
  app.use(express.json());
  if (socketIpOverride) {
    app.use(mockSocketIpMiddleware(socketIpOverride));
  }
  app.use(
    route,
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit,
      keyGenerator: getRealIp,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many messages sent. Please try again later." },
    }),
  );
  app.post(route, (_req, res) => res.json({ ok: true }));
  return app;
}

// ── Helper: build a contact-style email-limited test app ─────────────────────
function buildContactEmailLimitedApp(
  route: string,
  limit: number,
  socketIpOverride?: string,
): express.Express {
  const app = express();
  app.use(express.json());
  if (socketIpOverride) {
    app.use(mockSocketIpMiddleware(socketIpOverride));
  }
  app.use(
    route,
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit,
      keyGenerator: (req) => {
        const email = (
          typeof req.body?.email === "string" ? req.body.email : ""
        )
          .toLowerCase()
          .trim();
        return email
          ? `contact-email:${email}`
          : `contact-ip:${getRealIp(req)}`;
      },
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error:
          "Too many contact requests from this email address. Please try again later.",
      },
    }),
  );
  app.post(route, (_req, res) => res.json({ ok: true }));
  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. /api/contact — IP limiter
// ─────────────────────────────────────────────────────────────────────────────
describe("/api/contact IP limiter — spoofed XFF on direct connections does not bypass limits", () => {
  const ROUTE = "/api/contact";
  const LIMIT = 3;

  it("spoofed XFF header is ignored; socket IP is the rate-limit key", async () => {
    const app = buildContactIpLimitedApp(ROUTE, LIMIT, "203.0.113.50");

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .send({ name: "Alice", message: "hi" });
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }

    // Attacker rotates XFF hoping to claim a fresh bucket — must still be blocked
    const spoofed = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.99")
      .send({ name: "Alice", message: "hi" });
    expect(spoofed.status).toBe(429);
    expect(spoofed.body.error).toMatch(/too many/i);
  });

  it("multiple rotating spoofed XFF values all map to the same socket bucket", async () => {
    const app = buildContactIpLimitedApp(ROUTE, LIMIT, "198.51.100.7");

    const spoofedIps = ["10.0.0.1", "10.0.0.2", "10.0.0.3"];
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", spoofedIps[i]!)
        .send({ name: "Bob", message: "test" });
      expect(res.status, `rotation request ${i + 1} should succeed`).toBe(200);
    }

    // A "new" spoofed IP still maps to the same exhausted socket bucket
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.99")
      .send({ name: "Bob", message: "test" });
    expect(blocked.status).toBe(429);
  });

  it("two direct-connected clients on different socket IPs have independent buckets", async () => {
    const appA = buildContactIpLimitedApp(ROUTE, LIMIT, "203.0.113.10");
    for (let i = 0; i < LIMIT; i++) {
      await request(appA).post(ROUTE).send({ name: "A", message: "msg" });
    }
    const blockedA = await request(appA)
      .post(ROUTE)
      .send({ name: "A", message: "msg" });
    expect(blockedA.status).toBe(429);

    // Client B on a different socket IP must be unaffected
    const appB = buildContactIpLimitedApp(ROUTE, LIMIT, "203.0.113.11");
    const resB = await request(appB)
      .post(ROUTE)
      .send({ name: "B", message: "msg" });
    expect(resB.status).toBe(200);
  });

  it("proxy-mediated client is bucketed by real XFF IP, not the shared loopback", async () => {
    // supertest socket is loopback — no socket override needed
    const app = buildContactIpLimitedApp(ROUTE, LIMIT);

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.20")
        .send({ name: "C", message: "msg" });
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }

    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.20")
      .send({ name: "C", message: "msg" });
    expect(blocked.status).toBe(429);

    // A different XFF IP is still under the limit
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.21")
      .send({ name: "D", message: "msg" });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. /api/contact — email limiter
// ─────────────────────────────────────────────────────────────────────────────
describe("/api/contact email limiter — per-email key and IP fallback behaviour", () => {
  const ROUTE = "/api/contact";
  const LIMIT = 3;

  it("requests with the same email are counted under a per-email key", async () => {
    const app = buildContactEmailLimitedApp(ROUTE, LIMIT);

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.30")
        .send({ name: "Eve", email: "eve@example.com", message: "msg" });
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }

    // Same email, now with a different XFF — still blocked because key is email-based
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.31")
      .send({ name: "Eve", email: "eve@example.com", message: "msg" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });

  it("two different emails have independent per-email buckets", async () => {
    const app = buildContactEmailLimitedApp(ROUTE, LIMIT);

    // Exhaust bucket for alice@example.com
    for (let i = 0; i < LIMIT; i++) {
      await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.40")
        .send({ name: "Alice", email: "alice@example.com", message: "msg" });
    }

    // bob@example.com has its own fresh bucket
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.40")
      .send({ name: "Bob", email: "bob@example.com", message: "msg" });
    expect(res.status).toBe(200);
  });

  it("no-email requests on a direct connection fall back to socket IP, not XFF", async () => {
    const app = buildContactEmailLimitedApp(ROUTE, LIMIT, "198.51.100.20");

    // Exhaust the bucket (no email → key = socket IP)
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .send({ name: "Anon", message: "msg" });
      expect(res.status).toBe(200);
    }

    // Sending a spoofed XFF must not grant a fresh bucket
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "9.9.9.9")
      .send({ name: "Anon", message: "msg" });
    expect(blocked.status).toBe(429);
  });

  it("no-email requests via a loopback proxy fall back to XFF IP, not the loopback", async () => {
    const app = buildContactEmailLimitedApp(ROUTE, LIMIT);

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.77")
        .send({ name: "Anon", message: "msg" });
      expect(res.status).toBe(200);
    }

    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.77")
      .send({ name: "Anon", message: "msg" });
    expect(blocked.status).toBe(429);
  });

  it("spoofed XFF on a direct connection is still ignored in the email-limiter IP fallback", async () => {
    const app = buildContactEmailLimitedApp(ROUTE, LIMIT, "198.51.100.30");

    // Exhaust bucket via socket IP (no email → fallback key = socket IP)
    for (let i = 0; i < LIMIT; i++) {
      await request(app)
        .post(ROUTE)
        .send({ name: "Anon", message: "msg" });
    }

    // Attacker changes XFF to claim a brand-new IP — still blocked
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.1")
      .send({ name: "Anon", message: "msg" });
    expect(res.status).toBe(429);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/inquiries — IP limiter
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/inquiries IP limiter — spoofed XFF on direct connections does not bypass limits", () => {
  const ROUTE = "/api/inquiries";
  const LIMIT = 3;

  it("spoofed XFF header is ignored; socket IP is the rate-limit key", async () => {
    const app = buildContactIpLimitedApp(ROUTE, LIMIT, "203.0.113.60");

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .send({ productName: "Widget" });
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }

    // Attacker rotates XFF — must still be blocked by the socket IP bucket
    const spoofed = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.99")
      .send({ productName: "Widget" });
    expect(spoofed.status).toBe(429);
    expect(spoofed.body.error).toMatch(/too many/i);
  });

  it("multiple rotating spoofed XFF values all map to the same socket bucket", async () => {
    const app = buildContactIpLimitedApp(ROUTE, LIMIT, "198.51.100.8");

    const spoofedIps = ["10.1.0.1", "10.1.0.2", "10.1.0.3"];
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", spoofedIps[i]!)
        .send({ productName: "Gizmo" });
      expect(res.status, `rotation request ${i + 1} should succeed`).toBe(200);
    }

    // The fourth request — regardless of XFF — is blocked
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.1.0.99")
      .send({ productName: "Gizmo" });
    expect(blocked.status).toBe(429);
  });

  it("two direct-connected clients on different socket IPs have independent buckets", async () => {
    const appA = buildContactIpLimitedApp(ROUTE, LIMIT, "203.0.113.12");
    for (let i = 0; i < LIMIT; i++) {
      await request(appA).post(ROUTE).send({ productName: "A" });
    }
    const blockedA = await request(appA)
      .post(ROUTE)
      .send({ productName: "A" });
    expect(blockedA.status).toBe(429);

    // Client B on a different socket IP is unaffected
    const appB = buildContactIpLimitedApp(ROUTE, LIMIT, "203.0.113.13");
    const resB = await request(appB).post(ROUTE).send({ productName: "B" });
    expect(resB.status).toBe(200);
  });

  it("proxy-mediated client is bucketed by real XFF IP, not the shared loopback", async () => {
    // supertest socket is loopback — no socket override needed
    const app = buildContactIpLimitedApp(ROUTE, LIMIT);

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.50")
        .send({ productName: "X" });
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }

    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.50")
      .send({ productName: "X" });
    expect(blocked.status).toBe(429);

    // A different XFF IP has its own fresh bucket
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.51")
      .send({ productName: "X" });
    expect(res.status).toBe(200);
  });
});
