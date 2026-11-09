// Sprint 11: formulario y detalle de casa con la interfaz nueva (T11.1 a T11.6), con el
// repositorio real sobre un sistema de archivos simulado en memoria.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { rutas } from "../src/App";
import { ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../src/modelos/tipos";
import { tarjetaInicio, titulosInicio } from "./ayudas";
import { bancoArchivos } from "./simulados/almacenes";

const persona = (id: string, nombre: string, apodo = ""): Persona => ({ id, nombre, apodo, direccion: direccionVacia(), fechas: [] });

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

const selector = () => screen.getByRole("group", { name: "¿Quiénes viven aquí?" });
const fila = (nombre: string) => within(selector()).getByRole("checkbox", { name: nombre });
const nombresEnSelector = () => within(selector()).getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"));
const marcadas = () =>
  within(selector())
    .getAllByRole("checkbox")
    .filter((c) => c.getAttribute("aria-checked") === "true")
    .map((c) => c.getAttribute("aria-label"));
const contador = (texto: string) => within(screen.getByRole("region", { name: "¿Quiénes viven aquí?" })).getByText(texto);
const guardar = () => screen.getByRole("button", { name: "Guardar" });
const regionMiembros = () => screen.getByRole("region", { name: "¿Quiénes viven aquí?" });

const ana = persona("p1", "Ana García", "Anita");
const bruno = persona("p2", "Bruno");
const carla = persona("p3", "Carla");

describe("Sprint 11: casas", () => {
  test("T11.1 el contador y las filas reflejan la selección; sin ninguna, no se puede guardar (R8)", async () => {
    const { usuario, banco } = await montar({ personas: [carla, ana, bruno], ruta: "/casa/nueva" });
    const antes = banco.archivos();
    expect(nombresEnSelector()).toEqual(["Ana García", "Bruno", "Carla"]);
    // El apodo se ve bajo el nombre.
    expect(fila("Ana García")).toHaveTextContent("Anita");

    expect(contador("0 seleccionados")).toHaveClass("text-on-surface-variant");
    expect(guardar()).toBeDisabled();
    expect(guardar()).toHaveTextContent("Guardar casa");
    expect(screen.getByText("Elige al menos una persona")).toBeInTheDocument();

    await usuario.click(fila("Bruno"));
    expect(contador("1 seleccionado")).toHaveClass("text-primary");
    expect(fila("Bruno")).toHaveAttribute("aria-checked", "true");
    expect(fila("Bruno")).toHaveClass("bg-primary-fixed/20");
    expect(fila("Bruno").querySelector(".bg-primary")).not.toBeNull();
    expect(fila("Ana García")).toHaveAttribute("aria-checked", "false");
    expect(fila("Ana García")).not.toHaveClass("bg-primary-fixed/20");
    expect(screen.queryByText("Elige al menos una persona")).toBeNull();
    expect(guardar()).toBeEnabled();

    await usuario.click(fila("Carla"));
    await usuario.click(fila("Ana García"));
    expect(contador("3 seleccionados")).toBeInTheDocument();
    expect(marcadas()).toEqual(["Ana García", "Bruno", "Carla"]);

    for (const nombre of ["Ana García", "Bruno", "Carla"]) await usuario.click(fila(nombre));
    expect(contador("0 seleccionados")).toBeInTheDocument();
    expect(guardar()).toBeDisabled();
    expect(screen.getByText("Elige al menos una persona")).toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa");
    await usuario.click(guardar());
    expect(banco.archivos()).toEqual(antes);
  });

  test("T11.1b sin personas en la app se avisa en lugar de la lista", async () => {
    await montar({ ruta: "/casa/nueva" });
    expect(screen.getByText("Aún no hay personas. Añade una primero.")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(guardar()).toBeDisabled();
  });

  test("T11.2 crear una casa con apodo, dirección y dos personas la guarda y la muestra en Inicio (CU7)", async () => {
    const { usuario, leer, router } = await montar({ personas: [ana, bruno, carla] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    expect(screen.getByRole("heading", { level: 1, name: "Nueva Casa" })).toBeInTheDocument();

    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa de la playa");
    await usuario.type(screen.getByLabelText("Calle / Avenida"), "Paseo Marítimo");
    await usuario.type(screen.getByLabelText("Nº"), "7");
    await usuario.type(screen.getByLabelText("Piso"), "2º");
    await usuario.type(screen.getByLabelText("Puerta"), "A");
    await usuario.type(screen.getByLabelText("Ciudad / Pueblo"), "Cádiz");
    await usuario.type(screen.getByLabelText(/^Detalles útiles/), "Plaza 12");
    await usuario.click(fila("Bruno"));
    await usuario.click(fila("Ana García"));
    await usuario.click(guardar());

    expect(await screen.findByRole("heading", { level: 2, name: "Casa de la playa" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Casa guardada");
    const guardadas = leer("casas.json");
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({
      apodo: "Casa de la playa",
      direccion: { ...direccionVacia(), calle: "Paseo Marítimo", numero: "7", piso: "2º", puerta: "A", ciudad: "Cádiz", notas: "Plaza 12" },
      personas: ["p2", "p1"],
    });
    expect(router.state.location.pathname).toBe(`/casa/${guardadas[0].id}`);

    await usuario.click(screen.getByRole("button", { name: "Volver" }));
    await screen.findByRole("region", { name: "Casas y lugares" });
    expect(titulosInicio("Casas y lugares")).toEqual(["Casa de la playa"]);
    const tarjeta = tarjetaInicio("Casas y lugares", "Casa de la playa");
    expect(tarjeta).toHaveTextContent("2 miembros");
    expect(tarjeta).toHaveTextContent("Paseo Marítimo 7, 2ºA");
    // Los miembros salen en el orden guardado (Bruno se marcó primero).
    expect(tarjeta).toHaveTextContent("Bruno, Ana García");
  });

  test("T11.2b sin apodo no guarda, marca el campo y pide el apodo; cancelar con cambios pide descartar (CU7)", async () => {
    const { usuario, banco, router } = await montar({ personas: [ana] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    const antes = banco.archivos();
    await usuario.click(fila("Ana García"));
    await usuario.click(guardar());
    const apodo = screen.getByLabelText("Apodo del hogar");
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe el apodo");
    expect(apodo).toHaveAttribute("aria-invalid", "true");
    expect(apodo).toHaveFocus();
    expect(banco.archivos()).toEqual(antes);

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    const dialogo = screen.getByRole("alertdialog", { name: "¿Descartar los cambios?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(router.state.location.pathname).toBe("/casa/nueva");
    expect(fila("Ana García")).toHaveAttribute("aria-checked", "true");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(router.state.location.pathname).toBe("/");
    expect(banco.archivos()).toEqual(antes);
  });

  test("T11.2c cancelar sin cambios vuelve directamente", async () => {
    const { usuario, router } = await montar({ personas: [ana] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(router.state.location.pathname).toBe("/");
  });

  test("T11.3 tras 'Añadir nueva persona' y guardarla, vuelve al formulario con la persona en la lista y lo escrito intacto", async () => {
    const { usuario, router, leer } = await montar({ personas: [bruno, carla] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa del pueblo");
    await usuario.type(screen.getByLabelText("Calle / Avenida"), "Calle Real");
    await usuario.type(screen.getByLabelText("Ciudad / Pueblo"), "Soria");
    await usuario.click(fila("Carla"));

    await usuario.click(screen.getByRole("button", { name: "Añadir nueva persona" }));
    expect(router.state.location.pathname).toBe("/persona/nueva");
    await usuario.type(screen.getByLabelText("Nombre completo"), "Ana García");
    await usuario.click(guardar());

    expect(await screen.findByRole("heading", { level: 1, name: "Nueva Casa" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/casa/nueva");
    expect(screen.getByLabelText("Apodo del hogar")).toHaveValue("Casa del pueblo");
    expect(screen.getByLabelText("Calle / Avenida")).toHaveValue("Calle Real");
    expect(screen.getByLabelText("Ciudad / Pueblo")).toHaveValue("Soria");
    // La persona nueva está en la lista (por orden alfabético) y marcada; Carla sigue marcada.
    expect(nombresEnSelector()).toEqual(["Ana García", "Bruno", "Carla"]);
    expect(marcadas()).toEqual(["Ana García", "Carla"]);
    expect(contador("2 seleccionados")).toBeInTheDocument();
    // Solo se ha guardado la persona.
    const personas = leer("personas.json");
    expect(personas.map((p: Persona) => p.nombre)).toEqual(["Bruno", "Carla", "Ana García"]);
    expect(leer("casas.json")).toEqual([]);

    await usuario.click(guardar());
    expect(await screen.findByRole("heading", { level: 2, name: "Casa del pueblo" })).toBeInTheDocument();
    const nueva = personas.find((p: Persona) => p.nombre === "Ana García");
    expect(leer("casas.json")[0]).toMatchObject({ apodo: "Casa del pueblo", personas: ["p3", nueva.id] });
  });

  test("T11.3b cancelar la persona nueva también vuelve con lo escrito; el borrador no reaparece después", async () => {
    const { usuario, router, leer } = await montar({ personas: [bruno] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa");
    await usuario.click(fila("Bruno"));
    await usuario.click(screen.getByRole("button", { name: "Añadir nueva persona" }));
    await usuario.click(screen.getAllByRole("button", { name: /^Cancelar/ })[0]);

    expect(await screen.findByRole("heading", { level: 1, name: "Nueva Casa" })).toBeInTheDocument();
    expect(screen.getByLabelText("Apodo del hogar")).toHaveValue("Casa");
    expect(marcadas()).toEqual(["Bruno"]);
    expect(leer("personas.json")).toEqual([bruno]);

    // Descartar y volver a abrir el formulario: empieza vacío.
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(router.state.location.pathname).toBe("/");
    await usuario.click(await screen.findByRole("link", { name: "Añadir casa" }));
    expect(screen.getByLabelText("Apodo del hogar")).toHaveValue("");
    expect(marcadas()).toEqual([]);
  });

  test("T11.3c al editar una casa, 'Añadir nueva persona' vuelve a la edición con los cambios y la persona marcada", async () => {
    const { usuario, router, leer } = await montar({ personas: [bruno], casas: [casa("c1", "Casa", ["p2"])], ruta: "/casa/c1" });
    // "Añadir persona" del detalle abre la edición de la casa.
    await usuario.click(screen.getByRole("button", { name: "Añadir persona" }));
    expect(screen.getByRole("heading", { level: 1, name: "Editar Casa" })).toBeInTheDocument();
    const apodo = screen.getByLabelText("Apodo del hogar");
    await usuario.clear(apodo);
    await usuario.type(apodo, "Casa grande");
    await usuario.click(screen.getByRole("button", { name: "Añadir nueva persona" }));
    await usuario.type(screen.getByLabelText("Nombre completo"), "Dani");
    await usuario.click(guardar());

    expect(await screen.findByRole("heading", { level: 1, name: "Editar Casa" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/casa/c1");
    expect(screen.getByLabelText("Apodo del hogar")).toHaveValue("Casa grande");
    expect(marcadas()).toEqual(["Bruno", "Dani"]);
    await usuario.click(guardar());
    expect(await screen.findByRole("heading", { level: 2, name: "Casa grande" })).toBeInTheDocument();
    const dani = leer("personas.json").find((p: Persona) => p.nombre === "Dani");
    expect(leer("casas.json")).toEqual([casa("c1", "Casa grande", ["p2", dani.id])]);
  });

  test("T11.4 el detalle de casa muestra dirección y todos los miembros, y cada miembro abre su ficha (CU9, RF6)", async () => {
    const { usuario, router } = await montar({
      personas: [ana, bruno, carla],
      casas: [casa("c1", "Casa de los abuelos", ["p2", "p1"], { calle: "Calle Sol", numero: "5", portal: "2", codigoPostal: "45001", ciudad: "Toledo", notas: "Timbre con música" })],
      ruta: "/casa/c1",
    });
    expect(screen.getByRole("heading", { level: 1, name: "Detalle Casa" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Casa de los abuelos" })).toBeInTheDocument();
    const direccion = screen.getByRole("region", { name: "Dirección compartida" });
    expect(direccion).toHaveTextContent("Ubicación compartida");
    expect(within(direccion).getByText("Calle Sol 5")).toBeInTheDocument();
    expect(within(direccion).getByText("Portal 2")).toBeInTheDocument();
    expect(within(direccion).getByText("45001 Toledo")).toBeInTheDocument();
    expect(within(direccion).getByText("Detalles útiles")).toBeInTheDocument();
    expect(within(direccion).getByText("Timbre con música")).toBeInTheDocument();

    const miembros = regionMiembros();
    expect(within(miembros).getByText("2 miembros")).toBeInTheDocument();
    const enlaces = within(miembros).getAllByRole("link");
    expect(enlaces.map((a) => a.getAttribute("aria-label"))).toEqual(["Bruno", "Ana García"]);
    expect(enlaces[1]).toHaveTextContent("Anita");
    expect(within(miembros).getAllByRole("button", { name: /^Quitar a / })).toHaveLength(2);

    await usuario.click(within(miembros).getByRole("link", { name: "Ana García" }));
    expect(router.state.location.pathname).toBe("/persona/p1");
    expect(await screen.findByRole("heading", { level: 2, name: "Ana García" })).toBeInTheDocument();
  });

  test("T11.4b sin dirección, el detalle lo dice; la hoja de opciones edita y elimina", async () => {
    const { usuario, leer, router } = await montar({ personas: [bruno], casas: [casa("c1", "Casa", ["p2"])], ruta: "/casa/c1" });
    expect(within(screen.getByRole("region", { name: "Dirección compartida" })).getByText("Sin dirección guardada")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Opciones de la casa" }));
    const hoja = screen.getByRole("dialog", { name: "Opciones de la casa" });
    expect(within(hoja).getByRole("button", { name: "Editar información" })).toBeInTheDocument();
    await usuario.click(within(hoja).getByRole("button", { name: "Eliminar casa" }));
    await usuario.click(within(screen.getByRole("alertdialog", { name: "Confirmar borrado" })).getByRole("button", { name: "Eliminar" }));
    expect(router.state.location.pathname).toBe("/");
    expect(leer("casas.json")).toEqual([]);
    expect(leer("personas.json")).toEqual([bruno]);
  });

  test("T11.5 'Quitar' al último miembro muestra el diálogo; cancelar la deja igual y aceptar la borra (RF7b)", async () => {
    const { usuario, leer, router } = await montar({ personas: [ana, bruno], casas: [casa("c1", "Casa de Ana", ["p1"]), casa("c2", "Otra", ["p2"])], ruta: "/casa/c1" });
    const inicial = leer("casas.json");
    await usuario.click(within(regionMiembros()).getByRole("button", { name: "Quitar a Ana García" }));
    const dialogo = screen.getByRole("alertdialog", { name: "Confirmar quitar último miembro" });
    expect(dialogo).toHaveTextContent("se borrará la casa");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(leer("casas.json")).toEqual(inicial);
    expect(within(regionMiembros()).getAllByRole("link").map((a) => a.getAttribute("aria-label"))).toEqual(["Ana García"]);

    await usuario.click(within(regionMiembros()).getByRole("button", { name: "Quitar a Ana García" }));
    await usuario.click(screen.getByRole("button", { name: "Borrar casa" }));
    expect(router.state.location.pathname).toBe("/");
    await screen.findByRole("region", { name: "Casas y lugares" });
    expect(titulosInicio("Casas y lugares")).toEqual(["Otra"]);
    expect(leer("casas.json")).toEqual([casa("c2", "Otra", ["p2"])]);
    expect(leer("personas.json")).toEqual([ana, bruno]);
  });

  test("T11.6 si el guardado falla al editar, la casa no cambia y se ve el banner de error (RNF9)", async () => {
    const { usuario, banco, leer } = await montar({ personas: [ana, bruno], casas: [casa("c1", "Casa", ["p1"])], ruta: "/casa/c1" });
    const inicial = leer("casas.json");
    await usuario.click(screen.getByRole("button", { name: "Opciones de la casa" }));
    await usuario.click(screen.getByRole("button", { name: "Editar información" }));
    const apodo = screen.getByLabelText("Apodo del hogar");
    await usuario.clear(apodo);
    await usuario.type(apodo, "Casa cambiada");
    await usuario.click(fila("Bruno"));
    banco.fallarEscrituraTmp("casas.json");
    await usuario.click(guardar());

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(screen.queryByText("Casa guardada")).toBeNull();
    expect(leer("casas.json")).toEqual(inicial);
    expect(screen.getByLabelText("Apodo del hogar")).toHaveValue("Casa cambiada");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.getByRole("heading", { level: 2, name: "Casa" })).toBeInTheDocument();
    expect(screen.queryByText("Casa cambiada")).toBeNull();
    expect(within(regionMiembros()).getAllByRole("link").map((a) => a.getAttribute("aria-label"))).toEqual(["Ana García"]);
  });

  test("T11.6b si falla crear, la casa no aparece en Inicio y se ve el banner de error (RNF9)", async () => {
    const { usuario, banco, leer } = await montar({ personas: [ana] });
    await usuario.click(screen.getByRole("link", { name: "Añadir casa" }));
    await usuario.type(screen.getByLabelText("Apodo del hogar"), "Casa fallida");
    await usuario.click(fila("Ana García"));
    banco.fallarEscrituraTmp("casas.json");
    await usuario.click(guardar());
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(leer("casas.json")).toEqual([]);
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.queryByRole("region", { name: "Casas y lugares" })).toBeNull();
    expect(screen.queryByText("Casa fallida")).toBeNull();
  });
});
