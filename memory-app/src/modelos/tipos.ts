// Modelo de datos (casos_de_uso.md, "Modelo de datos").

export interface Direccion {
  calle: string;
  numero: string;
  portal: string;
  piso: string;
  puerta: string;
  codigoPostal: string;
  ciudad: string;
  notas: string;
}

export type TipoFecha = "cumpleaños" | "aniversario";

export interface Fecha {
  tipo: TipoFecha;
  etiqueta: string;
  dia: number;
  mes: number;
  /** Opcional. */
  anio?: number;
}

export interface Persona {
  id: string;
  nombre: string;
  apodo: string;
  direccion: Direccion;
  fechas: Fecha[];
}

export interface Casa {
  id: string;
  apodo: string;
  direccion: Direccion;
  /** Ids de `personas.json`; al menos uno (R8). */
  personas: string[];
}

export interface Ajustes {
  /** Hora de aviso, `HH:MM`. */
  horaNotificacion: string;
}

export const TIPOS_FECHA: readonly TipoFecha[] = ["cumpleaños", "aniversario"];

export const CAMPOS_DIRECCION: readonly (keyof Direccion)[] = [
  "calle",
  "numero",
  "portal",
  "piso",
  "puerta",
  "codigoPostal",
  "ciudad",
  "notas",
];

export function direccionVacia(): Direccion {
  return { calle: "", numero: "", portal: "", piso: "", puerta: "", codigoPostal: "", ciudad: "", notas: "" };
}

export function ajustesPorDefecto(): Ajustes {
  return { horaNotificacion: "09:00" };
}

/** Resultado de una validación: `ok` o el motivo del error (en español). */
export type Validacion = { ok: true } | { ok: false; error: string };

/** Resultado de una operación con valor: `ok` con el valor o el motivo del error (en español). */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };
