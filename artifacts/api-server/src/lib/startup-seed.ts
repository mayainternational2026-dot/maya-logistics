import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, permissionsTable } from "@workspace/db";
import { logger } from "./logger";

const ADMIN_EMAIL = "chapagainsirish@gmail.com";
const ADMIN_PASSWORD = "Sirish@@2054";

export async function runStartupSeed() {
  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (existing) {
      // Always keep the admin password in sync with the configured value
      await db
        .update(usersTable)
        .set({ passwordHash, role: "admin" })
        .where(eq(usersTable.email, ADMIN_EMAIL));
      logger.info({ email: ADMIN_EMAIL }, "Admin password synced on startup");
      return;
    }

    logger.info("No admin found — running startup seed");

    const [admin] = await db
      .insert(usersTable)
      .values({
        name: "Maya Admin",
        email: ADMIN_EMAIL,
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

    logger.info({ email: ADMIN_EMAIL }, "Admin account created");
  } catch (err) {
    logger.error({ err }, "Startup seed failed");
  }
}
