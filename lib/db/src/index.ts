import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL in production
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
  // Keep connections alive so Neon serverless doesn't cold-start on each request
  max: 5,
  idleTimeoutMillis: 60_000,       // hold idle connections for 60 s
  connectionTimeoutMillis: 10_000, // fail fast if DB is unreachable
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
