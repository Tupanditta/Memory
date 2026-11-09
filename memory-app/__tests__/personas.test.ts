// Sprint 3: servicio de personas (T3.1 a T3.11), sobre el repositorio real con
// un sistema de archivos simulado en memoria.
import { describe, expect, test, vi } from "vitest";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../src/modelos/tipos";
import { Repositorio, type Datos } from "../src/repositorio/repositorio";
import { PersonasService } from "../src/servicios/personasService";
import { Tienda } from "../src/servicios/tienda";
import { bancoArchivos } from "./simulados/almacenes";

const persona = (id: string, nombre: string, cambios: Partial<Persona> = {}): Persona => ({
  id,
  nombre,
  apodo: "",
  direccion: direccionVacia(),
  fechas: [],
  ...cambios,
});

const casa = (id: string, apodo: string, personas: string[], direccion: Partial<Direccion> = {}): Casa => ({
  id,
  apodo,
  direccion: { ...direccionVacia(), ...direccion },
  personas,
});

/** Prepara disco, repositorio, tienda y servicio con los datos indicados. */
async function preparar(datos: Partial<Datos> = {}) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(datos.personas ?? []));
  banco.poner("casas.json", JSON.stringify(datos.casas ?? []));
  banco.poner("ajustes.json", JSON.stringify(datos.ajustes ?? { horaNotificacion: "09:00" }));
  const repositorio = new Repositorio(banco.almacen);
  const inicio = await repositorio.iniciar();
  if (!inicio.ok) throw new Error(inicio.error);
  const tienda = new Tienda(repositorio, inicio.valor);
  const servicio = new PersonasService(tienda);
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, repositorio, tienda, servicio, leer };
}

