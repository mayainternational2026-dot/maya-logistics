import { pgTable, serial, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const permissionsTable = pgTable("permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  canManageShipments: boolean("can_manage_shipments").notNull().default(false),
  canManageCustomers: boolean("can_manage_customers").notNull().default(false),
  canGenerateInvoice: boolean("can_generate_invoice").notNull().default(false),
});

export type Permission = typeof permissionsTable.$inferSelect;
