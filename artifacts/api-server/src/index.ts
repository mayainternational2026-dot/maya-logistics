import app from "./app";
import { logger } from "./lib/logger";
import { runStartupSeed } from "./lib/startup-seed";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run seed first, then warm the DB connection pool, then open the port.
// Pre-warming means the first real request (login, dashboard) hits an already-open
// Neon connection instead of waiting for a cold TCP handshake + SSL negotiation.
(async () => {
  await runStartupSeed();

  // Warm the pool: acquire + release one connection so it's open before the
  // first user request arrives.
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("DB connection pool warmed");
  } catch (err) {
    logger.warn({ err }, "DB warm-up query failed — server will still start");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
})();
