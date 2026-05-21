import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, permissionsTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
  UpdateUserPermissionsParams,
  UpdateUserPermissionsBody,
  AdminResetUserPasswordParams,
  AdminResetUserPasswordBody,
} from "@workspace/api-zod";
import { hashPassword, requireAuth, loadUserById } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireAuth("admin"), async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      canManageShipments: permissionsTable.canManageShipments,
      canManageCustomers: permissionsTable.canManageCustomers,
      canGenerateInvoice: permissionsTable.canGenerateInvoice,
    })
    .from(usersTable)
    .leftJoin(permissionsTable, eq(permissionsTable.userId, usersTable.id))
    .orderBy(usersTable.createdAt);

  const filtered = params.data.role
    ? rows.filter((r) => r.role === params.data.role)
    : rows;

  res.json(
    filtered.map((r) => {
      const isAdmin = r.role === "admin";
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        createdAt: r.createdAt.toISOString(),
        permissions: {
          canManageShipments: isAdmin || (r.canManageShipments ?? false),
          canManageCustomers: isAdmin || (r.canManageCustomers ?? false),
          canGenerateInvoice: isAdmin || (r.canGenerateInvoice ?? false),
        },
      };
    }),
  );
});

router.post(
  "/users",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const parsed = CreateUserBody.safeParse(req.body);
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
      res
        .status(409)
        .json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const [user] = await db
      .insert(usersTable)
      .values({
        name: parsed.data.name.trim(),
        email,
        phone: parsed.data.phone.trim(),
        whatsappNumber: parsed.data.whatsappNumber?.trim() || null,
        passwordHash,
        role: parsed.data.role,
      })
      .returning();

    await db.insert(permissionsTable).values({
      userId: user.id,
      canManageShipments: parsed.data.permissions?.canManageShipments ?? false,
      canManageCustomers: parsed.data.permissions?.canManageCustomers ?? false,
      canGenerateInvoice: parsed.data.permissions?.canGenerateInvoice ?? false,
    });

    res.status(201).json(await loadUserById(user.id));
  },
);

router.get("/users/:id", requireAuth("admin"), async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = await loadUserById(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch(
  "/users/:id",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const params = UpdateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = UpdateUserBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (body.data.name != null) updates.name = body.data.name.trim();
    if (body.data.email != null)
      updates.email = body.data.email.toLowerCase().trim();
    if (body.data.phone != null) updates.phone = body.data.phone.trim();
    if (body.data.whatsappNumber != null) updates.whatsappNumber = body.data.whatsappNumber.trim() || null;
    if (body.data.role != null) updates.role = body.data.role;

    if (Object.keys(updates).length > 0) {
      await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, params.data.id));
    }

    const user = await loadUserById(params.data.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  },
);

router.delete(
  "/users/:id",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const params = DeleteUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (req.currentUser && req.currentUser.id === params.data.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
    res.status(204).end();
  },
);

router.patch(
  "/users/:id/permissions",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const params = UpdateUserPermissionsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = UpdateUserPermissionsBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const existing = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.userId, params.data.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(permissionsTable)
        .set({
          canManageShipments: body.data.canManageShipments,
          canManageCustomers: body.data.canManageCustomers,
          canGenerateInvoice: body.data.canGenerateInvoice,
        })
        .where(eq(permissionsTable.userId, params.data.id));
    } else {
      await db.insert(permissionsTable).values({
        userId: params.data.id,
        canManageShipments: body.data.canManageShipments,
        canManageCustomers: body.data.canManageCustomers,
        canGenerateInvoice: body.data.canGenerateInvoice,
      });
    }

    res.json({
      canManageShipments: body.data.canManageShipments,
      canManageCustomers: body.data.canManageCustomers,
      canGenerateInvoice: body.data.canGenerateInvoice,
    });
  },
);

router.post(
  "/users/:id/reset-password",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const params = AdminResetUserPasswordParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = AdminResetUserPasswordBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const passwordHash = await hashPassword(body.data.newPassword);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, params.data.id));

    res.json({ message: "Password reset successfully" });
  },
);

export default router;
