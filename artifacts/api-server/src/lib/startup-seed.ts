import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, permissionsTable } from "@workspace/db";
import { logger } from "./logger";

export async function runStartupSeed() {
  try {
    const adminEmail = process.env["ADMIN_EMAIL"];
    const adminPassword = process.env["ADMIN_PASSWORD"];

    const [existing] = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"))
      .limit(1);

    // If ADMIN_EMAIL + ADMIN_PASSWORD are set, always ensure that account
    // exists with the correct password (create or update).
    if (adminEmail && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const normalizedEmail = adminEmail.toLowerCase().trim();

      const [target] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, normalizedEmail))
        .limit(1);

      if (target) {
        // Update the password for this account
        await db
          .update(usersTable)
          .set({ passwordHash })
          .where(eq(usersTable.id, target.id));
        logger.info({ email: normalizedEmail }, "Admin password synced from ADMIN_PASSWORD env var");
      } else {
        // Create the account fresh
        const [admin] = await db
          .insert(usersTable)
          .values({
            name: "Maya Admin",
            email: normalizedEmail,
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
        logger.info({ email: normalizedEmail }, "Admin account created via startup seed");
      }
      return;
    }

    if (existing) {
      logger.info("Admin account already exists — skipping startup seed");
      return;
    }

    logger.warn(
      "No admin account found and ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set — skipping startup seed.",
    );
  } catch (err) {
    logger.error({ err }, "Startup seed failed");
  }
}
