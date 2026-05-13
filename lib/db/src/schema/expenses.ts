import { pgTable, serial, text, numeric, integer, date, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  productName: text("product_name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Expense = typeof expensesTable.$inferSelect;
