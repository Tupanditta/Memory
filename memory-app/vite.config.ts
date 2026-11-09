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
    // Las pruebas de pantallas escriben con user-event (2-3 s en caliente); en la primera
    // ejecución en frío, con todos los archivos en paralelo, pasaban de los 5 s por defecto.
    testTimeout: 20000,
  },
});
