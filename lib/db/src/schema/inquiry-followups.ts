import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { inquiriesTable } from "./inquiries";
import { usersTable } from "./users";

export const inquiryFollowupsTable = pgTable("inquiry_followups", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id")
    .notNull()
    .references(() => inquiriesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InquiryFollowup = typeof inquiryFollowupsTable.$inferSelect;
