/**
 * Tests for the getRealIp() proxy-trust logic and its effect on rate limiting.
 *
 * Scenarios covered:
 *
 *  1. Unit tests for getRealIp()
 *     — direct (non-loopback) socket ignores XFF entirely
 *     — loopback socket trusts only the rightmost XFF entry (proxy-appended)
 *     — multiple XFF entries: client-prepended values are discarded
 *
 *  2. Integration: proxy-mediated clients (loopback socket, XFF set)
 *     — rate limit fires on the real client IP, not the loopback proxy address
 *     — two different client IPs behind the same proxy have independent buckets
 *
 *  3. Integration: direct connections (non-loopback socket) with spoofed XFF
 *     — spoofed XFF does NOT grant a fresh rate-limit bucket
 *     — exhausted bucket blocks the next request even when XFF changes
 *
 *  4. Email-keyed limiter fallback: no email body → falls back to validated IP
 *     — direct connection with no email uses socket IP as key
 *     — proxy connection with no email uses XFF IP as key
 *     — spoofed XFF on a direct connection is still ignored for the fallback key
 *
 * NOTE: supertest connects via the loopback address (::ffff:127.0.0.1),
 * so by default every supertest request goes through the "proxy-mediated"
 * code path. To exercise the "direct connection" path, each test in sections
 * 3 and 4 uses a middleware shim that overrides req.socket.remoteAddress to a
 * non-loopback IP before the keyGenerator runs.
 */

import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import { rateLimit } from "express-rate-limit";
import request from "supertest";
import { getRealIp } from "./lib/get-real-ip";

// ── Helper: build a fake express.Request for unit tests ───────────────────────
function fakeReq(socketIp: string, xff?: string): express.Request {
  return {
    socket: { remoteAddress: socketIp },
    headers: xff ? { "x-forwarded-for": xff } : {},
  } as unknown as express.Request;
}

// ── Helper: middleware that overrides socket.remoteAddress ────────────────────
// Used to simulate a non-loopback direct connection in supertest (which
// normally connects from a loopback address).
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

// ── Helper: build a rate-limited test app ────────────────────────────────────
function buildIpLimitedApp(
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
      windowMs: 60_000,
      limit,
      keyGenerator: getRealIp,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests." },
    }),
  );
  app.post(route, (_req, res) => res.json({ ok: true }));
  return app;
}

// ── Helper: build an email-keyed test app ────────────────────────────────────
function buildEmailLimitedApp(
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
      windowMs: 60_000,
      limit,
      keyGenerator: (req) => {
        const email = (
          typeof req.body?.email === "string" ? req.body.email : ""
        )
          .toLowerCase()
          .trim();
        return email
          ? `reg-email:${email}`
          : `reg-ip:${getRealIp(req)}`;
      },
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests." },
    }),
  );
  app.post(route, (_req, res) => res.json({ ok: true }));
  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getRealIp — unit tests
