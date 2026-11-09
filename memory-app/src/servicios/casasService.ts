// Reglas de negocio de casas (CU7 a CU9). Cada operación valida, calcula el
// nuevo estado sin mutar el actual y lo guarda con la `Tienda`.
import { direccionVacia, type Casa, type Direccion, type Persona, type Resultado } from "../modelos/tipos";
import { validarCasa } from "../modelos/validadores";
import { coincide, palabrasConsulta, textoCasa } from "../utilidades/busqueda";
import { nuevoId } from "../utilidades/id";
import type { Tienda } from "./tienda";

/** Datos para crear una casa: apodo y al menos una persona (RF5, R8). */
export interface DatosCasa {
  apodo: string;
  direccion?: Partial<Direccion>;
  personas: string[];
}

export interface CambiosCasa {
  apodo?: string;
  direccion?: Partial<Direccion>;
  /** Lista completa de miembros (formulario de casa); al menos uno. */
  personas?: string[];
}

/**
 * Resultado de quitar a una persona. Si es la última de la casa y no se ha
 * confirmado, no cambia nada y pide confirmación (RF7b). `valor` es la casa
 * resultante, o `null` si se ha borrado.
 */
export type ResultadoQuitar = Resultado<Casa | null> | { ok: false; error: string; requiereConfirmacion: true };

/** Una casa de una persona, con sus convivientes (el resto de miembros) (RF7). */
export interface CasaDePersona {
  casa: Casa;
  convivientes: Persona[];
}

export const ERROR_REQUIERE_CONFIRMACION = "Es la última persona de la casa: confirma para borrar la casa";

const fallo = <T>(error: string): Resultado<T> => ({ ok: false, error });
const recortar = (texto: unknown) => (typeof texto === "string" ? texto.trim() : texto);

export class CasasService {
  constructor(private readonly tienda: Tienda) {}

  async crear(datos: DatosCasa): Promise<Resultado<Casa>> {
    const casa = {
      id: nuevoId(),
      apodo: recortar(datos.apodo),
      direccion: { ...direccionVacia(), ...datos.direccion },
      personas: Array.isArray(datos.personas) ? [...datos.personas] : datos.personas,
    } as Casa;
    const validacion = this.validar(casa);
    if (!validacion.ok) return validacion;
    const resultado = await this.tienda.aplicar({ casas: [...this.tienda.datos.casas, casa] });
    return resultado.ok ? { ok: true, valor: casa } : fallo(resultado.error);
  }

  /** Cambia solo los campos indicados (CU8). */
  async editar(id: string, cambios: CambiosCasa): Promise<Resultado<Casa>> {
    const actual = this.porId(id);
    if (!actual) return fallo("La casa no existe");
    const editada = {
      ...actual,
      ...(cambios.apodo !== undefined ? { apodo: recortar(cambios.apodo) } : {}),
      ...(cambios.direccion !== undefined ? { direccion: { ...actual.direccion, ...cambios.direccion } } : {}),
      ...(cambios.personas !== undefined ? { personas: [...cambios.personas] } : {}),
    } as Casa;
    return this.reemplazar(editada);
  }

  async borrar(id: string): Promise<Resultado<void>> {
    if (!this.porId(id)) return fallo("La casa no existe");
    const resultado = await this.tienda.aplicar({ casas: this.tienda.datos.casas.filter((c) => c.id !== id) });
    return resultado.ok ? { ok: true, valor: undefined } : fallo(resultado.error);
  }

  /** Añade una persona existente a la casa; una persona puede estar en varias casas (RF5). */
  async anadirPersona(id: string, personaId: string): Promise<Resultado<Casa>> {
    const actual = this.porId(id);
    if (!actual) return fallo("La casa no existe");
    if (actual.personas.includes(personaId)) return fallo("La persona ya está en la casa");
    return this.reemplazar({ ...actual, personas: [...actual.personas, personaId] });
  }

  /**
   * Quita a una persona de la casa. Si es la última, sin `confirmado` devuelve
   * `requiereConfirmacion` sin cambiar nada; con `confirmado` borra la casa (RF7b).
   */
  async quitarPersona(id: string, personaId: string, confirmado = false): Promise<ResultadoQuitar> {
    const actual = this.porId(id);
    if (!actual) return fallo("La casa no existe");
    if (!actual.personas.includes(personaId)) return fallo("La persona no está en la casa");
    if (actual.personas.length === 1) {
      if (!confirmado) return { ok: false, error: ERROR_REQUIERE_CONFIRMACION, requiereConfirmacion: true };
      const borrado = await this.borrar(id);
      return borrado.ok ? { ok: true, valor: null } : borrado;
    }
    return this.reemplazar({ ...actual, personas: actual.personas.filter((p) => p !== personaId) });
  }

  /** Busca por apodo, dirección o nombre de un miembro (RF6, RNF3); con la consulta vacía devuelve todas. */
  buscar(consulta: string): Casa[] {
    const palabras = palabrasConsulta(consulta);
    const { personas, casas } = this.tienda.datos;
    if (palabras.length === 0) return casas;
    return casas.filter((casa) => coincide(textoCasa(casa, personas), palabras));
  }

  /** Casas de una persona, cada una con sus convivientes (RF7). */
  casasDePersona(personaId: string): CasaDePersona[] {
    return this.tienda.datos.casas
      .filter((casa) => casa.personas.includes(personaId))
      .map((casa) => ({ casa, convivientes: this.miembros(casa.id).filter((p) => p.id !== personaId) }));
  }

  /** Personas de la casa, en el orden de `personas`. */
  miembros(id: string): Persona[] {
    const casa = this.porId(id);
    if (!casa) return [];
    const { personas } = this.tienda.datos;
    return casa.personas.map((pid) => personas.find((p) => p.id === pid)).filter((p): p is Persona => p !== undefined);
  }

  private porId(id: string): Casa | undefined {
    return this.tienda.datos.casas.find((c) => c.id === id);
  }

  /** Estructura válida (R8) y todos los miembros existen (RNF10). */
  private validar(casa: Casa): Resultado<Casa> {
    const validacion = validarCasa(casa);
    if (!validacion.ok) return fallo(validacion.error);
    const ids = new Set(this.tienda.datos.personas.map((p) => p.id));
    if (!casa.personas.every((pid) => ids.has(pid))) return fallo("Alguna persona de la casa no existe");
    return { ok: true, valor: casa };
  }

  private async reemplazar(casa: Casa): Promise<Resultado<Casa>> {
    const validacion = this.validar(casa);
    if (!validacion.ok) return validacion;
    const casas = this.tienda.datos.casas.map((c) => (c.id === casa.id ? casa : c));
    const resultado = await this.tienda.aplicar({ casas });
    return resultado.ok ? { ok: true, valor: casa } : fallo(resultado.error);
  }
}
