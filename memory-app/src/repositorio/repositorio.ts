// Único código que lee y escribe los JSON (design.md, "Datos y persistencia").
import { Capacitor } from "@capacitor/core";
import { ajustesPorDefecto, type Ajustes, type Casa, type Persona, type Resultado } from "../modelos/tipos";
import { validarAjustes, validarCasa, validarPersona } from "../modelos/validadores";
import type { Almacen } from "./almacen";
import { AlmacenArchivos } from "./almacenArchivos";
import { AlmacenLocalStorage } from "./almacenLocalStorage";

export interface Datos {
  personas: Persona[];
  casas: Casa[];
  ajustes: Ajustes;
}

export type Clave = keyof Datos;

export const ARCHIVOS: Record<Clave, string> = {
  personas: "personas.json",
  casas: "casas.json",
  ajustes: "ajustes.json",
};

const CLAVES: Clave[] = ["personas", "casas", "ajustes"];

const ERROR_GUARDAR = "No se pudieron guardar los cambios";

function porDefecto(clave: Clave): Datos[Clave] {
  return clave === "ajustes" ? ajustesPorDefecto() : [];
}

function serializar(valor: unknown): string {
  return JSON.stringify(valor, null, 2);
}

/** Comprueba la forma de un archivo; devuelve el motivo si no es válida. */
function problemaDeForma(clave: Clave, valor: unknown): string | null {
  if (clave === "ajustes") {
    const r = validarAjustes(valor);
    return r.ok ? null : r.error;
  }
  if (!Array.isArray(valor)) return "no es una lista";
  const validar = clave === "personas" ? validarPersona : validarCasa;
  const ids = new Set<string>();
  for (const elemento of valor) {
    const r = validar(elemento);
    if (!r.ok) return r.error;
    const id = (elemento as { id: string }).id;
    if (ids.has(id)) return `el id ${id} está repetido`;
    ids.add(id);
  }
  return null;
}

/** Quita de las casas los ids que no existen y descarta las que quedan vacías (RNF10, R8). */
export function limpiarCasas(casas: Casa[], personas: Persona[]): Casa[] {
  const existentes = new Set(personas.map((p) => p.id));
  return casas
    .map((casa) => ({ ...casa, personas: casa.personas.filter((id) => existentes.has(id)) }))
    .filter((casa) => casa.personas.length > 0);
}

export class Repositorio {
  constructor(private readonly almacen: Almacen) {}

  /**
   * Descarta los `.tmp` huérfanos, carga los tres archivos y crea con su valor por
   * defecto los que no existen. Si un archivo está dañado no escribe nada.
   */
  async iniciar(): Promise<Resultado<Datos>> {
    await this.descartarTmp();

    const leidos: Partial<Datos> = {};
    const faltan: Partial<Datos> = {};
    for (const clave of CLAVES) {
      const nombre = ARCHIVOS[clave];
      let texto: string | null;
      try {
        texto = await this.almacen.leer(nombre);
      } catch {
        return { ok: false, error: `No se pudo leer ${nombre}` };
      }
      if (texto === null) {
        Object.assign(faltan, { [clave]: porDefecto(clave) });
        continue;
      }
      let valor: unknown;
      try {
        valor = JSON.parse(texto);
      } catch {
        return { ok: false, error: `El archivo ${nombre} está dañado: no es un JSON válido` };
      }
      const problema = problemaDeForma(clave, valor);
      if (problema) return { ok: false, error: `El archivo ${nombre} está dañado: ${problema}` };
      Object.assign(leidos, { [clave]: valor });
    }

    if (Object.keys(faltan).length > 0) {
      const creado = await this.guardar(faltan);
      if (!creado.ok) return { ok: false, error: "No se pudieron crear los archivos de datos" };
    }

    const datos = { ...faltan, ...leidos } as Datos;
    return { ok: true, valor: { ...datos, casas: limpiarCasas(datos.casas, datos.personas) } };
  }

  /**
   * Guarda los archivos indicados como una sola operación (RNF8, RNF9): escribe
   * todos los `.tmp`, luego los renombra; si algo falla, restaura los ya
   * confirmados y borra los `.tmp`.
   */
  async guardar(cambios: Partial<Datos>): Promise<Resultado<void>> {
    const claves = CLAVES.filter((c) => cambios[c] !== undefined);
    const nombres = claves.map((c) => ARCHIVOS[c]);

    const originales: (string | null)[] = [];
    try {
      for (const nombre of nombres) originales.push(await this.almacen.leer(nombre));
      for (const clave of claves) await this.almacen.escribirTmp(ARCHIVOS[clave], serializar(cambios[clave]));
    } catch {
      await this.borrarTmps(nombres);
      return { ok: false, error: ERROR_GUARDAR };
    }

    let confirmados = 0;
    try {
      for (const nombre of nombres) {
        await this.almacen.confirmarTmp(nombre);
        confirmados++;
      }
    } catch {
      await this.restaurar(nombres.slice(0, confirmados), originales);
      await this.borrarTmps(nombres);
      return { ok: false, error: ERROR_GUARDAR };
    }
    return { ok: true, valor: undefined };
  }

  private async restaurar(nombres: string[], originales: (string | null)[]): Promise<void> {
    for (const [i, nombre] of nombres.entries()) {
      try {
        const original = originales[i];
        if (original === null) {
          await this.almacen.borrar(nombre);
        } else {
          await this.almacen.escribirTmp(nombre, original);
          await this.almacen.confirmarTmp(nombre);
        }
      } catch {
        // Se intenta con el resto; el error ya se devuelve al llamante.
      }
    }
  }

  private async borrarTmps(nombres: string[]): Promise<void> {
    for (const nombre of nombres) {
      try {
        await this.almacen.borrarTmp(nombre);
      } catch {
        // Un `.tmp` que no se pudo borrar se descarta en el siguiente arranque.
      }
    }
  }

  private async descartarTmp(): Promise<void> {
    try {
      await this.borrarTmps(await this.almacen.listarTmp());
    } catch {
      // Los `.tmp` no se leen nunca; si no se pueden listar, no afectan a los datos.
    }
  }
}

/** `localStorage` en la vista previa web; archivos en Android. */
export function crearAlmacen(): Almacen {
  return Capacitor.isNativePlatform() ? new AlmacenArchivos() : new AlmacenLocalStorage();
}
