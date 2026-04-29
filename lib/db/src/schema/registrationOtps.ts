import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const registrationOtpsTable = pgTable("registration_otps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  otp: varchar("otp", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RegistrationOtp = typeof registrationOtpsTable.$inferSelect;
