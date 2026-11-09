// Calendario de fechas (CU5, RF8) y día del aviso anual (design.md, "Notificaciones").
import type { DiaMes } from "./fechas";
import { proximaFecha } from "./fechas";
import type { Fecha, Persona } from "../modelos/tipos";
import { normalizarTexto } from "./texto";

export const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** "14 de marzo". */
export function textoDiaMes({ dia, mes }: DiaMes): string {
  return `${dia} de ${NOMBRES_MES[mes - 1]}`;
}

export interface EntradaCalendario {
  persona: Persona;
  fecha: Fecha;
  /** Posición de la fecha en `persona.fechas`. */
  indice: number;
  /** Próxima ocurrencia (incluye hoy). */
  proxima: Date;
  /** Días que faltan desde `desde` (0 = hoy). */
  dias: number;
}

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Todas las fechas de todas las personas, ordenadas por la más próxima (RF8).
 * A igual día, por nombre (sin mayúsculas ni acentos) y después por orden en la persona.
 */
export function entradasCalendario(personas: readonly Persona[], desde: Date): EntradaCalendario[] {
  const hoy = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const entradas = personas.flatMap((persona) =>
    persona.fechas.map((fecha, indice) => {
      const proxima = proximaFecha(fecha, hoy);
      // `round` evita errores de una hora por los cambios de horario.
      return { persona, fecha, indice, proxima, dias: Math.round((proxima.getTime() - hoy.getTime()) / MS_DIA) };
    }),
  );
  return entradas.sort(
    (a, b) =>
      a.proxima.getTime() - b.proxima.getTime() ||
      normalizarTexto(a.persona.nombre).localeCompare(normalizarTexto(b.persona.nombre)) ||
      a.indice - b.indice,
  );
}

/**
 * Día y mes del aviso anual: el día anterior a la fecha. Un aviso que se repite cada
 * año no puede caer el 29/02, así que el aviso del 1 de marzo es el 28/02, y el de
 * una fecha 29/02 también (el día anterior).
 */
export function diaAvisoAnual({ dia, mes }: DiaMes): DiaMes {
  if (dia > 1) return { dia: dia - 1, mes };
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const diasMesAnterior = mesAnterior === 2 ? 28 : [4, 6, 9, 11].includes(mesAnterior) ? 30 : 31;
  return { dia: diasMesAnterior, mes: mesAnterior };
}
