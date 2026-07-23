import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages：`vite build --mode pages` → https://<user>.github.io/ImgFrame/
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/ImgFrame/" : "/",
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
}));
