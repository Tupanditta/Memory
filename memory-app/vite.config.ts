/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: Capacitor sirve dist/ desde el propio dispositivo.
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./__tests__/preparacion.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
});
