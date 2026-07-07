import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: false
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false
  }
});
