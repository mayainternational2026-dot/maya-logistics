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

    if (existing) return;

    logger.info("No admin found — running startup seed");

    const passwordHash = await bcrypt.hash("Sirish@@2054", 10);
    const [admin] = await db
      .insert(usersTable)
      .values({
        name: "Maya Admin",
        email: "greenhouse2053@gmail.com",
        phone: "9768595133",
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

    logger.info({ email: "greenhouse2053@gmail.com" }, "Admin account created");
  } catch (err) {
    logger.error({ err }, "Startup seed failed");
  }
}
