import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineDpdpElements } from "../src/index.js";

const notice = {
  version: 3,
  locale: "en",
  title: "How we use your data",
  body: "We process data as described below.",
  purposes: [
    { id: "essential", title: "Account", description: "", legal_basis: "legitimate_use", required: true, data_items: ["email"] },
    { id: "analytics", title: "Analytics", description: "Usage stats", legal_basis: "consent", required: false, data_items: ["pages"] },
    { id: "marketing", title: "Marketing", description: "", legal_basis: "consent", required: false, data_items: ["email"] },
  ],
  links: { withdraw: "/withdraw", rights: "/rights", board_complaint: "https://www.dpb.gov.in/" },
};

type Call = { method: string; url: string; headers: Record<string, string>; body: unknown };

let calls: Call[];
let consents: unknown[];
let requests: unknown[];
let failing: boolean;

function fakeFetch(url: string, init: { method: string; headers: Record<string, string>; body?: string }) {
  calls.push({ method: init.method, url, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined });
  const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));
  if (failing) return reply({ error: { code: "boom", message: "boom" } }, 500);
  const path = new URL(url, "http://x").pathname;
  if (path === "/notices/current") return reply(notice);
  if (path === "/consents/me") return reply({ consents });
  if (path === "/consents") return reply({ consents: [] });
  if (path.endsWith("/withdraw")) return reply({});
  if (path === "/requests" && init.method === "POST")
    return reply({ id: "REQ-1", kind: "access", status: "open", due_at: "2026-12-01T00:00:00Z" });
  if (path === "/requests") return reply({ items: requests });
  if (path === "/me/export")
    return reply({ consent_history: [{ purpose: "analytics", action: "granted", occurred_at: "2026-01-02T00:00:00Z", notice_version: 3 }] });
  return reply({}, 404);
}

async function mount(tag: string, attrs: Record<string, string> = { api: "https://api.example.test" }) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.append(el);
  await vi.waitFor(() => expect(el.shadowRoot!.querySelector("[role=status]:not(.status), section, [role=alert]")).not.toBeNull());
  await vi.waitFor(() => expect(el.shadowRoot!.textContent).not.toContain("Loading"));
  return el;
}

const q = <T extends Element = HTMLElement>(el: Element, sel: string) => el.shadowRoot!.querySelector(sel) as T;
const qa = (el: Element, sel: string) => [...el.shadowRoot!.querySelectorAll<HTMLInputElement>(sel)];
const click = (el: Element) => (el as HTMLElement).click();

