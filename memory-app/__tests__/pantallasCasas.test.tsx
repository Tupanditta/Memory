// Sprint 6: pantallas de casas (T6.1 a T6.6), con el repositorio real sobre un
// sistema de archivos simulado en memoria. Desde el Sprint 10 (regla 8) Inicio y la
// ficha de persona tienen la interfaz nueva, y desde el Sprint 11 el formulario y el
// detalle de casa; lo que se comprueba no cambia.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { rutas } from "../src/App";
import { ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../src/modelos/tipos";
import { seccionInicio, tarjetaInicio, titulosInicio } from "./ayudas";
import { bancoArchivos } from "./simulados/almacenes";

const persona = (id: string, nombre: string): Persona => ({ id, nombre, apodo: "", direccion: direccionVacia(), fechas: [] });

const casa = (id: string, apodo: string, personas: string[], direccion: Partial<Direccion> = {}): Casa => ({
  id,
  apodo,
  direccion: { ...direccionVacia(), ...direccion },
  personas,
});

async function montar({ personas = [] as Persona[], casas = [] as Casa[], ruta = "/" } = {}) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(personas));
  banco.poner("casas.json", JSON.stringify(casas));
  banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: "09:00" }));
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const usuario = userEvent.setup();
  render(
    <ProveedorApp almacen={banco.almacen}>
      <RouterProvider router={router} />
    </ProveedorApp>,
  );
  await screen.findByRole("heading", { level: 1 });
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, router, usuario, leer };
}

const regionCasas = () => seccionInicio("Casas y lugares");
const casasEnLista = () => titulosInicio("Casas y lugares");
/** La tarjeta de la casa en Inicio muestra su dirección corta y los nombres de los miembros. */
const esperarTarjetaCasa = (apodo: string, direccion: string, miembros: string) => {
  const tarjeta = tarjetaInicio("Casas y lugares", apodo);
  expect(tarjeta).toHaveTextContent(direccion);
  expect(tarjeta).toHaveTextContent(miembros);
};
const regionMiembros = () => screen.getByRole("region", { name: "¿Quiénes viven aquí?" });
const miembrosEnDetalle = () => within(regionMiembros()).getAllByRole("link").map((a) => a.getAttribute("aria-label"));
const regionDireccion = () => screen.getByRole("region", { name: "Dirección compartida" });
/** Abre la hoja de opciones del detalle de casa y pulsa una opción. */
async function opcionDeCasa(usuario: ReturnType<typeof userEvent.setup>, opcion: "Editar información" | "Eliminar casa") {
  await usuario.click(screen.getByRole("button", { name: "Opciones de la casa" }));
  await usuario.click(within(screen.getByRole("dialog", { name: "Opciones de la casa" })).getByRole("button", { name: opcion }));
}

const ana = persona("p1", "Ana");
const bruno = persona("p2", "Bruno");
const carla = persona("p3", "Carla");

