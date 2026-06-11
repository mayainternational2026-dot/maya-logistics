import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const shipmentsTable = pgTable("shipments", {
  id: serial("id").primaryKey(),
  trackingId: varchar("tracking_id", { length: 32 }).notNull().unique(),
  shipmentType: varchar("shipment_type", { length: 16 }).notNull().default("export"),
  freightMode: varchar("freight_mode", { length: 8 }),
  senderName: text("sender_name").notNull(),
  senderPhone: varchar("sender_phone", { length: 64 }),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: varchar("receiver_phone", { length: 64 }),
  customerPhone: varchar("customer_phone", { length: 64 }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  productName: text("product_name"),
  quantity: integer("quantity"),
  weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
  dimensions: varchar("dimensions", { length: 64 }),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
  estimatedDelivery: timestamp("estimated_delivery", { withTimezone: true }),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  customerId: integer("customer_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdById: integer("created_by_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Shipment = typeof shipmentsTable.$inferSelect;
