import { pgTable, serial, text, varchar, numeric, timestamp } from "drizzle-orm/pg-core";

export const shippingRatesTable = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  rateUsd: numeric("rate_usd", { precision: 10, scale: 2 }).notNull(),
  rateNpr: numeric("rate_npr", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShippingRate = typeof shippingRatesTable.$inferSelect;
