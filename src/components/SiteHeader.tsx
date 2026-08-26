"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/arctic", label: "Arctic" },
  { href: "/expeditions", label: "Expeditions" },
  { href: "/data", label: "Data" },
  { href: "/methodology", label: "Methodology" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="glass-strong border-b border-[var(--hairline)]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-3 sm:px-10 lg:px-16">
          <Link href="/" className="group flex items-baseline gap-2.5">
            <span className="display text-base leading-none text-ice transition-colors duration-200 group-hover:text-cyan-bright">
              Ocean Warrior
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-cyan-bright/80 sm:inline">
              Planetary Pulse
            </span>
          </Link>

          <nav aria-label="Primary">
            <ul className="flex items-center gap-1 sm:gap-2">
              {NAV.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-sm px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:px-3 ${
                        active
                          ? "text-cyan-bright"
                          : "text-muted hover:text-ice"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
