import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

// `@e965/xlsx` (SheetJS, used by json-as-xlsx) `require()`s the Node built-ins
// `fs` and `stream` for its Node-only code paths. In the browser Vite
// "externalizes" them and logs "Module <x> has been externalized for browser
// compatibility" warnings (see issue #96). Those paths never run in the browser
// — downloads use a Blob — so we alias the built-ins to an empty module to
// silence the warnings without affecting behavior.
const emptyBuiltin = fileURLToPath(
  new URL("./src/empty-node-builtin.ts", import.meta.url)
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      fs: emptyBuiltin,
      stream: emptyBuiltin,
    },
  },
  optimizeDeps: {
    include: ["json-as-xlsx"],
  },
  server: {
    port: 6500,
  },
  preview: {
    port: 6500,
  },
  build: {
    // Keep the existing deploy pipeline working: `yarn static`
    // copies packages/demo-reactjs/build/ into the repo root build/.
    outDir: "build",
    // This demo bundles the whole xlsx library on purpose, so the single
    // chunk is expected to be large — raise the limit to avoid a noisy warning.
    chunkSizeWarningLimit: 1500,
  },
})
