// Sprint 7: calendario, notificaciones y ajustes desde la interfaz (T7.1 a T7.7),
// con el repositorio real sobre archivos simulados y el módulo de notificaciones simulado.
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";
import { rutas } from "../src/App";
import { AVISO_SIN_PERMISO, ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Fecha, type Persona } from "../src/modelos/tipos";
import { avisosDe } from "../src/servicios/notificacionesService";
import { bancoArchivos, type Banco } from "./simulados/almacenes";
import { NotificadorSimulado } from "./simulados/notificador";

const cumple = (dia: number, mes: number): Fecha => ({ tipo: "cumpleaños", etiqueta: "", dia, mes });
const persona = (id: string, nombre: string, fechas: Fecha[] = []): Persona => ({ id, nombre, apodo: "", direccion: direccionVacia(), fechas });

interface Opciones {
  personas?: Persona[];
  hora?: string;
  ruta?: string;
  notificador?: NotificadorSimulado;
  /** Reabrir la app sobre los mismos archivos. */
  banco?: Banco;
}

async function montar({ personas = [], hora = "09:00", ruta = "/", notificador = new NotificadorSimulado(), banco }: Opciones = {}) {
  if (!banco) {
    banco = bancoArchivos();
    banco.poner("personas.json", JSON.stringify(personas));
    banco.poner("casas.json", "[]");
    banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: hora }));
  }
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const usuario = userEvent.setup();
  render(
    <ProveedorApp almacen={banco.almacen} externos={{ notificador }}>
      <RouterProvider router={router} />
    </ProveedorApp>,
  );
  await screen.findByRole("heading", { level: 1 });
  const b = banco;
  const leer = (nombre: string) => JSON.parse(b.archivos()[nombre]);
  return { banco: b, router, usuario, leer, notificador };
}

const filasCalendario = () => within(screen.getByRole("list", { name: "Próximas fechas" })).getAllByRole("listitem").map((li) => li.textContent);

afterEach(() => {
  vi.useRealTimers();
});

