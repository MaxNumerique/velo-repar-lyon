import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Utilise jsdom pour simuler le DOM navigateur
    environment: "jsdom",

    // Fichier de setup global (jest-dom matchers)
    setupFiles: ["./vitest.setup.js"],

    // Inclure les fichiers de test dans src/
    include: ["src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}"],

    // Exclure node_modules et .next
    exclude: ["node_modules", ".next"],

    // Options de couverture de code
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**", "src/hooks/**"],
      exclude: ["src/**/__tests__/**", "node_modules"],
    },

    // Rendre les tests lisibles en CI
    reporters: ["verbose"],

    // Variables globales (describe, it, expect) sans import
    globals: true,
  },
  resolve: {
    alias: {
      // Résoudre l'alias @/ comme Next.js le fait
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
