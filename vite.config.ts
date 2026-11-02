import { defineConfig } from "vitest/config";

// @dpdpkit/client is bundled in: the CDN build must work from one <script> tag with no resolver.
export default defineConfig({
  build: {
    lib: {
      entry: { index: "src/index.ts", embed: "src/embed.ts" },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    sourcemap: true,
    target: "es2020",
  },
  test: { environment: "jsdom", globals: false, include: ["test/**/*.test.ts"] },
});
