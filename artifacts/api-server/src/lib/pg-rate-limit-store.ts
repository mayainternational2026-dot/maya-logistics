/**
 * PostgreSQL-backed store for express-rate-limit.
 *
 * Counters are persisted to `rate_limit_hits` so they survive process
 * restarts, redeploys, and autoscale spin-ups. An attacker who triggers
 * a restart cannot clear their OTP budget.
 *
 * Each store instance is constructed with a unique `scope` string that is
 * prepended to every persisted key (`"<scope>:<key>"`). This guarantees full
 * isolation between limiters: an IP that is counted by the login limiter
 * never shares a row with the same IP counted by the register-OTP limiter,
 * and the `window_ms` for each row always belongs to exactly one policy.
 *
 * The table is created automatically on first use (idempotent DDL).
 * All hit increments use a single atomic UPSERT — no separate SELECT needed.
 */

import type { Store, Options, IncrementResponse } from "express-rate-limit";

/** Minimal subset of the pg Pool API used by this store. */
interface QueryablePool {
  query<R extends object = object>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: R[] }>;
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS rate_limit_hits (
    key          TEXT        NOT NULL PRIMARY KEY,
    window_ms    BIGINT      NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    hits         INTEGER     NOT NULL DEFAULT 1
  )
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_window_start
    ON rate_limit_hits (window_start)
`;

/** Shared promise so DDL runs exactly once per process, regardless of instance count. */
let tableEnsuredPromise: Promise<void> | null = null;

export class PgRateLimitStore implements Store {
  private pool: QueryablePool;
  /**
   * Stable identifier for this limiter policy (e.g. "login-ip", "reg-email").
   * Prepended to every stored key so limiters never share rows.
   */
  private scope: string;
  private windowMs: number = 60_000;

  /**
   * @param pool  - The pg Pool (or any object with a compatible `query` method).
   * @param scope - A unique, stable label for this limiter policy. Must not
   *                contain colons. Examples: "login-ip", "reg-email", "fp-ip".
   */
  constructor(pool: QueryablePool, scope: string) {
    if (!scope || scope.includes(":")) {
      throw new Error(
        `PgRateLimitStore: scope must be a non-empty string without colons, got "${scope}"`,
      );
    }
    this.pool = pool;
    this.scope = scope;
  }

  /** Returns the fully-qualified storage key for this limiter. */
  private sk(key: string): string {
    return `${this.scope}:${key}`;
  }

  async init(options: Options): Promise<void> {
    this.windowMs = options.windowMs;
    if (!tableEnsuredPromise) {
      tableEnsuredPromise = this.pool
        .query(CREATE_TABLE_SQL)
        .then(() => this.pool.query(CREATE_INDEX_SQL))
        .then(() => undefined);
    }
    await tableEnsuredPromise;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const windowMs = this.windowMs;
    const result = await this.pool.query<{
      hits: number;
      window_start: Date;
    }>(
      `
      INSERT INTO rate_limit_hits (key, window_ms, window_start, hits)
      VALUES ($1, $2, NOW(), 1)
      ON CONFLICT (key) DO UPDATE SET
        window_start = CASE
          WHEN rate_limit_hits.window_start
               + (rate_limit_hits.window_ms * INTERVAL '1 millisecond') < NOW()
            THEN NOW()
          ELSE rate_limit_hits.window_start
        END,
        hits = CASE
          WHEN rate_limit_hits.window_start
               + (rate_limit_hits.window_ms * INTERVAL '1 millisecond') < NOW()
            THEN 1
          ELSE rate_limit_hits.hits + 1
        END,
        window_ms = $2
      RETURNING hits, window_start
      `,
      [this.sk(key), windowMs],
    );

    const row = result.rows[0];
    if (!row) throw new Error("rate_limit_hits UPSERT returned no rows");

    const resetTime = new Date(row.window_start.getTime() + windowMs);
    return { totalHits: row.hits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    await this.pool.query(
      `UPDATE rate_limit_hits SET hits = GREATEST(0, hits - 1) WHERE key = $1`,
      [this.sk(key)],
    );
  }

  async resetKey(key: string): Promise<void> {
    await this.pool.query(`DELETE FROM rate_limit_hits WHERE key = $1`, [
      this.sk(key),
    ]);
  }

  async resetAll(): Promise<void> {
    await this.pool.query(
      `DELETE FROM rate_limit_hits WHERE key LIKE $1`,
      [`${this.scope}:%`],
    );
  }

  /** Remove expired windows — call periodically to prevent unbounded growth. */
  async pruneExpired(): Promise<void> {
    await this.pool.query(
      `DELETE FROM rate_limit_hits
       WHERE window_start + (window_ms * INTERVAL '1 millisecond') < NOW()`,
    );
  }
}
