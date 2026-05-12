import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  boolean,
  numeric,
  text,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  clockIn: timestamp("clock_in", { withTimezone: true }).notNull(),
  clockOut: timestamp("clock_out", { withTimezone: true }),
  clockInLat: numeric("clock_in_lat", { precision: 10, scale: 7 }),
  clockInLng: numeric("clock_in_lng", { precision: 10, scale: 7 }),
  clockOutLat: numeric("clock_out_lat", { precision: 10, scale: 7 }),
  clockOutLng: numeric("clock_out_lng", { precision: 10, scale: 7 }),
  isLate: boolean("is_late").notNull().default(false),
  totalMinutes: integer("total_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Attendance = typeof attendanceTable.$inferSelect;
