// Sprint 8: exportar e importar desde Ajustes (CU11, CU12), con el compartidor,
// el selector de archivos y las notificaciones simulados.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { rutas } from "../src/App";
import { ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Casa, type Persona } from "../src/modelos/tipos";
import type { Compartidor, SelectorArchivo } from "../src/servicios/archivosExternos";
import { bancoArchivos } from "./simulados/almacenes";
import { NotificadorSimulado } from "./simulados/notificador";

const persona = (id: string, nombre: string, cambios: Partial<Persona> = {}): Persona => ({ id, nombre, apodo: "", direccion: direccionVacia(), fechas: [], ...cambios });
const casa = (id: string, apodo: string, personas: string[]): Casa => ({ id, apodo, direccion: direccionVacia(), personas });

class CompartidorSimulado implements Compartidor {
  compartidos: string[] = [];
  fallar = false;
  async compartir(_nombre: string, contenido: string) {
    if (this.fallar) throw new Error("Disco lleno");
    this.compartidos.push(contenido);
  }
}

class SelectorSimulado implements SelectorArchivo {
  /** Texto del próximo archivo elegido; `null` = cancelar. */
  constructor(public texto: string | null = null) {}
  async elegir() {
    return this.texto;
  }
}

async function montar({ personas = [] as Persona[], casas = [] as Casa[] } = {}) {
  const banco = bancoArchivos();
  banco.poner("personas.json", JSON.stringify(personas));
  banco.poner("casas.json", JSON.stringify(casas));
  banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: "09:00" }));
  const compartidor = new CompartidorSimulado();
  const selector = new SelectorSimulado();
  const notificador = new NotificadorSimulado();
  const router = createMemoryRouter(rutas, { initialEntries: ["/ajustes"] });
  const usuario = userEvent.setup();
  render(
    <ProveedorApp almacen={banco.almacen} externos={{ compartidor, selector, notificador }}>
      <RouterProvider router={router} />
    </ProveedorApp>,
  );
  await screen.findByRole("heading", { name: "Ajustes" });
  const leer = (nombre: string) => JSON.parse(banco.archivos()[nombre]);
  return { banco, usuario, leer, compartidor, selector, notificador };
}

const archivo = (personas: unknown[], casas: unknown[] = []) => JSON.stringify({ version: 1, exportadoEn: "2026-01-01T00:00:00.000Z", personas, casas });
const nombresEnInicio = () => within(screen.getByRole("region", { name: "Personas" })).getAllByRole("link").map((a) => a.textContent);

describe("Sprint 8: exportar e importar en Ajustes", () => {
  test("T8.1 el botón Exportar comparte un JSON con los datos actuales (RF11, CU11)", async () => {
    const ana = persona("p1", "Ana");
    const { usuario, compartidor } = await montar({ personas: [ana], casas: [casa("c1", "Casa", ["p1"])] });
    await usuario.click(screen.getByRole("button", { name: "Exportar" }));
    await waitFor(() => expect(compartidor.compartidos).toHaveLength(1));
    expect(JSON.parse(compartidor.compartidos[0])).toMatchObject({ version: 1, personas: [ana], casas: [casa("c1", "Casa", ["p1"])] });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("T8.2b si exportar falla, se ve un error (CU11)", async () => {
    const { usuario, compartidor } = await montar();
    compartidor.fallar = true;
    await usuario.click(screen.getByRole("button", { name: "Exportar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo crear el archivo de exportación");
  });

  test("T8.10 importar muestra el resumen y las personas nuevas aparecen en la lista (CU12)", async () => {
    const { usuario, selector, leer, notificador } = await montar({ personas: [persona("p2", "Bruno")] });
    selector.texto = archivo(
      [persona("p1", "Ana", { fechas: [{ tipo: "cumpleaños", etiqueta: "", dia: 14, mes: 3 }] }), persona("x2", "bruno")],
      [casa("c1", "Casa nueva", ["p1", "x2"]), casa("c2", "Rota", ["fantasma"])],
    );
    await usuario.click(screen.getByRole("button", { name: "Importar" }));
    expect(await screen.findByLabelText("Resumen de importación")).toHaveTextContent("Personas: 1 añadidas, 1 omitidas. Casas: 1 añadidas, 1 omitidas.");
    expect(leer("casas.json")).toEqual([casa("c1", "Casa nueva", ["p1", "p2"])]);
    // Las fechas importadas también tienen su aviso.
    await waitFor(() => expect(notificador.programadas).toHaveLength(1));

    await usuario.click(screen.getByRole("link", { name: "Inicio" }));
    expect(nombresEnInicio()).toEqual(["Ana", "Bruno"]);
  });

  test("T8.8 un archivo inválido se rechaza con un error y no cambia nada", async () => {
    const { usuario, selector, banco } = await montar({ personas: [persona("p2", "Bruno")] });
    const antes = banco.archivos();
    selector.texto = JSON.stringify({ personas: [], casas: [] });
    await usuario.click(screen.getByRole("button", { name: "Importar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("versión");
    expect(screen.queryByLabelText("Resumen de importación")).not.toBeInTheDocument();
    expect(banco.archivos()).toEqual(antes);
  });

  test("T8.9 si el guardado falla al importar, no se añade nada y se ve el error (RNF8, RNF9)", async () => {
    const { usuario, selector, banco } = await montar({ personas: [persona("p2", "Bruno")] });
    const antes = banco.archivos();
    banco.fallarEscrituraTmp("personas.json");
    selector.texto = archivo([persona("p1", "Ana")]);
    await usuario.click(screen.getByRole("button", { name: "Importar" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(banco.archivos()).toEqual(antes);
    await usuario.click(screen.getByRole("link", { name: "Inicio" }));
    expect(nombresEnInicio()).toEqual(["Bruno"]);
  });

  test("cancelar la elección de archivo no cambia nada ni muestra nada", async () => {
    const { usuario, banco } = await montar({ personas: [persona("p2", "Bruno")] });
    const antes = banco.archivos();
    await usuario.click(screen.getByRole("button", { name: "Importar" }));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Resumen de importación")).not.toBeInTheDocument();
    expect(banco.archivos()).toEqual(antes);
  });
});
