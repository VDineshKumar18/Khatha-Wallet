import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ✅ FIX: sockjs-client expects global (Node-style)
  define: {
    global: {},
  },

  // ✅ FIX: allow mobile & LAN access
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**']
    }
  },
});
