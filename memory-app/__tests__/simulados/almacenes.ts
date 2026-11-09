// Sistemas de almacenamiento simulados en memoria, con fallos a demanda, para probar
// las dos implementaciones de `Almacen` con los mismos tests (T2.8).
import type { Almacen } from "../../src/repositorio/almacen";
import { AlmacenArchivos, type SistemaArchivos } from "../../src/repositorio/almacenArchivos";
import { AlmacenLocalStorage, PREFIJO_CLAVE } from "../../src/repositorio/almacenLocalStorage";

/** Banco de pruebas común: el almacén y el acceso directo a lo que hay "en disco". */
export interface Banco {
  almacen: Almacen;
  /** Contenido actual de todos los archivos, por nombre. */
  archivos(): Record<string, string>;
  poner(nombre: string, contenido: string): void;
  /** La próxima escritura de `<nombre>.tmp` falla. */
  fallarEscrituraTmp(nombre: string): void;
  /** El próximo paso de `<nombre>.tmp` a `<nombre>` falla. */
  fallarConfirmar(nombre: string): void;
}

/** Simula `Filesystem` de `@capacitor/filesystem` (directorio plano). */
class FilesystemEnMemoria {
  readonly disco = new Map<string, string>();
  readonly fallosEscritura = new Set<string>();
  readonly fallosRenombrado = new Set<string>();

  async readFile({ path }: { path: string }) {
    const data = this.disco.get(path);
    if (data === undefined) throw new Error("File does not exist");
    return { data };
  }

  async writeFile({ path, data }: { path: string; data: string }) {
    if (this.fallosEscritura.delete(path)) throw new Error("Disco lleno");
    this.disco.set(path, data);
    return { uri: path };
  }

  async rename({ from, to }: { from: string; to: string }) {
    const data = this.disco.get(from);
    if (data === undefined) throw new Error("File does not exist");
    if (this.fallosRenombrado.delete(from)) throw new Error("Fallo al renombrar");
    this.disco.delete(to);
    this.disco.set(to, data);
    this.disco.delete(from);
  }

  async deleteFile({ path }: { path: string }) {
    if (!this.disco.delete(path)) throw new Error("File does not exist");
  }

  async readdir() {
    return { files: [...this.disco.keys()].map((name) => ({ name, type: "file" as const, size: 0, mtime: 0, uri: name })) };
  }
}

export function bancoArchivos(): Banco {
  const fs = new FilesystemEnMemoria();
  return {
    almacen: new AlmacenArchivos(fs as unknown as SistemaArchivos),
    archivos: () => Object.fromEntries(fs.disco),
    poner: (nombre, contenido) => void fs.disco.set(nombre, contenido),
    fallarEscrituraTmp: (nombre) => void fs.fallosEscritura.add(nombre + ".tmp"),
    fallarConfirmar: (nombre) => void fs.fallosRenombrado.add(nombre + ".tmp"),
  };
}

/** Simula `Storage` (`localStorage`). */
class StorageEnMemoria implements Storage {
  readonly datos = new Map<string, string>();
  readonly fallosSet = new Set<string>();

  get length() {
    return this.datos.size;
  }
  key(indice: number) {
    return [...this.datos.keys()][indice] ?? null;
  }
  getItem(clave: string) {
    return this.datos.get(clave) ?? null;
  }
  setItem(clave: string, valor: string) {
    if (this.fallosSet.delete(clave)) throw new Error("QuotaExceededError");
    this.datos.set(clave, String(valor));
  }
  removeItem(clave: string) {
    this.datos.delete(clave);
  }
  clear() {
    this.datos.clear();
  }
}

export function bancoLocalStorage(): Banco {
  const storage = new StorageEnMemoria();
  return {
    almacen: new AlmacenLocalStorage(storage),
    archivos: () =>
      Object.fromEntries([...storage.datos].filter(([k]) => k.startsWith(PREFIJO_CLAVE)).map(([k, v]) => [k.slice(PREFIJO_CLAVE.length), v])),
    poner: (nombre, contenido) => void storage.datos.set(PREFIJO_CLAVE + nombre, contenido),
    fallarEscrituraTmp: (nombre) => void storage.fallosSet.add(PREFIJO_CLAVE + nombre + ".tmp"),
    // Confirmar en localStorage = escribir la clave final.
    fallarConfirmar: (nombre) => void storage.fallosSet.add(PREFIJO_CLAVE + nombre),
  };
}
