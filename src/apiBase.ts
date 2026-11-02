// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/apiBase.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// Which address the calls of a web client go to. Two situations, both documented:
//
//   - development behind a proxy: every call uses a RELATIVE path and the dev server forwards it, so the base is the empty string;
//   - production, served statically from anywhere: every call needs an absolute origin. It is the one the caller configured, and when none was
//     configured it is the origin this same page was loaded from (same scheme, same host, same port), which is where the server is in the default
//     "everything on the CM5" deployment. The scheme of the page decides http or https (a page on https that called http would be refused as mixed content).
//
// The functions are pure: the caller passes the page location and the configured value, so they are tested without a browser.

export interface PageLocation {
  protocol: string;
  hostname: string;
  port: string;
}

export interface ApiBaseOptions {
  /** The address the operator configured (for example the value of `VITE_API_BASE_URL`). Empty or missing means "not configured". */
  configured?: string | null;
  /** True in development behind a proxy: the base is then empty. */
  dev?: boolean;
  /** The location of the page. Missing (a server-side render): `http://localhost`. */
  location?: PageLocation | null;
}

/** '' in development; the configured address without trailing slashes; otherwise the origin of the page. */
export function resolveApiBase(options: ApiBaseOptions = {}): string {
  if (options.dev) return '';
  const configured = options.configured?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const location = options.location;
  const protocol = location?.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = location?.hostname || 'localhost';
  // Behind a reverse proxy on 80/443 the page has no port of its own and the API is on that same origin: no port is invented.
  return location?.port ? `${protocol}//${hostname}:${location.port}` : `${protocol}//${hostname}`;
}

/** The base followed by `path` (a path starts with `/`). */
export function apiUrl(base: string, path: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** The WebSocket address of `path` on the same host as `base`; with an empty base it follows the page (`host` includes the port). */
export function wsUrl(base: string, path: string, page?: { protocol: string; host: string } | null): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    const scheme = base.startsWith('https:') ? 'wss:' : 'ws:';
    return `${scheme}${base.replace(/^https?:/i, '')}${clean}`;
  }
  const scheme = page?.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${page?.host || 'localhost'}${clean}`;
}
