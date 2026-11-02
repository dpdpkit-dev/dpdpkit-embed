import type { RightsRequest } from "@dpdpkit/client";
import { DpdpElement, h, uid } from "./base.js";
import { REQUEST_KINDS, type RequestKind } from "./labels.js";

/**
 * Access, correction, completion, updating, erasure, nomination and grievance requests, with the
 * principal's existing requests listed underneath. Attributes: `kinds` (space-separated subset of
 * request kinds to offer), `hide-requests` (omit the list). Fires `dpdp-submitted` (detail: the request).
 */
export class DpdpRightsForm extends DpdpElement {
  static observedAttributes = [...DpdpElement.observedAttributes, "kinds", "hide-requests"];

  private get kinds(): RequestKind[] {
    const wanted = (this.getAttribute("kinds") ?? "").split(/\s+/);
    const kinds = REQUEST_KINDS.filter((k) => wanted.includes(k));
    return kinds.length > 0 ? kinds : REQUEST_KINDS;
  }

  protected async load(): Promise<Node> {
    const { labels, client, kinds } = this;
    const showRequests = !this.hasAttribute("hide-requests");
    const requests = showRequests ? await client.myRequests() : [];
    const id = uid();
    const date = (iso: string) => new Date(iso).toLocaleDateString(this.locale);

    const select = h("select", { id: `${id}-kind` }, ...kinds.map((k) => h("option", { value: k }, labels.kinds[k])));
    const field = (key: string, label: string, control: HTMLElement) =>
      h("div", { class: "field" }, h("label", { for: control.id || `${id}-${key}` }, label), control);
    const input = (key: string, required: boolean) => h("input", { id: `${id}-${key}`, name: key, required });

    const details = h("textarea", { id: `${id}-details`, rows: "4" });
    const textFields = h("div", {}, field("details", labels.requestDetails, details));
    const nomineeFields = h(
      "div",
      { hidden: true },
      field("name", labels.nomineeName, input("name", true)),
      field("contact", labels.nomineeContact, input("contact", true)),
      field("relationship", labels.nomineeRelationship, input("relationship", false)),
    );
    const nominee = (key: string) => (nomineeFields.querySelector(`[name=${key}]`) as HTMLInputElement).value;
    // Hidden nominee inputs are `required`; disable them while hidden so they do not block the form.
    const sync = () => {
      const nominating = select.value === "nomination";
      nomineeFields.hidden = !nominating;
      textFields.hidden = nominating;
      nomineeFields.querySelectorAll("input").forEach((i) => (i.disabled = !nominating));
    };
    select.addEventListener("change", sync);
    sync();

    const status = h("p", { class: "status", role: "status", "aria-live": "polite" });
    const submit = h("button", { type: "submit" }, labels.submitRequest);
    const form = h(
      "form",
      {},
      field("kind", labels.requestKind, select),
      textFields,
      nomineeFields,
      h("div", { class: "actions" }, submit),
      status,
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const kind = select.value as RequestKind;
      const body =
        kind === "nomination"
          ? { name: nominee("name"), contact: nominee("contact"), relationship: nominee("relationship") || undefined }
          : details.value
            ? { text: details.value }
            : {};
      submit.disabled = true;
      client.openRequest(kind, body).then(
        (request: RightsRequest) => {
          status.textContent = `${labels.requestSubmitted} ${request.id}. ${labels.dueBy} ${date(request.due_at)}.`;
          details.value = "";
          this.emit("dpdp-submitted", request);
          submit.disabled = false;
        },
        () => {
          status.textContent = labels.error;
          submit.disabled = false;
        },
      );
    });

    const table =
      requests.length > 0
        ? [
            h("h3", {}, labels.yourRequests),
            h(
              "table",
              {},
              h(
                "thead",
                {},
                h(
                  "tr",
                  {},
                  h("th", { scope: "col" }, "#"),
                  h("th", { scope: "col" }, labels.requestKind),
                  h("th", { scope: "col" }, labels.status),
                  h("th", { scope: "col" }, labels.dueBy),
                ),
              ),
              h(
                "tbody",
                {},
                ...requests.map((r) =>
                  h(
                    "tr",
                    {},
                    h("td", {}, r.id),
                    h("td", {}, labels.kinds[r.kind]),
                    h("td", {}, r.status.replace("_", " ")),
                    h("td", {}, h("time", { datetime: r.due_at }, date(r.due_at))),
                  ),
                ),
              ),
            ),
          ]
        : [];

    return h("section", { "aria-labelledby": `${id}-h` }, h("h2", { id: `${id}-h` }, labels.requestTitle), form, ...table);
  }
}
