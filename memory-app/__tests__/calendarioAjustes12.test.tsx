// Sprint 12: calendario y ajustes según el prototipo (T12.1 a T12.9), con el repositorio
// real sobre archivos simulados y notificaciones, compartidor y selector simulados.
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";
import { rutas } from "../src/App";
import { ProveedorApp } from "../src/estado/contexto";
import { direccionVacia, type Casa, type Fecha, type Persona } from "../src/modelos/tipos";
import { pasoMasCercano } from "../src/pantallas/Ajustes";
import { AjustesService } from "../src/servicios/ajustesService";
import type { Compartidor, SelectorArchivo } from "../src/servicios/archivosExternos";
import { avisosDe } from "../src/servicios/notificacionesService";
import { horaDeMinutos, minutosDeHora, textoTamano } from "../src/utilidades/presentacion";
import { deslizadorHora, lecturaHora, moverHora } from "./ayudas";
import { bancoArchivos, type Banco } from "./simulados/almacenes";
import { NotificadorSimulado } from "./simulados/notificador";

const cumple = (dia: number, mes: number, anio?: number): Fecha => ({ tipo: "cumpleaños", etiqueta: "", dia, mes, ...(anio ? { anio } : {}) });
const aniversario = (dia: number, mes: number, etiqueta = "", anio?: number): Fecha => ({ tipo: "aniversario", etiqueta, dia, mes, ...(anio ? { anio } : {}) });
const persona = (id: string, nombre: string, fechas: Fecha[] = [], apodo = ""): Persona => ({ id, nombre, apodo, direccion: direccionVacia(), fechas });

class CompartidorSimulado implements Compartidor {
  compartidos: string[] = [];
  fallar = false;
  async compartir(_nombre: string, contenido: string) {
    if (this.fallar) throw new Error("Disco lleno");
    this.compartidos.push(contenido);
  }
}

class SelectorSimulado implements SelectorArchivo {
  texto: string | null = null;
  async elegir() {
    return this.texto;
  }
}

interface Opciones {
  personas?: Persona[];
  casas?: Casa[];
  hora?: string;
  ruta?: string;
  banco?: Banco;
}

async function montar({ personas = [], casas = [], hora = "09:00", ruta = "/calendario", banco }: Opciones = {}) {
  if (!banco) {
    banco = bancoArchivos();
    banco.poner("personas.json", JSON.stringify(personas));
    banco.poner("casas.json", JSON.stringify(casas));
    banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: hora }));
  }
  const notificador = new NotificadorSimulado();
  const compartidor = new CompartidorSimulado();
  const selector = new SelectorSimulado();
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const usuario = userEvent.setup();
  render(
    <ProveedorApp almacen={banco.almacen} externos={{ notificador, compartidor, selector }}>
      <RouterProvider router={router} />
    </ProveedorApp>,
  );
  await screen.findByRole("heading", { level: 1 });
  const b = banco;
  const leer = (nombre: string) => JSON.parse(b.archivos()[nombre]);
  return { banco: b, router, usuario, leer, notificador, compartidor, selector };
}

/** Fija "hoy" (solo `Date`; los temporizadores siguen siendo reales). */
function hoyEs(fecha: Date) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(fecha);
}

