import type { ConsentState } from "@dpdpkit/client";
import { DpdpElement, h, uid } from "./base.js";

/**
 * Itemised notice with one checkbox per consent purpose. Nothing is pre-ticked: a box is ticked only if
 * the principal previously gave that consent. "Accept all", "Reject all" and "Save my choices" have equal
 * weight. Fires `dpdp-saved` (detail: the recorded consent states) after a save.
 */
export class DpdpConsent extends DpdpElement {
  protected async load(): Promise<Node> {
    const { labels, client } = this;
    const [notice, consents] = await Promise.all([client.getNotice(this.locale), client.myConsents()]);
    const granted = new Set(consents.filter((c) => c.status === "granted").map((c) => c.purpose));
    const forConsent = notice.purposes.filter((p) => p.legal_basis === "consent");
    const others = notice.purposes.filter((p) => p.legal_basis !== "consent");
    const headingId = uid();
    const boxes = new Map<string, HTMLInputElement>();

    const status = h("p", { class: "status", role: "status", "aria-live": "polite" });
    const buttons: HTMLButtonElement[] = [];

    const save = async (values: Record<string, boolean>): Promise<void> => {
      buttons.forEach((b) => (b.disabled = true));
      try {
        const states: ConsentState[] = await client.recordConsents(
          forConsent.map((p) => ({ purpose: p.id, granted: values[p.id] === true })),
          { noticeVersion: notice.version, locale: notice.locale },
        );
        status.textContent = labels.saved;
        this.emit("dpdp-saved", states);
      } catch {
        status.textContent = labels.error;
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    };
    const everyone = (value: boolean) => Object.fromEntries(forConsent.map((p) => [p.id, value]));
    const button = (text: string, type: "button" | "submit", onClick?: () => void) => {
      const b = h("button", { type }, text);
      if (onClick) b.addEventListener("click", onClick);
      buttons.push(b);
      return b;
    };

    const purposes = forConsent.map((p) => {
      const inputId = uid();
      const input = h("input", { type: "checkbox", id: inputId, name: p.id, "aria-describedby": `${inputId}-desc` });
      input.checked = granted.has(p.id);
      boxes.set(p.id, input);
      return h(
        "div",
        { class: "purpose" },
        input,
        h("label", { for: inputId }, h("span", { class: "title" }, p.title), p.required && h("span", { class: "badge" }, labels.neededForService)),
        h(
          "div",
          { id: `${inputId}-desc`, class: "desc" },
          p.description && h("p", {}, p.description),
          h("p", { class: "items" }, `${labels.dataUsed}: ${p.data_items.join(", ")}`),
        ),
      );
    });

    const form = h(
      "form",
      {},
      h("fieldset", { class: "purposes" }, h("legend", { class: "visually-hidden" }, notice.title), ...purposes),
      others.length > 0 &&
        h(
          "details",
          {},
          h("summary", {}, labels.noConsentNeeded),
          h("ul", {}, ...others.map((p) => h("li", {}, `${p.title} (${p.data_items.join(", ")})`))),
        ),
      h(
        "div",
        { class: "actions" },
        button(labels.rejectAll, "button", () => void save(everyone(false))),
        button(labels.acceptAll, "button", () => void save(everyone(true))),
        button(labels.saveChoices, "submit"),
      ),
      status,
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      void save(Object.fromEntries([...boxes].map(([id, box]) => [id, box.checked])));
    });

    return h(
      "section",
      { "aria-labelledby": headingId, lang: notice.locale },
      h("h2", { id: headingId }, notice.title),
      notice.body && h("p", { class: "body" }, notice.body),
      form,
      this.links(notice, notice.title),
    );
  }
}
