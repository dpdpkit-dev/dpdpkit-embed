# @dpdpkit/embed

Framework-free web components for [dpdpkit](https://github.com/dpdpkit-dev): `<dpdp-consent>`,
`<dpdp-preferences>` and `<dpdp-rights-form>`. Drop them into any page (plain HTML, a CMS, Vue, Svelte,
Angular). They work with any dpdpkit backend (FastAPI or Django adapter, `dpdpkit-server`, dpdpkit Cloud).

> **Disclaimer.** dpdpkit is software that helps you implement obligations under India's Digital Personal
> Data Protection Act, 2023 and the DPDP Rules, 2025. It does not provide legal advice and does not
> guarantee compliance.

## Use

From [jsDelivr](https://www.jsdelivr.com/), one tag registers all three elements. Pin the version in production
(`@dpdpkit/embed@0.1.0`), and add a [Subresource Integrity](https://www.jsdelivr.com/using-sri-with-dynamic-files)
hash from the jsDelivr page for that version. `dist/embed.js` is one minified, self-contained file:

```html
<script src="https://cdn.jsdelivr.net/npm/@dpdpkit/embed@0.1.0/dist/embed.js" crossorigin="anonymous"></script>

<dpdp-consent api="/dpdp" token-url="/api/privacy-token" locale="hi"></dpdp-consent>
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
| `token-url` | all | Your own endpoint that mints a token (see below). Called with `POST`, same-origin cookies. |
| `locale` | all | Notice language (BCP 47). Defaults to the server's choice. |
| `labels` | all | JSON of interface labels to override, e.g. `{"acceptAll":"Sab theek hai"}`. Also a `labels` property. |
| `kinds` | `dpdp-rights-form` | Space-separated subset of request kinds to offer. |
| `hide-requests` | `dpdp-rights-form` | Do not list the principal's existing requests. |

## Signed-token auth

The widgets act for one signed-in person, so every call carries a short-lived token signed by dpdpkit. Your
backend mints it with its API key (`POST /v1/tokens`, or `createUserToken` in the server SDKs); the key never
reaches the browser. Three ways to hand the token to the element:

1. `token="…"` — render it into the page. Good for server-rendered pages; it is used until 30 seconds before it expires.
2. `token-url="/api/privacy-token"` — the element `POST`s there (with same-origin cookies) and expects
   `{ "token": "…", "expires_at": 1767225600 }`. It refreshes before expiry and, if the API answers 401, fetches a new token and retries once.
3. `el.tokenProvider = async () => ({ token, expires_at })` — the same, from code; wins over `token-url`.

Only the expiry is read in the browser, from the unverified payload; the server verifies the signature.

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
