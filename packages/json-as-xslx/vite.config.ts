import { resolve } from "path"
import { defineConfig } from "vite"

console.log(__dirname)

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src", "library.ts"),
      name: "JsonAsXlsx",
      fileName: "library",
    },
  },
  server: {
    port: 5400,
  },
})
