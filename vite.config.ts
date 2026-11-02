import { defineConfig } from "vitest/config";

// @dpdpkit/client is bundled in: the CDN build must work from one <script> tag with no resolver.
// `vite build` makes the ES module for npm users; `vite build --mode cdn` makes dist/embed.js, one minified
// self-contained file (no shared chunks) that jsDelivr serves for a plain <script> tag.
export default defineConfig(({ mode }) => ({
  build:
    mode === "cdn"
      ? {
          lib: { entry: "src/embed.ts", formats: ["iife"], name: "DpdpEmbed", fileName: () => "embed.js" },
          emptyOutDir: false,
          minify: true,
          sourcemap: true,
          target: "es2020",
        }
      : {
          lib: { entry: { index: "src/index.ts" }, formats: ["es"], fileName: (_format, name) => `${name}.js` },
          sourcemap: true,
          target: "es2020",
        },
  test: { environment: "jsdom", globals: false, include: ["test/**/*.test.ts"] },
}));
