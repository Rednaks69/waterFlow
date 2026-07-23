import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react/jsx-runtime", "three", "@react-three/fiber"],
  treeshake: true,
  splitting: false,
  minify: false,
});
