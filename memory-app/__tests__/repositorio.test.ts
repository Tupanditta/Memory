// Sprint 2: repositorio de JSON (T2.1 a T2.8). T2.8: los tests T2.1 a T2.7 se
// ejecutan sobre las dos implementaciones de `Almacen`.
import { describe, expect, test } from "vitest";
import { direccionVacia, type Casa, type Persona } from "../src/modelos/tipos";
import { AlmacenLocalStorage } from "../src/repositorio/almacenLocalStorage";
import { crearAlmacen, Repositorio, type Datos } from "../src/repositorio/repositorio";
import { bancoArchivos, bancoLocalStorage, type Banco } from "./simulados/almacenes";

const persona = (id: string, nombre: string, cambios: Partial<Persona> = {}): Persona => ({
  id,
  nombre,
  apodo: "",
  direccion: direccionVacia(),
  fechas: [],
  ...cambios,
});

const casa = (id: string, apodo: string, personas: string[]): Casa => ({ id, apodo, direccion: direccionVacia(), personas });

const json = (valor: unknown) => JSON.stringify(valor, null, 2);

const datosEjemplo = (): Datos => ({
  personas: [
    persona("p1", "Ana García", {
      apodo: "Anita",
      direccion: { ...direccionVacia(), calle: "Calle Mayor", numero: "3", portal: "B", piso: "2", puerta: "A", ciudad: "Madrid" },
      fechas: [
        { tipo: "cumpleaños", etiqueta: "", dia: 1, mes: 1, anio: 1990 },
        { tipo: "aniversario", etiqueta: "Boda", dia: 29, mes: 2 },
      ],
    }),
    persona("p2", "José Pérez"),
  ],
  casas: [casa("c1", "Casa de los abuelos", ["p1", "p2"])],
  ajustes: { horaNotificacion: "20:30" },
});

/** Pone en "disco" los tres archivos con los datos indicados. */
function ponerDatos(banco: Banco, datos: Datos) {
  banco.poner("personas.json", json(datos.personas));
  banco.poner("casas.json", json(datos.casas));
  banco.poner("ajustes.json", json(datos.ajustes));
}

const sinTmp = (banco: Banco) => Object.keys(banco.archivos()).filter((n) => n.endsWith(".tmp"));

