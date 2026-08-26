import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      {/* Slow-drifting depth field. Pure CSS — no asset, no request. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-3xl"
             style={{ background: "radial-gradient(circle, #00b7e8 0%, transparent 62%)" }} />
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

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-dim">
          Private prototype. Not for publication or circulation.
        </p>
      </div>
    </main>
  );
}
