import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const passwordResetsTable = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 16 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PasswordReset = typeof passwordResetsTable.$inferSelect;
