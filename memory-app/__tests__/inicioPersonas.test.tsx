// Sprint 10: Inicio y personas (T10.1 a T10.13), con el repositorio real sobre archivos
// simulados en memoria y el módulo de notificaciones simulado.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";
import { rutas } from "../src/App";
import { ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Casa, type Direccion, type Fecha, type Persona } from "../src/modelos/tipos";
import { Repositorio } from "../src/repositorio/repositorio";
import { PersonasService } from "../src/servicios/personasService";
import { Tienda } from "../src/servicios/tienda";
import { elegirMes, opcionDePerfil, seccionInicio, tarjetaInicio, titulosInicio } from "./ayudas";
import { bancoArchivos } from "./simulados/almacenes";
import { NotificadorSimulado } from "./simulados/notificador";

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

const cumple = (dia: number, mes: number, anio?: number): Fecha => ({ tipo: "cumpleaños", etiqueta: "", dia, mes, ...(anio ? { anio } : {}) });

interface Opciones {
  personas?: Persona[];
  casas?: Casa[];
  ruta?: string;
  hora?: string;
  notificador?: NotificadorSimulado;
}

async function montar({ personas = [], casas = [], ruta = "/", hora = "09:00", notificador = new NotificadorSimulado() }: Opciones = {}) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(personas));
  banco.poner("casas.json", JSON.stringify(casas));
  banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: hora }));
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const usuario = userEvent.setup();
  render(
    <ProveedorApp almacen={banco.almacen} externos={{ notificador }}>
      <RouterProvider router={router} />
    </ProveedorApp>,
  );
  await screen.findByRole("heading", { level: 1 });
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, router, usuario, leer, notificador };
}

/** Servicio de personas sobre el repositorio real (pruebas sin interfaz). */
async function servicio(personas: Persona[], casas: Casa[]) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(personas));
  banco.poner("casas.json", JSON.stringify(casas));
  banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: "09:00" }));
  const repositorio = new Repositorio(banco.almacen);
  const inicio = await repositorio.iniciar();
  if (!inicio.ok) throw new Error(inicio.error);
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, repositorio, servicio: new PersonasService(new Tienda(repositorio, inicio.valor)), leer };
}

const filtro = (nombre: RegExp) => within(screen.getByRole("group", { name: "Filtros" })).getByRole("button", { name: nombre });
const textosFiltros = () => within(screen.getByRole("group", { name: "Filtros" })).getAllByRole("button").map((b) => b.textContent);
const chipCasa = (apodo: string) => within(screen.getByRole("group", { name: "Casas" })).getByRole("button", { name: apodo });

/** Hoy en las pruebas con fecha fija: martes 10 de marzo de 2026. */
const fijarHoy = () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 10, 12, 0));
};

afterEach(() => {
  vi.useRealTimers();
});

