// axe-core over every widget, in the states users actually see. Shadow roots are scanned from the host.
// Colour contrast is off: jsdom does no layout or painting, so axe cannot compute it.
import axe from "axe-core";
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
  ],
  links: { withdraw: "/withdraw", rights: "/rights", board_complaint: "https://www.dpb.gov.in/" },
};

let failing: boolean;

function fakeFetch(url: string, init: { method: string }) {
  const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));
  if (failing) return reply({ error: { code: "boom", message: "boom" } }, 500);
  const path = new URL(url, "http://x").pathname;
  if (path === "/notices/current") return reply(notice);
  if (path === "/consents/me") return reply({ consents: [{ purpose: "analytics", status: "granted", updated_at: "2026-01-01T00:00:00Z" }] });
  if (path === "/requests" && init.method === "GET")
    return reply({ items: [{ id: "REQ-1", kind: "access", status: "open", due_at: "2026-12-01T00:00:00Z" }] });
  if (path === "/me/export") return reply({ consent_history: [] });
  return reply({}, 404);
}

async function mount(tag: string, attrs: Record<string, string> = { api: "https://api.example.test" }) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.append(el);
  await vi.waitFor(() => expect(el.shadowRoot!.querySelector("section, [role=alert]")).not.toBeNull());
  await vi.waitFor(() => expect(el.shadowRoot!.textContent).not.toContain("Loading"));
  return el;
}

async function violations(el: Element) {
  const results = await axe.run(el, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`);
}

// axe probes canvas for icon ligatures; jsdom has no canvas and logs a "not implemented" error.
HTMLCanvasElement.prototype.getContext = () => null;

beforeEach(() => {
  failing = false;
  vi.stubGlobal("fetch", fakeFetch);
  defineDpdpElements();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("accessibility (axe)", () => {
  it("<dpdp-consent> has no violations", async () => {
    expect(await violations(await mount("dpdp-consent"))).toEqual([]);
  });

  it("<dpdp-preferences> has no violations", async () => {
    expect(await violations(await mount("dpdp-preferences"))).toEqual([]);
  });

  it("<dpdp-rights-form> has no violations", async () => {
    expect(await violations(await mount("dpdp-rights-form"))).toEqual([]);
  });

  it("<dpdp-rights-form> has no violations when nominating", async () => {
    const el = await mount("dpdp-rights-form");
    const kind = el.shadowRoot!.querySelector<HTMLSelectElement>("select")!;
    kind.value = "nominate";
    kind.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.shadowRoot!.textContent).toMatch(/nominee/i);
    expect(await violations(el)).toEqual([]);
  });

  it("error states have no violations", async () => {
    failing = true;
    for (const tag of ["dpdp-consent", "dpdp-preferences", "dpdp-rights-form"]) {
      expect(await violations(await mount(tag))).toEqual([]);
    }
    expect(await violations(await mount("dpdp-consent", {}))).toEqual([]);
  });
});