const proximoAviso = () => screen.queryByRole("region", { name: "Próximo aviso" });
const filaDe = (nombre: string) => {
  const fila = within(screen.getByRole("region", { name: "Próximas fechas" }))
    .getAllByRole("link")
    .find((enlace) => enlace.textContent?.includes(nombre));
  if (!fila) throw new Error(`No hay fila de ${nombre}`);
  return fila;
};
/** Insignia (mes y día) y chip ("En N días") de una fila. */
const insignia = (fila: HTMLElement) => fila.querySelector(".shadow-inner") as HTMLElement;
const chip = (fila: HTMLElement) => within(fila).getByText(/^(Hoy|Mañana|En \d+ días)$/);
const chipHora = (hora: string) => within(screen.getByRole("group", { name: "Hora de notificación" })).getByRole("button", { name: hora });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Sprint 12: calendario", () => {
  test("T12.1 'Próximo aviso' muestra la primera fecha con su día, el día de aviso y la hora de ajustes (RF8, RF9)", async () => {
    hoyEs(new Date(2026, 2, 10, 12, 0)); // martes 10 de marzo de 2026
    await montar({ personas: [persona("p1", "Ana García", [cumple(14, 3, 1992)]), persona("p2", "Bruno", [cumple(2, 5)])] });
    const tarjeta = proximoAviso();
    expect(tarjeta).not.toBeNull();
    const t = within(tarjeta!);
    expect(t.getByRole("heading", { name: "Ana García" })).toBeInTheDocument();
    expect(t.getByText("Cumpleaños en 4 días • Sábado, 14 de Marzo")).toBeInTheDocument();
    expect(t.getByText("09:00 h el día anterior (13 Mar)")).toBeInTheDocument();
  });

  test("T12.1b con otra hora de ajustes, hoy y mañana, y un aniversario con etiqueta", async () => {
    hoyEs(new Date(2026, 2, 13, 8, 0));
    await montar({ hora: "20:30", personas: [persona("p1", "Ana", [cumple(14, 3)]), persona("p2", "Carla", [aniversario(1, 4, "Boda")])] });
    let t = within(proximoAviso()!);
    expect(t.getByText("Cumpleaños mañana • Sábado, 14 de Marzo")).toBeInTheDocument();
    expect(t.getByText("20:30 h el día anterior (13 Mar)")).toBeInTheDocument();
    cleanup();

    hoyEs(new Date(2026, 3, 1, 8, 0));
    await montar({ personas: [persona("p2", "Carla", [aniversario(1, 4, "Boda")])] });
    t = within(proximoAviso()!);
    expect(t.getByText("Boda hoy • Miércoles, 1 de Abril")).toBeInTheDocument();
    expect(t.getByText("09:00 h el día anterior (31 Mar)")).toBeInTheDocument();
  });

  test("T12.1c el día de aviso es el que se programa: nunca el 29/02 (design.md, Notificaciones)", async () => {
    hoyEs(new Date(2028, 1, 20, 12, 0)); // 2028 es bisiesto
    await montar({ personas: [persona("p1", "Ana", [cumple(1, 3)])] });
    expect(within(proximoAviso()!).getByText("09:00 h el día anterior (28 Feb)")).toBeInTheDocument();
  });

  test("T12.2 las fechas se agrupan por mes de la próxima ocurrencia, con 'N momentos', ordenadas por próxima fecha (RF8)", async () => {
    hoyEs(new Date(2026, 2, 10, 12, 0));
    await montar({
      personas: [
        persona("p1", "Ana", [cumple(14, 3)]),
        persona("p2", "Fernando", [cumple(22, 3)]),
        persona("p3", "Carlos", [aniversario(28, 4, "Aniversario de bodas")]),
        persona("p4", "Carmen", [cumple(10, 5)]),
        persona("p5", "Dani", [cumple(2, 3)]), // ya pasó: marzo del año que viene
      ],
    });
    const lista = screen.getByRole("region", { name: "Próximas fechas" });
    const meses = within(lista).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(meses).toEqual(["Marzo", "Abril", "Mayo", "Marzo 2027"]);
    const grupo = (nombre: string) => screen.getByRole("region", { name: nombre });
    expect(grupo("Marzo")).toHaveTextContent("2 momentos");
    expect(within(grupo("Marzo")).getAllByRole("link").map((l) => l.textContent)).toEqual([expect.stringContaining("Ana"), expect.stringContaining("Fernando")]);
    expect(grupo("Abril")).toHaveTextContent("1 momento");
    expect(grupo("Abril")).not.toHaveTextContent("1 momentos");
    expect(within(grupo("Marzo 2027")).getByRole("link")).toHaveTextContent("Dani");
    // Punto de color por orden de mes: primary, secondary, tertiary y vuelta a empezar.
    const puntos = meses.map((m) => grupo(m!).querySelector("span.rounded-full.h-2")?.className);
    expect(puntos.map((c) => c?.match(/bg-(primary|secondary|tertiary)\b/)?.[1])).toEqual(["primary", "secondary", "tertiary", "primary"]);
  });

  test("T12.3 cada fila muestra insignia, tipo o etiqueta, edad si hay año y chip; el color distingue cumpleaños y aniversario (R5)", async () => {
    hoyEs(new Date(2026, 2, 10, 12, 0));
    await montar({
      personas: [
        persona("p1", "Ana García", [cumple(14, 3, 1992)], "Anita"),
        persona("p2", "Fernando", [cumple(22, 3)]),
        persona("p3", "Carlos", [aniversario(28, 4, "Aniversario de bodas", 2000)]),
        persona("p4", "Hoy Cumple", [cumple(10, 3)]),
        persona("p5", "Mañana Cumple", [cumple(11, 3)]),
      ],
    });
    const ana = filaDe("Ana García");
    expect(insignia(ana)).toHaveTextContent("Mar14");
    expect(within(ana).getByText("(Anita)")).toBeInTheDocument();
    // Años que cumple en esa fecha.
    expect(within(ana).getByText("Cumpleaños (34 años)")).toBeInTheDocument();
    expect(chip(ana)).toHaveTextContent("En 4 días");

    const fernando = filaDe("Fernando");
    expect(within(fernando).getByText("Cumpleaños")).toBeInTheDocument();
    expect(chip(fernando)).toHaveTextContent("En 12 días");

    const carlos = filaDe("Carlos");
    expect(insignia(carlos)).toHaveTextContent("Abr28");
    expect(within(carlos).getByText("Aniversario de bodas (26 años)")).toBeInTheDocument();
    expect(chip(carlos)).toHaveTextContent("En 49 días");

    expect(chip(filaDe("Hoy Cumple"))).toHaveTextContent("Hoy");
    expect(chip(filaDe("Mañana Cumple"))).toHaveTextContent("Mañana");

    // Colores: cumpleaños (insignia surface-container-high/primary), aniversario (secondary-fixed/secondary).
    expect(insignia(ana)).toHaveClass("bg-surface-container-high", "text-primary");
    expect(insignia(carlos)).toHaveClass("bg-secondary-fixed", "text-secondary");
    // Chip: cumpleaños a 7 días o menos, aniversario y resto.
    expect(chip(ana)).toHaveClass("bg-primary-fixed", "text-on-primary-fixed-variant");
    expect(chip(carlos)).toHaveClass("bg-secondary-fixed", "text-on-secondary-fixed");
    expect(chip(fernando)).toHaveClass("bg-surface-container-high", "text-on-surface-variant");

    // Pulsar una fila abre a la persona.
    await userEvent.setup().click(fernando);
    expect(await screen.findByRole("heading", { name: "Fernando" })).toBeInTheDocument();
  });

  test("T12.4 sin fechas se muestra 'Aún no hay fechas guardadas' y no hay tarjeta de próximo aviso", async () => {
    await montar({ personas: [persona("p1", "Ana")] });
    expect(screen.getByText("Aún no hay fechas guardadas")).toBeInTheDocument();
    expect(screen.getByText("Añade cumpleaños o aniversarios en la ficha de una persona.")).toBeInTheDocument();
    expect(proximoAviso()).toBeNull();
    expect(screen.queryByRole("region", { name: "Próximas fechas" })).toBeNull();
    // La tarjeta final sigue.
    expect(screen.getByText("Cada día guarda una historia")).toBeInTheDocument();
  });
});

