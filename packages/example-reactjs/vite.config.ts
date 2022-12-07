import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5600,
  },
  // https://vitejs.dev/config/dep-optimization-options.html
  // optimizeDeps: {
  //   include: ["json-as-xlsx"],
  // },
  // https://github.com/nuxt/vite/issues/56
  // https://vite.nuxtjs.org/misc/common-issues/
})