describe("Sprint 6: pantallas de casas", () => {
  test("T6.1 crear una casa con personas desde la UI la guarda y la muestra (CU7)", async () => {
    const { usuario, leer, router } = await montar({ personas: [carla, ana, bruno] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    expect(screen.getByRole("heading", { level: 1, name: "Nueva Casa" })).toBeInTheDocument();

    // El selector lista a todas las personas en orden alfabético.
    const selector = screen.getByRole("group", { name: "¿Quiénes viven aquí?" });
    expect(within(selector).getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"))).toEqual(["Ana", "Bruno", "Carla"]);

    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa de los abuelos");
    await usuario.type(screen.getByLabelText("Calle / Avenida"), "Calle Sol");
    await usuario.type(screen.getByLabelText("Ciudad / Pueblo"), "Toledo");
    await usuario.click(screen.getByRole("checkbox", { name: "Ana" }));
    await usuario.click(screen.getByRole("checkbox", { name: "Carla" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("heading", { name: "Casa de los abuelos" })).toBeInTheDocument();
    const guardadas = leer("casas.json");
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({
      apodo: "Casa de los abuelos",
      direccion: { ...direccionVacia(), calle: "Calle Sol", ciudad: "Toledo" },
      personas: ["p1", "p3"],
    });
    expect(router.state.location.pathname).toBe(`/casa/${guardadas[0].id}`);
    expect(miembrosEnDetalle()).toEqual(["Ana", "Carla"]);
    expect(within(regionDireccion()).getByText("Toledo")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Volver" }));
    expect(casasEnLista()).toEqual(["Casa de los abuelos"]);
    esperarTarjetaCasa("Casa de los abuelos", "Calle Sol", "Ana, Carla");
  });

  test("T6.2 el formulario no permite guardar sin personas seleccionadas (R8)", async () => {
    const { usuario, banco, router } = await montar({ personas: [ana], ruta: "/casa/nueva" });
    const antes = banco.archivos();
    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa vacía");
    const guardar = screen.getByRole("button", { name: "Guardar" });
    expect(guardar).toBeDisabled();
    expect(screen.getByText("Elige al menos una persona")).toBeInTheDocument();
    await usuario.click(guardar);
    // Marcar y desmarcar vuelve a dejarlo desactivado.
    await usuario.click(screen.getByRole("checkbox", { name: "Ana" }));
    expect(guardar).toBeEnabled();
    await usuario.click(screen.getByRole("checkbox", { name: "Ana" }));
    expect(guardar).toBeDisabled();
    await usuario.click(guardar);
    expect(banco.archivos()).toEqual(antes);
    expect(router.state.location.pathname).toBe("/casa/nueva");
  });

  test("T6.2b sin apodo no guarda y pide el apodo (CU7)", async () => {
    const { usuario, banco } = await montar({ personas: [ana], ruta: "/casa/nueva" });
    const antes = banco.archivos();
    await usuario.click(screen.getByRole("checkbox", { name: "Ana" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe el apodo");
    expect(banco.archivos()).toEqual(antes);
  });

  test("T6.3 buscar una casa por cualquiera de sus datos muestra dirección y todas las personas (CU9, RF6)", async () => {
    const { usuario } = await montar({
      personas: [ana, bruno, carla],
      casas: [
        casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Calle Sol", numero: "5", ciudad: "Toledo" }),
        casa("c2", "Piso de la playa", ["p3"], { ciudad: "Cádiz" }),
      ],
    });
    const buscador = screen.getByRole("searchbox", { name: "Buscar" });
    for (const consulta of ["ABUELOS", "calle sol", "toledo", "bruno"]) {
      await usuario.clear(buscador);
      await usuario.type(buscador, consulta);
      expect(casasEnLista()).toEqual(["Casa de los abuelos"]);
      esperarTarjetaCasa("Casa de los abuelos", "Calle Sol 5", "Ana, Bruno");
    }
    await usuario.clear(buscador);
    await usuario.type(buscador, "cadiz");
    expect(casasEnLista()).toEqual(["Piso de la playa"]);
    esperarTarjetaCasa("Piso de la playa", "Cádiz", "Carla");

    // Desde la búsqueda se abre el detalle con la dirección y todos los miembros.
    await usuario.clear(buscador);
    await usuario.type(buscador, "abuelos");
    await usuario.click(within(regionCasas()!).getByRole("link", { name: /Casa de los abuelos/ }));
    expect(await screen.findByRole("heading", { name: "Casa de los abuelos" })).toBeInTheDocument();
    // La ficha une calle y número en una línea ("Calle Sol 5").
    const direccion = regionDireccion();
    for (const texto of ["Calle Sol 5", "Toledo"]) expect(within(direccion).getByText(texto)).toBeInTheDocument();
    expect(miembrosEnDetalle()).toEqual(["Ana", "Bruno"]);
    expect(within(regionMiembros()).getByText("2 miembros")).toBeInTheDocument();
  });

  test("T6.4 una persona en dos casas muestra ambas en su detalle, y cada una abre su casa (RF7)", async () => {
    const { usuario, router } = await montar({
      personas: [ana, bruno],
      casas: [casa("c1", "Casa de Madrid", ["p1", "p2"], { ciudad: "Madrid" }), casa("c2", "Casa del pueblo", ["p1"], { ciudad: "Soria" })],
      ruta: "/persona/p1",
    });
    const casas = within(screen.getByRole("region", { name: "Casas a las que pertenece" })).getAllByRole("listitem");
    expect(casas).toHaveLength(2);
    expect(casas[0]).toHaveTextContent("Casa de Madrid");
    expect(casas[0]).toHaveTextContent("Madrid");
    expect(within(casas[0]).getByRole("link", { name: "Bruno" })).toBeInTheDocument();
    expect(casas[1]).toHaveTextContent("Casa del pueblo");
    expect(casas[1]).toHaveTextContent("Soria");
    expect(casas[1]).toHaveTextContent("Vive sola en esta casa");

    await usuario.click(within(casas[1]).getByRole("link", { name: "Abrir Casa del pueblo" }));
    expect(router.state.location.pathname).toBe("/casa/c2");
    expect(await screen.findByRole("heading", { name: "Casa del pueblo" })).toBeInTheDocument();
  });

  test("T6.5 quitar al último miembro muestra el diálogo; cancelar deja la casa igual y aceptar la borra (RF7b)", async () => {
    const { usuario, leer, router } = await montar({
      personas: [ana, bruno],
      casas: [casa("c1", "Casa de Ana", ["p1"]), casa("c2", "Otra", ["p2"])],
      ruta: "/casa/c1",
    });
    await usuario.click(screen.getByRole("button", { name: "Quitar a Ana" }));
    const dialogo = screen.getByRole("alertdialog", { name: "Confirmar quitar último miembro" });
    expect(dialogo).toHaveTextContent("se borrará la casa");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(leer("casas.json")).toEqual([casa("c1", "Casa de Ana", ["p1"]), casa("c2", "Otra", ["p2"])]);

    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(miembrosEnDetalle()).toEqual(["Ana"]);
    expect(leer("casas.json")).toEqual([casa("c1", "Casa de Ana", ["p1"]), casa("c2", "Otra", ["p2"])]);

    await usuario.click(screen.getByRole("button", { name: "Quitar a Ana" }));
    await usuario.click(screen.getByRole("button", { name: "Borrar casa" }));
    expect(router.state.location.pathname).toBe("/");
    // React Router pinta la navegación en una transición: se espera a que aparezca Inicio.
    await screen.findByRole("region", { name: "Casas y lugares" });
    expect(casasEnLista()).toEqual(["Otra"]);
    expect(tarjetaInicio("Casas y lugares", "Otra")).toHaveTextContent("Bruno");
    expect(leer("casas.json")).toEqual([casa("c2", "Otra", ["p2"])]);
    // Borrar la casa no borra a la persona.
    expect(leer("personas.json")).toEqual([ana, bruno]);
  });

  test("T6.5b quitar a un miembro de una casa con más personas no pide confirmación (CU8)", async () => {
    const { usuario, leer } = await montar({ personas: [ana, bruno], casas: [casa("c1", "Compartida", ["p1", "p2"])], ruta: "/casa/c1" });
    await usuario.click(screen.getByRole("button", { name: "Quitar a Ana" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(miembrosEnDetalle()).toEqual(["Bruno"]);
    expect(leer("casas.json")).toEqual([casa("c1", "Compartida", ["p2"])]);
  });

  test("T6.5c editar la casa cambia apodo y miembros; borrarla pide confirmación (CU8)", async () => {
    const { usuario, leer, router } = await montar({ personas: [ana, bruno], casas: [casa("c1", "Casa", ["p1"])], ruta: "/casa/c1" });
    await opcionDeCasa(usuario, "Editar información");
    const apodo = screen.getByLabelText("Apodo del hogar");
    expect(apodo).toHaveValue("Casa");
    await usuario.clear(apodo);
    await usuario.type(apodo, "Casa nueva");
    expect(screen.getByRole("checkbox", { name: "Ana" })).toBeChecked();
    await usuario.click(screen.getByRole("checkbox", { name: "Bruno" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("heading", { name: "Casa nueva" })).toBeInTheDocument();
    expect(miembrosEnDetalle()).toEqual(["Ana", "Bruno"]);
    expect(leer("casas.json")).toEqual([casa("c1", "Casa nueva", ["p1", "p2"])]);

    await opcionDeCasa(usuario, "Eliminar casa");
    await usuario.click(within(screen.getByRole("alertdialog", { name: "Confirmar borrado" })).getByRole("button", { name: "Cancelar" }));
    expect(leer("casas.json")).toHaveLength(1);
    await opcionDeCasa(usuario, "Eliminar casa");
    await usuario.click(within(screen.getByRole("alertdialog", { name: "Confirmar borrado" })).getByRole("button", { name: "Eliminar" }));
    expect(router.state.location.pathname).toBe("/");
    expect(leer("casas.json")).toEqual([]);
    expect(leer("personas.json")).toEqual([ana, bruno]);
  });

  test("T6.6 si el guardado falla, la casa no aparece en pantalla y se ve el error (RNF9)", async () => {
    const { usuario, banco, leer } = await montar({ personas: [ana] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa fallida");
    await usuario.click(screen.getByRole("checkbox", { name: "Ana" }));
    banco.fallarEscrituraTmp("casas.json");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(leer("casas.json")).toEqual([]);
    expect(screen.getByLabelText("Apodo del hogar")).toHaveValue("Casa fallida");
    // Con lo escrito sin guardar, "Cancelar" pide descartar.
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(regionCasas()).toBeNull();
    expect(screen.queryByText("Casa fallida")).toBeNull();
  });

  test("T6.6b si falla quitar al último miembro, la casa sigue igual y se ve el error (RNF9)", async () => {
    const { usuario, banco, leer } = await montar({ personas: [ana], casas: [casa("c1", "Casa de Ana", ["p1"])], ruta: "/casa/c1" });
    banco.fallarEscrituraTmp("casas.json");
    await usuario.click(screen.getByRole("button", { name: "Quitar a Ana" }));
    await usuario.click(screen.getByRole("button", { name: "Borrar casa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(screen.getByRole("heading", { name: "Casa de Ana" })).toBeInTheDocument();
    expect(miembrosEnDetalle()).toEqual(["Ana"]);
    expect(leer("casas.json")).toEqual([casa("c1", "Casa de Ana", ["p1"])]);
  });
});
