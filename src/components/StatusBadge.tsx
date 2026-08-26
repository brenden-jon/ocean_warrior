import { STATUS_LABELS } from "@/lib/catalog";
import type { LayerStatus } from "@/lib/types";

/**
 * Layer status, shown wherever a layer is named.
 *
 * Demo is amber and never green, because the one thing this badge must never
 * do is let synthetic data pass for real.
 */
const STYLES: Record<LayerStatus, string> = {
  live: "border-cyan/40 bg-cyan/10 text-cyan-bright",
  credentials_required: "border-amber/30 bg-amber/8 text-amber",
  connector_ready: "border-[var(--hairline-bright)] text-muted",
  planned: "border-[var(--hairline)] text-dim",
  demo: "border-amber/50 bg-amber/12 text-amber",
};

export default function StatusBadge({
  status,
  className = "",
}: {
  status: LayerStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${STYLES[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
