import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import {
  db,
  usersTable,
  permissionsTable,
  passwordResetsTable,
} from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  loadUserById,
} from "../lib/auth";
import { sendOtpEmail } from "../lib/mailer";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
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
  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone.trim(),
      passwordHash,
      role: "customer",
    })
    .returning();

  await db.insert(permissionsTable).values({
    userId: user.id,
    canManageShipments: false,
    canManageCustomers: false,
    canGenerateInvoice: false,
  });

  req.session.userId = user.id;
  const sessionUser = await loadUserById(user.id);
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

  // Generate a 6-digit OTP. We always return success-shaped responses to
  // avoid disclosing whether an email is registered, but only persist when
  // the user exists.
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (user) {
    await db.insert(passwordResetsTable).values({
      email: user.email,
      otp,
      expiresAt,
    });
    // Send OTP to the user's email — fire-and-forget, errors are logged
    sendOtpEmail(user.email, otp).catch((err) =>
      req.log.error({ err, email: user.email }, "Failed to send OTP email"),
    );
  }

  req.log.info(
    { email, otp: user ? otp : "(no user)" },
    "Password reset OTP generated",
  );

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
