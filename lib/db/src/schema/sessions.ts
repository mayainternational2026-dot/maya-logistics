import { pgTable, varchar, json, timestamp, index } from "drizzle-orm/pg-core";

// Session storage table for connect-pg-simple. The library manages this table
// itself, but defining it here lets drizzle-kit create it during `db push`
// so we don't need a separate migration step.
export const sessionsTable = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6, withTimezone: false }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
