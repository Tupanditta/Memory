// Reglas de presentación de la interfaz (design.md, "Interfaz"): saludo, colores de
// avatar, textos de miembros, signo zodiacal, edad, días que faltan y formatos de fecha.
import type { Direccion, Fecha } from "../modelos/tipos";
import { proximaFecha, type DiaMes } from "./fechas";

/** "Buenos días" de 6:00 a 11:59, "Buenas tardes" de 12:00 a 20:59 y "Buenas noches" de 21:00 a 5:59. */
export function saludo(hora: Date): string {
  const h = hora.getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 21) return "Buenas tardes";
  return "Buenas noches";
}

export interface ColorAvatar {
  /** Clase de fondo (`bg-*`). */
  fondo: string;
  /** Clase de texto (`text-*`). */
  texto: string;
}

/** Paleta de avatares del prototipo: cinco parejas fondo/texto. */
export const PALETA_AVATAR: readonly ColorAvatar[] = [
  { fondo: "bg-primary-fixed", texto: "text-on-primary-fixed" },
  { fondo: "bg-secondary-fixed", texto: "text-on-secondary-fixed" },
  { fondo: "bg-tertiary-fixed", texto: "text-on-tertiary-fixed" },
  { fondo: "bg-secondary-fixed-dim", texto: "text-on-secondary-fixed" },
  { fondo: "bg-surface-variant", texto: "text-on-surface" },
];

