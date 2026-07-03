/**
 * Integration tests for customer inquiry isolation.
 *
 * These tests hit the real database and mount the actual inquiries router
 * behind a minimal express app (session + attachUser, mirroring app.ts),
 * to verify:
 *
 *  1. GET /api/inquiries/mine only returns inquiries whose userId matches
 *     the logged-in customer — never another customer's inquiries.
 *  2. GET /api/inquiries/mine returns 401 for unauthenticated requests.
 *  3. POST /api/inquiries while logged in stamps userId with the current
 *     session user's id.
 *  4. POST /api/inquiries while NOT logged in stores userId as null.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express, { type Express } from "express";
import session from "express-session";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { db, usersTable, inquiriesTable } from "@workspace/db";
import { attachUser, hashPassword } from "../lib/auth";
import inquiriesRouter from "./inquiries";

// ── Test app — mirrors the relevant slice of app.ts's middleware stack ──────
function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      // Default MemoryStore is fine for tests — no need for PgSession.
    }),
  );
  app.use(attachUser);

  // Test-only helper route to establish a session for a given user id,
  // standing in for the real /api/auth/login flow.
  app.post("/test/login-as/:id", (req, res) => {
    req.session.userId = Number(req.params.id);
    res.json({ ok: true });
  });

  app.use("/api", inquiriesRouter);
  return app;
}

const TEST_EMAIL_A = "inquiry-isolation-a@example.com";
const TEST_EMAIL_B = "inquiry-isolation-b@example.com";

let app: Express;
let userAId: number;
let userBId: number;
let inquiryAId: number;
let inquiryBId: number;

beforeAll(async () => {
  app = buildApp();

  const passwordHash = await hashPassword("Test@1234");

  const [userA] = await db
    .insert(usersTable)
    .values({
      name: "Isolation Test A",
      email: TEST_EMAIL_A,
      phone: "9800000001",
      passwordHash,
      role: "customer",
    })
    .returning();
  const [userB] = await db
    .insert(usersTable)
    .values({
      name: "Isolation Test B",
      email: TEST_EMAIL_B,
      phone: "9800000002",
      passwordHash,
      role: "customer",
    })
    .returning();

  userAId = userA!.id;
  userBId = userB!.id;

  const [inquiryA] = await db
    .insert(inquiriesTable)
    .values({
      userId: userAId,
      name: "Isolation Test A",
      email: TEST_EMAIL_A,
      productDetails: "Widget for customer A",
    })
    .returning();
  const [inquiryB] = await db
    .insert(inquiriesTable)
    .values({
      userId: userBId,
      name: "Isolation Test B",
      email: TEST_EMAIL_B,
      productDetails: "Widget for customer B",
    })
    .returning();

  inquiryAId = inquiryA!.id;
  inquiryBId = inquiryB!.id;
});

afterAll(async () => {
  await db
    .delete(inquiriesTable)
    .where(inArray(inquiriesTable.userId, [userAId, userBId]));
  await db
    .delete(usersTable)
    .where(inArray(usersTable.id, [userAId, userBId]));
});

describe("GET /api/inquiries/mine — customer isolation", () => {
  it("returns only the logged-in customer's own inquiries", async () => {
    const agent = request.agent(app);
    await agent.post(`/test/login-as/${userAId}`);

    const res = await agent.get("/api/inquiries/mine");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const ids = res.body.map((row: { id: number }) => row.id);
    expect(ids).toContain(inquiryAId);
    expect(ids).not.toContain(inquiryBId);
    for (const row of res.body) {
      expect(row.userId).toBe(userAId);
    }
  });

  it("a different customer sees only their own inquiries, not the first customer's", async () => {
    const agent = request.agent(app);
    await agent.post(`/test/login-as/${userBId}`);

    const res = await agent.get("/api/inquiries/mine");
    expect(res.status).toBe(200);

    const ids = res.body.map((row: { id: number }) => row.id);
    expect(ids).toContain(inquiryBId);
    expect(ids).not.toContain(inquiryAId);
    for (const row of res.body) {
      expect(row.userId).toBe(userBId);
    }
  });

  it("returns 401 for unauthenticated requests", async () => {
    const res = await request(app).get("/api/inquiries/mine");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/inquiries — userId stamping", () => {
  it("stamps userId with the session user's id when logged in", async () => {
    const agent = request.agent(app);
    await agent.post(`/test/login-as/${userAId}`);

    const res = await agent.post("/api/inquiries").send({
      name: "Isolation Test A",
      email: TEST_EMAIL_A,
      productDetails: "Another widget while logged in",
    });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(userAId);

    // Cleanup this extra row immediately so it doesn't leak into other tests.
    await db.delete(inquiriesTable).where(eq(inquiriesTable.id, res.body.id));
  });

  it("stores userId as null when submitted without a session", async () => {
    const res = await request(app).post("/api/inquiries").send({
      name: "Anonymous Submitter",
      email: "anonymous-inquiry@example.com",
      productDetails: "Widget submitted while logged out",
    });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBeNull();

    await db.delete(inquiriesTable).where(eq(inquiriesTable.id, res.body.id));
  });
});
