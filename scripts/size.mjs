// Bundle-size budget: fails when a built file grows past its gzip limit.
// Raise a limit only on purpose, in the same PR as the change that needs it.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgets = {
  "dist/embed.js": 9, // kB gzip; 6.0 kB at 0.1.0-alpha.1, @dpdpkit/client bundled in
  "dist/index.js": 9, // 6.6 kB at 0.1.0-alpha.1
};

let failed = false;
for (const [file, limitKb] of Object.entries(budgets)) {
  const kb = gzipSync(readFileSync(file), { level: 9 }).length / 1024;
  const ok = kb <= limitKb;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${file}: ${kb.toFixed(2)} kB gzip (budget ${limitKb} kB)`);
}
process.exit(failed ? 1 : 0);
