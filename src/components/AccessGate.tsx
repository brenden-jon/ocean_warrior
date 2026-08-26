"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  isUnlocked,
  markUnlocked,
  verifyPassphrase,
  type GateSentinel,
} from "@/lib/gate";

/**
 * Wraps the whole application. Renders nothing of the product until the
 * visitor's passphrase successfully decrypts the build-time sentinel.
 *
 * Deliberately renders its own full-screen experience rather than redirecting,
 * because a static export has no server to redirect from.
 */
export default function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sentinel, setSentinel] = useState<GateSentinel | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setUnlocked(isUnlocked());
    setChecked(true);
  }, []);

  useEffect(() => {
    if (unlocked || !checked) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    fetch(`${base}/gate.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSentinel)
      .catch(() => setSentinel(null));
  }, [unlocked, checked]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!sentinel) {
      setError("The gate is not configured. Rebuild with APP_PASSWORD set.");
      return;
    }
    setPending(true);
    setError(null);

    // 600k PBKDF2 iterations takes a moment; yield so the button can repaint
    // into its pending state before the main thread is occupied.
    await new Promise((resolve) => setTimeout(resolve, 16));

    const ok = await verifyPassphrase(passphrase, sentinel);
    if (ok) {
      markUnlocked();
      setUnlocked(true);
    } else {
      setError("Incorrect passphrase.");
      setPassphrase("");
    }
    setPending(false);
  }

  // Avoid a flash of the gate for an already-unlocked visitor.
  if (!checked) return null;
  if (unlocked) return <>{children}</>;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-3xl"
          style={{
            background: "radial-gradient(circle, #00b7e8 0%, transparent 62%)",
          }}
        />
      </div>

      <div className="fade-up relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-4">Ocean Warrior</p>
          <h1 className="display text-5xl leading-[0.9] text-ice sm:text-6xl">
            Planetary
            <br />
            Pulse
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            A living view of a changing ocean.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="passphrase" className="sr-only">
            Passphrase
          </label>
          <input
            id="passphrase"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "gate-error" : undefined}
            className="w-full rounded-sm border border-[var(--hairline-bright)] bg-[rgba(7,20,36,0.6)] px-4 py-3 text-center text-sm text-ice placeholder:text-dim focus:border-cyan focus:outline-none"
          />

          <button
            type="submit"
            disabled={pending || passphrase.length === 0}
            className="w-full rounded-sm bg-cyan px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-abyss transition-opacity duration-200 hover:bg-cyan-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Checking…" : "Enter"}
          </button>

          {error && (
            <p id="gate-error" role="alert" className="pt-1 text-center text-xs text-alert">
              {error}
            </p>
          )}
        </form>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-dim">
          Private prototype. Not for publication or circulation.
        </p>
      </div>
    </main>
  );
}
