import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// base: "./" makes all asset URLs relative, so the build works under any
// GitHub Pages project subpath (e.g. /ciphary/) without hard-coding the name.
export default defineConfig({
  base: "./",
  plugins: [svelte()],
});
