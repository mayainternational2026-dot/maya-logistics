import express, { type Express } from "express";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { attachUser } from "./lib/auth";
import { PgRateLimitStore } from "./lib/pg-rate-limit-store";
import { getRealIp } from "./lib/get-real-ip";
import { pool, db, registrationOtpsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const app: Express = express();

// Trust Replit's reverse proxy so req.secure and cookies work correctly in production
app.set("trust proxy", 1);

// Gzip all responses — reduces payload ~70 % for JSON and HTML
app.use(compression());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
// 10 MB body-size limit: the inquiry form lets customers attach up to 4 product
// photos. Before upload the mobile client resizes each image so its longest
// side is at most 800 px, then compresses to JPEG quality 0.6. A typical
// result is ~50–150 KB per image. 4 images × ~150 KB = ~600 KB of raw bytes;
// base64 encoding inflates that to ~800 KB. 10 MB gives ample headroom while
// still bounding runaway payloads. All other endpoints send tiny JSON payloads
// (< 1 KB) and are unaffected by this limit.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);
const sessionSecret = process.env["SESSION_SECRET"] ?? "maya-dev-secret";

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    name: "maya.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  }),
);

app.use(attachUser);

// Rate limit sensitive auth endpoints to slow brute-force and enumeration.
// Every rateLimit() call receives a scoped PgRateLimitStore so counters are:
//   • Persistent across process restarts (PostgreSQL-backed), and
//   • Fully isolated between policies — the same IP is counted separately
//     by each limiter; no cross-endpoint counter sharing or window corruption.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  store: new PgRateLimitStore(pool, "fp-ip"),
  message: { error: "Too many requests. Please try again later." },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  store: new PgRateLimitStore(pool, "rp-ip"),
  message: { error: "Too many attempts. Please request a new code and try again." },
});

// Per-email gate for OTP submission: max 5 attempts per email per 15-minute
// window regardless of IP. An attacker rotating IPs cannot guess the 6-digit
// OTP more than 5 times per window for the same target address.
const resetPasswordEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (typeof req.body?.email === "string" ? req.body.email : "")
      .toLowerCase()
      .trim();
    return email ? `rp-email:${email}` : `rp-ip:${getRealIp(req)}`;
  },
  store: new PgRateLimitStore(pool, "rp-email"),
  message: { error: "Too many attempts for this email. Please request a new code and try again." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  store: new PgRateLimitStore(pool, "login-ip"),
  message: { error: "Too many login attempts. Please try again later." },
});

const registerOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  store: new PgRateLimitStore(pool, "reg-otp-ip"),
  message: { error: "Too many registration attempts. Please try again later." },
});

// Per-email gate: max 3 OTP emails per hour for the same address regardless of IP.
// This prevents a bot rotating IPs from bombing a single inbox.
const registerOtpEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (typeof req.body?.email === "string" ? req.body.email : "")
      .toLowerCase()
      .trim();
    return email ? `reg-email:${email}` : `reg-ip:${getRealIp(req)}`;
  },
  store: new PgRateLimitStore(pool, "reg-otp-email"),
  message: { error: "Too many OTP requests for this email address. Please try again later." },
});

// Per-email gate for OTP verification: max 5 attempts per email per 15-minute
// window regardless of IP. On limit hit, the pending OTP is deleted so an
// attacker who exhausted their attempts must request a brand-new code,
// resetting their brute-force progress instead of just waiting out a window.
const registerVerifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (typeof req.body?.email === "string" ? req.body.email : "")
      .toLowerCase()
      .trim();
    return email ? `reg-verify-email:${email}` : `reg-verify-ip:${getRealIp(req)}`;
  },
  store: new PgRateLimitStore(pool, "reg-verify-email"),
  handler: async (req, res) => {
    const email = (typeof req.body?.email === "string" ? req.body.email : "")
      .toLowerCase()
      .trim();
    if (email) {
      try {
        await db.delete(registrationOtpsTable).where(eq(registrationOtpsTable.email, email));
      } catch (err) {
        logger.warn({ err, email }, "Failed to clear registration OTP after rate limit hit");
      }
    }
    res.status(429).json({
      error: "Too many verification attempts. Please request a new verification code.",
    });
  },
});

// Per-email gate for password reset: max 3 emails per hour for the same address.
const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (typeof req.body?.email === "string" ? req.body.email : "")
      .toLowerCase()
      .trim();
    return email ? `fp-email:${email}` : `fp-ip:${getRealIp(req)}`;
  },
  store: new PgRateLimitStore(pool, "fp-email"),
  message: { error: "Too many password reset requests for this email address. Please try again later." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  store: new PgRateLimitStore(pool, "contact-ip"),
  message: { error: "Too many messages sent. Please try again later." },
});

// Per-email gate for contact form: max 5 submissions per hour for the same sender
// address regardless of IP, so a bot rotating IPs cannot exhaust the SMTP quota.
const contactEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (typeof req.body?.email === "string" ? req.body.email : "")
      .toLowerCase()
      .trim();
    return email ? `contact-email:${email}` : `contact-ip:${getRealIp(req)}`;
  },
  store: new PgRateLimitStore(pool, "contact-email"),
  message: { error: "Too many contact requests from this email address. Please try again later." },
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  store: new PgRateLimitStore(pool, "inquiry-ip"),
  message: { error: "Too many inquiry submissions. Please try again later." },
});

// Prune expired rate-limit rows every 10 minutes to prevent unbounded table growth.
// The prune store scope is arbitrary — pruneExpired() deletes across all scopes.
const pruneStore = new PgRateLimitStore(pool, "prune");
setInterval(
  () => {
    pruneStore.pruneExpired().catch((err: unknown) => {
      logger.warn({ err }, "rate_limit_hits prune failed");
    });
  },
  10 * 60 * 1000,
);

app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth/forgot-password", forgotPasswordEmailLimiter);
app.use("/api/auth/reset-password", resetPasswordLimiter);
app.use("/api/auth/reset-password", resetPasswordEmailLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register-otp", registerOtpLimiter);
app.use("/api/auth/register-otp", registerOtpEmailLimiter);
app.use("/api/auth/register-verify", registerVerifyEmailLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/contact", contactEmailLimiter);

// Only rate-limit the public POST; admin GET/PATCH are authenticated
app.post("/api/inquiries", inquiryLimiter);

app.use("/api", router);

// Serve React frontend in production (Railway / any single-service deploy)
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "../../maya-logistics/dist/public");
  if (fs.existsSync(frontendDist)) {
    // Hashed assets (Vite fingerprints filenames) can be cached forever.
    // index.html and un-hashed files stay no-store so deploys are instant.
    app.use((req, res, next) => {
      if (/\/assets\/[^/]+\.[a-f0-9]{6,}\.[a-z]+(\?.*)?$/.test(req.path)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      }
      next();
    });
    app.use(express.static(frontendDist));
    app.get("*path", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    logger.info({ frontendDist }, "Serving frontend static files");
  }
}

export default app;
