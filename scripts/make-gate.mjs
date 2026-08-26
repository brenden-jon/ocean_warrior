#!/usr/bin/env node
/**
 * Generate the access-gate sentinel from APP_PASSWORD.
 *
 * Run at build time only. The passphrase itself never enters the repository or
 * the client bundle — only a salted, iterated, authenticated ciphertext of a
 * fixed known string, which the browser attempts to decrypt with whatever the
 * visitor types.
 *
 *   APP_PASSWORD='some strong passphrase' node scripts/make-gate.mjs
 *
 * Writes public/gate.json.
 */

import { webcrypto as crypto } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PBKDF2_ITERATIONS = 600_000;
const SENTINEL_PLAINTEXT = "planetary-pulse";

const passphrase = process.env.APP_PASSWORD;

if (!passphrase || passphrase === "CHANGE_ME") {
  console.error(
    "\n  APP_PASSWORD is not set.\n\n" +
      "  Locally:  APP_PASSWORD='your passphrase' npm run build\n" +
      "  In CI:    add APP_PASSWORD as a GitHub Actions secret.\n",
  );
  process.exit(1);
}

if (passphrase.length < 12) {
  console.error(
    "\n  APP_PASSWORD is too short.\n\n" +
      "  This gate is attackable offline, so passphrase strength is the only\n" +
      "  real protection. Use at least 12 characters — ideally four or more\n" +
      "  unrelated words.\n",
  );
  process.exit(1);
}

const toBase64 = (bytes) => Buffer.from(bytes).toString("base64");

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const material = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(passphrase),
  "PBKDF2",
  false,
  ["deriveKey"],
);

const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
  material,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);

const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  new TextEncoder().encode(SENTINEL_PLAINTEXT),
);

const sentinel = {
  salt: toBase64(salt),
  iv: toBase64(iv),
  ciphertext: toBase64(ciphertext),
  iterations: PBKDF2_ITERATIONS,
};

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "public", "gate.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(sentinel, null, 2) + "\n");

console.log(`Wrote ${target} (PBKDF2 ${PBKDF2_ITERATIONS.toLocaleString()} iterations)`);