describe("Sprint 10: Inicio", () => {
  test("T10.1 los filtros muestran los recuentos de la búsqueda y filtran las secciones; una sección vacía se oculta (CU3)", async () => {
    const { usuario } = await montar({
      personas: [persona("p1", "Ana"), persona("p2", "Bruno")],
      casas: [casa("c1", "Casa de los abuelos", ["p1"])],
    });
    expect(textosFiltros()).toEqual(["Todos (3)", "Personas (2)", "Casas (1)"]);
    expect(filtro(/^Todos/)).toHaveAttribute("aria-pressed", "true");

    await usuario.click(filtro(/^Personas/));
    expect(filtro(/^Personas/)).toHaveAttribute("aria-pressed", "true");
    expect(filtro(/^Todos/)).toHaveAttribute("aria-pressed", "false");
    expect(titulosInicio("Personas")).toEqual(["Ana", "Bruno"]);
    expect(seccionInicio("Casas y lugares")).toBeNull();

    await usuario.click(filtro(/^Casas/));
    expect(seccionInicio("Personas")).toBeNull();
    expect(titulosInicio("Casas y lugares")).toEqual(["Casa de los abuelos"]);

    // Los recuentos son los del resultado de la búsqueda.
    await usuario.click(filtro(/^Todos/));
    const buscador = screen.getByRole("searchbox", { name: "Buscar" });
    await usuario.type(buscador, "bruno");
    expect(textosFiltros()).toEqual(["Todos (1)", "Personas (1)", "Casas (0)"]);
    expect(titulosInicio("Personas")).toEqual(["Bruno"]);
    expect(seccionInicio("Casas y lugares")).toBeNull();
    expect(screen.getByText("1 guardada")).toBeInTheDocument();

    await usuario.clear(buscador);
    await usuario.type(buscador, "abuelos");
    expect(textosFiltros()).toEqual(["Todos (2)", "Personas (1)", "Casas (1)"]);
    expect(screen.getByText("1 hogar")).toBeInTheDocument();

    // "Limpiar búsqueda" vacía el buscador y le devuelve el foco.
    await usuario.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(buscador).toHaveValue("");
    expect(buscador).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
    expect(textosFiltros()).toEqual(["Todos (3)", "Personas (2)", "Casas (1)"]);
    expect(screen.getByText("2 guardadas")).toBeInTheDocument();
  });

  test("T10.2 la tarjeta de persona muestra nombre, apodo, dirección, próxima fecha y casas; a 7 días o menos, chip de peligro y avatar destacado", async () => {
    fijarHoy();
    await montar({
      personas: [
        persona("p1", "Ana García", {
          apodo: "Anita",
          direccion: { ...direccionVacia(), calle: "Calle Alcalá", numero: "42", piso: "3º", puerta: "B", ciudad: "Madrid" },
          fechas: [{ tipo: "aniversario", etiqueta: "", dia: 28, mes: 4 }, cumple(14, 3)],
        }),
        persona("p2", "Bruno", { direccion: { ...direccionVacia(), ciudad: "Toledo" }, fechas: [cumple(2, 6)] }),
        persona("p3", "Carla", { fechas: [{ tipo: "aniversario", etiqueta: "Boda", dia: 28, mes: 4 }] }),
        persona("p4", "Dani", { fechas: [cumple(17, 3)] }),
      ],
      casas: [casa("c1", "Piso Centro", ["p1"]), casa("c2", "Casa de los abuelos", ["p1"]), casa("c3", "El Refugio", ["p1", "p2"])],
    });

    const ana = tarjetaInicio("Personas", "Ana García");
    expect(ana).toHaveAccessibleName("Ana García (Anita)");
    expect(ana).toHaveAttribute("href", "/persona/p1");
    expect(ana).toHaveTextContent("Calle Alcalá 42, 3ºB");
    const chipFecha = within(ana).getByText("En 4 días (14 Mar)");
    expect(chipFecha.closest("span.rounded-full")).toHaveClass("bg-error-container", "text-on-error-container");
    // Un chip por casa (máximo 2, por orden alfabético) y "+N" con el resto.
    expect(within(ana).getByText("Casa de los abuelos")).toBeInTheDocument();
    expect(within(ana).getByText("El Refugio")).toBeInTheDocument();
    expect(within(ana).queryByText("Piso Centro")).toBeNull();
    expect(within(ana).getByText("+1")).toBeInTheDocument();
    // Avatar destacado: degradado y estrella.
    expect(ana.querySelector(".bg-gradient-to-tr")).not.toBeNull();
    expect(within(ana).getByText("star")).toBeInTheDocument();

    const bruno = tarjetaInicio("Personas", "Bruno");
    expect(bruno).toHaveAccessibleName("Bruno");
    expect(bruno).toHaveTextContent("Toledo");
    expect(within(bruno).getByText("Cumpleaños (02 Jun)").closest("span.rounded-full")).toHaveClass("bg-surface-container", "text-primary");
    expect(within(bruno).getByText("El Refugio")).toBeInTheDocument();
    expect(bruno.querySelector(".bg-gradient-to-tr")).toBeNull();
    expect(within(bruno).queryByText("star")).toBeNull();

    // La etiqueta sustituye al tipo; a 7 días justos sigue siendo cercana.
    expect(within(tarjetaInicio("Personas", "Carla")).getByText("Boda (28 Abr)")).toBeInTheDocument();
    expect(within(tarjetaInicio("Personas", "Dani")).getByText("En 7 días (17 Mar)").closest("span.rounded-full")).toHaveClass("bg-error-container");
    // Sin dirección no hay línea de dirección.
    expect(within(tarjetaInicio("Personas", "Carla")).queryByText("location_on")).toBeNull();
  });

  test("T10.3 la tarjeta de casa muestra apodo, miembros, dirección y nombres según textoMiembros (CU9)", async () => {
    await montar({
      personas: [persona("p1", "Ana García"), persona("p2", "Pedro García"), persona("p3", "Carlos Ruiz"), persona("p4", "Marta López")],
      casas: [
        casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Calle Sol", numero: "5", ciudad: "Toledo" }),
        casa("c2", "El Refugio", ["p3", "p4", "p1"], { ciudad: "Cádiz" }),
        casa("c3", "Piso de Ana", ["p1"]),
      ],
    });
    expect(titulosInicio("Casas y lugares")).toEqual(["Casa de los abuelos", "El Refugio", "Piso de Ana"]);
    expect(screen.getByText("3 hogares")).toBeInTheDocument();

    const abuelos = tarjetaInicio("Casas y lugares", "Casa de los abuelos");
    expect(abuelos).toHaveAccessibleName("Casa de los abuelos");
    expect(abuelos).toHaveAttribute("href", "/casa/c1");
    expect(within(abuelos).getByText("2 miembros")).toBeInTheDocument();
    expect(within(abuelos).getByText("Calle Sol 5")).toBeInTheDocument();
    expect(within(abuelos).getByText("Ana García, Pedro García")).toBeInTheDocument();

    const refugio = tarjetaInicio("Casas y lugares", "El Refugio");
    expect(within(refugio).getByText("3 miembros")).toBeInTheDocument();
    expect(within(refugio).getByText("Cádiz")).toBeInTheDocument();
    expect(within(refugio).getByText("Carlos, Marta y 1 más")).toBeInTheDocument();
    expect(within(refugio).getByText("+1")).toBeInTheDocument();

    const piso = tarjetaInicio("Casas y lugares", "Piso de Ana");
    expect(within(piso).getByText("1 miembro")).toBeInTheDocument();
    expect(within(piso).queryByText("pin_drop")).toBeNull();
  });

  test("T10.4 sin resultados se lee 'Sin coincidencias'; con la app vacía, 'Todavía no hay nada guardado' (CU3)", async () => {
    const { usuario } = await montar({ personas: [persona("p1", "Ana")] });
    expect(screen.queryByText("Todavía no hay nada guardado")).toBeNull();
    await usuario.type(screen.getByRole("searchbox", { name: "Buscar" }), "zzz");
    expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
    expect(screen.getByText("No encontramos a nadie ni ninguna casa con ese término. Prueba con otro nombre.")).toBeInTheDocument();
    expect(seccionInicio("Personas")).toBeNull();
    expect(seccionInicio("Casas y lugares")).toBeNull();
    expect(textosFiltros()).toEqual(["Todos (0)", "Personas (0)", "Casas (0)"]);
  });

  test("T10.4b con la app vacía y sin búsqueda se lee 'Todavía no hay nada guardado'", async () => {
    const { usuario } = await montar();
    expect(screen.getByText("Todavía no hay nada guardado")).toBeInTheDocument();
    expect(screen.getByText("Añade una persona o una casa con los botones de arriba.")).toBeInTheDocument();
    expect(screen.queryByText("Sin coincidencias")).toBeNull();
    await usuario.type(screen.getByRole("searchbox", { name: "Buscar" }), "ana");
    expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
  });
});

