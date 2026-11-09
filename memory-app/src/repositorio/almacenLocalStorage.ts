// Almacen de la vista previa web (solo desarrollo): cada archivo es una clave de `localStorage`.
import { SUFIJO_TMP, type Almacen } from "./almacen";

export const PREFIJO_CLAVE = "memory/";

export class AlmacenLocalStorage implements Almacen {
  constructor(private readonly storage: Storage = window.localStorage) {}

  private clave(nombre: string): string {
    return PREFIJO_CLAVE + nombre;
  }

  async leer(nombre: string): Promise<string | null> {
    return this.storage.getItem(this.clave(nombre));
  }

  async escribirTmp(nombre: string, contenido: string): Promise<void> {
    this.storage.setItem(this.clave(nombre + SUFIJO_TMP), contenido);
  }

  async confirmarTmp(nombre: string): Promise<void> {
    const contenido = this.storage.getItem(this.clave(nombre + SUFIJO_TMP));
    if (contenido === null) throw new Error(`No existe ${nombre}${SUFIJO_TMP}`);
    this.storage.setItem(this.clave(nombre), contenido);
    this.storage.removeItem(this.clave(nombre + SUFIJO_TMP));
  }

  async borrarTmp(nombre: string): Promise<void> {
    this.storage.removeItem(this.clave(nombre + SUFIJO_TMP));
  }

  async borrar(nombre: string): Promise<void> {
    this.storage.removeItem(this.clave(nombre));
  }

  async listarTmp(): Promise<string[]> {
    const nombres: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const clave = this.storage.key(i);
      if (clave?.startsWith(PREFIJO_CLAVE) && clave.endsWith(SUFIJO_TMP)) {
        nombres.push(clave.slice(PREFIJO_CLAVE.length, -SUFIJO_TMP.length));
      }
    }
    return nombres;
  }
}
