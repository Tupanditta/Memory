// Reglas de negocio de personas (CU1 a CU4). Cada operación valida, calcula el
// nuevo estado sin mutar el actual y lo guarda con la `Tienda`.
import { direccionVacia, type Casa, type Direccion, type Fecha, type Persona, type Resultado } from "../modelos/tipos";
import { validarFecha, validarPersona } from "../modelos/validadores";
import { coincide, palabrasConsulta, textoPersona } from "../utilidades/busqueda";
import { nuevoId } from "../utilidades/id";
import type { Tienda } from "./tienda";

/** Datos para crear una persona: solo el nombre es obligatorio (RF1). */
export interface DatosPersona {
  nombre: string;
  apodo?: string;
  direccion?: Partial<Direccion>;
  fechas?: Fecha[];
}

export interface CambiosPersona {
  nombre?: string;
  apodo?: string;
  direccion?: Partial<Direccion>;
  fechas?: Fecha[];
}

const fallo = <T>(error: string): Resultado<T> => ({ ok: false, error });
const recortar = (texto: unknown) => (typeof texto === "string" ? texto.trim() : texto);

export class PersonasService {
  constructor(private readonly tienda: Tienda) {}

  async crear(datos: DatosPersona): Promise<Resultado<Persona>> {
    const persona = {
      id: nuevoId(),
      nombre: recortar(datos.nombre),
      apodo: recortar(datos.apodo ?? ""),
      direccion: { ...direccionVacia(), ...datos.direccion },
      fechas: (datos.fechas ?? []).map((f) => ({ ...f })),
    } as Persona;
    const validacion = validarPersona(persona);
    if (!validacion.ok) return fallo(validacion.error);
    const resultado = await this.tienda.aplicar({ personas: [...this.tienda.datos.personas, persona] });
    return resultado.ok ? { ok: true, valor: persona } : fallo(resultado.error);
  }

  /** Cambia solo los campos indicados (CU2). */
  async editar(id: string, cambios: CambiosPersona): Promise<Resultado<Persona>> {
    const actual = this.porId(id);
    if (!actual) return fallo("La persona no existe");
    const editada = {
      ...actual,
      ...(cambios.nombre !== undefined ? { nombre: recortar(cambios.nombre) } : {}),
      ...(cambios.apodo !== undefined ? { apodo: recortar(cambios.apodo) } : {}),
      ...(cambios.direccion !== undefined ? { direccion: { ...actual.direccion, ...cambios.direccion } } : {}),
      ...(cambios.fechas !== undefined ? { fechas: cambios.fechas.map((f) => ({ ...f })) } : {}),
    } as Persona;
    return this.reemplazar(editada);
  }

  /**
   * Borra la persona, la quita de sus casas y borra las que quedan vacías, todo
   * en un solo guardado (RNF8, RF7b).
   */
  async borrar(id: string): Promise<Resultado<void>> {
    if (!this.porId(id)) return fallo("La persona no existe");
    const { personas, casas } = this.tienda.datos;
    const personasNuevas = personas.filter((p) => p.id !== id);
    const enAlgunaCasa = casas.some((casa) => casa.personas.includes(id));
    const casasNuevas = casas
      .map((casa) => (casa.personas.includes(id) ? { ...casa, personas: casa.personas.filter((p) => p !== id) } : casa))
      .filter((casa) => casa.personas.length > 0);
    const resultado = await this.tienda.aplicar(enAlgunaCasa ? { personas: personasNuevas, casas: casasNuevas } : { personas: personasNuevas });
    return resultado.ok ? { ok: true, valor: undefined } : fallo(resultado.error);
  }

  /** Casas cuyo único miembro es la persona: se borrarían con ella (para avisar antes de borrar). */
  casasQueSeBorrarian(id: string): Casa[] {
    return this.tienda.datos.casas.filter((casa) => casa.personas.length === 1 && casa.personas[0] === id);
  }

  async anadirFecha(id: string, fecha: Fecha): Promise<Resultado<Persona>> {
    const validacion = validarFecha(fecha);
    if (!validacion.ok) return fallo(validacion.error);
    const actual = this.porId(id);
    if (!actual) return fallo("La persona no existe");
    return this.reemplazar({ ...actual, fechas: [...actual.fechas, { ...fecha }] });
  }

  async editarFecha(id: string, indice: number, fecha: Fecha): Promise<Resultado<Persona>> {
    const validacion = validarFecha(fecha);
    if (!validacion.ok) return fallo(validacion.error);
    const actual = this.porId(id);
    if (!actual) return fallo("La persona no existe");
    if (!(indice >= 0 && indice < actual.fechas.length)) return fallo("La fecha no existe");
    return this.reemplazar({ ...actual, fechas: actual.fechas.map((f, i) => (i === indice ? { ...fecha } : f)) });
  }

  async borrarFecha(id: string, indice: number): Promise<Resultado<Persona>> {
    const actual = this.porId(id);
    if (!actual) return fallo("La persona no existe");
    if (!(indice >= 0 && indice < actual.fechas.length)) return fallo("La fecha no existe");
    return this.reemplazar({ ...actual, fechas: actual.fechas.filter((_, i) => i !== indice) });
  }

  /** Busca por cualquier dato (RF4, RNF3); con la consulta vacía devuelve todas. */
  buscar(consulta: string): Persona[] {
    const palabras = palabrasConsulta(consulta);
    const { personas, casas } = this.tienda.datos;
    if (palabras.length === 0) return personas;
    return personas.filter((persona) => coincide(textoPersona(persona, casas), palabras));
  }

  private porId(id: string): Persona | undefined {
    return this.tienda.datos.personas.find((p) => p.id === id);
  }

  private async reemplazar(persona: Persona): Promise<Resultado<Persona>> {
    const validacion = validarPersona(persona);
    if (!validacion.ok) return fallo(validacion.error);
    const personas = this.tienda.datos.personas.map((p) => (p.id === persona.id ? persona : p));
    const resultado = await this.tienda.aplicar({ personas });
    return resultado.ok ? { ok: true, valor: persona } : fallo(resultado.error);
  }
}
