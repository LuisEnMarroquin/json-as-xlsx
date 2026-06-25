import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
