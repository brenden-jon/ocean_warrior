import { CATALOG } from "@/lib/catalog";

/**
 * Data provider acknowledgements.
 *
 * Derived from the catalog rather than hand-maintained, so a new layer cannot
 * be added without its provider appearing here. Attribution is a licence
 * condition for several of these sources, not a courtesy.
 */

interface Provider {
  org: string;
  url: string;
  attribution: string;
  layers: string[];
}

function buildProviders(): Provider[] {
  const byOrg = new Map<string, Provider>();

  for (const layer of CATALOG) {
    // Ocean Warrior's own entries are not third-party sources.
    if (layer.sourceOrg === "Ocean Warrior" || layer.sourceOrg === "Planetary Pulse") {
      continue;
    }
    const existing = byOrg.get(layer.sourceOrg);
    if (existing) {
      existing.layers.push(layer.title);
      // Prefer the longest attribution string — usually the fullest citation.
      if (layer.attribution.length > existing.attribution.length) {
        existing.attribution = layer.attribution;
      }
      continue;
    }
    byOrg.set(layer.sourceOrg, {
      org: layer.sourceOrg,
      url: layer.sourceUrl,
      attribution: layer.attribution,
      layers: [layer.title],
    });
  }

  return [...byOrg.values()].sort((a, b) => b.layers.length - a.layers.length);
}

export default function ProviderAcknowledgements() {
  const providers = buildProviders();

  return (
    <div className="!mt-8 space-y-px">
      {providers.map((provider) => (
        <div
          key={provider.org}
          className="border border-[var(--hairline)] p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[15px] text-ice">{provider.org}</h3>
            <a
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted underline decoration-dotted underline-offset-2 transition-colors hover:text-cyan-bright"
            >
              Visit source
            </a>
          </div>

          <p className="mt-2 text-[12px] leading-relaxed text-dim">
            {provider.attribution}
          </p>

          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            <span className="text-dim">
              {provider.layers.length === 1 ? "Layer: " : "Layers: "}
            </span>
            {provider.layers.join(" · ")}
          </p>
        </div>
      ))}

      <p className="!mt-8 text-[12px] leading-relaxed text-dim">
        Ocean Warrior expeditions are made possible by their scientific
        partners, crew and participants. Partner institutions will be credited
        on each expedition page, and against every measurement they contribute,
        once expeditions begin.
      </p>
    </div>
  );
}
