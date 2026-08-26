"use client";

import { useState, type ReactNode } from "react";

/**
 * Collapsible group for the explore drawer.
 *
 * The previous flat list put Ocean Warrior's own layers below five scientific
 * rasters, so the thing that makes this platform distinctive was off-screen
 * until you scrolled. Groups collapse so everything important fits at once.
 */
export function LayerGroup({
  title,
  subtitle,
  defaultOpen = true,
  accent,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  accent?: string;
  badge?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--hairline)] last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        {accent && (
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
          />
        )}
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {title}
        </span>
        {badge && (
          <span className="rounded-[2px] border border-cyan/40 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-bright">
            {badge}
          </span>
        )}
        <span
          aria-hidden
          className={`text-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {subtitle && (
            <p className="mb-2.5 text-[10px] leading-relaxed text-dim">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/** A checkbox row with a colour swatch and optional count. */
export function LayerToggle({
  label,
  checked,
  onChange,
  count,
  swatch,
  disabled,
  badge,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
  swatch?: string;
  disabled?: boolean;
  badge?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        className={`flex items-center gap-2.5 py-1.5 text-[13px] transition-colors ${
          disabled
            ? "cursor-not-allowed text-dim"
            : "cursor-pointer text-muted hover:text-ice"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-cyan"
        />
        {swatch && (
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: swatch, opacity: disabled ? 0.4 : 1 }}
          />
        )}
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="shrink-0 rounded-[2px] border border-amber/40 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-amber">
            {badge}
          </span>
        )}
        {count != null && (
          <span className="text-[10px] text-dim tnum">
            {count.toLocaleString()}
          </span>
        )}
      </label>
      {hint && (
        <p className="mb-1 ml-[26px] text-[10px] leading-relaxed text-dim">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Single-select row that can also be switched off.
 *
 * The earlier version had no "off" state at all: once a base layer was chosen
 * there was no way back to plain imagery, which made the drawer feel like a
 * trap. Selecting the active row now clears it.
 */
export function BaseLayerOption({
  label,
  blurb,
  active,
  onSelect,
  onClear,
}: {
  label: string;
  blurb?: string;
  active: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
  return (
    <button
      onClick={() => (active ? onClear() : onSelect())}
      aria-pressed={active}
      title={active ? "Click again to turn this layer off" : undefined}
      className={`group flex w-full items-start gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors duration-150 ${
        active
          ? "bg-cyan/10 text-cyan-bright"
          : "text-muted hover:bg-white/[0.03] hover:text-ice"
      }`}
    >
      <span
        aria-hidden
        className={`mt-[3px] flex h-3 w-3 shrink-0 items-center justify-center rounded-full border transition-colors ${
          active ? "border-cyan-bright" : "border-[var(--hairline-bright)]"
        }`}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-bright" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-tight">{label}</span>
        {blurb && (
          <span className="mt-0.5 block text-[10px] leading-snug text-dim">
            {blurb}
          </span>
        )}
      </span>
      {active && (
        <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-cyan-bright/60 opacity-0 transition-opacity group-hover:opacity-100">
          Off
        </span>
      )}
    </button>
  );
}
