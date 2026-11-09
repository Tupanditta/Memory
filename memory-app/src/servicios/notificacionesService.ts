// Avisos del día anterior a cada fecha (RF9, RF10, CU6, CU10). Cada sincronización
// cancela todo y vuelve a programar un aviso anual por fecha. Nunca lanza: un fallo
// de notificaciones no deshace un guardado.
import type { Persona } from "../modelos/tipos";
import { diaAvisoAnual, textoDiaMes } from "../utilidades/calendario";
import type { Aviso, Notificador } from "./notificador";

/**
 * Resultado de una sincronización: `programadas` (hay permiso y se programó todo),
 * `sinFechas` (no hay nada que avisar), `sinPermiso` (no se programa nada) o `error`.
 */
export type EstadoNotificaciones = "programadas" | "sinFechas" | "sinPermiso" | "error";

/** Id numérico estable (FNV-1a de 32 bits, positivo) a partir de `personaId:índice`. */
export function idAviso(personaId: string, indice: number): number {
  let hash = 0x811c9dc5;
  for (const caracter of `${personaId}:${indice}`) {
    hash ^= caracter.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) & 0x7fffffff;
}

/** Un aviso por cada fecha de cada persona, el día anterior a la hora `HH:MM`. */
export function avisosDe(personas: readonly Persona[], hora: string): Aviso[] {
  const [h, m] = hora.split(":").map(Number);
  return personas.flatMap((persona) =>
    persona.fechas.map((fecha, indice) => {
      const etiqueta = fecha.etiqueta ? ` (${fecha.etiqueta})` : "";
      return {
        id: idAviso(persona.id, indice),
        titulo: `Mañana: ${fecha.tipo} de ${persona.nombre}`,
        cuerpo: `${textoDiaMes(fecha)}${etiqueta}`,
        ...diaAvisoAnual(fecha),
        hora: h,
        minuto: m,
      };
    }),
  );
}

export class NotificacionesService {
  /** Las sincronizaciones se encadenan para que no se mezclen sus cancelaciones y programaciones. */
  private cola: Promise<unknown> = Promise.resolve();
  private permisoPedido = false;

  constructor(private readonly notificador: Notificador) {}

  sincronizar(personas: readonly Persona[], hora: string): Promise<EstadoNotificaciones> {
    const resultado = this.cola.then(() => this.sincronizarAhora(personas, hora));
    this.cola = resultado;
    return resultado;
  }

  private async sincronizarAhora(personas: readonly Persona[], hora: string): Promise<EstadoNotificaciones> {
    try {
      const avisos = avisosDe(personas, hora);
      if (avisos.length === 0) {
        await this.notificador.cancelarTodas();
        return "sinFechas";
      }
      // El permiso se pide solo cuando hay algo que avisar, y una vez por sesión.
      let permiso = await this.notificador.permiso();
      if (permiso === "preguntar" && !this.permisoPedido) {
        this.permisoPedido = true;
        permiso = await this.notificador.pedirPermiso();
      }
      await this.notificador.cancelarTodas();
      if (permiso !== "concedido") return "sinPermiso";
      await this.notificador.programar(avisos);
      return "programadas";
    } catch {
      return "error";
    }
  }
}
