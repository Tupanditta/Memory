// Frontera con el sistema de almacenamiento (design.md, "Datos y persistencia").
// Los nombres son los de los archivos de datos (`personas.json`...); la copia
// temporal de cada uno es `<nombre>.tmp`.

export interface Almacen {
  /** Contenido del archivo, o `null` si no existe. */
  leer(nombre: string): Promise<string | null>;
  /** Escribe `<nombre>.tmp`. */
  escribirTmp(nombre: string, contenido: string): Promise<void>;
  /** Renombra `<nombre>.tmp` a `<nombre>`, sustituyendo el archivo anterior. */
  confirmarTmp(nombre: string): Promise<void>;
  /** Borra `<nombre>.tmp` si existe. */
  borrarTmp(nombre: string): Promise<void>;
  /** Borra `<nombre>` si existe. */
  borrar(nombre: string): Promise<void>;
  /** Nombres (sin `.tmp`) de los archivos temporales que existen. */
  listarTmp(): Promise<string[]>;
}

export const SUFIJO_TMP = ".tmp";
