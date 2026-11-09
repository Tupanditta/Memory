// Sprint 4: servicio de casas (T4.1 a T4.9), sobre el repositorio real con
// un sistema de archivos simulado en memoria.
import { describe, expect, test, vi } from "vitest";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../src/modelos/tipos";
import { Repositorio, type Datos } from "../src/repositorio/repositorio";
import { CasasService } from "../src/servicios/casasService";
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

const ana = persona("p1", "Ana García");
const jose = persona("p2", "José Pérez");
const luis = persona("p3", "Luis Martín");

/** Prepara disco, repositorio, tienda y servicio con los datos indicados. */
async function preparar(datos: Partial<Datos> = {}) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(datos.personas ?? [ana, jose, luis]));
  banco.poner("casas.json", JSON.stringify(datos.casas ?? []));
  banco.poner("ajustes.json", JSON.stringify(datos.ajustes ?? { horaNotificacion: "09:00" }));
  const repositorio = new Repositorio(banco.almacen);
  const inicio = await repositorio.iniciar();
  if (!inicio.ok) throw new Error(inicio.error);
  const tienda = new Tienda(repositorio, inicio.valor);
  const servicio = new CasasService(tienda);
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, repositorio, tienda, servicio, leer };
}

describe("Sprint 4: servicio de casas", () => {
  test("T4.1 crear casa con apodo y dos personas la guarda con los dos ids (RF5, CU7)", async () => {
    const { servicio, tienda, leer } = await preparar();
    const r = await servicio.crear({ apodo: "  Casa de los abuelos ", direccion: { calle: "Calle Mayor" }, personas: ["p1", "p2"] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor).toEqual({
      id: r.valor.id,
      apodo: "Casa de los abuelos",
      direccion: { ...direccionVacia(), calle: "Calle Mayor" },
      personas: ["p1", "p2"],
    });
    expect(leer("casas.json")).toEqual([r.valor]);
    expect(tienda.datos.casas).toEqual([r.valor]);
  });

  test("T4.2 crear casa sin personas se rechaza y no escribe (R8, RNF9)", async () => {
    const { servicio, banco, repositorio, tienda } = await preparar();
    const guardar = vi.spyOn(repositorio, "guardar");
    const antes = banco.archivos();
    const r = await servicio.crear({ apodo: "Vacía", personas: [] });
    expect(r).toEqual({ ok: false, error: "Elige al menos una persona" });
    expect(guardar).not.toHaveBeenCalled();
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos.casas).toEqual([]);
  });

  test("T4.3 crear casa con un id de persona inexistente se rechaza (RNF10)", async () => {
    const { servicio, banco, repositorio } = await preparar();
    const guardar = vi.spyOn(repositorio, "guardar");
    const antes = banco.archivos();
    const r = await servicio.crear({ apodo: "Casa", personas: ["p1", "no-existe"] });
    expect(r).toEqual({ ok: false, error: "Alguna persona de la casa no existe" });
    expect(guardar).not.toHaveBeenCalled();
    expect(banco.archivos()).toEqual(antes);
  });

  test("T4.4 la misma persona puede estar en dos casas distintas (RF5)", async () => {
    const { servicio, leer } = await preparar();
    const a = await servicio.crear({ apodo: "Casa de los abuelos", personas: ["p1", "p2"] });
    const b = await servicio.crear({ apodo: "Piso de la playa", personas: ["p1"] });
    expect(a.ok && b.ok).toBe(true);
    const c = await servicio.crear({ apodo: "Oficina", personas: ["p3"] });
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    const anadir = await servicio.anadirPersona(c.valor.id, "p1");
    expect(anadir.ok).toBe(true);
    const casas: Casa[] = leer("casas.json");
    expect(casas.filter((x) => x.personas.includes("p1"))).toHaveLength(3);
    expect(casas.find((x) => x.id === c.valor.id)?.personas).toEqual(["p3", "p1"]);
  });

  test("T4.5 quitar a una persona de una casa con más miembros la deja con el resto", async () => {
    const { servicio, leer, tienda } = await preparar({ casas: [casa("c1", "Casa", ["p1", "p2", "p3"])] });
    const r = await servicio.quitarPersona("c1", "p2");
    expect(r).toEqual({ ok: true, valor: casa("c1", "Casa", ["p1", "p3"]) });
    expect(leer("casas.json")).toEqual([casa("c1", "Casa", ["p1", "p3"])]);
    expect(tienda.datos.casas).toEqual([casa("c1", "Casa", ["p1", "p3"])]);
  });

  test("T4.6 quitar a la última persona devuelve la señal de confirmación y no modifica nada (RF7b)", async () => {
    const inicial = [casa("c1", "Casa sola", ["p1"]), casa("c2", "Otra", ["p2"])];
    const { servicio, banco, repositorio, tienda } = await preparar({ casas: inicial });
    const guardar = vi.spyOn(repositorio, "guardar");
    const antes = banco.archivos();
    const r = await servicio.quitarPersona("c1", "p1");
    expect(r.ok).toBe(false);
    expect(r).toMatchObject({ requiereConfirmacion: true });
    expect(guardar).not.toHaveBeenCalled();
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos.casas).toEqual(inicial);
  });

  test("T4.7 confirmar el borrado elimina la casa; cancelar la mantiene intacta", async () => {
    const inicial = [casa("c1", "Casa sola", ["p1"]), casa("c2", "Otra", ["p2"])];
    // Cancelar: no se vuelve a llamar con confirmación; todo sigue igual.
    const cancelado = await preparar({ casas: inicial });
    const antes = cancelado.banco.archivos();
    const r1 = await cancelado.servicio.quitarPersona("c1", "p1");
    expect(r1).toMatchObject({ ok: false, requiereConfirmacion: true });
    expect(cancelado.banco.archivos()).toEqual(antes);
    expect(cancelado.tienda.datos.casas).toEqual(inicial);
    // Confirmar: la casa se borra y las demás quedan.
    const confirmado = await preparar({ casas: inicial });
    const r2 = await confirmado.servicio.quitarPersona("c1", "p1", true);
    expect(r2).toEqual({ ok: true, valor: null });
    expect(confirmado.leer("casas.json")).toEqual([inicial[1]]);
    expect(confirmado.tienda.datos.casas).toEqual([inicial[1]]);
    // La persona sigue existiendo.
    expect(confirmado.leer("personas.json")).toEqual([ana, jose, luis]);
  });

  test("T4.8 buscar por apodo, nombre de un miembro o calle encuentra la casa (RF6, CU9)", async () => {
    const abuelos = casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Calle Mayor", ciudad: "Ávila" });
    const playa = casa("c2", "Piso de la playa", ["p3"], { calle: "Paseo Marítimo" });
    const { servicio } = await preparar({ casas: [abuelos, playa] });
    expect(servicio.buscar("abuelos")).toEqual([abuelos]);
    expect(servicio.buscar("ABUELOS")).toEqual([abuelos]);
    expect(servicio.buscar("jose")).toEqual([abuelos]);
    expect(servicio.buscar("mayor")).toEqual([abuelos]);
    expect(servicio.buscar("avila")).toEqual([abuelos]);
    expect(servicio.buscar("luis maritimo")).toEqual([playa]);
    expect(servicio.buscar("luis mayor")).toEqual([]);
    expect(servicio.buscar("")).toEqual([abuelos, playa]);
  });

  test("T4.9 casasDePersona devuelve todas sus casas con dirección y convivientes (RF7)", async () => {
    const abuelos = casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Calle Mayor" });
    const playa = casa("c2", "Piso de la playa", ["p3", "p1"], { calle: "Paseo Marítimo" });
    const oficina = casa("c3", "Oficina", ["p2", "p3"]);
    const { servicio } = await preparar({ casas: [abuelos, playa, oficina] });
    expect(servicio.casasDePersona("p1")).toEqual([
      { casa: abuelos, convivientes: [jose] },
      { casa: playa, convivientes: [luis] },
    ]);
    expect(servicio.casasDePersona("p1")[0].casa.direccion.calle).toBe("Calle Mayor");
    expect(servicio.miembros("c3")).toEqual([jose, luis]);
    expect(servicio.casasDePersona("no-existe")).toEqual([]);
  });

  test("editar cambia solo los campos indicados y rechaza dejarla sin personas o con ids inexistentes (CU8, R8, RNF10)", async () => {
    const original = casa("c1", "Casa", ["p1"], { calle: "Calle Mayor", ciudad: "Madrid" });
    const { servicio, leer, banco } = await preparar({ casas: [original] });
    const r = await servicio.editar("c1", { apodo: "Casa nueva", direccion: { numero: "5" }, personas: ["p1", "p2"] });
    const esperada = { ...original, apodo: "Casa nueva", direccion: { ...original.direccion, numero: "5" }, personas: ["p1", "p2"] };
    expect(r).toEqual({ ok: true, valor: esperada });
    expect(leer("casas.json")).toEqual([esperada]);
    const antes = banco.archivos();
    expect((await servicio.editar("c1", { personas: [] })).ok).toBe(false);
    expect((await servicio.editar("c1", { personas: ["p9"] })).ok).toBe(false);
    expect((await servicio.anadirPersona("c1", "p9")).ok).toBe(false);
    expect((await servicio.editar("c1", { apodo: "  " })).ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
  });

  test("borrar casa la elimina sin tocar personas; si el guardado falla no cambia nada (CU8, RNF9)", async () => {
    const inicial = [casa("c1", "Casa", ["p1"]), casa("c2", "Otra", ["p2"])];
    const { servicio, leer, banco, tienda } = await preparar({ casas: inicial });
    banco.fallarEscrituraTmp("casas.json");
    const antes = banco.archivos();
    const fallo = await servicio.borrar("c1");
    expect(fallo.ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos.casas).toEqual(inicial);
    const r = await servicio.borrar("c1");
    expect(r.ok).toBe(true);
    expect(leer("casas.json")).toEqual([inicial[1]]);
    expect(leer("personas.json")).toEqual([ana, jose, luis]);
  });

  test("si el guardado falla al crear o quitar, el servicio devuelve error y el estado no cambia (RNF9)", async () => {
    const inicial = [casa("c1", "Casa", ["p1", "p2"])];
    const { servicio, banco, tienda } = await preparar({ casas: inicial });
    const antes = banco.archivos();
    banco.fallarEscrituraTmp("casas.json");
    expect((await servicio.crear({ apodo: "Nueva", personas: ["p3"] })).ok).toBe(false);
    banco.fallarConfirmar("casas.json");
    expect((await servicio.quitarPersona("c1", "p2")).ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
    expect(tienda.datos.casas).toEqual(inicial);
  });
});
