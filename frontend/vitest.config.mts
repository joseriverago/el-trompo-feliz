import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Pruebas del frontend (T-09): funciones de validación y formularios, en un navegador
 * simulado (jsdom) con Testing Library. Se ejecutan con `npm test`.
 */
export default defineConfig({
  plugins: [react()],
  // Resuelve el alias @/* de tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
