// Exportar e importar (CU11, CU12; design.md, "Exportar e importar").
// Importar solo añade: nunca modifica ni borra datos existentes (R11).
import { CAMPOS_DIRECCION, type Casa, type Direccion, type Fecha, type Persona, type Resultado } from "../modelos/tipos";
import { validarCasa, validarPersona } from "../modelos/validadores";
import { normalizarTexto } from "../utilidades/texto";
import type { Compartidor } from "./archivosExternos";
import type { Tienda } from "./tienda";

export const VERSION_EXPORTACION = 1;
export const NOMBRE_EXPORTACION = "memory-export.json";

export interface Exportacion {
  version: typeof VERSION_EXPORTACION;
  exportadoEn: string;
  personas: Persona[];
  casas: Casa[];
}

export interface ResumenImportacion {
  personasAnadidas: number;
  personasOmitidas: number;
  casasAnadidas: number;
  casasOmitidas: number;
}

const fallo = <T>(error: string): Resultado<T> => ({ ok: false, error });
const esObjeto = (valor: unknown): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor);

/** Copias limpias: solo los campos del modelo, sin campos de más que traiga el archivo. */
const limpiarDireccion = (d: Direccion): Direccion => Object.fromEntries(CAMPOS_DIRECCION.map((c) => [c, d[c]])) as unknown as Direccion;
const limpiarFecha = (f: Fecha): Fecha => ({ tipo: f.tipo, etiqueta: f.etiqueta, dia: f.dia, mes: f.mes, ...(f.anio !== undefined ? { anio: f.anio } : {}) });
const limpiarPersona = (p: Persona): Persona => ({ id: p.id, nombre: p.nombre, apodo: p.apodo, direccion: limpiarDireccion(p.direccion), fechas: p.fechas.map(limpiarFecha) });
const limpiarCasa = (c: Casa): Casa => ({ id: c.id, apodo: c.apodo, direccion: limpiarDireccion(c.direccion), personas: [...c.personas] });

/** Texto del archivo `memory-export.json` (el que se comparte). */
export function contenidoExportacion(exportacion: Exportacion): string {
  return JSON.stringify(exportacion, null, 2);
}

/** Tamaño en bytes (UTF-8) del archivo exportado. */
export function bytesExportacion(exportacion: Exportacion): number {
  return new TextEncoder().encode(contenidoExportacion(exportacion)).length;
}

/** Texto del resumen (CU12). */
export function textoResumen(r: ResumenImportacion): string {
  return `Personas: ${r.personasAnadidas} añadidas, ${r.personasOmitidas} omitidas. Casas: ${r.casasAnadidas} añadidas, ${r.casasOmitidas} omitidas.`;
}

/**
 * Valida el archivo entero: `version` 1, `personas` y `casas` como listas, y cada
 * persona y casa con estructura y datos válidos. Si algo falla, se rechaza todo.
 */
export function leerExportacion(texto: string): Resultado<{ personas: Persona[]; casas: Casa[] }> {
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    return fallo("El archivo no es un JSON válido");
  }
  if (!esObjeto(valor)) return fallo("El archivo no es una exportación de Memory");
  if (valor.version !== VERSION_EXPORTACION) return fallo("El archivo no es una exportación de Memory compatible (falta la versión o es otra)");
  if (!Array.isArray(valor.personas) || !Array.isArray(valor.casas)) return fallo("El archivo no tiene listas de personas y casas");
  for (const [i, p] of valor.personas.entries()) {
    const v = validarPersona(p);
    if (!v.ok) return fallo(`Persona ${i + 1} del archivo: ${v.error}`);
  }
  for (const [i, c] of valor.casas.entries()) {
    const v = validarCasa(c);
    if (!v.ok) return fallo(`Casa ${i + 1} del archivo: ${v.error}`);
  }
  return { ok: true, valor: { personas: (valor.personas as Persona[]).map(limpiarPersona), casas: (valor.casas as Casa[]).map(limpiarCasa) } };
}

export class IntercambioService {
  constructor(
    private readonly tienda: Tienda,
    private readonly compartidor: Compartidor,
  ) {}

  /** Contenido de `memory-export.json` con los datos actuales (RF11). */
  generar(ahora: Date = new Date()): Exportacion {
    const { personas, casas } = this.tienda.datos;
    return { version: VERSION_EXPORTACION, exportadoEn: ahora.toISOString(), personas, casas };
  }

  /** Crea `memory-export.json` y abre el menú de compartir/guardar. No modifica los datos. */
  async exportar(): Promise<Resultado<Exportacion>> {
    const exportacion = this.generar();
    try {
      await this.compartidor.compartir(NOMBRE_EXPORTACION, contenidoExportacion(exportacion));
    } catch {
      return fallo("No se pudo crear el archivo de exportación");
    }
    return { ok: true, valor: exportacion };
  }

  /**
   * Añade lo que no existe (por `id`, nombre o apodo normalizados) y guarda personas
   * y casas en una sola operación (RNF8). Si el guardado falla, no se añade nada (RNF9).
   */
  async importar(texto: string): Promise<Resultado<ResumenImportacion>> {
    const leido = leerExportacion(texto);
    if (!leido.ok) return leido;
    const actuales = this.tienda.datos;
    const personas = [...actuales.personas];
    const casas = [...actuales.casas];
    const resumen: ResumenImportacion = { personasAnadidas: 0, personasOmitidas: 0, casasAnadidas: 0, casasOmitidas: 0 };

    // id del archivo → id en la app (el mismo si se añade, el de la existente si es duplicada).
    const mapa = new Map<string, string>();
    for (const persona of leido.valor.personas) {
      const nombre = normalizarTexto(persona.nombre.trim());
      const existente = personas.find((p) => p.id === persona.id) ?? personas.find((p) => normalizarTexto(p.nombre.trim()) === nombre);
      if (existente) {
        if (!mapa.has(persona.id)) mapa.set(persona.id, existente.id);
        resumen.personasOmitidas++;
      } else {
        personas.push(persona);
        mapa.set(persona.id, persona.id);
        resumen.personasAnadidas++;
      }
    }

    const idsEnApp = new Set(actuales.personas.map((p) => p.id));
    for (const casa of leido.valor.casas) {
      const apodo = normalizarTexto(casa.apodo.trim());
      const duplicada = casas.some((c) => c.id === casa.id || normalizarTexto(c.apodo.trim()) === apodo);
      // Cada miembro debe existir en el archivo (ya mapeado) o en la app (RNF10).
      const miembros = casa.personas.map((id) => mapa.get(id) ?? (idsEnApp.has(id) ? id : undefined));
      if (duplicada || miembros.some((id) => id === undefined)) {
        resumen.casasOmitidas++;
        continue;
      }
      const nueva: Casa = { ...casa, personas: [...new Set(miembros as string[])] };
      if (!validarCasa(nueva).ok) {
        resumen.casasOmitidas++;
        continue;
      }
      casas.push(nueva);
      resumen.casasAnadidas++;
    }

    const cambios = {
      ...(resumen.personasAnadidas > 0 ? { personas } : {}),
      ...(resumen.casasAnadidas > 0 ? { casas } : {}),
    };
    if (Object.keys(cambios).length > 0) {
      const resultado = await this.tienda.aplicar(cambios);
      if (!resultado.ok) return fallo(resultado.error);
    }
    return { ok: true, valor: resumen };
  }
}
