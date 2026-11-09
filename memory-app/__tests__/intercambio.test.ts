// Sprint 8: exportar e importar (T8.1 a T8.10 sin interfaz), sobre el repositorio
// real con un sistema de archivos simulado en memoria.
import type { FilesystemPlugin } from "@capacitor/filesystem";
import type { ShareOptions } from "@capacitor/share";
import { describe, expect, test, vi } from "vitest";
import { direccionVacia, type Casa, type Direccion, type Fecha, type Persona } from "../src/modelos/tipos";
import { Repositorio, type Datos } from "../src/repositorio/repositorio";
import { CompartidorCapacitor, type Compartidor } from "../src/servicios/archivosExternos";
import { IntercambioService, NOMBRE_EXPORTACION, textoResumen, type Exportacion } from "../src/servicios/intercambioService";
import { Tienda } from "../src/servicios/tienda";
import { bancoArchivos } from "./simulados/almacenes";

const persona = (id: string, nombre: string, cambios: Partial<Persona> = {}): Persona => ({ id, nombre, apodo: "", direccion: direccionVacia(), fechas: [], ...cambios });
const casa = (id: string, apodo: string, personas: string[], direccion: Partial<Direccion> = {}): Casa => ({ id, apodo, direccion: { ...direccionVacia(), ...direccion }, personas });
const cumple = (dia: number, mes: number, anio?: number): Fecha => ({ tipo: "cumpleaños", etiqueta: "", dia, mes, ...(anio ? { anio } : {}) });

/** Compartidor simulado: guarda lo que se comparte. */
class CompartidorSimulado implements Compartidor {
  compartidos: { nombre: string; contenido: string }[] = [];
  fallar = false;
  async compartir(nombre: string, contenido: string) {
    if (this.fallar) throw new Error("Disco lleno");
    this.compartidos.push({ nombre, contenido });
  }
}

async function preparar(datos: Partial<Datos> = {}) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(datos.personas ?? []));
  banco.poner("casas.json", JSON.stringify(datos.casas ?? []));
  banco.poner("ajustes.json", JSON.stringify(datos.ajustes ?? { horaNotificacion: "09:00" }));
  const repositorio = new Repositorio(banco.almacen);
  const inicio = await repositorio.iniciar();
  if (!inicio.ok) throw new Error(inicio.error);
  const tienda = new Tienda(repositorio, inicio.valor);
  const compartidor = new CompartidorSimulado();
  const servicio = new IntercambioService(tienda, compartidor);
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, tienda, compartidor, servicio, leer };
}

const archivo = (personas: unknown[], casas: unknown[] = [], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ version: 1, exportadoEn: "2026-01-01T00:00:00.000Z", personas, casas, ...extra });

const ana = persona("p1", "Ana García", { apodo: "Anita", direccion: { ...direccionVacia(), calle: "Mayor", ciudad: "Toledo" }, fechas: [cumple(14, 3, 1990), { tipo: "aniversario", etiqueta: "Boda", dia: 1, mes: 6 }] });
const bruno = persona("p2", "Bruno");
const abuelos = casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Sol" });

describe("Sprint 8: exportar", () => {
  test("T8.1 exportar produce un JSON con version, personas y casas iguales a los datos actuales (RF11, CU11)", async () => {
    const { servicio, compartidor, banco } = await preparar({ personas: [ana, bruno], casas: [abuelos] });
    const antes = banco.archivos();
    const resultado = await servicio.exportar();
    expect(resultado.ok).toBe(true);
    expect(compartidor.compartidos).toHaveLength(1);
    const { nombre, contenido } = compartidor.compartidos[0];
    expect(nombre).toBe(NOMBRE_EXPORTACION);
    expect(nombre).toBe("memory-export.json");
    const json = JSON.parse(contenido) as Exportacion;
    expect(json.version).toBe(1);
    expect(new Date(json.exportadoEn).toISOString()).toBe(json.exportadoEn);
    expect(json.personas).toEqual([ana, bruno]);
    expect(json.casas).toEqual([abuelos]);
    expect(Object.keys(json).sort()).toEqual(["casas", "exportadoEn", "personas", "version"]);
    // Exportar no modifica los datos.
    expect(banco.archivos()).toEqual(antes);
  });

  test("T8.2 exportar sin datos produce listas vacías y no falla", async () => {
    const { servicio, compartidor } = await preparar();
    expect((await servicio.exportar()).ok).toBe(true);
    expect(JSON.parse(compartidor.compartidos[0].contenido)).toMatchObject({ version: 1, personas: [], casas: [] });
  });

  test("T8.2b si no se puede crear el archivo, exportar devuelve un error (CU11)", async () => {
    const { servicio, compartidor } = await preparar({ personas: [ana] });
    compartidor.fallar = true;
    expect(await servicio.exportar()).toEqual({ ok: false, error: "No se pudo crear el archivo de exportación" });
  });

  test("CompartidorCapacitor escribe en la caché y abre el menú de compartir; cancelar no es un error", async () => {
    const fs = { writeFile: vi.fn(async (_o: Parameters<FilesystemPlugin["writeFile"]>[0]) => ({ uri: "file:///cache/memory-export.json" })) };
    const share = { share: vi.fn(async (_o: ShareOptions) => ({})) };
    const compartidor = new CompartidorCapacitor(fs, share);
    await compartidor.compartir("memory-export.json", "{}");
    expect(fs.writeFile.mock.calls[0][0]).toMatchObject({ path: "memory-export.json", data: "{}", directory: "CACHE", encoding: "utf8" });
    expect(share.share.mock.calls[0][0]).toMatchObject({ files: ["file:///cache/memory-export.json"] });

    share.share.mockRejectedValueOnce(new Error("Share canceled"));
    await expect(compartidor.compartir("memory-export.json", "{}")).resolves.toBeUndefined();
    fs.writeFile.mockRejectedValueOnce(new Error("Disco lleno"));
    await expect(compartidor.compartir("memory-export.json", "{}")).rejects.toThrow("Disco lleno");
  });
});

