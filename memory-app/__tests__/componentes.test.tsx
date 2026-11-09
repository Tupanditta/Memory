// T9.9 a T9.11: componentes base (barra de pestañas, hoja inferior, diálogo, campo y chip),
// más el registro del botón atrás de Android.
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { cerrarUltimo, registrarCierre } from "../src/componentes/atras";
import BarraPestanas from "../src/componentes/BarraPestanas";
import Campo from "../src/componentes/Campo";
import ChipSeleccion from "../src/componentes/ChipSeleccion";
import DialogoConfirmacion from "../src/componentes/DialogoConfirmacion";
import HojaInferior from "../src/componentes/HojaInferior";

function montarPestanas(ruta: string) {
  const pantalla = (titulo: string) => <h1>{titulo}</h1>;
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Outlet />
            <BarraPestanas />
          </>
        ),
        children: [
          { path: "/", element: pantalla("Pantalla Inicio") },
          { path: "/calendario", element: pantalla("Pantalla Calendario") },
          { path: "/ajustes", element: pantalla("Pantalla Ajustes") },
        ],
      },
    ],
    { initialEntries: [ruta] },
  );
  render(<RouterProvider router={router} />);
  return { router, usuario: userEvent.setup() };
}

describe("Sprint 9: componentes base", () => {
  test("T9.9 BarraPestanas muestra Inicio, Calendario y Ajustes, marca la activa y navega", async () => {
    const { router, usuario } = montarPestanas("/calendario");
    const barra = screen.getByRole("navigation", { name: "Pestañas" });
    const enlaces = within(barra).getAllByRole("link");
    expect(enlaces.map((e) => e.textContent)).toEqual(["cottageInicio", "calendar_monthCalendario", "tuneAjustes"]);
    expect(within(barra).getByRole("link", { name: "Calendario" })).toHaveAttribute("aria-current", "page");
    expect(within(barra).getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");

    await usuario.click(within(barra).getByRole("link", { name: "Ajustes" }));
    expect(router.state.location.pathname).toBe("/ajustes");
    expect(screen.getByRole("heading", { name: "Pantalla Ajustes" })).toBeInTheDocument();
    expect(within(barra).getByRole("link", { name: "Ajustes" })).toHaveAttribute("aria-current", "page");
    expect(within(barra).getByRole("link", { name: "Calendario" })).not.toHaveAttribute("aria-current");

    await usuario.click(within(barra).getByRole("link", { name: "Inicio" }));
    expect(router.state.location.pathname).toBe("/");
  });

  test("T9.10 HojaInferior se abre y se cierra al pulsar fuera (no al pulsar dentro)", async () => {
    const usuario = userEvent.setup();
    function Prueba() {
      const [abierta, setAbierta] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAbierta(true)}>
            Abrir
          </button>
          <HojaInferior abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Opciones">
            <p>Contenido de la hoja</p>
          </HojaInferior>
        </>
      );
    }
    render(<Prueba />);
    expect(screen.queryByRole("dialog")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Abrir" }));
    const hoja = screen.getByRole("dialog", { name: "Opciones" });
    expect(hoja).toHaveAttribute("aria-modal", "true");

    await usuario.click(screen.getByText("Contenido de la hoja"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await usuario.click(screen.getByTestId("capa-hoja"));
    expect(screen.queryByRole("dialog")).toBeNull();

    // También se cierra con su botón y con atrás.
    await usuario.click(screen.getByRole("button", { name: "Abrir" }));
    await usuario.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Abrir" }));
    let cerrada = false;
    act(() => {
      cerrada = cerrarUltimo();
    });
    expect(cerrada).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cerrarUltimo()).toBe(false);
  });

  test("T9.10 DialogoConfirmacion llama a confirmar o a cancelar según el botón y a nada más", async () => {
    const usuario = userEvent.setup();
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    const { rerender } = render(
      <DialogoConfirmacion abierta titulo="Confirmar borrado" textoConfirmar="Borrar" peligro onConfirmar={onConfirmar} onCancelar={onCancelar}>
        ¿Borrar a Ana?
      </DialogoConfirmacion>,
    );
    const dialogo = screen.getByRole("alertdialog", { name: "Confirmar borrado" });
    expect(within(dialogo).getByText("¿Borrar a Ana?")).toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole("button", { name: "Borrar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onCancelar).not.toHaveBeenCalled();

    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onConfirmar).toHaveBeenCalledTimes(1);

    rerender(
      <DialogoConfirmacion abierta={false} titulo="Confirmar borrado" textoConfirmar="Borrar" onConfirmar={onConfirmar} onCancelar={onCancelar}>
        ¿Borrar a Ana?
      </DialogoConfirmacion>,
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  test("T9.11 Campo muestra el rótulo y el mensaje de error", () => {
    const { rerender } = render(<Campo etiqueta="Nombre" rotulo="Obligatorio" value="" onChange={() => undefined} />);
    const entrada = screen.getByLabelText("Nombre");
    expect(screen.getByText("Obligatorio")).toBeInTheDocument();
    expect(entrada).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("Escribe el nombre")).toBeNull();

    rerender(<Campo etiqueta="Nombre" rotulo="Obligatorio" error="Escribe el nombre" value="" onChange={() => undefined} />);
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Escribe el nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveAccessibleDescription("Escribe el nombre");

    rerender(<Campo etiqueta="Apodo" rotulo="Opcional" value="" onChange={() => undefined} />);
    expect(screen.getByText("Opcional")).toBeInTheDocument();
    expect(screen.getByLabelText("Apodo")).toBeInTheDocument();
  });

  test("T9.11 Campo en píldora no muestra etiqueta: es su nombre accesible y su marcador", () => {
    render(<Campo etiqueta="Calle" variante="pildora" value="" onChange={() => undefined} />);
    const entrada = screen.getByRole("textbox", { name: "Calle" });
    expect(entrada).toHaveAttribute("placeholder", "Calle");
  });

  test("T9.11 ChipSeleccion alterna su estado con aria-pressed", async () => {
    const usuario = userEvent.setup();
    function Prueba() {
      const [activo, setActivo] = useState(false);
      return (
        <ChipSeleccion activo={activo} onClick={() => setActivo((a) => !a)}>
          Cumpleaños
        </ChipSeleccion>
      );
    }
    render(<Prueba />);
    const chip = screen.getByRole("button", { name: "Cumpleaños" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await usuario.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await usuario.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  test("botón atrás: cierra primero lo último que se abrió", () => {
    const orden: string[] = [];
    const quitarA = registrarCierre(() => orden.push("a"));
    const quitarB = registrarCierre(() => orden.push("b"));
    expect(cerrarUltimo()).toBe(true);
    expect(orden).toEqual(["b"]);
    quitarB();
    expect(cerrarUltimo()).toBe(true);
    expect(orden).toEqual(["b", "a"]);
    quitarA();
    expect(cerrarUltimo()).toBe(false);
  });
});
