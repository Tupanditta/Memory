import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tupanditta.memory",
  appName: "Memory",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      // El splash se oculta cuando hay fuentes y datos (Sprint 9).
      launchAutoHide: true,
      backgroundColor: "#FAF8FF",
    },
  },
};

export default config;