describe("Sprint 12: ajustes", () => {
  test("T12.5 el deslizador cubre 06:00–22:00 en pasos de 30; moverlo cambia la lectura al instante y guarda una sola vez al soltar (CU10, RNF7)", async () => {
    const cambiar = vi.spyOn(AjustesService.prototype, "cambiarHora");
    const { leer, notificador } = await montar({ ruta: "/ajustes", personas: [persona("p1", "Ana", [cumple(14, 3)])] });
    const deslizador = deslizadorHora();
    expect(deslizador).toHaveAttribute("min", "360");
    expect(deslizador).toHaveAttribute("max", "1320");
    expect(deslizador).toHaveAttribute("step", "30");
    expect(deslizador).toHaveValue("540");
    expect(lecturaHora()).toHaveTextContent("09:00");

    // Arrastrar: la lectura y el chip activo cambian en cada paso, sin guardar.
    moverHora("07:00", false);
    expect(lecturaHora()).toHaveTextContent("07:00");
    moverHora("08:00", false);
    expect(lecturaHora()).toHaveTextContent("08:00");
    expect(chipHora("08:00")).toHaveAttribute("aria-pressed", "true");
    expect(chipHora("09:00")).toHaveAttribute("aria-pressed", "false");
    moverHora("10:30", false);
    expect(lecturaHora()).toHaveTextContent("10:30");
    await new Promise((r) => setTimeout(r, 20));
    expect(cambiar).not.toHaveBeenCalled();
    expect(leer("ajustes.json")).toEqual({ horaNotificacion: "09:00" });

    // Soltar: se guarda una vez.
    moverHora("10:30");
    await waitFor(() => expect(leer("ajustes.json")).toEqual({ horaNotificacion: "10:30" }));
    expect(cambiar).toHaveBeenCalledTimes(1);
    expect(cambiar).toHaveBeenCalledWith("10:30");
    await waitFor(() => expect(notificador.programadas).toEqual(avisosDe(leer("personas.json"), "10:30")));
    expect(lecturaHora()).toHaveTextContent("10:30");
    expect(deslizadorHora()).toHaveValue("630");

    // Soltar en la hora que ya está guardada no guarda otra vez.
    moverHora("10:30");
    await new Promise((r) => setTimeout(r, 20));
    expect(cambiar).toHaveBeenCalledTimes(1);
  });

  test("T12.6 pulsar un chip de hora la guarda, mueve el deslizador y reprograma las notificaciones (RF10, T7.5)", async () => {
    const personas = [persona("p1", "Ana", [cumple(14, 3)]), persona("p2", "Bruno", [cumple(2, 2)])];
    const { usuario, leer, notificador } = await montar({ ruta: "/ajustes", personas });
    expect(chipHora("09:00")).toHaveAttribute("aria-pressed", "true");
    await usuario.click(chipHora("20:00"));
    await waitFor(() => expect(leer("ajustes.json")).toEqual({ horaNotificacion: "20:00" }));
    expect(deslizadorHora()).toHaveValue("1200");
    expect(lecturaHora()).toHaveTextContent("20:00");
    expect(chipHora("20:00")).toHaveAttribute("aria-pressed", "true");
    expect(chipHora("09:00")).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(notificador.programadas).toEqual(avisosDe(personas, "20:00")));
  });

  test("T12.7 con una hora guardada que no es múltiplo de 30, la lectura la muestra exacta y no se guarda nada al abrir", async () => {
    const cambiar = vi.spyOn(AjustesService.prototype, "cambiarHora");
    const { leer, notificador } = await montar({ ruta: "/ajustes", hora: "09:15", personas: [persona("p1", "Ana", [cumple(14, 3)])] });
    expect(lecturaHora()).toHaveTextContent("09:15");
    expect(deslizadorHora()).toHaveAttribute("aria-valuetext", "09:15");
    // El deslizador va al paso más cercano.
    expect(deslizadorHora()).toHaveValue("570");
    for (const hora of ["08:00", "09:00", "10:30", "20:00"]) expect(chipHora(hora)).toHaveAttribute("aria-pressed", "false");
    await new Promise((r) => setTimeout(r, 20));
    expect(cambiar).not.toHaveBeenCalled();
    expect(notificador.programaciones).toBe(0);
    expect(leer("ajustes.json")).toEqual({ horaNotificacion: "09:15" });
  });

  test("T12.7b utilidades de la hora: paso más cercano dentro de 06:00–22:00 y conversión HH:MM", () => {
    expect(pasoMasCercano("09:00")).toBe(540);
    expect(pasoMasCercano("09:10")).toBe(540);
    expect(pasoMasCercano("09:15")).toBe(570);
    expect(pasoMasCercano("05:00")).toBe(360);
    expect(pasoMasCercano("23:45")).toBe(1320);
    expect(minutosDeHora("20:30")).toBe(1230);
    expect(horaDeMinutos(1230)).toBe("20:30");
    expect(horaDeMinutos(360)).toBe("06:00");
  });

  test("T12.8 exportar muestra 'Realizada hoy a las HH:MM' con el tamaño y un aviso; nada se guarda y desaparece al reiniciar (CU11)", async () => {
    hoyEs(new Date(2026, 2, 10, 18, 30));
    const ana = persona("p1", "Ana", [cumple(14, 3)]);
    const { usuario, banco, compartidor } = await montar({ ruta: "/ajustes", personas: [ana] });
    const antes = banco.archivos();
    expect(screen.queryByText(/Realizada hoy/)).toBeNull();
    expect(screen.queryByLabelText("Resumen de importación")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Exportar" }));
    expect(await screen.findByText("Realizada hoy a las 18:30")).toBeInTheDocument();
    expect(compartidor.compartidos).toHaveLength(1);
    expect(new TextEncoder().encode(compartidor.compartidos[0]).length).toBeLessThan(1024);
    expect(screen.getByLabelText("Última copia")).toHaveTextContent("<1 KB");
    expect(screen.getByRole("status")).toHaveTextContent("Copia exportada en formato JSON");
    expect(banco.archivos()).toEqual(antes);

    // Sigue al cambiar de pestaña (misma sesión) y desaparece al reiniciar la app.
    await usuario.click(screen.getByRole("link", { name: "Inicio" }));
    await usuario.click(screen.getByRole("link", { name: "Ajustes" }));
    expect(screen.getByText("Realizada hoy a las 18:30")).toBeInTheDocument();
    cleanup();
    await montar({ banco, ruta: "/ajustes" });
    expect(screen.queryByText(/Realizada hoy/)).toBeNull();
    expect(banco.archivos()).toEqual(antes);
  });

  test("T12.8b el tamaño de un archivo grande se muestra en KB redondeados", async () => {
    const notas = "x".repeat(400);
    const personas = Array.from({ length: 60 }, (_, i) => ({ ...persona(`p${i}`, `Persona ${i}`), direccion: { ...direccionVacia(), notas } }));
    const { usuario, compartidor } = await montar({ ruta: "/ajustes", personas });
    await usuario.click(screen.getByRole("button", { name: "Exportar" }));
    await screen.findByText(/Realizada hoy a las \d\d:\d\d/);
    const bytes = new TextEncoder().encode(compartidor.compartidos[0]).length;
    expect(bytes).toBeGreaterThan(20 * 1024);
    expect(screen.getByLabelText("Última copia")).toHaveTextContent(`${Math.round(bytes / 1024)} KB`);
    expect(textoTamano(1023)).toBe("<1 KB");
    expect(textoTamano(1024)).toBe("1 KB");
    expect(textoTamano(24 * 1024 + 100)).toBe("24 KB");
  });

  test("T12.8c importar muestra el resumen y 'Datos importados correctamente'; el resumen no se guarda (CU12)", async () => {
    const { usuario, banco, selector, leer } = await montar({ ruta: "/ajustes", personas: [persona("p2", "Bruno")] });
    selector.texto = JSON.stringify({ version: 1, exportadoEn: "2026-01-01T00:00:00.000Z", personas: [persona("p1", "Ana"), persona("x2", "bruno")], casas: [] });
    await usuario.click(screen.getByRole("button", { name: "Importar" }));
    expect(await screen.findByLabelText("Resumen de importación")).toHaveTextContent("Personas: 1 añadidas, 1 omitidas. Casas: 0 añadidas, 0 omitidas.");
    expect(screen.getByRole("status")).toHaveTextContent("Datos importados correctamente");
    expect(screen.queryByText(/Realizada hoy/)).toBeNull();
    expect(Object.keys(banco.archivos()).sort()).toEqual(["ajustes.json", "casas.json", "personas.json"]);
    expect(leer("ajustes.json")).toEqual({ horaNotificacion: "09:00" });

    cleanup();
    await montar({ banco, ruta: "/ajustes" });
    expect(screen.queryByLabelText("Resumen de importación")).toBeNull();
  });

  test("T12.9 si exportar o importar falla, se ve el banner de error y los datos no cambian (RNF9, RNF8)", async () => {
    const { usuario, banco, compartidor, selector } = await montar({ ruta: "/ajustes", personas: [persona("p2", "Bruno")] });
    const antes = banco.archivos();

    compartidor.fallar = true;
    await usuario.click(screen.getByRole("button", { name: "Exportar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo crear el archivo de exportación");
    expect(screen.queryByText(/Realizada hoy/)).toBeNull();
    expect(screen.queryByText("Copia exportada en formato JSON")).toBeNull();
    expect(banco.archivos()).toEqual(antes);

    banco.fallarEscrituraTmp("personas.json");
    selector.texto = JSON.stringify({ version: 1, exportadoEn: "2026-01-01T00:00:00.000Z", personas: [persona("p1", "Ana")], casas: [] });
    await usuario.click(screen.getByRole("button", { name: "Importar" }));
    await waitFor(() => expect(screen.getByRole("alert")).not.toHaveTextContent("exportación"));
    expect(screen.queryByLabelText("Resumen de importación")).toBeNull();
    expect(screen.queryByText("Datos importados correctamente")).toBeNull();
    expect(banco.archivos()).toEqual(antes);
  });

  test("ajustes muestra el pie con la versión de package.json", async () => {
    const { version } = await import("../package.json");
    await montar({ ruta: "/ajustes" });
    expect(screen.getByText(`Memory v${version} • Hecho para recordar lo importante`)).toBeInTheDocument();
    expect(screen.getByText("Guardado local")).toBeInTheDocument();
  });
});