describe("Sprint 10: detalle de persona", () => {
  test("T10.5 el detalle muestra dirección sin partes vacías, notas, fechas con edad y signo, la hora de aviso y sus casas (RF7)", async () => {
    fijarHoy();
    await montar({
      personas: [
        persona("p1", "Ana García", {
          apodo: "Anita",
          direccion: { ...direccionVacia(), calle: "Calle Alcalá", numero: "42", piso: "3º", puerta: "B", codigoPostal: "28014", ciudad: "Madrid", notas: "Llamar al móvil" },
          fechas: [cumple(14, 3, 1990), { tipo: "aniversario", etiqueta: "Boda", dia: 2, mes: 6, anio: 2015 }, cumple(9, 9)],
        }),
        persona("p2", "Pedro García"),
      ],
      casas: [casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Calle Sol", numero: "5" }), casa("c2", "Piso de Ana", ["p1"], { ciudad: "Soria" })],
      hora: "08:30",
      ruta: "/persona/p1",
    });

    expect(screen.getByRole("heading", { level: 1, name: "Detalle Persona" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Ana García" })).toBeInTheDocument();
    expect(screen.getByText("“Anita”")).toBeInTheDocument();

    const direccion = screen.getByRole("region", { name: "Dirección particular" });
    expect(within(direccion).getByText("Calle Alcalá 42")).toBeInTheDocument();
    // Sin portal: la línea solo tiene piso y puerta.
    expect(within(direccion).getByText("Piso 3º, Puerta B")).toBeInTheDocument();
    expect(within(direccion).getByText("28014 Madrid")).toBeInTheDocument();
    expect(within(direccion).getByText("Nota para visitas")).toBeInTheDocument();
    expect(within(direccion).getByText("Llamar al móvil")).toBeInTheDocument();
    expect(within(direccion).queryByText(/Portal/)).toBeNull();

    const fechas = within(screen.getByRole("region", { name: "Fechas memorables" })).getAllByRole("listitem").map((li) => li.textContent);
    // Edad hoy (10/03/2026) y signo solo en cumpleaños.
    expect(fechas).toEqual(["🎂Cumpleaños14 de Marzo (1990 — 35 años)Piscis", "💍Boda2 de Junio (2015 — 10 años)", "🎂Cumpleaños9 de SeptiembreVirgo"]);
    expect(screen.getByText("Aviso activado día anterior a las 08:30")).toBeInTheDocument();

    const casas = screen.getByRole("region", { name: "Casas a las que pertenece" });
    expect(within(casas).getByText("2 hogares")).toBeInTheDocument();
    const items = within(casas).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Casa de los abuelos");
    expect(items[0]).toHaveTextContent("Calle Sol 5");
    expect(within(items[0]).getByRole("link", { name: "Pedro García" })).toHaveAttribute("href", "/persona/p2");
    expect(within(items[0]).getByRole("link", { name: "Abrir Casa de los abuelos" })).toHaveAttribute("href", "/casa/c1");
    expect(items[1]).toHaveTextContent("Soria");
    expect(items[1]).toHaveTextContent("Vive sola en esta casa");
    expect(screen.getByText("Libreta personal de memorias")).toBeInTheDocument();
  });

  test("T10.5b sin datos se leen 'Sin dirección guardada', 'Sin fechas guardadas' y 'No pertenece a ninguna casa'", async () => {
    await montar({ personas: [persona("p1", "Ana")], ruta: "/persona/p1" });
    expect(within(screen.getByRole("region", { name: "Dirección particular" })).getByText("Sin dirección guardada")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Fechas memorables" })).getByText("Sin fechas guardadas")).toBeInTheDocument();
    expect(screen.queryByText(/Aviso activado/)).toBeNull();
    const casas = screen.getByRole("region", { name: "Casas a las que pertenece" });
    expect(within(casas).getByText("No pertenece a ninguna casa")).toBeInTheDocument();
    expect(within(casas).getByText("0 hogares")).toBeInTheDocument();
    expect(screen.queryByText("Nota para visitas")).toBeNull();
    expect(screen.queryByText(/“/)).toBeNull();
  });

  test("T10.6 con el permiso de notificaciones denegado, el detalle muestra 'Avisos desactivados (sin permiso)' (T7.6)", async () => {
    await montar({ personas: [persona("p1", "Ana", { fechas: [cumple(14, 3)] })], ruta: "/persona/p1", notificador: new NotificadorSimulado("denegado") });
    expect(await screen.findByText("Avisos desactivados (sin permiso)")).toBeInTheDocument();
    expect(screen.queryByText(/Aviso activado/)).toBeNull();
  });

  test("T10.6b si el permiso se deniega al guardar una fecha, el detalle pasa a 'Avisos desactivados (sin permiso)'", async () => {
    const notificador = new NotificadorSimulado("preguntar", "denegado");
    const { usuario } = await montar({ personas: [persona("p1", "Ana")], ruta: "/persona/p1", notificador });
    await opcionDePerfil(usuario, "Editar información");
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(fecha).getByLabelText("Día"), "14");
    await elegirMes(usuario, fecha, "Marzo");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Avisos desactivados (sin permiso)")).toBeInTheDocument();
  });

  test("T10.12 eliminar desde la hoja de opciones avisa de las casas que se borran; cancelar no cambia nada y aceptar borra en una operación (CU2, RNF8)", async () => {
    const { usuario, leer, banco, router } = await montar({
      personas: [persona("p1", "Ana"), persona("p2", "Bruno")],
      casas: [casa("c1", "Piso de Ana", ["p1"]), casa("c2", "Casa compartida", ["p1", "p2"])],
      ruta: "/persona/p1",
    });
    const antes = banco.archivos();
    await usuario.click(screen.getByRole("button", { name: "Opciones de perfil" }));
    const hoja = screen.getByRole("dialog", { name: "Opciones de contacto" });
    expect(within(hoja).getByRole("button", { name: "Editar información" })).toBeInTheDocument();
    await usuario.click(within(hoja).getByRole("button", { name: "Eliminar de contactos" }));
    expect(screen.queryByRole("dialog", { name: "Opciones de contacto" })).toBeNull();

    const dialogo = screen.getByRole("alertdialog", { name: "¿Eliminar a Ana?" });
    expect(dialogo).toHaveTextContent("También se borrarán estas casas, porque se quedarían vacías: Piso de Ana");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(banco.archivos()).toEqual(antes);

    await opcionDePerfil(usuario, "Eliminar de contactos");
    await usuario.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(router.state.location.pathname).toBe("/");
    expect(leer("personas.json")).toEqual([persona("p2", "Bruno")]);
    expect(leer("casas.json")).toEqual([casa("c2", "Casa compartida", ["p2"])]);
  });

  test("T10.12b si eliminar falla, no cambia ningún archivo y se ve el error (RNF8, RNF9)", async () => {
    const { usuario, banco } = await montar({ personas: [persona("p1", "Ana")], casas: [casa("c1", "Piso de Ana", ["p1"])], ruta: "/persona/p1" });
    const antes = banco.archivos();
    banco.fallarConfirmar("casas.json");
    await opcionDePerfil(usuario, "Eliminar de contactos");
    await usuario.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(banco.archivos()).toEqual(antes);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
  });
});

describe("Sprint 10: formulario de persona", () => {
  test("T10.7 con el nombre vacío no guarda, muestra 'Escribe el nombre' bajo el campo y le da el foco (CU1, RNF1)", async () => {
    const { usuario, banco, router } = await montar({ ruta: "/persona/nueva" });
    const antes = banco.archivos();
    expect(screen.getByRole("heading", { level: 1, name: "Detalle Persona" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Nueva Persona" })).toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Apodo o alias"), "Luci");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    const nombre = screen.getByLabelText("Nombre completo");
    expect(nombre).toHaveAttribute("aria-invalid", "true");
    expect(nombre).toHaveAccessibleDescription("Escribe el nombre");
    expect(nombre).toHaveFocus();
    expect(banco.archivos()).toEqual(antes);
    expect(router.state.location.pathname).toBe("/persona/nueva");

    // Al escribir, el error desaparece.
    await usuario.type(nombre, "Lucía");
    expect(nombre).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("Escribe el nombre")).toBeNull();
  });

  test("T10.8 una fecha 31/02 muestra el error bajo su fila y no guarda; se pueden añadir y quitar varias fechas (RF3)", async () => {
    const { usuario, banco, leer } = await montar({ ruta: "/persona/nueva" });
    const antes = banco.archivos();
    await usuario.type(screen.getByLabelText("Nombre completo"), "Ana");
    // Un bloque de fecha de partida, sin botón de quitar mientras está vacío.
    expect(screen.getAllByRole("group", { name: /^Fecha / })).toHaveLength(1);
    expect(within(screen.getByRole("group", { name: "Fecha 1" })).queryByRole("button", { name: "Quitar fecha" })).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Añadir otra fecha" }));
    await usuario.click(screen.getByRole("button", { name: "Añadir otra fecha" }));
    expect(screen.getAllByRole("group", { name: /^Fecha / })).toHaveLength(3);

    const primera = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(primera).getByLabelText("Día"), "31");
    await elegirMes(usuario, primera, "Febrero");
    expect(within(primera).getByLabelText("Mes")).toHaveTextContent("Feb");
    const segunda = screen.getByRole("group", { name: "Fecha 2" });
    await usuario.type(within(segunda).getByLabelText("Etiqueta"), "Se quita");
    const tercera = screen.getByRole("group", { name: "Fecha 3" });
    await usuario.click(within(tercera).getByRole("button", { name: "Aniversario" }));
    expect(within(tercera).getByRole("button", { name: "Aniversario" })).toHaveAttribute("aria-pressed", "true");
    await usuario.type(within(tercera).getByLabelText("Etiqueta"), "Boda");
    await usuario.type(within(tercera).getByLabelText("Día"), "2");
    await elegirMes(usuario, tercera, "Junio");
    await usuario.type(within(tercera).getByLabelText("Año (opc.)"), "2015");

    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(within(primera).getByRole("alert")).toHaveTextContent("El día no existe en ese mes");
    // La segunda (con etiqueta pero sin día ni mes) tampoco es válida.
    expect(within(segunda).getByRole("alert")).toBeInTheDocument();
    expect(within(tercera).queryByRole("alert")).toBeNull();
    expect(banco.archivos()).toEqual(antes);

    // Se quita la segunda y se corrige la primera.
    await usuario.click(within(segunda).getByRole("button", { name: "Quitar fecha" }));
    expect(screen.getAllByRole("group", { name: /^Fecha / })).toHaveLength(2);
    const dia = within(screen.getByRole("group", { name: "Fecha 1" })).getByLabelText("Día");
    await usuario.clear(dia);
    await usuario.type(dia, "28");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await screen.findByRole("heading", { level: 2, name: "Ana" });
    expect(leer("personas.json")[0].fechas).toEqual([
      { tipo: "cumpleaños", etiqueta: "", dia: 28, mes: 2 },
      { tipo: "aniversario", etiqueta: "Boda", dia: 2, mes: 6, anio: 2015 },
    ]);
  });

  test("T10.8b al editar, quitar la única fecha deja el bloque vacío y la persona se guarda sin fechas", async () => {
    const { usuario, leer } = await montar({ personas: [persona("p1", "Ana", { fechas: [cumple(14, 3)] })], ruta: "/persona/p1" });
    await opcionDePerfil(usuario, "Editar información");
    expect(screen.getByRole("heading", { level: 2, name: "Editar Persona" })).toBeInTheDocument();
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    expect(within(fecha).getByLabelText("Día")).toHaveValue("14");
    expect(within(fecha).getByLabelText("Mes")).toHaveTextContent("Mar");
    await usuario.click(within(fecha).getByRole("button", { name: "Quitar fecha" }));
    const vacia = screen.getByRole("group", { name: "Fecha 1" });
    expect(within(vacia).getByLabelText("Día")).toHaveValue("");
    expect(within(vacia).getByLabelText("Mes")).toHaveTextContent("Mes");
    expect(within(vacia).queryByRole("button", { name: "Quitar fecha" })).toBeNull();
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(leer("personas.json")[0].fechas).toEqual([]));
  });

  test("T10.9 crear una persona con dos casas la añade a ambas en una sola operación y avisa del guardado (RNF8)", async () => {
    const { usuario, leer, router } = await montar({
      personas: [persona("p2", "Bruno")],
      casas: [casa("c1", "El Refugio", ["p2"]), casa("c2", "Casa de los abuelos", ["p2"]), casa("c3", "Piso Centro", ["p2"])],
      ruta: "/persona/nueva",
    });
    // Chips de casas por orden alfabético.
    expect(within(screen.getByRole("group", { name: "Casas" })).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Casa de los abuelos",
      "El Refugio",
      "Piso Centro",
    ]);
    await usuario.type(screen.getByLabelText("Nombre completo"), "Ana");
    await usuario.click(chipCasa("El Refugio"));
    await usuario.click(chipCasa("Casa de los abuelos"));
    expect(chipCasa("El Refugio")).toHaveAttribute("aria-pressed", "true");
    expect(chipCasa("Piso Centro")).toHaveAttribute("aria-pressed", "false");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Persona guardada con éxito en Memory");
    const [, ana] = leer("personas.json");
    expect(ana.nombre).toBe("Ana");
    expect(router.state.location.pathname).toBe(`/persona/${ana.id}`);
    expect(leer("casas.json")).toEqual([
      casa("c1", "El Refugio", ["p2", ana.id]),
      casa("c2", "Casa de los abuelos", ["p2", ana.id]),
      casa("c3", "Piso Centro", ["p2"]),
    ]);
    expect(within(await screen.findByRole("region", { name: "Casas a las que pertenece" })).getAllByRole("listitem")).toHaveLength(2);
  });

  test("T10.9b si el guardado falla, no cambia ningún archivo ni la pantalla (RNF8, RNF9)", async () => {
    const { usuario, banco, router } = await montar({ personas: [persona("p2", "Bruno")], casas: [casa("c1", "El Refugio", ["p2"])], ruta: "/persona/nueva" });
    const antes = banco.archivos();
    await usuario.type(screen.getByLabelText("Nombre completo"), "Ana");
    await usuario.click(chipCasa("El Refugio"));
    // Falla el segundo archivo: el primero ya confirmado se deshace.
    banco.fallarConfirmar("casas.json");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(banco.archivos()).toEqual(antes);
    expect(router.state.location.pathname).toBe("/persona/nueva");
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana");
    expect(chipCasa("El Refugio")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Persona guardada con éxito en Memory")).toBeNull();
  });

  test("T10.11 al editar, desmarcar la casa donde es la única persona pide confirmación; aceptar la borra al guardar y cancelar la deja (RF7b)", async () => {
    const { usuario, leer, banco } = await montar({
      personas: [persona("p1", "Ana"), persona("p2", "Bruno")],
      casas: [casa("c1", "Piso de Ana", ["p1"]), casa("c2", "Casa compartida", ["p1", "p2"]), casa("c3", "Casa de Bruno", ["p2"])],
      ruta: "/persona/p1",
    });
    await opcionDePerfil(usuario, "Editar información");
    expect(chipCasa("Piso de Ana")).toHaveAttribute("aria-pressed", "true");
    expect(chipCasa("Casa compartida")).toHaveAttribute("aria-pressed", "true");
    expect(chipCasa("Casa de Bruno")).toHaveAttribute("aria-pressed", "false");

    // Cancelar deja la casa marcada.
    await usuario.click(chipCasa("Piso de Ana"));
    let dialogo = screen.getByRole("alertdialog", { name: "Confirmar quitar de la casa" });
    expect(dialogo).toHaveTextContent("Ana es la única persona de Piso de Ana");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(chipCasa("Piso de Ana")).toHaveAttribute("aria-pressed", "true");

    // Aceptar la desmarca; no se borra nada hasta guardar.
    const antes = banco.archivos();
    await usuario.click(chipCasa("Piso de Ana"));
    dialogo = screen.getByRole("alertdialog", { name: "Confirmar quitar de la casa" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Quitar y borrar la casa" }));
    expect(chipCasa("Piso de Ana")).toHaveAttribute("aria-pressed", "false");
    expect(banco.archivos()).toEqual(antes);

    // Desmarcar una casa con más miembros no pide confirmación; marcar otra la añade.
    await usuario.click(chipCasa("Casa compartida"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await usuario.click(chipCasa("Casa de Bruno"));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(leer("casas.json")).toEqual([casa("c2", "Casa compartida", ["p2"]), casa("c3", "Casa de Bruno", ["p2", "p1"])]));
    expect(leer("personas.json")).toEqual([persona("p1", "Ana"), persona("p2", "Bruno")]);
  });

  test("T10.13 'Cancelar' sin cambios vuelve directamente; con cambios pide confirmación", async () => {
    const { usuario, router, banco } = await montar();
    const antes = banco.archivos();

    // Sin cambios: vuelve sin preguntar.
    await usuario.click(screen.getByRole("link", { name: "Añadir persona" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(router.state.location.pathname).toBe("/");

    // Con cambios: pregunta; seguir editando conserva lo escrito.
    await usuario.click(await screen.findByRole("link", { name: "Añadir persona" }));
    await usuario.type(screen.getByLabelText("Nombre completo"), "Ana");
    await usuario.click(screen.getByRole("button", { name: "Cancelar y descartar" }));
    const dialogo = screen.getByRole("alertdialog", { name: "¿Descartar los cambios?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana");
    expect(router.state.location.pathname).toBe("/persona/nueva");

    // El botón atrás de la cabecera también pregunta; descartar vuelve sin guardar.
    await usuario.click(screen.getByRole("button", { name: "Volver" }));
    await usuario.click(within(screen.getByRole("alertdialog", { name: "¿Descartar los cambios?" })).getByRole("button", { name: "Descartar" }));
    expect(router.state.location.pathname).toBe("/");
    expect(banco.archivos()).toEqual(antes);
  });

  test("T10.13b al editar, descartar los cambios vuelve a la ficha sin cambiar nada", async () => {
    const { usuario, banco } = await montar({ personas: [persona("p1", "Ana")], ruta: "/persona/p1" });
    const antes = banco.archivos();
    await opcionDePerfil(usuario, "Editar información");
    // Sin cambios, cancelar vuelve a la ficha.
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Opciones de perfil" })).toBeInTheDocument();

    await opcionDePerfil(usuario, "Editar información");
    await usuario.type(screen.getByLabelText("Ciudad o Localidad"), "Soria");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.getByRole("button", { name: "Opciones de perfil" })).toBeInTheDocument();
    expect(screen.getByText("Sin dirección guardada")).toBeInTheDocument();
    expect(banco.archivos()).toEqual(antes);
  });

  test("ningún componente usa window.confirm", async () => {
    const confirmar = vi.spyOn(window, "confirm");
    const { usuario } = await montar({ personas: [persona("p1", "Ana")], casas: [casa("c1", "Piso de Ana", ["p1"])], ruta: "/persona/p1" });
    await opcionDePerfil(usuario, "Eliminar de contactos");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await opcionDePerfil(usuario, "Editar información");
    await usuario.click(chipCasa("Piso de Ana"));
    await usuario.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    await usuario.type(screen.getByLabelText("Nombre completo"), "x");
    await usuario.click(screen.getByRole("button", { name: "Cancelar y descartar" }));
    expect(screen.getByRole("alertdialog", { name: "¿Descartar los cambios?" })).toBeInTheDocument();
    expect(confirmar).not.toHaveBeenCalled();
    confirmar.mockRestore();
  });
});

describe("Sprint 10: PersonasService con casas", () => {
  test("T10.9 crear con dos casas escribe personas.json y casas.json en un solo guardado (RNF8)", async () => {
    const { servicio: s, repositorio, leer } = await servicio([persona("p2", "Bruno")], [casa("c1", "A", ["p2"]), casa("c2", "B", ["p2"])]);
    const guardar = vi.spyOn(repositorio, "guardar");
    const r = await s.crear({ nombre: "Ana" }, ["c1", "c2"]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(Object.keys(guardar.mock.calls[0][0]).sort()).toEqual(["casas", "personas"]);
    expect(leer("casas.json")).toEqual([casa("c1", "A", ["p2", r.valor.id]), casa("c2", "B", ["p2", r.valor.id])]);
  });

  test("T10.9 sin casas, crear solo escribe personas.json", async () => {
    const { servicio: s, repositorio } = await servicio([], []);
    const guardar = vi.spyOn(repositorio, "guardar");
    expect((await s.crear({ nombre: "Ana" }, [])).ok).toBe(true);
    expect(Object.keys(guardar.mock.calls[0][0])).toEqual(["personas"]);
  });

  test("T10.9 si falla el guardado de las casas al crear, ningún archivo cambia (RNF8, RNF9)", async () => {
    const { servicio: s, banco } = await servicio([persona("p2", "Bruno")], [casa("c1", "A", ["p2"])]);
    const antes = banco.archivos();
    banco.fallarConfirmar("casas.json");
    expect((await s.crear({ nombre: "Ana" }, ["c1"])).ok).toBe(false);
    expect(banco.archivos()).toEqual(antes);
  });

  test("T10.10 crear con un id de casa inexistente se rechaza y no escribe (RNF10)", async () => {
    const { servicio: s, repositorio, banco } = await servicio([persona("p2", "Bruno")], [casa("c1", "A", ["p2"])]);
    const guardar = vi.spyOn(repositorio, "guardar");
    const antes = banco.archivos();
    const r = await s.crear({ nombre: "Ana" }, ["c1", "no-existe"]);
    expect(r).toEqual({ ok: false, error: "Alguna casa no existe" });
    expect(guardar).not.toHaveBeenCalled();
    expect(banco.archivos()).toEqual(antes);
  });

  test("T10.11 editar con casas añade, quita y borra las casas vacías en un solo guardado (RF7b, RNF8)", async () => {
    const { servicio: s, repositorio, leer } = await servicio(
      [persona("p1", "Ana"), persona("p2", "Bruno")],
      [casa("c1", "Solo Ana", ["p1"]), casa("c2", "Compartida", ["p1", "p2"]), casa("c3", "De Bruno", ["p2"])],
    );
    const guardar = vi.spyOn(repositorio, "guardar");
    const r = await s.editar("p1", { nombre: "Ana María" }, ["c3"]);
    expect(r.ok).toBe(true);
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(leer("personas.json")[0].nombre).toBe("Ana María");
    expect(leer("casas.json")).toEqual([casa("c2", "Compartida", ["p2"]), casa("c3", "De Bruno", ["p2", "p1"])]);
  });

  test("T10.11 editar con las mismas casas no escribe casas.json; con una casa inexistente se rechaza", async () => {
    const { servicio: s, repositorio, banco } = await servicio([persona("p1", "Ana")], [casa("c1", "A", ["p1"])]);
    const guardar = vi.spyOn(repositorio, "guardar");
    expect((await s.editar("p1", { apodo: "Anita" }, ["c1"])).ok).toBe(true);
    expect(Object.keys(guardar.mock.calls[0][0])).toEqual(["personas"]);
    const antes = banco.archivos();
    expect(await s.editar("p1", { apodo: "Otra" }, ["zz"])).toEqual({ ok: false, error: "Alguna casa no existe" });
    expect(banco.archivos()).toEqual(antes);
  });
});
