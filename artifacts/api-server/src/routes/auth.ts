import { Router, type IRouter } from "express";
import { eq, and, gte, lt } from "drizzle-orm";
import {
  db,
  usersTable,
  permissionsTable,
  passwordResetsTable,
  registrationOtpsTable,
} from "@workspace/db";
import {
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  loadUserById,
} from "../lib/auth";
import { sendOtpEmail, sendRegistrationOtpEmail } from "../lib/mailer";

const router: IRouter = Router();

// ── Password strength rule (shared between register-otp and reset-password) ──
const STRONG_PASSWORD = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
    "Password must contain at least one special character",
  );

const RegisterInitBody = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  password: STRONG_PASSWORD,
});

const RegisterVerifyBody = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// ── STEP 1: Send registration OTP ──
router.post("/auth/register-otp", async (req, res): Promise<void> => {
  const parsed = RegisterInitBody.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    res.status(400).json({ error: msg });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Check if email already registered
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  // Delete any previous pending OTP for this email
  await db
    .delete(registrationOtpsTable)
    .where(eq(registrationOtpsTable.email, email));

  await db.insert(registrationOtpsTable).values({
    name: parsed.data.name.trim(),
    email,
    phone: parsed.data.phone.trim(),
    passwordHash,
    otp,
    expiresAt,
  });

  sendRegistrationOtpEmail(email, parsed.data.name.trim(), otp).catch((err) =>
    req.log.error({ err, email }, "Failed to send registration OTP email"),
  );

  req.log.info({ email }, "Registration OTP sent");
  res.json({ message: "OTP sent to your email. Please verify to complete registration." });
});

// ── STEP 2: Verify OTP and create account ──
router.post("/auth/register-verify", async (req, res): Promise<void> => {
  const parsed = RegisterVerifyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const now = new Date();

  const [pending] = await db
    .select()
    .from(registrationOtpsTable)
    .where(
      and(
        eq(registrationOtpsTable.email, email),
        eq(registrationOtpsTable.otp, parsed.data.otp),
        gte(registrationOtpsTable.expiresAt, now),
      ),
    )
    .limit(1);

  if (!pending) {
    res.status(400).json({ error: "Invalid or expired OTP. Please try again." });
    return;
  }

  // Double-check no account was created in between
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(registrationOtpsTable).where(eq(registrationOtpsTable.email, email));
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      role: "customer",
    })
    .returning();

  await db.insert(permissionsTable).values({
    userId: user.id,
    canManageShipments: false,
    canManageCustomers: false,
    canGenerateInvoice: false,
  });

  // Clean up OTP
  await db.delete(registrationOtpsTable).where(eq(registrationOtpsTable.email, email));

  req.session.userId = user.id;
  const sessionUser = await loadUserById(user.id);
  req.log.info({ email, userId: user.id }, "Customer account created via OTP verification");
  res.status(201).json({ user: sessionUser });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  const sessionUser = await loadUserById(user.id);
  res.json({ user: sessionUser });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("maya.sid");
    res.status(204).end();
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const id = req.session?.userId;
  if (!id) {
    res.json({ user: null });
    return;
  }
  const user = await loadUserById(id);
  res.json({ user: user ?? null });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (user) {
    await db.insert(passwordResetsTable).values({
      email: user.email,
      otp,
      expiresAt,
    });
    sendOtpEmail(user.email, otp).catch((err) =>
      req.log.error({ err, email: user.email }, "Failed to send OTP email"),
    );
  }

  req.log.info({ email, hasUser: !!user }, "Password reset OTP generated");

  res.json({
    message:
      "If that email is registered, a one-time code has been sent to your inbox.",
  });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Enforce strong password on reset too
  const pwCheck = STRONG_PASSWORD.safeParse(parsed.data.newPassword);
  if (!pwCheck.success) {
    res.status(400).json({ error: pwCheck.error.errors[0]?.message ?? "Weak password" });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const now = new Date();

  const [reset] = await db
    .select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.email, email),
        eq(passwordResetsTable.otp, parsed.data.otp),
        gte(passwordResetsTable.expiresAt, now),
      ),
    )
    .orderBy(passwordResetsTable.createdAt)
    .limit(1);

  if (!reset) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.email, email));

  await db
    .delete(passwordResetsTable)
    .where(eq(passwordResetsTable.email, email));

  res.json({ message: "Password reset successfully" });
});

export default router;
