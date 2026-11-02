/** Supplies a fresh end-user token; may be async. Return `{ token, expires_at }` as `POST /v1/tokens` does. */
export type TokenProvider = () => Promise<{ token: string; expires_at?: number } | string>;

/** Refresh this long before a token expires, in seconds, so a request never leaves with a stale one. */
const SKEW = 30;

/** Expiry (unix seconds) from the unverified payload of a dpdpkit token, or undefined if it cannot be read. The server does the verifying. */
export function tokenExpiry(token: string): number | undefined {
  try {
    const body = token.split(".")[0] ?? "";
    const padded = body.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(body.length / 4) * 4, "=");
    const exp = (JSON.parse(atob(padded)) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : undefined;
  } catch {
    return undefined;
  }
}

/** A provider that POSTs to the site's own backend, which mints the token with its API key. */
export function urlTokenProvider(url: string): TokenProvider {
  return async () => {
    const response = await fetch(url, { method: "POST", credentials: "same-origin", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`dpdp: token endpoint answered ${response.status}`);
    return (await response.json()) as { token: string; expires_at?: number };
  };
}

/**
 * Keeps one valid token for an element. A static `token` attribute is used until it expires; after that, or
 * when none is set, the provider (the `token-url` attribute or a `tokenProvider` property) is asked. Concurrent
 * callers share one provider call.
 */
export class TokenSource {
  private cached?: { token: string; expiresAt?: number };
  private pending?: Promise<string | undefined>;

  constructor(
    private readonly staticToken: () => string | null,
    private readonly provider: () => TokenProvider | undefined,
    private readonly now: () => number = () => Date.now() / 1000,
  ) {}

  private fresh(token: string, expiresAt = tokenExpiry(token)): boolean {
    return expiresAt === undefined || expiresAt - SKEW > this.now();
  }

  async get(force = false): Promise<string | undefined> {
    const given = this.staticToken();
    const provider = this.provider();
    if (given && !force && (this.fresh(given) || !provider)) return given;
    if (!provider) return undefined;
    if (this.cached && !force && this.fresh(this.cached.token, this.cached.expiresAt)) return this.cached.token;
    this.pending ??= provider()
      .then((issued) => {
        const token = typeof issued === "string" ? issued : issued.token;
        const expiresAt = typeof issued === "string" ? undefined : issued.expires_at;
        this.cached = { token, expiresAt: expiresAt ?? tokenExpiry(token) };
        return token;
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }

  get canRefresh(): boolean {
    return this.provider() !== undefined;
  }
}
