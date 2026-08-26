import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 *
 * No server, so no middleware and no route handlers. Consequences, all handled
 * elsewhere in the codebase:
 *   - The password gate is client-side (see src/lib/gate.ts). It is a keep-out
 *     sign, not a lock, and SCIENTIFIC_INTEGRITY.md says so plainly.
 *   - Sources that refuse cross-origin browser requests (NSIDC, NDBC, GISTEMP,
 *     Argo) are fetched by a scheduled GitHub Action and committed as compact
 *     JSON under public/data. Every such file carries its own fetch timestamp
 *     and is labelled in the UI as a daily snapshot, never as live.
 *   - Everything else (NASA GIBS tiles, NOAA ERDDAP, OBIS, GEBCO) serves
 *     permissive CORS and is fetched directly by the browser.
 */

// Project pages are served from https://<user>.github.io/<repo>/, so every
// asset and route needs the repo name prefixed. Unset for local development.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  // No image optimiser without a server.
  images: { unoptimized: true },
  // Emit /explore/index.html rather than /explore.html, so GitHub Pages serves
  // clean URLs without a trailing-slash redirect.
  trailingSlash: true,
};

export default nextConfig;