/** Hash FNV-1a de 32 bits (sin signo): estable entre ejecuciones y sin dependencias. */
export function hashTexto(texto: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Color estable para un `id`: el mismo `id` da siempre la misma pareja de la paleta. */
export function colorAvatar(id: string): ColorAvatar {
  return PALETA_AVATAR[hashTexto(id) % PALETA_AVATAR.length];
}

/** Iniciales de un nombre: la primera letra de las dos primeras palabras ("Ana García" → "AG"). */
export function iniciales(nombre: string, cuantas = 2): string {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, cuantas)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

const nombreDePila = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? "";

/** 1 o 2 nombres: completos separados por coma. 3 o más: los nombres de pila de los dos primeros y "y N más". */
export function textoMiembros(nombres: readonly string[]): string {
  if (nombres.length <= 2) return nombres.join(", ");
  return `${nombreDePila(nombres[0])}, ${nombreDePila(nombres[1])} y ${nombres.length - 2} más`;
}

/** Inicio de cada signo (día, mes), en orden del año; las fronteras son inclusivas. */
const SIGNOS: readonly [number, number, string][] = [
  [20, 1, "Acuario"],
  [19, 2, "Piscis"],
  [21, 3, "Aries"],
  [20, 4, "Tauro"],
  [21, 5, "Géminis"],
  [21, 6, "Cáncer"],
  [23, 7, "Leo"],
  [23, 8, "Virgo"],
  [23, 9, "Libra"],
  [23, 10, "Escorpio"],
  [22, 11, "Sagitario"],
  [22, 12, "Capricornio"],
];

/** Signo zodiacal de un día y mes (tabla de design.md). */
export function signoZodiacal(dia: number, mes: number): string {
  let signo = "Capricornio"; // del 1 al 19 de enero
  for (const [d, m, nombre] of SIGNOS) {
    if (mes > m || (mes === m && dia >= d)) signo = nombre;
  }
  return signo;
}

/** Años cumplidos hoy; `null` si la fecha no tiene año. */
export function edad(fecha: DiaMes & { anio?: number }, hoy: Date): number | null {
  if (fecha.anio === undefined) return null;
  const mes = hoy.getMonth() + 1;
  const yaCumplidos = mes > fecha.mes || (mes === fecha.mes && hoy.getDate() >= fecha.dia);
  return hoy.getFullYear() - fecha.anio - (yaCumplidos ? 0 : 1);
}

const MS_DIA = 24 * 60 * 60 * 1000;

/** Días que faltan hasta la próxima ocurrencia (0 = hoy). */
export function diasHasta(fecha: DiaMes, hoy: Date): number {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  // `round` evita errores de una hora por los cambios de horario.
  return Math.round((proximaFecha(fecha, inicio).getTime() - inicio.getTime()) / MS_DIA);
}

/** Una fecha es cercana si faltan 7 días o menos. */
export const DIAS_CERCANA = 7;

export function esCercana(fecha: DiaMes, hoy: Date): boolean {
  return diasHasta(fecha, hoy) <= DIAS_CERCANA;
}

/** "Hoy", "Mañana" o "En N días". */
export function etiquetaProximaFecha(fecha: DiaMes, hoy: Date): string {
  const dias = diasHasta(fecha, hoy);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const;
export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as const;
export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

/** "02 Jun". */
export function fechaCorta({ dia, mes }: DiaMes): string {
  return `${String(dia).padStart(2, "0")} ${MESES_CORTOS[mes - 1]}`;
}

/** "14 de Marzo". */
export function fechaLarga({ dia, mes }: DiaMes): string {
  return `${dia} de ${MESES[mes - 1]}`;
}

/** "Sábado, 14 de Marzo". */
export function fechaConDiaSemana(fecha: Date): string {
  return `${DIAS_SEMANA[fecha.getDay()]}, ${fechaLarga({ dia: fecha.getDate(), mes: fecha.getMonth() + 1 })}`;
}

/** "0 seleccionados", "1 seleccionado", "3 seleccionados". */
export function textoSeleccionados(n: number): string {
  return `${n} ${n === 1 ? "seleccionado" : "seleccionados"}`;
}

/** "1 guardada" / "3 guardadas": número y la forma singular o plural. */
export function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

const TIPO_FECHA: Record<Fecha["tipo"], string> = { cumpleaños: "Cumpleaños", aniversario: "Aniversario" };

/** Texto de una fecha: su etiqueta si la tiene; si no, el tipo ("Cumpleaños", "Aniversario"). */
export function nombreFecha(fecha: Pick<Fecha, "tipo" | "etiqueta">): string {
  return fecha.etiqueta.trim() || TIPO_FECHA[fecha.tipo];
}

/** Emoji del tipo de fecha. */
export function emojiFecha(tipo: Fecha["tipo"]): string {
  return tipo === "cumpleaños" ? "🎂" : "💍";
}

/** La fecha más próxima de una lista (a igual distancia, la primera) y los días que faltan; `null` sin fechas. */
export function proximaDe(fechas: readonly Fecha[], hoy: Date): { fecha: Fecha; dias: number } | null {
  let mejor: { fecha: Fecha; dias: number } | null = null;
  for (const fecha of fechas) {
    const dias = diasHasta(fecha, hoy);
    if (!mejor || dias < mejor.dias) mejor = { fecha, dias };
  }
  return mejor;
}

/**
 * Chip de la próxima fecha en Inicio: "Cumpleaños (02 Jun)"; a 7 días o menos,
 * "En 4 días (14 Mar)", "Hoy (14 Mar)" o "Mañana (14 Mar)".
 */
export function textoChipFecha(fecha: Fecha, hoy: Date): string {
  const cuando = esCercana(fecha, hoy) ? etiquetaProximaFecha(fecha, hoy) : nombreFecha(fecha);
  return `${cuando} (${fechaCorta(fecha)})`;
}

/** Dirección en una línea para tarjetas: "Calle Alcalá 42, 3ºB"; sin calle, la ciudad; sin nada, "". */
export function direccionCorta(direccion: Direccion): string {
  const calle = direccion.calle.trim();
  if (!calle) return direccion.ciudad.trim();
  const via = [calle, direccion.numero.trim()].filter(Boolean).join(" ");
  const vivienda = `${direccion.piso.trim()}${direccion.puerta.trim()}`;
  return [via, vivienda].filter(Boolean).join(", ");
}

/**
 * Dirección en tres líneas para las fichas, sin las partes vacías:
 * "Calle Alcalá 42" / "Portal 2, Piso 3º, Puerta B" / "28014 Madrid".
 */
export function lineasDireccion(direccion: Direccion): { via: string; vivienda: string; localidad: string } {
  const t = (texto: string) => texto.trim();
  return {
    via: [t(direccion.calle), t(direccion.numero)].filter(Boolean).join(" "),
    vivienda: [
      t(direccion.portal) && `Portal ${t(direccion.portal)}`,
      t(direccion.piso) && `Piso ${t(direccion.piso)}`,
      t(direccion.puerta) && `Puerta ${t(direccion.puerta)}`,
    ]
      .filter(Boolean)
      .join(", "),
    localidad: [t(direccion.codigoPostal), t(direccion.ciudad)].filter(Boolean).join(" "),
  };
}
