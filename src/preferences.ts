import { DpdpElement, h, uid } from "./base.js";

interface HistoryRow {
  purpose: string;
  action: string;
  occurred_at: string;
  notice_version: number | null;
}

/**
 * Current consent per purpose with one-click withdrawal (or re-granting) and the principal's consent
 * history. Fires `dpdp-changed` (detail: `{ purpose, granted }`) after each change.
 */
export class DpdpPreferences extends DpdpElement {
  protected async load(): Promise<Node> {
    const { labels, client } = this;
    const [notice, consents] = await Promise.all([client.getNotice(this.locale), client.myConsents()]);
    const byPurpose = new Map(consents.map((c) => [c.purpose, c]));
    const statusText = { granted: labels.granted, denied: labels.denied, withdrawn: labels.withdrawn } as const;
    const headingId = uid();
    const status = h("p", { class: "status", role: "status", "aria-live": "polite" });
    const date = (iso: string) => new Date(iso).toLocaleDateString(notice.locale);

    const act = async (purpose: string, grant: boolean, trigger: HTMLButtonElement): Promise<void> => {
      trigger.disabled = true;
      try {
        if (grant) await client.recordConsents([{ purpose, granted: true }], { noticeVersion: notice.version, locale: notice.locale });
        else await client.withdraw(purpose);
        this.emit("dpdp-changed", { purpose, granted: grant });
        await this.refresh();
      } catch {
        status.textContent = labels.error;
        trigger.disabled = false;
      }
    };

    const rows = notice.purposes
      .filter((p) => p.legal_basis === "consent")
      .map((p) => {
        const state = byPurpose.get(p.id);
        const granted = state?.status === "granted";
        const verb = granted ? labels.withdraw : labels.give;
        const trigger = h("button", { type: "button", "aria-label": `${verb}: ${p.title}` }, verb);
        trigger.addEventListener("click", () => void act(p.id, !granted, trigger));
        return h(
          "li",
          { class: "preference" },
          h(
            "div",
            {},
            h("span", { class: "title" }, p.title),
            " ",
            h("span", { class: `state state-${state?.status ?? "none"}` }, state ? statusText[state.status] : labels.notDecided),
            state &&
              h("span", { class: "updated" }, ` · ${labels.updated} `, h("time", { datetime: state.updated_at }, date(state.updated_at))),
          ),
          trigger,
        );
      });

    const history = h("details", {}, h("summary", {}, labels.history));
    let loaded = false;
    history.addEventListener("toggle", () => {
      if (!history.open || loaded) return;
      loaded = true;
      const pending = h("p", { role: "status" }, labels.loading);
      history.append(pending);
      client.exportMyData().then(
        (data) => {
          const items = ((data.consent_history ?? []) as unknown as HistoryRow[]).map((r) =>
            h(
              "li",
              {},
              h("time", { datetime: r.occurred_at }, new Date(r.occurred_at).toLocaleString(notice.locale)),
              ` · ${r.purpose} · ${r.action}${r.notice_version ? ` · v${r.notice_version}` : ""}`,
            ),
          );
          pending.replaceWith(h("ol", {}, ...items));
        },
        () => {
          loaded = false;
          pending.replaceWith(h("p", { role: "alert" }, labels.error));
        },
      );
    });

    return h(
      "section",
      { "aria-labelledby": headingId, lang: notice.locale },
      h("h2", { id: headingId }, labels.preferencesTitle),
      h("ul", { class: "list" }, ...rows),
      status,
      history,
      this.links(notice, labels.preferencesTitle),
    );
  }
}
