import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, permissionsTable } from "@workspace/db";
import { logger } from "./logger";

export async function runStartupSeed() {
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"))
      .limit(1);

    if (existing) {
      logger.info("Admin account already exists — skipping startup seed");
      return;
    }

    const adminEmail = process.env["ADMIN_EMAIL"];
    const adminPassword = process.env["ADMIN_PASSWORD"];

    if (!adminEmail || !adminPassword) {
      logger.warn(
        "No admin account found and ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set — skipping startup seed. Set these variables to bootstrap the first admin account.",
      );
      return;
    }

    logger.info("No admin found — running one-time startup seed");

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [admin] = await db
      .insert(usersTable)
      .values({
        name: "Maya Admin",
        email: adminEmail.toLowerCase().trim(),
        phone: "",
        passwordHash,
        role: "admin",
      })
      .returning();

    await db.insert(permissionsTable).values({
      userId: admin.id,
      canManageShipments: true,
      canManageCustomers: true,
      canGenerateInvoice: true,
    });

    logger.info({ email: adminEmail }, "Admin account created via startup seed");
  } catch (err) {
    logger.error({ err }, "Startup seed failed");
  }
}
