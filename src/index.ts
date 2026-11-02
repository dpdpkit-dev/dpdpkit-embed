import { DpdpConsent } from "./consent.js";
import { DpdpPreferences } from "./preferences.js";
import { DpdpRightsForm } from "./rights-form.js";

export { DpdpConsent, DpdpPreferences, DpdpRightsForm };
export type { TokenProvider } from "./token.js";
export { defaultLabels, type Labels, type RequestKind } from "./labels.js";

const TAGS = {
  "dpdp-consent": DpdpConsent,
  "dpdp-preferences": DpdpPreferences,
  "dpdp-rights-form": DpdpRightsForm,
} as const;

/** Register the three elements. Safe to call more than once. */
export function defineDpdpElements(): void {
  for (const [tag, element] of Object.entries(TAGS)) {
    if (!customElements.get(tag)) customElements.define(tag, element);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dpdp-consent": DpdpConsent;
    "dpdp-preferences": DpdpPreferences;
    "dpdp-rights-form": DpdpRightsForm;
  }
}
