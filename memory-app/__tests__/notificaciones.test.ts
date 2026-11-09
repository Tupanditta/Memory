// Sprint 7: calendario y notificaciones a nivel de utilidades y servicios
// (T7.1 a T7.5 sin interfaz), con el módulo de notificaciones simulado.
import type { Channel, ScheduleOptions } from "@capacitor/local-notifications";
import { describe, expect, test, vi } from "vitest";
import { ajustesPorDefecto, direccionVacia, type Fecha, type Persona } from "../src/modelos/tipos";
import type { Datos } from "../src/repositorio/repositorio";
import { AjustesService } from "../src/servicios/ajustesService";
import { avisosDe, idAviso, NotificacionesService } from "../src/servicios/notificacionesService";
import { CANAL_AVISOS, crearNotificador, NotificadorCapacitor, NotificadorNulo } from "../src/servicios/notificador";
import { PersonasService } from "../src/servicios/personasService";
import { Tienda } from "../src/servicios/tienda";
import { diaAvisoAnual, entradasCalendario, textoDiaMes } from "../src/utilidades/calendario";
import { diasDelMes } from "../src/utilidades/fechas";
import { NotificadorSimulado } from "./simulados/notificador";

const cumple = (dia: number, mes: number, anio?: number): Fecha => ({ tipo: "cumpleaños", etiqueta: "", dia, mes, ...(anio ? { anio } : {}) });
const aniversario = (dia: number, mes: number, etiqueta = ""): Fecha => ({ tipo: "aniversario", etiqueta, dia, mes });
const persona = (id: string, nombre: string, fechas: Fecha[] = []): Persona => ({ id, nombre, apodo: "", direccion: direccionVacia(), fechas });

/** Tienda con un repositorio que siempre guarda bien. */
function montar(personas: Persona[], hora = "09:00") {
  const datos: Datos = { personas, casas: [], ajustes: { horaNotificacion: hora } };
  const tienda = new Tienda({ guardar: async () => ({ ok: true, valor: undefined }) }, datos);
  const notificador = new NotificadorSimulado();
  const notificaciones = new NotificacionesService(notificador);
  const sincronizar = () => notificaciones.sincronizar(tienda.datos.personas, tienda.datos.ajustes.horaNotificacion);
  return { tienda, notificador, notificaciones, sincronizar, personas: new PersonasService(tienda), ajustes: new AjustesService(tienda) };
}

describe("Sprint 7: calendario", () => {
  test("T7.1 el calendario lista solo fechas, ordenadas por la más próxima (RF8)", () => {
    const desde = new Date(2026, 2, 10, 18, 30); // 10 de marzo de 2026, por la tarde
    const personas = [
      persona("p1", "Ana", [cumple(14, 3, 1990), aniversario(5, 1, "Boda")]),
      persona("p2", "Bruno"), // sin fechas: no aparece
      persona("p3", "Carla", [cumple(10, 3)]), // hoy
      persona("p4", "Álvaro", [cumple(14, 3)]), // mismo día que Ana: por nombre sin acentos
      persona("p5", "Dani", [cumple(9, 3)]), // ya pasó: el año que viene
    ];
    const entradas = entradasCalendario(personas, desde);
    expect(entradas.map((e) => [e.persona.nombre, e.fecha.dia, e.fecha.mes, e.dias])).toEqual([
      ["Carla", 10, 3, 0],
      ["Álvaro", 14, 3, 4],
      ["Ana", 14, 3, 4],
      ["Ana", 5, 1, 301],
      ["Dani", 9, 3, 364],
    ]);
    expect(entradas[3].proxima).toEqual(new Date(2027, 0, 5));
    expect(entradas[3].indice).toBe(1);
    expect(entradasCalendario([persona("p2", "Bruno")], desde)).toEqual([]);
  });

  test("T7.1b el 29/02 sale el 1 de marzo en años no bisiestos y el 29 en bisiestos", () => {
    const personas = [persona("p1", "Ana", [cumple(29, 2)])];
    expect(entradasCalendario(personas, new Date(2026, 1, 1))[0].proxima).toEqual(new Date(2026, 2, 1));
    expect(entradasCalendario(personas, new Date(2028, 1, 1))[0].proxima).toEqual(new Date(2028, 1, 29));
    expect(textoDiaMes({ dia: 14, mes: 3 })).toBe("14 de marzo");
  });
});

