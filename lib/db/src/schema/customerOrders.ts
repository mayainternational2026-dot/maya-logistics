import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const customerOrdersTable = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 64 }),
  email: varchar("email", { length: 255 }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type CustomerOrder = typeof customerOrdersTable.$inferSelect;
