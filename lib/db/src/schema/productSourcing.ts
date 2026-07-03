import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const productSourcingTable = pgTable("product_sourcing", {
  id: serial("id").primaryKey(),
  sourceProduct: text("source_product").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  customsCost: numeric("customs_cost", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  serviceCharge: numeric("service_charge", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  productImagePath: text("product_image_path"),
  productVideoPath: text("product_video_path"),
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

export type ProductSourcing = typeof productSourcingTable.$inferSelect;