beforeEach(() => {
  calls = [];
  consents = [];
  requests = [];
  failing = false;
  vi.stubGlobal("fetch", fakeFetch);
  defineDpdpElements();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("registration", () => {
  it("defines the three elements and is idempotent", () => {
    defineDpdpElements();
    for (const tag of ["dpdp-consent", "dpdp-preferences", "dpdp-rights-form"]) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it("shows an error when the api attribute is missing", async () => {
    const el = await mount("dpdp-consent", {});
    expect(q(el, "[role=alert]").textContent).toBeTruthy();
    expect(calls).toHaveLength(0);
  });
});

describe("<dpdp-consent>", () => {
  it("renders notice text from the API with nothing pre-ticked", async () => {
    const el = await mount("dpdp-consent");
    expect(q(el, "h2").textContent).toBe(notice.title);
    const boxes = qa(el, "input[type=checkbox]");
    expect(boxes.map((b) => b.name)).toEqual(["analytics", "marketing"]);
    expect(boxes.every((b) => !b.checked)).toBe(true);
    expect(qa(el, "nav a").map((a) => a.getAttribute("href"))).toEqual(["/withdraw", "/rights", "https://www.dpb.gov.in/"]);
    expect(q(el, "details").textContent).toContain("Account");
  });

  it("ticks only purposes previously granted", async () => {
    consents = [{ purpose: "analytics", status: "granted", updated_at: "2026-01-01T00:00:00Z" }];
    const el = await mount("dpdp-consent");
    expect(qa(el, "input[type=checkbox]").map((b) => b.checked)).toEqual([true, false]);
  });

  it("records the ticked choices and emits dpdp-saved", async () => {
    const el = await mount("dpdp-consent");
    const saved = vi.fn();
    el.addEventListener("dpdp-saved", saved);
    qa(el, "input[type=checkbox]")[0]!.click();
    q<HTMLFormElement>(el, "form").requestSubmit();
    await vi.waitFor(() => expect(saved).toHaveBeenCalled());
    const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/consents"))!;
    expect(post.body).toEqual({
      decisions: [
        { purpose: "analytics", granted: true },
        { purpose: "marketing", granted: false },
      ],
      notice_version: 3,
      locale: "en",
    });
  });

  it("rejects and accepts everything with one click", async () => {
    const el = await mount("dpdp-consent");
    const buttons = qa(el, ".actions button");
    expect(buttons).toHaveLength(3);
    click(buttons[1]!);
    await vi.waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect((calls.find((c) => c.method === "POST")!.body as { decisions: { granted: boolean }[] }).decisions.every((d) => d.granted)).toBe(true);
  });

  it("sends the token as a bearer header", async () => {
    await mount("dpdp-consent", { api: "https://api.example.test", token: "abc" });
    expect(calls.every((c) => c.headers.Authorization === "Bearer abc")).toBe(true);
  });

  it("applies label overrides from the labels attribute", async () => {
    const el = await mount("dpdp-consent", { api: "https://api.example.test", labels: '{"acceptAll":"Sab theek hai"}' });
    expect(qa(el, ".actions button").map((b) => b.textContent)).toContain("Sab theek hai");
  });

  it("shows an error when the API fails", async () => {
    failing = true;
    const el = await mount("dpdp-consent");
    expect(q(el, "[role=alert]")).not.toBeNull();
  });
});

describe("<dpdp-preferences>", () => {
  beforeEach(() => {
    consents = [{ purpose: "analytics", status: "granted", updated_at: "2026-01-01T00:00:00Z" }];
  });

  it("withdraws in one click", async () => {
    const el = await mount("dpdp-preferences");
    const changed = vi.fn();
    el.addEventListener("dpdp-changed", changed);
    const rows = qa(el, ".preference");
    expect(rows).toHaveLength(2);
    click(rows[0]!.querySelector("button")!);
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());
    expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/consents/analytics/withdraw"))).toBe(true);
    expect((changed.mock.calls[0]![0] as CustomEvent).detail).toEqual({ purpose: "analytics", granted: false });
  });

  it("grants a not-yet-decided purpose", async () => {
    const el = await mount("dpdp-preferences");
    click(qa(el, ".preference")[1]!.querySelector("button")!);
    await vi.waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/consents"))).toBe(true));
  });

  it("loads history lazily", async () => {
    const el = await mount("dpdp-preferences");
    expect(calls.some((c) => c.url.includes("/me/export"))).toBe(false);
    const details = q<HTMLDetailsElement>(el, "details");
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    await vi.waitFor(() => expect(q(el, "details ol li")).not.toBeNull());
    expect(q(el, "details ol li").textContent).toContain("analytics");
  });
});

describe("<dpdp-rights-form>", () => {
  it("submits a request and emits dpdp-submitted", async () => {
    const el = await mount("dpdp-rights-form");
    const submitted = vi.fn();
    el.addEventListener("dpdp-submitted", submitted);
    q<HTMLSelectElement>(el, "select").value = "access";
    q<HTMLTextAreaElement>(el, "textarea").value = "Please send my data";
    q<HTMLFormElement>(el, "form").requestSubmit();
    await vi.waitFor(() => expect(submitted).toHaveBeenCalled());
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.body).toEqual({ kind: "access", details: { text: "Please send my data" } });
    expect(q(el, ".status").textContent).toContain("REQ-1");
  });

  it("asks for nominee details when nominating", async () => {
    const el = await mount("dpdp-rights-form");
    const select = q<HTMLSelectElement>(el, "select");
    select.value = "nomination";
    select.dispatchEvent(new Event("change"));
    expect(q(el, "textarea").closest("div[hidden]")).not.toBeNull();
    const [name, contact] = qa(el, "input");
    name!.value = "Asha";
    contact!.value = "asha@example.test";
    q<HTMLFormElement>(el, "form").requestSubmit();
    await vi.waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({
      kind: "nomination",
      details: { name: "Asha", contact: "asha@example.test" },
    });
  });

  it("limits kinds via the kinds attribute", async () => {
    const el = await mount("dpdp-rights-form", { api: "https://api.example.test", kinds: "access erasure" });
    expect(qa(el, "option").map((o) => o.value)).toEqual(["access", "erasure"]);
  });

  it("lists existing requests unless hide-requests is set", async () => {
    requests = [{ id: "REQ-9", kind: "erasure", status: "in_progress", due_at: "2026-12-01T00:00:00Z" }];
    const el = await mount("dpdp-rights-form");
    expect(q(el, "tbody").textContent).toContain("REQ-9");
    document.body.replaceChildren();
    calls = [];
    const hidden = await mount("dpdp-rights-form", { api: "https://api.example.test", "hide-requests": "" });
    expect(q(hidden, "table")).toBeNull();
    expect(calls.some((c) => c.url.endsWith("/requests"))).toBe(false);
  });
});