describe.each([
  ["AlmacenArchivos (@capacitor/filesystem)", bancoArchivos],
  ["AlmacenLocalStorage (vista previa web)", bancoLocalStorage],
])("Sprint 2: repositorio con %s (T2.8)", (_nombre, crearBanco) => {
  test("T2.1 con archivos inexistentes, la carga devuelve [], [] y ajustes por defecto, y los crea (RNF2)", async () => {
    const banco = crearBanco();
    const resultado = await new Repositorio(banco.almacen).iniciar();
    expect(resultado).toEqual({ ok: true, valor: { personas: [], casas: [], ajustes: { horaNotificacion: "09:00" } } });
    const archivos = banco.archivos();
    expect(JSON.parse(archivos["personas.json"])).toEqual([]);
    expect(JSON.parse(archivos["casas.json"])).toEqual([]);
    expect(JSON.parse(archivos["ajustes.json"])).toEqual({ horaNotificacion: "09:00" });
    expect(sinTmp(banco)).toEqual([]);
  });

  test("T2.1 si solo falta un archivo, crea ese y conserva los demás", async () => {
    const banco = crearBanco();
    const datos = datosEjemplo();
    banco.poner("personas.json", json(datos.personas));
    const resultado = await new Repositorio(banco.almacen).iniciar();
    expect(resultado.ok && resultado.valor.personas).toEqual(datos.personas);
    expect(banco.archivos()["personas.json"]).toBe(json(datos.personas));
    expect(JSON.parse(banco.archivos()["casas.json"])).toEqual([]);
  });

  test("T2.2 guardar y volver a cargar devuelve los mismos datos (RNF7)", async () => {
    const banco = crearBanco();
    const repo = new Repositorio(banco.almacen);
    await repo.iniciar();
    const datos = datosEjemplo();
    expect(await repo.guardar(datos)).toEqual({ ok: true, valor: undefined });
    // Otra instancia sobre el mismo almacenamiento = reabrir la app.
    expect(await new Repositorio(banco.almacen).iniciar()).toEqual({ ok: true, valor: datos });
    expect(sinTmp(banco)).toEqual([]);
  });

  test("T2.2 guardar un solo archivo no toca los demás", async () => {
    const banco = crearBanco();
    ponerDatos(banco, datosEjemplo());
    const antes = banco.archivos();
    const repo = new Repositorio(banco.almacen);
    expect((await repo.guardar({ ajustes: { horaNotificacion: "07:00" } })).ok).toBe(true);
    const despues = banco.archivos();
    expect(despues["personas.json"]).toBe(antes["personas.json"]);
    expect(despues["casas.json"]).toBe(antes["casas.json"]);
    expect(JSON.parse(despues["ajustes.json"])).toEqual({ horaNotificacion: "07:00" });
  });

  test("T2.3 si falla la escritura de un .tmp, el archivo original no cambia y la operación devuelve error (RNF9)", async () => {
    const banco = crearBanco();
    ponerDatos(banco, datosEjemplo());
    const antes = banco.archivos();
    banco.fallarEscrituraTmp("personas.json");
    const resultado = await new Repositorio(banco.almacen).guardar({ personas: [persona("p9", "Otra")] });
    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && resultado.error).toMatch(/guardar/);
    expect(banco.archivos()).toEqual(antes);
  });

  test("T2.3 en una operación doble, si falla el .tmp del segundo archivo ninguno cambia (RNF8)", async () => {
    const banco = crearBanco();
    ponerDatos(banco, datosEjemplo());
    const antes = banco.archivos();
    banco.fallarEscrituraTmp("casas.json");
    const resultado = await new Repositorio(banco.almacen).guardar({ personas: [persona("p9", "Otra")], casas: [] });
    expect(resultado.ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
  });

  test("T2.4 si falla el renombrado del segundo archivo en una operación doble, ninguno de los dos queda modificado (RNF8)", async () => {
    const banco = crearBanco();
    ponerDatos(banco, datosEjemplo());
    const antes = banco.archivos();
    banco.fallarConfirmar("casas.json");
    const resultado = await new Repositorio(banco.almacen).guardar({ personas: [persona("p1", "Ana García")], casas: [] });
    expect(resultado.ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
    expect(await new Repositorio(banco.almacen).iniciar()).toEqual({ ok: true, valor: datosEjemplo() });
  });

  test("T2.4 si el primer archivo no existía y falla el segundo renombrado, el primero no se queda creado", async () => {
    const banco = crearBanco();
    banco.poner("casas.json", "[]");
    banco.fallarConfirmar("casas.json");
    const resultado = await new Repositorio(banco.almacen).guardar({ personas: [persona("p1", "Ana")], casas: [] });
    expect(resultado.ok).toBe(false);
    expect(banco.archivos()).toEqual({ "casas.json": "[]" });
  });

  test("T2.5 un .tmp huérfano al arrancar se descarta y no afecta a los datos", async () => {
    const banco = crearBanco();
    const datos = datosEjemplo();
    ponerDatos(banco, datos);
    banco.poner("personas.json.tmp", json([persona("px", "A medio guardar")]));
    banco.poner("casas.json.tmp", "{ roto");
    const resultado = await new Repositorio(banco.almacen).iniciar();
    expect(resultado).toEqual({ ok: true, valor: datos });
    expect(sinTmp(banco)).toEqual([]);
    expect(banco.archivos()["personas.json"]).toBe(json(datos.personas));
  });

  test("T2.6 una casa con un id inexistente lo pierde al cargar; si queda vacía, se descarta (RNF10, R8)", async () => {
    const banco = crearBanco();
    const datos = datosEjemplo();
    ponerDatos(banco, {
      ...datos,
      casas: [casa("c1", "Casa de los abuelos", ["p1", "p-borrada", "p2"]), casa("c2", "Piso de estudiantes", ["p-borrada"])],
    });
    const resultado = await new Repositorio(banco.almacen).iniciar();
    expect(resultado.ok && resultado.valor.casas).toEqual([casa("c1", "Casa de los abuelos", ["p1", "p2"])]);
    expect(resultado.ok && resultado.valor.personas).toEqual(datos.personas);
  });

  test("T2.7 un JSON corrupto produce un error claro y no sobrescribe el archivo", async () => {
    const banco = crearBanco();
    banco.poner("personas.json", '[{"id": "p1", "nombre": ');
    const resultado = await new Repositorio(banco.almacen).iniciar();
    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && resultado.error).toBe("El archivo personas.json está dañado: no es un JSON válido");
    // No sobrescribe el dañado ni crea los que faltan.
    expect(banco.archivos()).toEqual({ "personas.json": '[{"id": "p1", "nombre": ' });
  });

  test("T2.7 un JSON con forma incorrecta también es un error y no escribe nada", async () => {
    for (const [nombre, contenido] of [
      ["personas.json", '{"id": "p1"}'],
      ["personas.json", json([{ id: "p1", nombre: "" }])],
      ["casas.json", json([casa("c1", "Vacía", [])])],
      ["ajustes.json", json({ horaNotificacion: "25:00" })],
    ]) {
      const banco = crearBanco();
      banco.poner(nombre, contenido);
      const resultado = await new Repositorio(banco.almacen).iniciar();
      expect(resultado.ok).toBe(false);
      expect(!resultado.ok && resultado.error).toMatch(new RegExp(`^El archivo ${nombre.replace(".", "\\.")} está dañado: `));
      expect(banco.archivos()).toEqual({ [nombre]: contenido });
    }
  });
});

describe("Sprint 2: elección del almacén", () => {
  test("en la vista previa web (no nativa) se usa localStorage", () => {
    expect(crearAlmacen()).toBeInstanceOf(AlmacenLocalStorage);
  });
});
