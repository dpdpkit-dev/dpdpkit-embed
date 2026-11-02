# @dpdpkit/embed

Framework-free web components for [dpdpkit](https://github.com/dpdpkit-dev): `<dpdp-consent>`,
`<dpdp-preferences>` and `<dpdp-rights-form>`. Drop them into any page (plain HTML, a CMS, Vue, Svelte,
Angular). They work with any dpdpkit backend (FastAPI or Django adapter, `dpdpkit-server`, dpdpkit Cloud).

> **Disclaimer.** dpdpkit is software that helps you implement obligations under India's Digital Personal
> Data Protection Act, 2023 and the DPDP Rules, 2025. It does not provide legal advice and does not
> guarantee compliance.

## Use

From a CDN, one tag registers all three elements:

```html
<script type="module" src="https://unpkg.com/@dpdpkit/embed"></script>

<dpdp-consent api="/dpdp" locale="hi"></dpdp-consent>
<dpdp-preferences api="/dpdp"></dpdp-preferences>
<dpdp-rights-form api="/dpdp"></dpdp-rights-form>
```

From npm (the import has no side effects; register explicitly, or import `@dpdpkit/embed/embed`):

```bash
npm i @dpdpkit/embed
```

```ts
import { defineDpdpElements } from "@dpdpkit/embed";
defineDpdpElements();
```

`@dpdpkit/client` is bundled in; you do not install it separately.

## Attributes

| Attribute | Elements | Meaning |
| --- | --- | --- |
| `api` | all | Base URL of the dpdpkit API. Required. |
| `token` | all | Sent as `Authorization: Bearer <token>`. Read on every request, so it can be rotated. |
| `locale` | all | Notice language (BCP 47). Defaults to the server's choice. |
| `labels` | all | JSON of interface labels to override, e.g. `{"acceptAll":"Sab theek hai"}`. Also a `labels` property. |
| `kinds` | `dpdp-rights-form` | Space-separated subset of request kinds to offer. |
| `hide-requests` | `dpdp-rights-form` | Do not list the principal's existing requests. |

## Events

All events bubble and cross the shadow boundary.

| Event | Element | `detail` |
| --- | --- | --- |
| `dpdp-saved` | `dpdp-consent` | The recorded consent states. |
| `dpdp-changed` | `dpdp-preferences` | `{ purpose, granted }` |
| `dpdp-submitted` | `dpdp-rights-form` | The created request. |

## Design rules the components follow

- **Legal text comes from the API.** Titles, purposes, data items and links come from the notice in the
  principal's language. Only interface labels (button text) live in the package.
- **Nothing is pre-ticked.** A box is ticked only if the principal already gave that consent.
- **Equal-weight choices.** Reject all, Accept all and Save have the same style.
- **Withdrawal is one click** in `dpdp-preferences`.
- **The withdraw, rights and Data Protection Board links are always shown.**
- Accessible markup: labelled sections, `aria-live` status messages, visible focus, keyboard operable.

## Theming

Styles live in each element's shadow root. Set CSS custom properties on the element or any ancestor:
`--dpdp-font`, `--dpdp-text`, `--dpdp-muted`, `--dpdp-bg`, `--dpdp-surface`, `--dpdp-border`,
`--dpdp-accent`, `--dpdp-accent-text`, `--dpdp-focus`, `--dpdp-radius`, `--dpdp-gap`. Dark mode follows `prefers-color-scheme`.

## Licence

Apache-2.0
