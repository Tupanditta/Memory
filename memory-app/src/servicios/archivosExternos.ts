// Archivos que entran y salen de la app (design.md, "Exportar e importar").
// `Compartidor`: crea el archivo exportado y abre el menú de compartir/guardar.
// `SelectorArchivo`: deja elegir un archivo JSON y devuelve su texto.
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem, type FilesystemPlugin } from "@capacitor/filesystem";
import { Share, type SharePlugin } from "@capacitor/share";

export interface Compartidor {
  /** Lanza si no se puede crear el archivo. Cancelar el menú no es un error. */
  compartir(nombre: string, contenido: string): Promise<void>;
}

export interface SelectorArchivo {
  /** Texto del archivo elegido, o `null` si se cancela. */
  elegir(): Promise<string | null>;
}

/** Android: escribe en la caché (`Directory.Cache`) y lo comparte con `@capacitor/share`. */
export class CompartidorCapacitor implements Compartidor {
  constructor(
    private readonly fs: Pick<FilesystemPlugin, "writeFile"> = Filesystem,
    private readonly share: Pick<SharePlugin, "share"> = Share,
  ) {}

  async compartir(nombre: string, contenido: string): Promise<void> {
    const { uri } = await this.fs.writeFile({ path: nombre, data: contenido, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await this.share.share({ title: nombre, files: [uri], dialogTitle: "Guardar o compartir la copia" });
    } catch (e) {
      // El usuario cerró el menú sin elegir: el archivo se creó bien.
      if (e instanceof Error && /cancel/i.test(e.message)) return;
      throw e;
    }
  }
}

/** Vista previa web: descarga el archivo con un enlace `download`. */
export class CompartidorWeb implements Compartidor {
  async compartir(nombre: string, contenido: string): Promise<void> {
    const url = URL.createObjectURL(new Blob([contenido], { type: "application/json" }));
    try {
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** `<input type="file">`: el WebView de Capacitor abre el selector de archivos de Android. */
export class SelectorArchivoInput implements SelectorArchivo {
  elegir(): Promise<string | null> {
    return new Promise((resolver, rechazar) => {
      const entrada = document.createElement("input");
      entrada.type = "file";
      entrada.accept = "application/json,.json";
      entrada.addEventListener("change", () => {
        const archivo = entrada.files?.[0];
        if (!archivo) return resolver(null);
        archivo.text().then(resolver, rechazar);
      });
      entrada.addEventListener("cancel", () => resolver(null));
      entrada.click();
    });
  }
}

export function crearCompartidor(): Compartidor {
  return Capacitor.isNativePlatform() ? new CompartidorCapacitor() : new CompartidorWeb();
}
