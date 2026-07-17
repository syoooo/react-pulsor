import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [react()],
  server: { port: 3030 },
  resolve: {
    alias: {
      "react-pulsor": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
})
