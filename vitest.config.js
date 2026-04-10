import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",

    setupFiles: ["./vitest.setup.js"],

    include: ["src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}"],

    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**", "src/hooks/**"],
      exclude: ["src/**/__tests__/**", "node_modules"],
    },

    reporters: ["verbose"],

    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
