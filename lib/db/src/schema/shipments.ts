import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const shipmentsTable = pgTable("shipments", {
  id: serial("id").primaryKey(),
  trackingId: varchar("tracking_id", { length: 32 }).notNull().unique(),
  senderName: text("sender_name").notNull(),
  senderPhone: varchar("sender_phone", { length: 64 }),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: varchar("receiver_phone", { length: 64 }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
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
