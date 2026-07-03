/**
 * Regression test: neither /api/auth/register-otp nor
 * /api/auth/forgot-password may ever leak the OTP in their response bodies
 * when NODE_ENV=production, regardless of whether email delivery is
 * configured or whether the send attempt fails.
 *
 * - register-otp never includes `otp` in its response under any condition —
 *   there is no dev fallback for it at all.
 * - forgot-password only exposes `otp` in the JSON body when `isDev` is true
 *   AND delivery could not happen. This test forces NODE_ENV=production
 *   (which is also how the real deployment starts the server — see
 *   nixpacks.toml) and asserts the field is absent under both the
 *   "no provider configured" and "send failed" fallback conditions that
 *   would otherwise trigger it in dev.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db, usersTable, registrationOtpsTable } from "@workspace/db";
import { hashPassword } from "../lib/auth";

vi.mock("../lib/mailer", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
  sendRegistrationOtpEmail: vi.fn().mockResolvedValue(undefined),
  isEmailConfigured: vi.fn(),
}));

const TEST_EMAIL = "otp-exposure-test@example.com";
let userId: number;
let app: Express;

beforeAll(async () => {
  const passwordHash = await hashPassword("Test@1234");
  const [user] = await db
    .insert(usersTable)
    .values({
      name: "OTP Exposure Test",
      email: TEST_EMAIL,
      phone: "9800000099",
      passwordHash,
      role: "customer",
    })
    .returning();
  userId = user!.id;

  // Force production mode before importing the router, since the route
  // reads process.env["NODE_ENV"] at request time — but we still set it
  // up front to mirror how the real server is started in production.
  process.env["NODE_ENV"] = "production";

  const authRouter = (await import("./auth")).default;
  app = express();
  app.use(express.json());
  // Minimal req.log stub — the route logs via req.log, which is normally
  // attached by pino-http in the real server (see app.ts).
  app.use((req, _res, next) => {
    (req as unknown as { log: Console }).log = console;
    next();
  });
  app.use("/api", authRouter);
});

afterAll(async () => {
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  await db
    .delete(registrationOtpsTable)
    .where(eq(registrationOtpsTable.email, "register-otp-exposure-test@example.com"));
});

describe("/api/auth/forgot-password — OTP never exposed in production", () => {
  it("omits `otp` from the response when no email provider is configured", async () => {
    const { isEmailConfigured } = await import("../lib/mailer");
    vi.mocked(isEmailConfigured).mockReturnValue(false);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("otp");
    expect(JSON.stringify(res.body)).not.toMatch(/"otp"/);
  });

  it("omits `otp` from the response when email delivery fails", async () => {
    const { isEmailConfigured, sendOtpEmail } = await import("../lib/mailer");
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(sendOtpEmail).mockRejectedValue(new Error("SMTP misconfigured"));

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("otp");
    expect(JSON.stringify(res.body)).not.toMatch(/"otp"/);
  });

  it("omits `otp` from the response on the happy path (email sent successfully)", async () => {
    const { isEmailConfigured, sendOtpEmail } = await import("../lib/mailer");
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(sendOtpEmail).mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("otp");
  });
});

describe("/api/auth/register-otp — OTP never exposed in production", () => {
  const REGISTER_EMAIL = "register-otp-exposure-test@example.com";

  it("omits `otp` from the response when no email provider is configured", async () => {
    const { isEmailConfigured } = await import("../lib/mailer");
    vi.mocked(isEmailConfigured).mockReturnValue(false);

    const res = await request(app).post("/api/auth/register-otp").send({
      name: "Register Exposure Test",
      email: REGISTER_EMAIL,
      phone: "9800000098",
      password: "Test@1234",
    });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("otp");
    expect(JSON.stringify(res.body)).not.toMatch(/"otp"/);
  });

  it("omits `otp` from the response when registration email delivery fails", async () => {
    const { isEmailConfigured, sendRegistrationOtpEmail } = await import(
      "../lib/mailer"
    );
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(sendRegistrationOtpEmail).mockRejectedValue(
      new Error("SMTP misconfigured"),
    );

    const res = await request(app).post("/api/auth/register-otp").send({
      name: "Register Exposure Test",
      email: REGISTER_EMAIL,
      phone: "9800000098",
      password: "Test@1234",
    });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("otp");
    expect(JSON.stringify(res.body)).not.toMatch(/"otp"/);
  });

  it("omits `otp` from the response on the happy path (email sent successfully)", async () => {
    const { isEmailConfigured, sendRegistrationOtpEmail } = await import(
      "../lib/mailer"
    );
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(sendRegistrationOtpEmail).mockResolvedValue(undefined);

    const res = await request(app).post("/api/auth/register-otp").send({
      name: "Register Exposure Test",
      email: REGISTER_EMAIL,
      phone: "9800000098",
      password: "Test@1234",
    });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("otp");
    expect(JSON.stringify(res.body)).not.toMatch(/"otp"/);
  });
});
