import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  text,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const workLogsTable = pgTable(
  "work_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    tasks: jsonb("tasks").$type<string[]>().notNull().default([]),
    summary: text("summary"),
    mood: integer("mood"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("work_logs_user_date_unique").on(t.userId, t.date)]
);

export type WorkLog = typeof workLogsTable.$inferSelect;
