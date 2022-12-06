import { resolve } from "path"
import { defineConfig } from "vite"

console.log(__dirname)

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src", "library.ts"),
      name: "MyLib",
      // the proper extensions will be added
      fileName: "my-lib",
    },
  },
  server: {
    port: 5400,
  },
})