describe("Sprint 8: importar", () => {
  test("T8.3 exportar y luego importar en una app vacía reproduce exactamente los mismos datos (RF12)", async () => {
    const origen = await preparar({ personas: [ana, bruno], casas: [abuelos] });
    await origen.servicio.exportar();
    const destino = await preparar();
    const resultado = await destino.servicio.importar(origen.compartidor.compartidos[0].contenido);
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 2, personasOmitidas: 0, casasAnadidas: 1, casasOmitidas: 0 } });
    expect(destino.leer("personas.json")).toEqual([ana, bruno]);
    expect(destino.leer("casas.json")).toEqual([abuelos]);
    expect(destino.tienda.datos.personas).toEqual([ana, bruno]);
    expect(destino.tienda.datos.casas).toEqual([abuelos]);
  });

  test("T8.4 importar el mismo archivo dos veces no duplica nada: la segunda vez todo se omite (R11)", async () => {
    const { servicio, leer } = await preparar();
    const texto = archivo([ana, bruno], [abuelos]);
    await servicio.importar(texto);
    const segunda = await servicio.importar(texto);
    expect(segunda).toEqual({ ok: true, valor: { personasAnadidas: 0, personasOmitidas: 2, casasAnadidas: 0, casasOmitidas: 1 } });
    expect(leer("personas.json")).toEqual([ana, bruno]);
    expect(leer("casas.json")).toEqual([abuelos]);
  });

  test("T8.5 importar nunca modifica una persona o casa existente con el mismo id (R11)", async () => {
    const { servicio, leer } = await preparar({ personas: [ana, bruno], casas: [abuelos] });
    const otraAna = persona("p1", "Otra persona", { apodo: "X", fechas: [cumple(2, 2)] });
    const otraCasa = casa("c1", "Otro apodo", ["p2"], { calle: "Luna" });
    const resultado = await servicio.importar(archivo([otraAna], [otraCasa]));
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 0, personasOmitidas: 1, casasAnadidas: 0, casasOmitidas: 1 } });
    expect(leer("personas.json")).toEqual([ana, bruno]);
    expect(leer("casas.json")).toEqual([abuelos]);
  });

  test("T8.5b una persona con distinto id y el mismo nombre (sin mayúsculas ni acentos) se omite (RF12)", async () => {
    const { servicio, leer } = await preparar({ personas: [persona("p1", "José Pérez")] });
    const resultado = await servicio.importar(archivo([persona("x1", "  jose perez "), persona("x2", "JOSÉ PÉREZ", { apodo: "Pepe" })]));
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 0, personasOmitidas: 2, casasAnadidas: 0, casasOmitidas: 0 } });
    expect(leer("personas.json")).toEqual([persona("p1", "José Pérez")]);
  });

  test("T8.5c una casa con distinto id y el mismo apodo que una existente se omite", async () => {
    const { servicio, leer } = await preparar({ personas: [ana, bruno], casas: [abuelos] });
    const resultado = await servicio.importar(archivo([], [casa("x9", "CASA DE LOS ÁBUELOS", ["p2"])]));
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 0, personasOmitidas: 0, casasAnadidas: 0, casasOmitidas: 1 } });
    expect(leer("casas.json")).toEqual([abuelos]);
  });

  test("T8.5d una casa nueva cuyo miembro es una persona duplicada se importa apuntando a la persona existente", async () => {
    const { servicio, leer } = await preparar({ personas: [ana] });
    const anaDelArchivo = persona("x1", "ana garcia");
    const carla = persona("x2", "Carla");
    const resultado = await servicio.importar(archivo([anaDelArchivo, carla], [casa("c7", "Piso de la playa", ["x1", "x2"])]));
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 1, personasOmitidas: 1, casasAnadidas: 1, casasOmitidas: 0 } });
    expect(leer("personas.json")).toEqual([ana, carla]);
    expect(leer("casas.json")).toEqual([casa("c7", "Piso de la playa", ["p1", "x2"])]);
  });

  test("T8.6 importar añade las personas nuevas y conserva las existentes (RF12)", async () => {
    const { servicio, leer } = await preparar({ personas: [ana] });
    const carla = persona("p3", "Carla", { fechas: [cumple(9, 9)] });
    const resultado = await servicio.importar(archivo([ana, carla]));
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 1, personasOmitidas: 1, casasAnadidas: 0, casasOmitidas: 0 } });
    expect(leer("personas.json")).toEqual([ana, carla]);
  });

  test("T8.7 una casa con un miembro que no existe ni en la app ni en el archivo se omite; las demás se importan (RNF10)", async () => {
    const { servicio, leer } = await preparar({ personas: [bruno] });
    const resultado = await servicio.importar(
      archivo([ana], [casa("c1", "Rota", ["p1", "fantasma"]), casa("c2", "Con Bruno", ["p2"]), casa("c3", "Con Ana y Bruno", ["p1", "p2"])]),
    );
    expect(resultado).toEqual({ ok: true, valor: { personasAnadidas: 1, personasOmitidas: 0, casasAnadidas: 2, casasOmitidas: 1 } });
    expect(leer("casas.json")).toEqual([casa("c2", "Con Bruno", ["p2"]), casa("c3", "Con Ana y Bruno", ["p1", "p2"])]);
    const ids = new Set(leer("personas.json").map((p: Persona) => p.id));
    for (const c of leer("casas.json") as Casa[]) for (const id of c.personas) expect(ids.has(id)).toBe(true);
  });

  test.each([
    ["no es JSON", "{ esto no es json"],
    ["no es un objeto", "[]"],
    ["sin version", JSON.stringify({ personas: [], casas: [] })],
    ["otra version", archivo([], [], { version: 2 })],
    ["personas no es una lista", JSON.stringify({ version: 1, personas: {}, casas: [] })],
    ["sin casas", JSON.stringify({ version: 1, personas: [] })],
    ["una persona sin nombre", archivo([persona("x1", "Carla"), { ...persona("x2", ""), nombre: "" }])],
    ["una fecha imposible", archivo([persona("x1", "Carla", { fechas: [cumple(31, 2)] })])],
    ["una casa vacía", archivo([persona("x1", "Carla")], [casa("c9", "Vacía", [])])],
    ["una casa sin dirección", archivo([persona("x1", "Carla")], [{ id: "c9", apodo: "Sin dirección", personas: ["x1"] }])],
  ])("T8.8 un archivo inválido (%s) se rechaza y no cambia ningún dato", async (_caso, texto) => {
    const { servicio, banco, tienda } = await preparar({ personas: [ana, bruno], casas: [abuelos] });
    const antes = banco.archivos();
    const datosAntes = tienda.datos;
    const resultado = await servicio.importar(texto);
    expect(resultado.ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos).toBe(datosAntes);
  });

  test("T8.9 si falla el guardado durante la importación, no se añade nada (RNF8, RNF9)", async () => {
    const { servicio, banco, tienda } = await preparar({ personas: [bruno] });
    const antes = banco.archivos();
    const datosAntes = tienda.datos;
    // Falla el segundo archivo: el primero ya confirmado se restaura.
    banco.fallarConfirmar("casas.json");
    const resultado = await servicio.importar(archivo([ana], [casa("c2", "Con Ana", ["p1"])]));
    expect(resultado.ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos).toBe(datosAntes);
  });

  test("T8.10 el resumen cuenta personas y casas añadidas y omitidas (CU12)", async () => {
    const { servicio } = await preparar({ personas: [bruno], casas: [casa("c1", "Casa Bruno", ["p2"])] });
    const resultado = await servicio.importar(archivo([ana, bruno, persona("p3", "Carla")], [casa("c1", "Casa Bruno", ["p2"]), casa("c2", "Nueva", ["p1", "p3"])]));
    expect(resultado.ok && resultado.valor).toEqual({ personasAnadidas: 2, personasOmitidas: 1, casasAnadidas: 1, casasOmitidas: 1 });
    expect(resultado.ok && textoResumen(resultado.valor)).toBe("Personas: 2 añadidas, 1 omitidas. Casas: 1 añadidas, 1 omitidas.");
  });

  test("los campos que no son del modelo no se importan", async () => {
    const { servicio, leer } = await preparar();
    await servicio.importar(archivo([{ ...persona("x1", "Carla"), secreto: "no" }]));
    expect(leer("personas.json")).toEqual([persona("x1", "Carla")]);
  });
});