// ─────────────────────────────────────────────────────────────────────────────
describe("getRealIp — unit tests", () => {
  it("returns the socket IP for a direct non-loopback connection, even when XFF is present", () => {
    expect(getRealIp(fakeReq("203.0.113.10", "1.2.3.4"))).toBe("203.0.113.10");
  });

  it("returns the socket IP for a direct non-loopback connection with no XFF", () => {
    expect(getRealIp(fakeReq("198.51.100.5"))).toBe("198.51.100.5");
  });

  it("returns the rightmost XFF entry for a 127.0.0.1 proxy connection", () => {
    expect(getRealIp(fakeReq("127.0.0.1", "203.0.113.42"))).toBe("203.0.113.42");
  });

  it("returns the rightmost XFF entry for a ::1 proxy connection", () => {
    expect(getRealIp(fakeReq("::1", "203.0.113.55"))).toBe("203.0.113.55");
  });

  it("returns the rightmost XFF entry for a ::ffff:127.0.0.1 proxy connection", () => {
    expect(getRealIp(fakeReq("::ffff:127.0.0.1", "203.0.113.99"))).toBe(
      "203.0.113.99",
    );
  });

  it("discards client-prepended XFF entries and uses only the proxy-appended rightmost entry", () => {
    // Client sent "1.2.3.4", proxy appended "203.0.113.42"
    expect(getRealIp(fakeReq("127.0.0.1", "1.2.3.4, 203.0.113.42"))).toBe(
      "203.0.113.42",
    );
  });

  it("discards all client-prepended entries even when the chain is long", () => {
    // Attacker prepends several IPs hoping to be treated as one of them
    expect(
      getRealIp(fakeReq("127.0.0.1", "5.5.5.5, 6.6.6.6, 7.7.7.7, 203.0.113.42")),
    ).toBe("203.0.113.42");
  });

  it("returns the socket loopback address when no XFF is present on a proxy connection", () => {
    expect(getRealIp(fakeReq("127.0.0.1"))).toBe("127.0.0.1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Integration: proxy-mediated clients (loopback socket, XFF trusted)
// ─────────────────────────────────────────────────────────────────────────────
describe("rate limiting — proxy-mediated clients are bucketed by their real XFF IP", () => {
  const ROUTE = "/api/auth/login";
  const LIMIT = 3;
  let app: express.Express;

  beforeEach(() => {
    // supertest connects from loopback — no socket override needed
    app = buildIpLimitedApp(ROUTE, LIMIT);
  });

  it("rate-limits by the real client IP from XFF, not by the shared proxy loopback", async () => {
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.1")
        .send({});
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.1")
      .send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });

  it("a different client IP behind the same proxy gets its own independent bucket", async () => {
    // Exhaust bucket for client 203.0.113.1
    for (let i = 0; i < LIMIT; i++) {
      await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.1")
        .send({});
    }
    // A different client IP must still succeed
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.2")
      .send({});
    expect(res.status).toBe(200);
  });

  it("proxy-appended XFF is used, not client-prepended entries in the chain", async () => {
    // Proxy sends "spoofed, 203.0.113.3" — rightmost is 203.0.113.3 (real client)
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "spoofed-attacker-ip, 203.0.113.3")
        .send({});
      expect(res.status).toBe(200);
    }
    // The bucket for 203.0.113.3 is now full
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "another-fake-ip, 203.0.113.3")
      .send({});
    expect(blocked.status).toBe(429);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Integration: direct connections — spoofed XFF must not bypass rate limits
// ─────────────────────────────────────────────────────────────────────────────
describe("rate limiting — spoofed XFF on direct connections does not grant a fresh bucket", () => {
  const ROUTE = "/api/auth/login";
  const LIMIT = 3;

  it("spoofed XFF header is completely ignored; socket IP is used for the bucket", async () => {
    const app = buildIpLimitedApp(ROUTE, LIMIT, "203.0.113.50");

    // Exhaust the bucket (no XFF initially)
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app).post(ROUTE).send({});
      expect(res.status, `request ${i + 1} should succeed`).toBe(200);
    }

    // Attacker rotates XFF hoping to claim a fresh IP — must still be blocked
    const spoofed = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.99")
      .send({});
    expect(spoofed.status).toBe(429);
    expect(spoofed.body.error).toMatch(/too many/i);
  });

  it("multiple different spoofed XFF values all map to the same (socket) bucket", async () => {
    const app = buildIpLimitedApp(ROUTE, LIMIT, "198.51.100.7");

    // Use a different spoofed XFF each time to simulate an IP-rotation attack
    const spoofedIps = ["10.0.0.1", "10.0.0.2", "10.0.0.3"];
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", spoofedIps[i]!)
        .send({});
      expect(res.status, `rotation request ${i + 1} should succeed`).toBe(200);
    }

    // The fourth request — regardless of which "new" IP is spoofed — is blocked
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.99")
      .send({});
    expect(blocked.status).toBe(429);
  });

  it("a second direct-connected client on a different socket IP has its own bucket", async () => {
    // Client A exhausts its bucket
    const appA = buildIpLimitedApp(ROUTE, LIMIT, "203.0.113.10");
    for (let i = 0; i < LIMIT; i++) {
      await request(appA).post(ROUTE).send({});
    }
    const blockedA = await request(appA).post(ROUTE).send({});
    expect(blockedA.status).toBe(429);

    // Client B on a different socket IP is unaffected
    const appB = buildIpLimitedApp(ROUTE, LIMIT, "203.0.113.11");
    const resB = await request(appB).post(ROUTE).send({});
    expect(resB.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Email-keyed limiter — fallback to validated IP when no email is supplied
// ─────────────────────────────────────────────────────────────────────────────
describe("email-keyed limiter — IP fallback uses the validated socket or XFF IP", () => {
  const ROUTE = "/api/auth/register-otp";
  const LIMIT = 3;

  it("no-email requests on a direct connection fall back to the socket IP, not XFF", async () => {
    const app = buildEmailLimitedApp(ROUTE, LIMIT, "198.51.100.20");

    // Exhaust the bucket (no email in body, so key = socket IP)
    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app).post(ROUTE).send({ name: "Test" });
      expect(res.status).toBe(200);
    }

    // Now send with a spoofed XFF — must still be blocked because socket IP is used
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "9.9.9.9")
      .send({ name: "Test" });
    expect(blocked.status).toBe(429);
  });

  it("no-email requests via a loopback proxy fall back to the XFF IP, not the loopback", async () => {
    // supertest socket is loopback → XFF is trusted
    const app = buildEmailLimitedApp(ROUTE, LIMIT);

    for (let i = 0; i < LIMIT; i++) {
      const res = await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.77")
        .send({ name: "Test" });
      expect(res.status).toBe(200);
    }
    const blocked = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.77")
      .send({ name: "Test" });
    expect(blocked.status).toBe(429);
  });

  it("a different XFF IP on a loopback proxy connection gets its own fallback bucket", async () => {
    const app = buildEmailLimitedApp(ROUTE, LIMIT);

    // Exhaust bucket for 203.0.113.77
    for (let i = 0; i < LIMIT; i++) {
      await request(app)
        .post(ROUTE)
        .set("x-forwarded-for", "203.0.113.77")
        .send({ name: "Test" });
    }

    // A different XFF IP still has its own fresh bucket
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "203.0.113.78")
      .send({ name: "Test" });
    expect(res.status).toBe(200);
  });

  it("spoofed XFF on a direct connection is ignored even in the email-limiter IP fallback", async () => {
    const app = buildEmailLimitedApp(ROUTE, LIMIT, "198.51.100.30");

    // Exhaust bucket (fallback key = socket IP 198.51.100.30)
    for (let i = 0; i < LIMIT; i++) {
      await request(app).post(ROUTE).send({ name: "Test" });
    }

    // Attacker changes XFF to claim a brand-new IP — still blocked
    const res = await request(app)
      .post(ROUTE)
      .set("x-forwarded-for", "10.0.0.1")
      .send({ name: "Test" });
    expect(res.status).toBe(429);
  });
});
