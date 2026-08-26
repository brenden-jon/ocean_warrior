import { SignJWT, jwtVerify } from "jose";

/**
 * Prototype access gate.
 *
 * Deliberately simple: one shared password, a signed HTTP-only cookie, and no
 * user accounts. This is a private prototype for a small group of advisors, not
 * a product with users. The password never reaches the client bundle, and the
 * cookie carries no secrets — only an expiry.
 */

export const SESSION_COOKIE = "ow_pulse_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // two weeks

function secret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw === "CHANGE_ME") {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ scope: "prototype" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("planetary-pulse")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret(), { issuer: "planetary-pulse" });
    return true;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/**
 * Constant-time string comparison.
 *
 * Avoids leaking password length or prefix through response timing. Web Crypto
 * has no timing-safe compare, so this is the standard XOR-accumulate approach,
 * over SHA-256 digests so that differing lengths cannot short-circuit.
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

/**
 * In-memory login rate limiter.
 *
 * Serverless instances are ephemeral and not shared, so this is a speed bump
 * rather than a guarantee — which is the honest description of what a shared
 * prototype password needs. Documented as such in SCIENTIFIC_INTEGRITY.md.
 */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function rateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.first + WINDOW_MS - now) / 1000),
    };
  }
  return { allowed: true };
}

export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}
