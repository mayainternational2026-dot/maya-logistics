---
name: Drizzle push ambiguous rename prompts
description: drizzle-kit push interactive prompts for orphan/new tables and how to get past them safely
---

`drizzle-kit push` (and `push-force`) prompts interactively when it sees a table in the DB that
isn't in the Drizzle schema alongside a new table being added in the schema — it asks whether the
new table is a create or a rename of the orphan table. This prompt cannot be reliably answered by
piping stdin (`printf '\n'`, `echo y`) since it's a raw-mode TUI list picker, not a line-based
prompt.

**Why:** Blindly forcing an answer is risky — picking "rename" on the wrong pair, or applying
`--force` past a "this will drop table X" warning, can silently destroy an active table (e.g. a
`rate_limit_hits` table created outside Drizzle's schema by application code).

**How to apply:** When `drizzle-kit push` hits one of these prompts:
1. Identify whether the "orphan" table (the one not in the schema) is still needed by the app
   (e.g. grep for its name in application code, not just Drizzle schema files).
2. If the new table is genuinely new (not a rename), create it manually via a `CREATE TABLE IF NOT
   EXISTS` SQL statement matching the Drizzle schema definition exactly (column names, types,
   defaults, constraints), using `psql "$DATABASE_URL"`.
3. Re-run `drizzle-kit push` — once the table already exists with a matching shape, Drizzle
   detects no diff for it and the ambiguous prompt disappears for that table.
4. Never accept a "drop table" / data-loss confirmation without first confirming the table is
   truly unused.
