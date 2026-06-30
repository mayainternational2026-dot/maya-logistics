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
import { pool } from "@workspace/db";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const app: Express = express();

// Trust Replit's reverse proxy so req.secure and cookies work correctly in production
app.set("trust proxy", 1);

/**
 * Trusted proxy detection for rate-limit key generation.
 *
 * Trust model:
 *   - In production, all external traffic arrives via Replit's reverse proxy,
 *     which connects from localhost (127.0.0.1 / ::1 / ::ffff:127.0.0.1).
 *   - When the direct socket comes from localhost we consider the request
 *     proxy-mediated and read the LAST entry of X-Forwarded-For — the IP the
 *     trusted proxy appended, representing the real client address.
 *     Entries further left in the chain are client-controlled and ignored.
 *   - When the direct socket comes from any other address (direct connection in
 *     development or a misconfigured path) we use socket.remoteAddress itself,
 *     so a spoofed X-Forwarded-For header has no effect on rate limiting.
 *
 * This prevents header-rotation attacks: an attacker cannot fake their IP by
 * sending arbitrary X-Forwarded-For values, because we only honour the entry
 * appended by the proxy we actually trust.
 */
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function getRealIp(req: express.Request): string {
  const socketIp = req.socket.remoteAddress ?? "unknown";
  if (!LOOPBACK.has(socketIp)) {
    // Direct connection — trust the socket, ignore XFF entirely.
    return socketIp;
  }
  // Proxy-mediated connection — use only the rightmost XFF entry (added by proxy).
  const xff = req.headers["x-forwarded-for"];
  if (!xff) return socketIp;
  const chain = (Array.isArray(xff) ? xff.join(",") : xff).split(",");
  const proxied = chain[chain.length - 1]?.trim();
  return proxied || socketIp;
}

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
app.use(express.json());
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
// Limits are per IP; windows reset after the specified duration.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  message: { error: "Too many requests. Please try again later." },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  message: { error: "Too many attempts. Please request a new code and try again." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  message: { error: "Too many login attempts. Please try again later." },
});

const registerOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
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
  message: { error: "Too many OTP requests for this email address. Please try again later." },
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
  message: { error: "Too many password reset requests for this email address. Please try again later." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
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
  message: { error: "Too many contact requests from this email address. Please try again later." },
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRealIp,
  message: { error: "Too many inquiry submissions. Please try again later." },
});

app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth/forgot-password", forgotPasswordEmailLimiter);
app.use("/api/auth/reset-password", resetPasswordLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register-otp", registerOtpLimiter);
app.use("/api/auth/register-otp", registerOtpEmailLimiter);
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