describe("Sprint 7: notificaciones", () => {
  test("T7.2 cada fecha tiene una notificación anual el día anterior a la hora de ajustes, con nombre y tipo (RF9, CU6)", async () => {
    const { notificador, sincronizar } = montar([persona("p1", "Ana", [cumple(14, 3, 1990), aniversario(1, 1, "Boda")]), persona("p2", "Bruno")], "08:45");
    expect(await sincronizar()).toBe("programadas");
    expect(notificador.programadas).toEqual([
      { id: idAviso("p1", 0), titulo: "Mañana: cumpleaños de Ana", cuerpo: "14 de marzo", dia: 13, mes: 3, hora: 8, minuto: 45 },
      { id: idAviso("p1", 1), titulo: "Mañana: aniversario de Ana", cuerpo: "1 de enero (Boda)", dia: 31, mes: 12, hora: 8, minuto: 45 },
    ]);
  });

  test("T7.2b el aviso anual nunca cae el 29/02", () => {
    expect(diaAvisoAnual({ dia: 1, mes: 3 })).toEqual({ dia: 28, mes: 2 });
    expect(diaAvisoAnual({ dia: 29, mes: 2 })).toEqual({ dia: 28, mes: 2 });
    expect(diaAvisoAnual({ dia: 1, mes: 5 })).toEqual({ dia: 30, mes: 4 });
    expect(diaAvisoAnual({ dia: 1, mes: 8 })).toEqual({ dia: 31, mes: 7 });
    for (let mes = 1; mes <= 12; mes++) for (let dia = 1; dia <= diasDelMes(mes); dia++) expect(diaAvisoAnual({ dia, mes })).not.toEqual({ dia: 29, mes: 2 });
  });

  test("T7.2c los ids son números enteros estables y distintos por fecha", () => {
    expect(idAviso("p1", 0)).toBe(idAviso("p1", 0));
    const ids = ["p1", "p2", "a1b2c3d4-e5f6-4789-8abc-def012345678"].flatMap((p) => [0, 1, 2].map((i) => idAviso(p, i)));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(Number.isInteger(id) && id >= 0 && id <= 0x7fffffff).toBe(true);
  });

  test("T7.3 borrar una persona o una fecha cancela sus notificaciones", async () => {
    const { notificador, sincronizar, personas, tienda } = montar([
      persona("p1", "Ana", [cumple(14, 3), aniversario(20, 6)]),
      persona("p2", "Bruno", [cumple(2, 2)]),
    ]);
    await sincronizar();
    expect(notificador.programadas).toHaveLength(3);

    expect((await personas.borrar("p2")).ok).toBe(true);
    await sincronizar();
    expect(notificador.programadas.map((a) => a.titulo)).toEqual(["Mañana: cumpleaños de Ana", "Mañana: aniversario de Ana"]);

    expect((await personas.borrarFecha("p1", 0)).ok).toBe(true);
    await sincronizar();
    expect(notificador.programadas).toEqual(avisosDe(tienda.datos.personas, "09:00"));
    expect(notificador.programadas.map((a) => [a.titulo, a.dia, a.mes])).toEqual([["Mañana: aniversario de Ana", 19, 6]]);

    // Sin ninguna fecha, no queda nada programado y no se pide permiso.
    expect((await personas.borrar("p1")).ok).toBe(true);
    expect(await sincronizar()).toBe("sinFechas");
    expect(notificador.programadas).toEqual([]);
    expect(notificador.pedidos).toBe(0);
  });

  test("T7.4 editar una fecha reprograma su notificación sin duplicarla", async () => {
    const { notificador, sincronizar, personas } = montar([persona("p1", "Ana", [cumple(14, 3)])]);
    await sincronizar();
    expect((await personas.editarFecha("p1", 0, cumple(20, 4))).ok).toBe(true);
    await sincronizar();
    expect(notificador.programadas).toHaveLength(1);
    expect(notificador.programadas[0]).toMatchObject({ id: idAviso("p1", 0), dia: 19, mes: 4, cuerpo: "20 de abril" });
  });

  test("T7.5 cambiar la hora reprograma todas las notificaciones con la nueva hora (RF10, CU10)", async () => {
    const { notificador, sincronizar, ajustes, tienda } = montar([persona("p1", "Ana", [cumple(14, 3)]), persona("p2", "Bruno", [cumple(2, 2)])]);
    await sincronizar();
    expect((await ajustes.cambiarHora("20:30")).ok).toBe(true);
    expect(tienda.datos.ajustes).toEqual({ horaNotificacion: "20:30" });
    await sincronizar();
    expect(notificador.programadas).toHaveLength(2);
    expect(notificador.programadas.every((a) => a.hora === 20 && a.minuto === 30)).toBe(true);

    // Una hora no válida no se guarda.
    const mala = await ajustes.cambiarHora("25:00");
    expect(mala.ok).toBe(false);
    expect(tienda.datos.ajustes).toEqual({ horaNotificacion: "20:30" });
  });

  test("T7.6 sin permiso no se programa nada; el permiso se pide una sola vez y solo si hay fechas", async () => {
    const { notificador, sincronizar, personas } = montar([persona("p1", "Ana")]);
    notificador.estado = "preguntar";
    notificador.respuesta = "denegado";
    expect(await sincronizar()).toBe("sinFechas");
    expect(notificador.pedidos).toBe(0);

    await personas.anadirFecha("p1", cumple(14, 3));
    expect(await sincronizar()).toBe("sinPermiso");
    expect(notificador.pedidos).toBe(1);
    expect(notificador.programadas).toEqual([]);

    // Android puede volver a ofrecer el diálogo ("preguntar"), pero no se insiste en la misma sesión.
    notificador.estado = "preguntar";
    expect(await sincronizar()).toBe("sinPermiso");
    expect(notificador.pedidos).toBe(1);
  });

  test("T7.6b un fallo del sistema de notificaciones no lanza", async () => {
    const { notificador, sincronizar } = montar([persona("p1", "Ana", [cumple(14, 3)])]);
    notificador.fallarProgramar = true;
    expect(await sincronizar()).toBe("error");
    expect(await sincronizar()).toBe("programadas");
  });

  test("las sincronizaciones seguidas no se mezclan: queda solo la última", async () => {
    const { notificador, notificaciones } = montar([]);
    const a = notificaciones.sincronizar([persona("p1", "Ana", [cumple(14, 3)])], "09:00");
    const b = notificaciones.sincronizar([persona("p2", "Bruno", [cumple(2, 2)])], "10:00");
    await Promise.all([a, b]);
    expect(notificador.programadas.map((x) => x.titulo)).toEqual(["Mañana: cumpleaños de Bruno"]);
  });
});

