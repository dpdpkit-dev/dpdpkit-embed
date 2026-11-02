/** Default theme. Override any `--dpdp-*` variable on the element or a parent; custom properties inherit into the shadow root. */
export const css = `
:host {
  display: block;
  --dpdp-font: inherit;
  --dpdp-text: #1f2328;
  --dpdp-muted: #57606a;
  --dpdp-bg: #ffffff;
  --dpdp-surface: #f6f8fa;
  --dpdp-border: #d0d7de;
  --dpdp-accent: #0b5cad;
  --dpdp-accent-text: #ffffff;
  --dpdp-focus: #0969da;
  --dpdp-radius: 8px;
  --dpdp-gap: 0.75rem;
  font-family: var(--dpdp-font);
  color: var(--dpdp-text);
  background: var(--dpdp-bg);
  line-height: 1.5;
}
@media (prefers-color-scheme: dark) {
  :host {
    --dpdp-text: #e6edf3; --dpdp-muted: #9da7b3; --dpdp-bg: #0d1117; --dpdp-surface: #161b22;
    --dpdp-border: #30363d; --dpdp-accent: #4493f8; --dpdp-accent-text: #0d1117; --dpdp-focus: #79c0ff;
  }
}
:host([hidden]) { display: none; }
h2 { font-size: 1.25rem; margin: 0 0 var(--dpdp-gap); }
h3 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; }
.body, .desc, .items, .updated { color: var(--dpdp-muted); }
.purposes { border: 0; padding: 0; margin: 0; display: grid; gap: var(--dpdp-gap); }
.purpose {
  display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.6rem; padding: var(--dpdp-gap);
  border: 1px solid var(--dpdp-border); border-radius: var(--dpdp-radius); background: var(--dpdp-surface);
}
.purpose input[type="checkbox"] { width: 1.15rem; height: 1.15rem; margin-top: 0.2rem; }
.desc { grid-column: 2; }
.desc p { margin: 0; }
.title { font-weight: 600; }
.badge { margin-left: 0.5rem; font-size: 0.8rem; padding: 0.05rem 0.45rem; border: 1px solid var(--dpdp-border); border-radius: 999px; }
/* All choice buttons share one style: accepting is never more prominent than rejecting. */
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: var(--dpdp-gap); }
button {
  font: inherit; min-height: 2.5rem; padding: 0.4rem 1rem; border-radius: var(--dpdp-radius);
  border: 1px solid var(--dpdp-accent); background: var(--dpdp-accent); color: var(--dpdp-accent-text); cursor: pointer;
}
button:disabled { opacity: 0.6; cursor: progress; }
:focus-visible { outline: 3px solid var(--dpdp-focus); outline-offset: 2px; }
a { color: var(--dpdp-accent); }
.links ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 1rem; }
.list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.preference {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
  padding: 0.6rem var(--dpdp-gap); border: 1px solid var(--dpdp-border); border-radius: var(--dpdp-radius);
}
.field { display: grid; gap: 0.25rem; margin-bottom: var(--dpdp-gap); }
.field input, .field select, .field textarea {
  font: inherit; padding: 0.45rem 0.6rem; border: 1px solid var(--dpdp-border); border-radius: var(--dpdp-radius);
  background: var(--dpdp-bg); color: var(--dpdp-text);
}
table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
th, td { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--dpdp-border); }
.status:empty { display: none; }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
`;
