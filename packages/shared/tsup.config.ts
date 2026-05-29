import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/analytics-events.ts", "src/domain-types.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  outDir: "dist",
  target: "node20",
});
