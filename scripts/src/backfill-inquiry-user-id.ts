import { pool } from "@workspace/db";

/**
 * Backfills `inquiries.user_id` for inquiries submitted before user_id
 * tracking existed. Matches inquiries to users by email, but only when
 * the email maps to exactly one user account (ambiguous or missing
 * matches are left untouched).
 */
async function main() {
  const client = await pool.connect();
  try {
    const { rows: candidates } = await client.query<{
      id: number;
      email: string;
    }>(
      `SELECT id, email FROM inquiries WHERE user_id IS NULL`,
    );

    if (candidates.length === 0) {
      console.log("No inquiries with a missing user_id — nothing to backfill.");
      return;
    }

    let updated = 0;
    let skippedNoMatch = 0;
    let skippedAmbiguous = 0;

    for (const inquiry of candidates) {
      const normalizedEmail = inquiry.email.trim().toLowerCase();

      const { rows: users } = await client.query<{ id: number }>(
        `SELECT id FROM users WHERE lower(email) = $1`,
        [normalizedEmail],
      );

      if (users.length === 0) {
        skippedNoMatch++;
        continue;
      }

      if (users.length > 1) {
        skippedAmbiguous++;
        continue;
      }

      await client.query(`UPDATE inquiries SET user_id = $1 WHERE id = $2`, [
        users[0].id,
        inquiry.id,
      ]);
      updated++;
    }

    console.log(
      `Backfill complete: ${updated} updated, ${skippedNoMatch} skipped (no matching user), ${skippedAmbiguous} skipped (ambiguous email match). ${candidates.length} total candidates.`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
