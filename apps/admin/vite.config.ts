import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    // ponytail: raise warning limit until we code-split large routes;
    // the admin bundle currently includes all features on first load.
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});
