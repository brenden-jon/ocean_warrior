/**
 * Client-side access gate.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS, HONESTLY
 *
 * This is a keep-out sign, not a lock. The site is a static export on a public
 * host, so the encrypted sentinel below is downloadable by anyone, and can be
 * attacked offline as fast as their hardware allows. There is no server to rate
 * limit, no account to lock.
 *
 * That is an accepted trade for this prototype, because nothing behind the gate
 * is confidential: every dataset is public, and the only thing being protected
 * is an unfinished interface. The protection that matters is therefore the
 * passphrase itself. PBKDF2 at 600,000 iterations means a multi-word passphrase
 * is impractical to brute-force, while a single dictionary word falls quickly.
 *
 * If the prototype ever needs real confidentiality, the fix is a server-side
 * gate — not a bigger number here.
 * ---------------------------------------------------------------------------
 */

export const GATE_STORAGE_KEY = "ow_pulse_unlocked";
const PBKDF2_ITERATIONS = 600_000;
const SENTINEL_PLAINTEXT = "planetary-pulse";

export interface GateSentinel {
  /** Base64 salt. */
  salt: string;
  /** Base64 AES-GCM initialisation vector. */
  iv: string;
  /** Base64 ciphertext of SENTINEL_PLAINTEXT. */
  ciphertext: string;
  iterations: number;
}

function toBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Verify a passphrase against the build-time sentinel. */
export async function verifyPassphrase(
  passphrase: string,
  sentinel: GateSentinel,
): Promise<boolean> {
  try {
    const key = await deriveKey(
      passphrase,
      toBytes(sentinel.salt),
      sentinel.iterations ?? PBKDF2_ITERATIONS,
    );
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toBytes(sentinel.iv) as unknown as BufferSource },
      key,
      toBytes(sentinel.ciphertext) as unknown as BufferSource,
    );
    return new TextDecoder().decode(plaintext) === SENTINEL_PLAINTEXT;
  } catch {
    // A wrong key fails GCM authentication and throws. That is the expected
    // path for an incorrect passphrase, not an error worth surfacing.
    return false;
  }
}

/**
 * Generate a sentinel. Used by scripts/make-gate.mjs at build time, never in
 * the browser — the passphrase must not appear in the client bundle.
 */
export async function createSentinel(
  passphrase: string,
): Promise<GateSentinel> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    new TextEncoder().encode(SENTINEL_PLAINTEXT),
  );
  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    iterations: PBKDF2_ITERATIONS,
  };
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(GATE_STORAGE_KEY) === "1";
}

export function markUnlocked(): void {
  window.sessionStorage.setItem(GATE_STORAGE_KEY, "1");
}

export function lock(): void {
  window.sessionStorage.removeItem(GATE_STORAGE_KEY);
}
