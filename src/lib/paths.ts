/**
 * Asset paths.
 *
 * GitHub project pages are served from /<repo>/, so every runtime fetch of a
 * file in public/ needs that prefix. Next rewrites `src` on components it
 * controls, but a bare fetch() is ours to handle.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}