describe("Sprint 7: notificador de Capacitor y vista previa web", () => {
  function pluginFalso(permiso = "granted") {
    return {
      checkPermissions: vi.fn(async () => ({ display: permiso as "granted" })),
      requestPermissions: vi.fn(async () => ({ display: "denied" as const })),
      cancelAll: vi.fn(async () => {}),
      createChannel: vi.fn(async (_canal: Channel) => {}),
      schedule: vi.fn(async (_opciones: ScheduleOptions) => ({ notifications: [] })),
    };
  }

  test("programa en el canal `avisos`, cada año, con el mes de Android empezando en 0", async () => {
    const plugin = pluginFalso();
    const notificador = new NotificadorCapacitor(plugin);
    const avisos = avisosDe([persona("p1", "Ana", [cumple(14, 3), cumple(1, 1)])], "09:05");
    await notificador.programar(avisos);
    await notificador.programar(avisos);
    expect(plugin.createChannel).toHaveBeenCalledTimes(1);
    expect(plugin.createChannel.mock.calls[0][0]).toMatchObject({ id: CANAL_AVISOS });
    expect(plugin.schedule.mock.calls[0][0]).toEqual({
      notifications: [
        {
          id: idAviso("p1", 0),
          title: "Mañana: cumpleaños de Ana",
          body: "14 de marzo",
          channelId: "avisos",
          // 13 de marzo: marzo es el mes 2 en `Calendar.MONTH` de Android.
          schedule: { on: { month: 2, day: 13, hour: 9, minute: 5, second: 0 }, allowWhileIdle: true },
        },
        {
          id: idAviso("p1", 1),
          title: "Mañana: cumpleaños de Ana",
          body: "1 de enero",
          channelId: "avisos",
          schedule: { on: { month: 11, day: 31, hour: 9, minute: 5, second: 0 }, allowWhileIdle: true },
        },
      ],
    });
    await notificador.cancelarTodas();
    expect(plugin.cancelAll).toHaveBeenCalledTimes(1);
  });

  test("traduce el estado del permiso", async () => {
    expect(await new NotificadorCapacitor(pluginFalso("granted")).permiso()).toBe("concedido");
    expect(await new NotificadorCapacitor(pluginFalso("denied")).permiso()).toBe("denegado");
    expect(await new NotificadorCapacitor(pluginFalso("prompt")).permiso()).toBe("preguntar");
    expect(await new NotificadorCapacitor(pluginFalso("prompt-with-rationale")).permiso()).toBe("preguntar");
    expect(await new NotificadorCapacitor(pluginFalso("prompt")).pedirPermiso()).toBe("denegado");
  });

  test("en la vista previa web el servicio de notificaciones no hace nada y no falla", async () => {
    const notificador = crearNotificador();
    expect(notificador).toBeInstanceOf(NotificadorNulo);
    const servicio = new NotificacionesService(notificador);
    expect(await servicio.sincronizar([persona("p1", "Ana", [cumple(14, 3)])], ajustesPorDefecto().horaNotificacion)).toBe("programadas");
    expect(await servicio.sincronizar([], "09:00")).toBe("sinFechas");
  });
});
