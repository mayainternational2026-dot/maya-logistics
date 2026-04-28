import { pgTable, serial, text, varchar, numeric, timestamp } from "drizzle-orm/pg-core";

export const inquiriesTable = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  productDetails: text("product_details").notNull(),
  images: text("images"),
  productLink: text("product_link"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Inquiry = typeof inquiriesTable.$inferSelect;
