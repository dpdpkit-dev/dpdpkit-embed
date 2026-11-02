import { DpdpClient, type Notice } from "@dpdpkit/client";
import { defaultLabels, type Labels } from "./labels.js";
import { css } from "./styles.js";

type Child = Node | string | null | false | undefined;

/** Build a DOM node. Text is always set as text, never parsed as HTML, so notice content cannot inject markup. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children) if (child) el.append(child);
  return el;
}

let counter = 0;
export const uid = (): string => `dpdp-${++counter}`;

/**
 * Shared behaviour of the three widgets. Attributes: `api` (base URL of the dpdpkit API, including the
 * mount prefix), `token` (short-lived signed end-user token, sent as a bearer token), `locale`, and
 * `labels` (JSON overriding interface text). Rendering happens in a shadow root, so host-page CSS does
 * not leak in; theme through the `--dpdp-*` custom properties.
 */
export abstract class DpdpElement extends HTMLElement {
  static observedAttributes = ["api", "token", "locale", "labels"];

  protected readonly root: ShadowRoot;
  private clientFor?: { api: string; client: DpdpClient };
  private generation = 0;
  private labelOverrides: Partial<Labels> = {};

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  get labels(): Labels {
    return { ...defaultLabels, ...this.labelOverrides, kinds: { ...defaultLabels.kinds, ...this.labelOverrides.kinds } };
  }
  set labels(value: Partial<Labels>) {
    this.labelOverrides = value;
    if (this.isConnected) void this.refresh();
  }

  protected get locale(): string | undefined {
    return this.getAttribute("locale") ?? undefined;
  }

  /** Client for the current `api`/`token` attributes; the token is read per request so it can be rotated. */
  protected get client(): DpdpClient {
    const api = this.getAttribute("api");
    if (!api) throw new Error("dpdp: the api attribute is required");
    if (this.clientFor?.api !== api) {
      const headers = (): Record<string, string> => {
        const token = this.getAttribute("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      };
      this.clientFor = { api, client: new DpdpClient({ baseUrl: api, headers }) };
    }
    return this.clientFor.client;
  }

  connectedCallback(): void {
    void this.refresh();
  }

  attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
    if (previous === value) return;
    if (name === "labels") {
      try {
        this.labelOverrides = value ? (JSON.parse(value) as Partial<Labels>) : {};
      } catch {
        this.labelOverrides = {};
      }
    }
    // A rotated token needs no reload: it is read on the next request.
    if (name !== "token" && this.isConnected) void this.refresh();
  }

  /** Re-fetch and re-render. A newer refresh supersedes an older one still in flight. */
  async refresh(): Promise<void> {
    const mine = ++this.generation;
    this.show(h("p", { role: "status" }, this.labels.loading));
    try {
      const view = await this.load();
      if (mine === this.generation) this.show(view);
    } catch {
      if (mine === this.generation) this.show(h("p", { role: "alert" }, this.labels.error));
    }
  }

  protected abstract load(): Promise<Node>;

  protected show(content: Node): void {
    this.root.replaceChildren(h("style", {}, css), content);
  }

  protected emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  /** The required links (withdraw, rights, Board complaint) from the notice. */
  protected links(notice: Notice, section: string): HTMLElement {
    const entries: Array<[string, string]> = [
      ["withdraw", this.labels.withdrawLink],
      ["rights", this.labels.rightsLink],
      ["board_complaint", this.labels.boardLink],
    ];
    const items = entries.flatMap(([key, text]) => {
      const href = notice.links[key];
      return href ? [h("li", {}, h("a", { href }, text))] : [];
    });
    return h("nav", { class: "links", "aria-label": `${this.labels.rightsLink}: ${section}` }, h("ul", {}, ...items));
  }
}
