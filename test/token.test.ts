import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineDpdpElements } from "../src/index.js";
import { TokenSource, tokenExpiry } from "../src/token.js";

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const tokenExpiringAt = (exp: number) => `${b64({ typ: "user", sub: "u1", exp, scp: "" })}.sig`;

describe("tokenExpiry", () => {
  it("reads exp from the payload", () => expect(tokenExpiry(tokenExpiringAt(1234))).toBe(1234));
  it("is undefined for opaque or malformed tokens", () => {
    expect(tokenExpiry("opaque")).toBeUndefined();
    expect(tokenExpiry("")).toBeUndefined();
  });
});

describe("TokenSource", () => {
  it("uses a static token until it nears expiry, then asks the provider", async () => {
    let now = 1000;
    const provider = vi.fn(async () => ({ token: "fresh", expires_at: 5000 }));
    const source = new TokenSource(() => tokenExpiringAt(1100), () => provider, () => now);
    expect(await source.get()).toBe(tokenExpiringAt(1100));
    now = 1080; // inside the 30 s skew
    expect(await source.get()).toBe("fresh");
    expect(await source.get()).toBe("fresh");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("shares one provider call between concurrent requests", async () => {
    const provider = vi.fn(async () => "t");
    const source = new TokenSource(() => null, () => provider);
    expect(await Promise.all([source.get(), source.get()])).toEqual(["t", "t"]);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("keeps an expired static token when there is no provider", async () => {
    const source = new TokenSource(() => tokenExpiringAt(1), () => undefined, () => 1000);
    expect(await source.get()).toBe(tokenExpiringAt(1));
  });
});

describe("token-url", () => {
  let calls: Array<{ url: string; auth?: string; method?: string }>;
  let rejectFirst: boolean;
  let minted: number;

  beforeEach(() => {
    calls = [];
    rejectFirst = false;
    minted = 0;
    vi.stubGlobal("fetch", async (url: string, init: { method?: string; headers?: Record<string, string> } = {}) => {
      const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
      if (url === "/api/privacy-token") {
        minted++;
        return json({ token: `tok-${minted}`, expires_at: 9e9 });
      }
      calls.push({ url, auth: init.headers?.Authorization, method: init.method });
      if (rejectFirst && init.headers?.Authorization === "Bearer tok-1") return json({ error: { code: "unauthorized", message: "expired" } }, 401);
      if (new URL(url, "http://x").pathname === "/consents/me") return json({ consents: [] });
      return json({
        version: 1, locale: "en", title: "t", body: "b", purposes: [], links: {},
      });
    });
    defineDpdpElements();
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  async function mount(attrs: Record<string, string>) {
    const el = document.createElement("dpdp-consent");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.append(el);
    await vi.waitFor(() => expect(el.shadowRoot!.textContent).not.toContain("Loading"));
    return el;
  }

  it("fetches a token from the site's backend and sends it as a bearer token", async () => {
    await mount({ api: "https://api.example.test", "token-url": "/api/privacy-token" });
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every((c) => c.auth === "Bearer tok-1")).toBe(true);
    expect(minted).toBe(1);
  });

  it("mints a new token and retries once after a 401", async () => {
    rejectFirst = true;
    await mount({ api: "https://api.example.test", "token-url": "/api/privacy-token" });
    expect(minted).toBe(2);
    expect(calls.some((c) => c.auth === "Bearer tok-2")).toBe(true);
  });

  it("prefers the tokenProvider property over token-url", async () => {
    const el = document.createElement("dpdp-consent") as HTMLElement & { tokenProvider: () => Promise<string> };
    el.setAttribute("api", "https://api.example.test");
    el.setAttribute("token-url", "/api/privacy-token");
    el.tokenProvider = async () => "from-property";
    document.body.append(el);
    await vi.waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(calls[0]?.auth).toBe("Bearer from-property");
    expect(minted).toBe(0);
  });
});
