// Almacen de Android: archivos en el directorio de datos de la app (`Directory.Data`).
import { Directory, Encoding, Filesystem, type FilesystemPlugin } from "@capacitor/filesystem";
import { SUFIJO_TMP, type Almacen } from "./almacen";

export type SistemaArchivos = Pick<FilesystemPlugin, "readFile" | "writeFile" | "rename" | "deleteFile" | "readdir">;

export class AlmacenArchivos implements Almacen {
  constructor(
    private readonly fs: SistemaArchivos = Filesystem,
    private readonly directorio: Directory = Directory.Data,
  ) {}

  private async nombres(): Promise<string[]> {
    const { files } = await this.fs.readdir({ path: "", directory: this.directorio });
    return files.filter((f) => f.type === "file").map((f) => f.name);
  }

  private async existe(nombre: string): Promise<boolean> {
    return (await this.nombres()).includes(nombre);
  }

  async leer(nombre: string): Promise<string | null> {
    if (!(await this.existe(nombre))) return null;
    const { data } = await this.fs.readFile({ path: nombre, directory: this.directorio, encoding: Encoding.UTF8 });
    return typeof data === "string" ? data : await data.text();
  }

  async escribirTmp(nombre: string, contenido: string): Promise<void> {
    await this.fs.writeFile({ path: nombre + SUFIJO_TMP, data: contenido, directory: this.directorio, encoding: Encoding.UTF8 });
  }

  async confirmarTmp(nombre: string): Promise<void> {
    // En Android, `rename` borra el destino si existe y luego renombra.
    await this.fs.rename({ from: nombre + SUFIJO_TMP, to: nombre, directory: this.directorio, toDirectory: this.directorio });
  }

  async borrarTmp(nombre: string): Promise<void> {
    await this.borrar(nombre + SUFIJO_TMP);
  }

  async borrar(nombre: string): Promise<void> {
    if (await this.existe(nombre)) await this.fs.deleteFile({ path: nombre, directory: this.directorio });
  }

  async listarTmp(): Promise<string[]> {
    return (await this.nombres()).filter((n) => n.endsWith(SUFIJO_TMP)).map((n) => n.slice(0, -SUFIJO_TMP.length));
  }
}
