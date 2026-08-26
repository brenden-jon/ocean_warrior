"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const next = params.get("next");
        // Only follow same-origin relative paths, so a crafted ?next= cannot
        // turn the login into an open redirect.
        router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Try again.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className="w-full rounded-sm border border-[var(--hairline-bright)] bg-[rgba(7,20,36,0.6)] px-4 py-3 text-center text-sm text-ice placeholder:text-dim focus:border-cyan focus:outline-none focus-visible:outline-2 focus-visible:outline-cyan-bright"
        />
      </div>

      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="w-full rounded-sm bg-cyan px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-abyss transition-opacity duration-200 hover:bg-cyan-bright disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Checking…" : "Enter"}
      </button>

      {error && (
        <p
          id="login-error"
          role="alert"
          className="pt-1 text-center text-xs text-alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
