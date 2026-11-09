// Sprint 5: estado y pantallas de personas (T5.1 a T5.6), con el repositorio real
// sobre un sistema de archivos simulado en memoria.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { rutas } from "../src/App";
import { ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../src/modelos/tipos";
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

/** Monta la app en `ruta` con los datos indicados en el disco simulado. */
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
  // Espera a que termine la carga de datos.
  await screen.findByRole("heading", { level: 1 });
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, router, usuario, leer };
}

const lista = () => screen.queryByRole("region", { name: "Personas" });
const nombresEnLista = () => {
  const region = lista();
  return region ? within(region).getAllByRole("link").map((a) => a.textContent) : [];
};

describe("Sprint 5: estado y pantallas de personas", () => {
  test("T5.1 al arrancar, la UI muestra las personas del JSON (RNF7)", async () => {
    await montar({ personas: [persona("p1", "Ana García"), persona("p2", "Bruno", { apodo: "Bru" })] });
    expect(nombresEnLista()).toEqual(["Ana García", "Bruno (Bru)"]);
  });

  test("T5.1b si un JSON está dañado, se muestra un error claro y no se escribe nada", async () => {
    const banco = bancoArchivos();
    banco.poner("personas.json", "{ no es json");
    render(
      <ProveedorApp almacen={banco.almacen}>
        <RouterProvider router={createMemoryRouter(rutas)} />
      </ProveedorApp>,
    );
    expect(await screen.findByText("No se pudieron cargar los datos")).toBeInTheDocument();
    expect(screen.getByText(/personas\.json está dañado/)).toBeInTheDocument();
    expect(banco.archivos()).toEqual({ "personas.json": "{ no es json" });
  });

  test("T5.2 crear una persona desde el formulario la muestra en la lista y está en el JSON (CU1)", async () => {
    const { usuario, leer, router } = await montar();
    await usuario.click(screen.getByRole("link", { name: "Añadir persona" }));
    await usuario.type(screen.getByLabelText("Nombre"), "José Pérez");
    await usuario.type(screen.getByLabelText("Apodo"), "Pepe");
    await usuario.type(screen.getByLabelText("Calle"), "Calle Mayor");
    await usuario.click(screen.getByRole("button", { name: "Añadir fecha" }));
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(fecha).getByLabelText("Día"), "14");
    await usuario.type(within(fecha).getByLabelText("Mes"), "3");
    await usuario.type(within(fecha).getByLabelText("Año (opcional)"), "1990");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("heading", { name: "José Pérez" })).toBeInTheDocument();
    const guardadas = leer("personas.json");
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({
      nombre: "José Pérez",
      apodo: "Pepe",
      direccion: { ...direccionVacia(), calle: "Calle Mayor" },
      fechas: [{ tipo: "cumpleaños", etiqueta: "", dia: 14, mes: 3, anio: 1990 }],
    });
    expect(router.state.location.pathname).toBe(`/persona/${guardadas[0].id}`);

    await usuario.click(screen.getByRole("link", { name: "Volver" }));
    expect(nombresEnLista()).toEqual(["José Pérez (Pepe)Calle Mayor"]);
  });

  test("T5.3 si el guardado falla, la persona no aparece en la lista y se ve un mensaje de error (RNF9)", async () => {
    const { usuario, banco, leer } = await montar({ personas: [persona("p1", "Ana")] });
    await usuario.click(screen.getByRole("link", { name: "Añadir persona" }));
    await usuario.type(screen.getByLabelText("Nombre"), "Bruno");
    banco.fallarEscrituraTmp("personas.json");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(leer("personas.json")).toEqual([persona("p1", "Ana")]);
    // Sigue en el formulario con lo escrito; al volver, la lista no la muestra.
    expect(screen.getByLabelText("Nombre")).toHaveValue("Bruno");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(nombresEnLista()).toEqual(["Ana"]);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
  });

  test("T5.4 el buscador filtra la lista y el detalle muestra dirección, fechas y casas con dirección y convivientes (CU3, RF7)", async () => {
    const ana = persona("p1", "Ana García", {
      apodo: "Anita",
      direccion: { ...direccionVacia(), calle: "Calle Alcalá", numero: "42", piso: "3", puerta: "B", ciudad: "Madrid", notas: "Timbre roto" },
      fechas: [
        { tipo: "cumpleaños", etiqueta: "", dia: 14, mes: 3, anio: 1990 },
        { tipo: "aniversario", etiqueta: "Boda", dia: 2, mes: 6 },
      ],
    });
    const pedro = persona("p2", "Pedro García");
    const jose = persona("p3", "JOSÉ Ruiz");
    const { usuario } = await montar({
      personas: [ana, pedro, jose],
      casas: [casa("c1", "Casa de los abuelos", ["p1", "p2"], { calle: "Calle Sol", numero: "5", ciudad: "Toledo" }), casa("c2", "Piso de la playa", ["p1"])],
    });

    const buscador = screen.getByRole("searchbox", { name: "Buscar" });
    await usuario.type(buscador, "jose");
    expect(nombresEnLista()).toEqual(["JOSÉ Ruiz"]);
    await usuario.clear(buscador);
    await usuario.type(buscador, "timbre");
    expect(nombresEnLista()).toEqual(["Ana García (Anita)Calle Alcalá 42, 3B, Madrid"]);
    await usuario.clear(buscador);
    await usuario.type(buscador, "zzz");
    expect(lista()).toBeNull();
    expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
    await usuario.clear(buscador);
    await usuario.type(buscador, "abuelos");
    expect(nombresEnLista()).toEqual(["Ana García (Anita)Calle Alcalá 42, 3B, Madrid", "Pedro García"]);

    await usuario.click(screen.getByRole("link", { name: /Ana García/ }));
    expect(await screen.findByRole("heading", { name: "Ana García" })).toBeInTheDocument();
    expect(screen.getByText("“Anita”")).toBeInTheDocument();

    const direccion = screen.getByRole("region", { name: "Dirección" });
    for (const texto of ["Calle Alcalá", "42", "3", "B", "Madrid", "Timbre roto"]) expect(within(direccion).getByText(texto)).toBeInTheDocument();

    const fechas = within(screen.getByRole("region", { name: "Fechas" })).getAllByRole("listitem").map((li) => li.textContent);
    expect(fechas).toEqual(["Cumpleaños: 14/03/1990", "Aniversario (Boda): 02/06"]);

    const casas = within(screen.getByRole("region", { name: "Casas" })).getAllByRole("listitem");
    expect(casas).toHaveLength(2);
    expect(casas[0]).toHaveTextContent("Casa de los abuelos");
    expect(casas[0]).toHaveTextContent("Calle Sol 5, Toledo");
    expect(casas[0]).toHaveTextContent("Con: Pedro García");
    expect(casas[1]).toHaveTextContent("Piso de la playa");
    expect(casas[1]).toHaveTextContent("Vive sola en esta casa");
  });

  test("T5.5 editar una persona actualiza la lista y el JSON (CU2)", async () => {
    const { usuario, leer } = await montar({
      personas: [persona("p1", "Ana", { fechas: [{ tipo: "cumpleaños", etiqueta: "", dia: 1, mes: 1 }] }), persona("p2", "Bruno")],
      ruta: "/persona/p1",
    });
    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const nombre = screen.getByLabelText("Nombre");
    expect(nombre).toHaveValue("Ana");
    await usuario.clear(nombre);
    await usuario.type(nombre, "Ana María");
    await usuario.type(screen.getByLabelText("Ciudad"), "Sevilla");
    await usuario.click(within(screen.getByRole("group", { name: "Fecha 1" })).getByRole("button", { name: "Quitar fecha" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("heading", { name: "Ana María" })).toBeInTheDocument();
    expect(leer("personas.json")).toEqual([
      persona("p1", "Ana María", { direccion: { ...direccionVacia(), ciudad: "Sevilla" } }),
      persona("p2", "Bruno"),
    ]);
    await usuario.click(screen.getByRole("link", { name: "Volver" }));
    expect(nombresEnLista()).toEqual(["Ana MaríaSevilla", "Bruno"]);
  });

  test("T5.5 borrar una persona avisa de las casas que se borran y actualiza la lista y el JSON (CU2, RF7b)", async () => {
    const { usuario, leer, router } = await montar({
      personas: [persona("p1", "Ana"), persona("p2", "Bruno")],
      casas: [casa("c1", "Casa de Ana", ["p1"]), casa("c2", "Casa compartida", ["p1", "p2"])],
      ruta: "/persona/p1",
    });
    await usuario.click(screen.getByRole("button", { name: "Borrar" }));
    const dialogo = screen.getByRole("alertdialog", { name: "Confirmar borrado" });
    expect(dialogo).toHaveTextContent("También se borrarán estas casas, porque se quedarían vacías: Casa de Ana");

    // Cancelar no cambia nada.
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(leer("personas.json")).toHaveLength(2);

    await usuario.click(screen.getByRole("button", { name: "Borrar" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar borrado" }));
    expect(router.state.location.pathname).toBe("/");
    // React Router pinta la navegación en una transición: se espera a que aparezca Inicio.
    await screen.findByRole("region", { name: "Personas" });
    expect(nombresEnLista()).toEqual(["Bruno"]);
    expect(leer("personas.json")).toEqual([persona("p2", "Bruno")]);
    expect(leer("casas.json")).toEqual([casa("c2", "Casa compartida", ["p2"])]);
  });

  test("T5.5 si el borrado falla, la persona sigue y se ve el error (RNF9)", async () => {
    const { usuario, banco, leer } = await montar({ personas: [persona("p1", "Ana")], ruta: "/persona/p1" });
    banco.fallarConfirmar("personas.json");
    await usuario.click(screen.getByRole("button", { name: "Borrar" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar borrado" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron guardar los cambios");
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(leer("personas.json")).toEqual([persona("p1", "Ana")]);
  });

  test("T5.6 con el nombre vacío, el formulario no guarda y pide el nombre (CU1)", async () => {
    const { usuario, banco, router } = await montar({ ruta: "/persona/nueva" });
    const antes = banco.archivos();
    await usuario.type(screen.getByLabelText("Apodo"), "Sin nombre");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe el nombre");
    await usuario.type(screen.getByLabelText("Nombre"), "   ");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe el nombre");
    expect(banco.archivos()).toEqual(antes);
    expect(router.state.location.pathname).toBe("/persona/nueva");
  });

  test("T5.6b una fecha inválida en el formulario no se guarda y se explica el error (CU4)", async () => {
    const { usuario, banco } = await montar({ ruta: "/persona/nueva" });
    const antes = banco.archivos();
    await usuario.type(screen.getByLabelText("Nombre"), "Ana");
    await usuario.click(screen.getByRole("button", { name: "Añadir fecha" }));
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(fecha).getByLabelText("Día"), "31");
    await usuario.type(within(fecha).getByLabelText("Mes"), "2");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Fecha 1: El día no existe en ese mes");
    expect(banco.archivos()).toEqual(antes);
  });
});
