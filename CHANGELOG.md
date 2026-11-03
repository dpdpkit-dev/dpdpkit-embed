# Changelog

All code packages in the dpdpkit release train share one version number.

## Unreleased

## 0.1.0-alpha.2 - 2026-11-03

### Added
- axe-core accessibility tests for all three widgets, a gzip bundle-size budget (`npm run size`, checked in CI)
  and a tag-triggered release workflow that publishes to npm with provenance.
- `<dpdp-consent>`, `<dpdp-preferences>` and `<dpdp-rights-form>` web components, with `api`, `token`,
  `locale` and `labels` attributes, `--dpdp-*` theming and dark mode.
- Signed-token auth: `token-url` attribute and `tokenProvider` property mint end-user tokens from your backend,
  refresh them before expiry and retry once after a 401.
- `dist/embed.js` is now one minified, self-contained script for jsDelivr
  (`https://cdn.jsdelivr.net/npm/@dpdpkit/embed@<version>/dist/embed.js`).
- `defineDpdpElements()` (idempotent) and a CDN entry, `@dpdpkit/embed/embed`, that registers the elements.