describe("Sprint 3: servicio de personas", () => {
  test("T3.1 crear persona con solo nombre la guarda con un id único (CU1)", async () => {
    const { servicio, tienda, leer } = await preparar();
    const a = await servicio.crear({ nombre: "Ana" });
    const b = await servicio.crear({ nombre: "Ana" });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.valor.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a.valor.id).not.toBe(b.valor.id);
    expect(a.valor).toEqual({ id: a.valor.id, nombre: "Ana", apodo: "", direccion: direccionVacia(), fechas: [] });
    expect(leer("personas.json")).toEqual([a.valor, b.valor]);
    expect(tienda.datos.personas).toEqual([a.valor, b.valor]);
  });

  test("T3.2 crear persona inválida no escribe en el JSON (RNF9)", async () => {
    const { servicio, banco, repositorio } = await preparar({ personas: [persona("p1", "Ana")] });
    const guardar = vi.spyOn(repositorio, "guardar");
    const antes = banco.archivos();
    for (const datos of [{ nombre: "" }, { nombre: "   " }, { nombre: "Ana", fechas: [{ tipo: "cumpleaños" as const, etiqueta: "", dia: 31, mes: 2 }] }]) {
      const r = await servicio.crear(datos);
      expect(r.ok).toBe(false);
    }
    const r = await servicio.crear({ nombre: "" });
    expect(r).toEqual({ ok: false, error: "Escribe el nombre" });
    expect(guardar).not.toHaveBeenCalled();
    expect(banco.archivos()).toEqual(antes);
  });

  test("T3.3 editar cambia solo los campos indicados y se persiste (CU2)", async () => {
    const original = persona("p1", "Ana García", {
      apodo: "Anita",
      direccion: { ...direccionVacia(), calle: "Calle Mayor", numero: "3", ciudad: "Madrid" },
      fechas: [{ tipo: "cumpleaños", etiqueta: "", dia: 1, mes: 1, anio: 1990 }],
    });
    const otra = persona("p2", "José");
    const { servicio, leer, tienda } = await preparar({ personas: [original, otra] });
    const r = await servicio.editar("p1", { apodo: "Anuchi", direccion: { piso: "2" } });
    const esperada = { ...original, apodo: "Anuchi", direccion: { ...original.direccion, piso: "2" } };
    expect(r).toEqual({ ok: true, valor: esperada });
    expect(leer("personas.json")).toEqual([esperada, otra]);
    expect(tienda.datos.personas).toEqual([esperada, otra]);

    // Editar con nombre vacío se rechaza y no cambia nada.
    expect((await servicio.editar("p1", { nombre: " " })).ok).toBe(false);
    expect(leer("personas.json")).toEqual([esperada, otra]);
    expect((await servicio.editar("no-existe", { nombre: "X" })).ok).toBe(false);
  });

  test("T3.4 añadir una fecha válida se guarda en la persona; una inválida se rechaza (CU4)", async () => {
    const { servicio, leer, repositorio } = await preparar({ personas: [persona("p1", "Ana")] });
    const boda = { tipo: "aniversario" as const, etiqueta: "Boda", dia: 29, mes: 2 };
    const r = await servicio.anadirFecha("p1", boda);
    expect(r.ok).toBe(true);
    expect(leer("personas.json")[0].fechas).toEqual([boda]);

    const guardar = vi.spyOn(repositorio, "guardar");
    expect((await servicio.anadirFecha("p1", { tipo: "cumpleaños", etiqueta: "", dia: 31, mes: 2 })).ok).toBe(false);
    expect((await servicio.anadirFecha("p1", { tipo: "cumpleaños", etiqueta: "", dia: 29, mes: 2, anio: 2023 })).ok).toBe(false);
    expect((await servicio.editarFecha("p1", 0, { ...boda, mes: 13 })).ok).toBe(false);
    expect(guardar).not.toHaveBeenCalled();
    expect(leer("personas.json")[0].fechas).toEqual([boda]);

    // Editar y borrar fechas.
    const cumple = { tipo: "cumpleaños" as const, etiqueta: "", dia: 14, mes: 3, anio: 1990 };
    await servicio.anadirFecha("p1", cumple);
    expect((await servicio.editarFecha("p1", 0, { ...boda, dia: 28 })).ok).toBe(true);
    expect(leer("personas.json")[0].fechas).toEqual([{ ...boda, dia: 28 }, cumple]);
    expect((await servicio.borrarFecha("p1", 0)).ok).toBe(true);
    expect(leer("personas.json")[0].fechas).toEqual([cumple]);
    expect((await servicio.borrarFecha("p1", 5)).ok).toBe(false);
  });

  test("T3.5 borrar una persona que está en dos casas la quita de ambas, en una sola operación (RNF8)", async () => {
    const { servicio, leer, repositorio, tienda } = await preparar({
      personas: [persona("p1", "Ana"), persona("p2", "José"), persona("p3", "Luis")],
      casas: [casa("c1", "Casa A", ["p1", "p2"]), casa("c2", "Casa B", ["p3", "p1"])],
    });
    const guardar = vi.spyOn(repositorio, "guardar");
    const r = await servicio.borrar("p1");
    expect(r.ok).toBe(true);
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(Object.keys(guardar.mock.calls[0][0]).sort()).toEqual(["casas", "personas"]);
    expect(leer("personas.json").map((p: Persona) => p.id)).toEqual(["p2", "p3"]);
    expect(leer("casas.json")).toEqual([casa("c1", "Casa A", ["p2"]), casa("c2", "Casa B", ["p3"])]);
    expect(tienda.datos.casas).toEqual(leer("casas.json"));
  });

  test("T3.5 si falla el guardado de las casas al borrar, ninguno de los dos archivos cambia (RNF8)", async () => {
    const { servicio, banco, tienda } = await preparar({
      personas: [persona("p1", "Ana"), persona("p2", "José")],
      casas: [casa("c1", "Casa A", ["p1", "p2"])],
    });
    const antes = banco.archivos();
    const estado = tienda.datos;
    banco.fallarConfirmar("casas.json");
    expect((await servicio.borrar("p1")).ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos).toBe(estado);
  });

  test("T3.6 borrar la única persona de una casa borra también la casa (RF7b)", async () => {
    const { servicio, leer } = await preparar({
      personas: [persona("p1", "Ana"), persona("p2", "José")],
      casas: [casa("c1", "Piso de Ana", ["p1"]), casa("c2", "Casa compartida", ["p1", "p2"])],
    });
    expect(servicio.casasQueSeBorrarian("p1").map((c) => c.id)).toEqual(["c1"]);
    expect((await servicio.borrar("p1")).ok).toBe(true);
    expect(leer("casas.json")).toEqual([casa("c2", "Casa compartida", ["p2"])]);
  });

  test("T3.7 si el guardado falla, el servicio devuelve error y el estado no cambia (RNF9)", async () => {
    const { servicio, banco, tienda } = await preparar({ personas: [persona("p1", "Ana")] });
    const antes = banco.archivos();
    const estado = tienda.datos;
    const operaciones = [
      () => servicio.crear({ nombre: "José" }),
      () => servicio.editar("p1", { nombre: "Ana María" }),
      () => servicio.anadirFecha("p1", { tipo: "cumpleaños", etiqueta: "", dia: 1, mes: 1 }),
      () => servicio.borrar("p1"),
    ];
    for (const operacion of operaciones) {
      banco.fallarEscrituraTmp("personas.json");
      const r = await operacion();
      expect(r).toEqual({ ok: false, error: "No se pudieron guardar los cambios" });
      expect(tienda.datos).toBe(estado);
      expect(banco.archivos()).toEqual(antes);
    }
    expect(servicio.buscar("")).toEqual([persona("p1", "Ana")]);
  });

  test("T3.8 buscar 'jose' encuentra 'José' y 'JOSÉ'; sin coincidencias devuelve lista vacía (RF4, RNF3)", async () => {
    const { servicio } = await preparar({ personas: [persona("p1", "José"), persona("p2", "JOSÉ LUIS"), persona("p3", "Ana")] });
    expect(servicio.buscar("jose").map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(servicio.buscar("JOSÉ").map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(servicio.buscar("zzz")).toEqual([]);
    expect(servicio.buscar("  ").map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  test("T3.9 buscar por calle, portal, ciudad, notas o etiqueta de fecha encuentra a la persona (RF4)", async () => {
    const ana = persona("p1", "Ana", {
      apodo: "Anita",
      direccion: { ...direccionVacia(), calle: "Calle Mayor", portal: "Portal Bé", ciudad: "Cádiz", notas: "Timbre roto" },
      fechas: [{ tipo: "aniversario", etiqueta: "Boda de plata", dia: 3, mes: 5 }],
    });
    const { servicio } = await preparar({ personas: [ana, persona("p2", "José")] });
    for (const consulta of ["mayor", "portal be", "cadiz", "timbre", "boda", "plata", "aniversario", "anita"]) {
      expect(servicio.buscar(consulta).map((p) => p.id), consulta).toEqual(["p1"]);
    }
  });

  test("T3.10 buscar por el apodo o la dirección de una casa encuentra a sus miembros (RF4)", async () => {
    const { servicio } = await preparar({
      personas: [persona("p1", "Ana"), persona("p2", "José"), persona("p3", "Luis")],
      casas: [casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Avenida del Sol", ciudad: "Málaga" })],
    });
    expect(servicio.buscar("abuelos").map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(servicio.buscar("avenida sol").map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(servicio.buscar("malaga").map((p) => p.id)).toEqual(["p1", "p2"]);
    // El nombre de un conviviente no basta para encontrar a la persona (design.md, "Búsqueda").
    expect(servicio.buscar("jose").map((p) => p.id)).toEqual(["p2"]);
  });

  test("T3.11 con varias palabras solo salen resultados que cumplen todas, en cualquier orden", async () => {
    const { servicio } = await preparar({
      personas: [
        persona("p1", "María López", { direccion: { ...direccionVacia(), calle: "Calle Mayor" } }),
        persona("p2", "María Ruiz", { direccion: { ...direccionVacia(), calle: "Calle Menor" } }),
        persona("p3", "Pedro", { direccion: { ...direccionVacia(), calle: "Calle Mayor" } }),
      ],
    });
    expect(servicio.buscar("maria calle mayor").map((p) => p.id)).toEqual(["p1"]);
    expect(servicio.buscar("mayor MARÍA calle").map((p) => p.id)).toEqual(["p1"]);
    expect(servicio.buscar("maria pedro")).toEqual([]);
  });
});
