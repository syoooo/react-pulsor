import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: { port: 3030 },
  resolve: {
    alias: {
      "react-pulsor": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
})
