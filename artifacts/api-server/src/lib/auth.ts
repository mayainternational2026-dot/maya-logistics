import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, permissionsTable } from "@workspace/db";

export type Role = "admin" | "staff" | "customer";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  permissions: {
    canManageShipments: boolean;
    canManageCustomers: boolean;
    canGenerateInvoice: boolean;
  };
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function loadUserById(id: number): Promise<SessionUser | null> {
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
    .where(eq(usersTable.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const role = row.role as Role;
  const isAdmin = role === "admin";

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role,
    createdAt: row.createdAt.toISOString(),
    permissions: {
      canManageShipments: isAdmin || (row.canManageShipments ?? false),
      canManageCustomers: isAdmin || (row.canManageCustomers ?? false),
      canGenerateInvoice: isAdmin || (row.canGenerateInvoice ?? false),
    },
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: SessionUser;
    }
  }
}

export const attachUser: RequestHandler = async (req, _res, next) => {
  const id = req.session?.userId;
  if (id) {
    const user = await loadUserById(id);
    if (user) {
      req.currentUser = user;
    }
  }
  next();
};

export function requireAuth(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.currentUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
