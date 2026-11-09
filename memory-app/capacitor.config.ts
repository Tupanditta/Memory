import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tupanditta.memory",
  appName: "Memory",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      // El splash se oculta desde la app cuando hay fuentes y datos (`SplashScreen.hide`).
      launchAutoHide: false,
      backgroundColor: "#FAF8FF",
    },
  },
};

export default config;
