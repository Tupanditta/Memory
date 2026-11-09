// Sprint 1: modelos y utilidades (T1.1 a T1.7).
import { describe, expect, test } from "vitest";
import { direccionVacia, type Casa, type Fecha, type Persona } from "../src/modelos/tipos";
import { validarCasa, validarFecha, validarPersona } from "../src/modelos/validadores";
import { fechaAviso, proximaFecha } from "../src/utilidades/fechas";
import { normalizarTexto } from "../src/utilidades/texto";

const persona = (cambios: Partial<Persona> = {}): Persona => ({
  id: "p1",
  nombre: "Ana",
  apodo: "",
  direccion: direccionVacia(),
  fechas: [],
  ...cambios,
});

const fecha = (cambios: Partial<Fecha> = {}): Fecha => ({ tipo: "cumpleaños", etiqueta: "", dia: 1, mes: 1, ...cambios });

const dia = (anio: number, mes: number, d: number) => new Date(anio, mes - 1, d);

describe("Sprint 1: validadores", () => {
  test("T1.1 persona sin nombre o con nombre en blanco es inválida; solo con nombre es válida (RF1, RNF1)", () => {
    expect(validarPersona(persona({ nombre: "" })).ok).toBe(false);
    expect(validarPersona(persona({ nombre: "   " })).ok).toBe(false);
    expect(validarPersona({ ...persona(), nombre: undefined }).ok).toBe(false);
    expect(validarPersona(persona({ nombre: "Ana" }))).toEqual({ ok: true });
  });

  test("T1.2 fecha 31/02 es inválida; 29/02 es válida (RF3)", () => {
    expect(validarFecha(fecha({ dia: 31, mes: 2 })).ok).toBe(false);
    expect(validarFecha(fecha({ dia: 29, mes: 2 }))).toEqual({ ok: true });
    expect(validarFecha(fecha({ dia: 29, mes: 2, anio: 2024 }))).toEqual({ ok: true });
    expect(validarFecha(fecha({ dia: 29, mes: 2, anio: 2023 })).ok).toBe(false);
    expect(validarFecha(fecha({ dia: 31, mes: 4 })).ok).toBe(false);
    expect(validarFecha(fecha({ dia: 0, mes: 1 })).ok).toBe(false);
    expect(validarFecha(fecha({ dia: 1, mes: 13 })).ok).toBe(false);
    expect(validarFecha(fecha({ tipo: "aniversario", etiqueta: "Boda", dia: 15, mes: 6, anio: 2010 }))).toEqual({ ok: true });
    expect(validarFecha({ ...fecha(), tipo: "santo" }).ok).toBe(false);
    // Una persona con una fecha inválida también es inválida.
    expect(validarPersona(persona({ fechas: [fecha({ dia: 31, mes: 2 })] })).ok).toBe(false);
  });

  test("T1.3 casa con lista de personas vacía es inválida; con una persona es válida (R8)", () => {
    const casa: Casa = { id: "c1", apodo: "Casa de los abuelos", direccion: direccionVacia(), personas: [] };
    expect(validarCasa(casa).ok).toBe(false);
    expect(validarCasa({ ...casa, personas: ["p1"] })).toEqual({ ok: true });
  });
});

describe("Sprint 1: utilidades", () => {
  test('T1.4 normalizarTexto("ÁNGEL Ñu") devuelve "angel nu" (RNF3)', () => {
    expect(normalizarTexto("ÁNGEL Ñu")).toBe("angel nu");
    expect(normalizarTexto("José ü ç")).toBe("jose u c");
  });

  test("T1.5 proximaFecha devuelve este año si la fecha aún no pasó, y el siguiente si ya pasó", () => {
    const desde = new Date(2026, 4, 10, 18, 30); // 10/05/2026 a las 18:30
    expect(proximaFecha({ dia: 20, mes: 6 }, desde)).toEqual(dia(2026, 6, 20));
    expect(proximaFecha({ dia: 1, mes: 3 }, desde)).toEqual(dia(2027, 3, 1));
    // El propio día cuenta como próxima fecha (design.md).
    expect(proximaFecha({ dia: 10, mes: 5 }, desde)).toEqual(dia(2026, 5, 10));
    expect(proximaFecha({ dia: 9, mes: 5 }, desde)).toEqual(dia(2027, 5, 9));
  });

  test("T1.6 fechaAviso de un 1 de marzo es el 28 o 29 de febrero según el año", () => {
    expect(fechaAviso({ dia: 1, mes: 3 }, dia(2027, 1, 15))).toEqual(dia(2027, 2, 28));
    expect(fechaAviso({ dia: 1, mes: 3 }, dia(2028, 1, 15))).toEqual(dia(2028, 2, 29));
    // Cambio de año: el aviso del 1 de enero es el 31 de diciembre.
    expect(fechaAviso({ dia: 1, mes: 1 }, dia(2026, 6, 1))).toEqual(dia(2026, 12, 31));
  });

  test("T1.7 cumpleaños 29/02 en año no bisiesto avisa el 28/02 (design.md)", () => {
    expect(fechaAviso({ dia: 29, mes: 2 }, dia(2027, 1, 15))).toEqual(dia(2027, 2, 28));
    expect(proximaFecha({ dia: 29, mes: 2 }, dia(2027, 1, 15))).toEqual(dia(2027, 3, 1));
    // En año bisiesto se celebra el 29 y se avisa el 28.
    expect(proximaFecha({ dia: 29, mes: 2 }, dia(2028, 1, 15))).toEqual(dia(2028, 2, 29));
    expect(fechaAviso({ dia: 29, mes: 2 }, dia(2028, 1, 15))).toEqual(dia(2028, 2, 28));
  });
});