describe("Sprint 7: calendario, notificaciones y ajustes en la interfaz", () => {
  test("T7.1 el calendario lista solo fechas, ordenadas por la más próxima (RF8, CU5)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 2, 10, 12, 0));
    const { usuario, router } = await montar({
      personas: [
        persona("p1", "Ana", [cumple(14, 3), { tipo: "aniversario", etiqueta: "Boda", dia: 5, mes: 1 }]),
        persona("p2", "Bruno"),
        persona("p3", "Carla", [cumple(10, 3)]),
        persona("p4", "Dani", [cumple(11, 3)]),
      ],
    });
    await usuario.click(screen.getByRole("link", { name: "Calendario" }));
    expect(screen.getByRole("heading", { name: "Calendario" })).toBeInTheDocument();
    expect(filasCalendario()).toEqual([
      "CarlaCumpleaños · 10 de marzoHoy",
      "DaniCumpleaños · 11 de marzoMañana",
      "AnaCumpleaños · 14 de marzoEn 4 días",
      "AnaAniversario (Boda) · 5 de eneroEn 301 días",
    ]);
    // Bruno no tiene fechas: no aparece.
    expect(screen.queryByText(/Bruno/)).not.toBeInTheDocument();
    await usuario.click(screen.getByRole("link", { name: /Dani/ }));
    expect(router.state.location.pathname).toBe("/persona/p4");
  });

  test("T7.1b sin fechas, el calendario lo indica", async () => {
    await montar({ personas: [persona("p1", "Ana")], ruta: "/calendario" });
    expect(screen.getByText("Sin fechas guardadas")).toBeInTheDocument();
  });

  test("T7.2 guardar la primera fecha pide permiso y programa su aviso el día anterior a la hora de ajustes (RF9)", async () => {
    const notificador = new NotificadorSimulado("preguntar", "concedido");
    const { usuario } = await montar({ hora: "08:15", notificador, ruta: "/persona/nueva" });

    // Una persona sin fechas no pide permiso.
    await usuario.type(screen.getByLabelText("Nombre"), "Bruno");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("heading", { name: "Bruno" });
    await waitFor(() => expect(notificador.programaciones + notificador.pedidos).toBe(0));

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    await usuario.click(screen.getByRole("button", { name: "Añadir fecha" }));
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(fecha).getByLabelText("Día"), "14");
    await usuario.type(within(fecha).getByLabelText("Mes"), "3");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(notificador.programadas).toHaveLength(1));
    expect(notificador.pedidos).toBe(1);
    expect(notificador.programadas[0]).toMatchObject({ titulo: "Mañana: cumpleaños de Bruno", dia: 13, mes: 3, hora: 8, minuto: 15 });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("T7.3 borrar una persona o una fecha cancela sus notificaciones", async () => {
    const personas = [persona("p1", "Ana", [cumple(14, 3), cumple(20, 6)]), persona("p2", "Bruno", [cumple(2, 2)])];
    const notificador = new NotificadorSimulado();
    await notificador.programar(avisosDe(personas, "09:00")); // de una sesión anterior
    const { usuario, leer } = await montar({ personas, notificador, ruta: "/persona/p2" });

    await usuario.click(screen.getByRole("button", { name: "Borrar" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar borrado" }));
    await screen.findByRole("heading", { name: "Memory" });
    await waitFor(() => expect(notificador.programadas).toEqual(avisosDe([personas[0]], "09:00")));

    await usuario.click(screen.getByRole("link", { name: "Ana" }));
    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    await usuario.click(within(screen.getByRole("group", { name: "Fecha 1" })).getByRole("button", { name: "Quitar fecha" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(notificador.programadas).toEqual(avisosDe(leer("personas.json"), "09:00")));
    expect(notificador.programadas.map((a) => [a.dia, a.mes])).toEqual([[19, 6]]);
  });

  test("T7.4 editar una fecha reprograma su notificación sin duplicarla", async () => {
    const personas = [persona("p1", "Ana", [cumple(14, 3)])];
    const notificador = new NotificadorSimulado();
    await notificador.programar(avisosDe(personas, "09:00"));
    const { usuario } = await montar({ personas, notificador, ruta: "/persona/p1" });

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const dia = within(screen.getByRole("group", { name: "Fecha 1" })).getByLabelText("Día");
    await usuario.clear(dia);
    await usuario.type(dia, "20");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(notificador.programadas[0]).toMatchObject({ dia: 19, mes: 3 }));
    expect(notificador.programadas).toHaveLength(1);
  });

  test("T7.5 cambiar la hora reprograma todas las notificaciones con la nueva hora (RF10, CU10)", async () => {
    const personas = [persona("p1", "Ana", [cumple(14, 3)]), persona("p2", "Bruno", [cumple(2, 2), cumple(9, 9)])];
    const notificador = new NotificadorSimulado();
    await notificador.programar(avisosDe(personas, "09:00"));
    const { usuario, leer } = await montar({ personas, notificador });

    await usuario.click(screen.getByRole("link", { name: "Ajustes" }));
    const hora = screen.getByLabelText("Hora de aviso");
    expect(hora).toHaveValue("09:00");
    await usuario.clear(hora);
    await usuario.type(hora, "20:30");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(notificador.programadas.every((a) => a.hora === 20 && a.minuto === 30)).toBe(true));
    expect(notificador.programadas).toEqual(avisosDe(personas, "20:30"));
    expect(leer("ajustes.json")).toEqual({ horaNotificacion: "20:30" });
    expect(screen.getByText(/el día anterior a las 20:30/)).toBeInTheDocument();
  });

  test("T7.6 si se deniega el permiso, la app sigue funcionando y avisa al usuario una vez", async () => {
    const notificador = new NotificadorSimulado("preguntar", "denegado");
    const { usuario, leer } = await montar({ notificador, ruta: "/persona/nueva" });

    await usuario.type(screen.getByLabelText("Nombre"), "Ana");
    await usuario.click(screen.getByRole("button", { name: "Añadir fecha" }));
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(fecha).getByLabelText("Día"), "14");
    await usuario.type(within(fecha).getByLabelText("Mes"), "3");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("status")).toHaveTextContent(AVISO_SIN_PERMISO);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(leer("personas.json")).toHaveLength(1);
    expect(notificador.programadas).toEqual([]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Se cierra el aviso y la app sigue: otra fecha se guarda y el aviso no vuelve a salir.
    await usuario.click(screen.getByRole("button", { name: "Cerrar aviso de notificaciones" }));
    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    await usuario.click(screen.getByRole("button", { name: "Añadir fecha" }));
    const otra = screen.getByRole("group", { name: "Fecha 2" });
    await usuario.type(within(otra).getByLabelText("Día"), "1");
    await usuario.type(within(otra).getByLabelText("Mes"), "5");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("heading", { name: "Ana" });
    await waitFor(() => expect(leer("personas.json")[0].fechas).toHaveLength(2));
    // Deja que termine la sincronización antes de comprobar que no hay aviso.
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(notificador.pedidos).toBe(1);
  });

  test("T7.7 la hora de ajustes se guarda en ajustes.json y se conserva al reabrir (RNF7)", async () => {
    const { usuario, banco, leer } = await montar({ ruta: "/ajustes" });
    const hora = screen.getByLabelText("Hora de aviso");
    await usuario.clear(hora);
    await usuario.type(hora, "07:30");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(leer("ajustes.json")).toEqual({ horaNotificacion: "07:30" }));

    cleanup();
    await montar({ banco, ruta: "/ajustes" });
    expect(screen.getByLabelText("Hora de aviso")).toHaveValue("07:30");
    expect(screen.getByText(/el día anterior a las 07:30/)).toBeInTheDocument();
  });

  test("T7.7b si guardar la hora falla, se conserva la anterior, se ve el error y no se reprograma (RNF9)", async () => {
    const personas = [persona("p1", "Ana", [cumple(14, 3)])];
    const notificador = new NotificadorSimulado();
    const { usuario, banco, leer } = await montar({ personas, notificador, ruta: "/ajustes" });
    banco.fallarConfirmar("ajustes.json");
    const hora = screen.getByLabelText("Hora de aviso");
    await usuario.clear(hora);
    await usuario.type(hora, "10:00");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(leer("ajustes.json")).toEqual({ horaNotificacion: "09:00" });
    expect(screen.getByLabelText("Hora de aviso")).toHaveValue("09:00");
    expect(screen.getByText(/el día anterior a las 09:00/)).toBeInTheDocument();
    expect(notificador.programaciones).toBe(0);
  });

  test("en la vista previa web (sin notificador inyectado) guardar fechas no falla ni avisa", async () => {
    const banco = bancoArchivos();
    const router = createMemoryRouter(rutas, { initialEntries: ["/persona/nueva"] });
    const usuario = userEvent.setup();
    render(
      <ProveedorApp almacen={banco.almacen}>
        <RouterProvider router={router} />
      </ProveedorApp>,
    );
    await usuario.type(await screen.findByLabelText("Nombre"), "Ana");
    await usuario.click(screen.getByRole("button", { name: "Añadir fecha" }));
    const fecha = screen.getByRole("group", { name: "Fecha 1" });
    await usuario.type(within(fecha).getByLabelText("Día"), "14");
    await usuario.type(within(fecha).getByLabelText("Mes"), "3");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("heading", { name: "Ana" });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
