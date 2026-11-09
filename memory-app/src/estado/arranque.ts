// Arranque (design.md, "Esqueleto común"): el splash se mantiene hasta tener fuentes y datos.
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

export interface Splash {
  ocultar(): Promise<void>;
}

/** Splash nativo de Android; en la vista previa web no hay splash. */
export function crearSplash(): Splash {
  return {
    async ocultar() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await SplashScreen.hide();
      } catch {
        // Si el plugin falla, la app sigue funcionando.
      }
    },
  };
}

/** Tiempo máximo de espera de las fuentes: si el WebView no avisa, se sigue con las de respaldo. */
export const ESPERA_MAXIMA_FUENTES_MS = 3000;

/** Se resuelve cuando las fuentes están cargadas (`document.fonts.ready`). */
export function fuentesListas(): Promise<void> {
  const listas = typeof document !== "undefined" ? document.fonts?.ready : undefined;
  if (!listas) return Promise.resolve();
  return Promise.race([listas.then(() => undefined), new Promise<void>((resolver) => setTimeout(resolver, ESPERA_MAXIMA_FUENTES_MS))]);
}
