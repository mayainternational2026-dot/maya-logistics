import type { Request } from "express";

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
export const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

export function getRealIp(req: Request): string {
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
