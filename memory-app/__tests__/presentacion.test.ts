// T9.3 a T9.8: reglas de presentación (utilidades/presentacion.ts).
import { describe, expect, test } from "vitest";
import {
  colorAvatar,
  diasHasta,
  edad,
  esCercana,
  etiquetaProximaFecha,
  fechaConDiaSemana,
  fechaCorta,
  fechaLarga,
  PALETA_AVATAR,
  saludo,
  signoZodiacal,
  textoMiembros,
  textoSeleccionados,
} from "../src/utilidades/presentacion";

const a = (hh: number, mm: number) => new Date(2026, 10, 9, hh, mm);

describe("Sprint 9: reglas de presentación", () => {
  test("T9.3 saludo según la hora", () => {
    expect(saludo(a(6, 0))).toBe("Buenos días");
    expect(saludo(a(11, 59))).toBe("Buenos días");
    expect(saludo(a(12, 0))).toBe("Buenas tardes");
    expect(saludo(a(20, 59))).toBe("Buenas tardes");
    expect(saludo(a(21, 0))).toBe("Buenas noches");
    expect(saludo(a(5, 59))).toBe("Buenas noches");
    expect(saludo(a(0, 0))).toBe("Buenas noches");
  });

  test("T9.4 colorAvatar es estable y siempre de la paleta", () => {
    const ids = ["p1", "p2", "abc", "8f3c2a", "", "persona-con-id-largo-123456"];
    for (const id of ids) {
      const color = colorAvatar(id);
      expect(colorAvatar(id)).toEqual(color);
      expect(PALETA_AVATAR).toContainEqual(color);
    }
    expect(PALETA_AVATAR).toEqual([
      { fondo: "bg-primary-fixed", texto: "text-on-primary-fixed" },
      { fondo: "bg-secondary-fixed", texto: "text-on-secondary-fixed" },
      { fondo: "bg-tertiary-fixed", texto: "text-on-tertiary-fixed" },
      { fondo: "bg-secondary-fixed-dim", texto: "text-on-secondary-fixed" },
      { fondo: "bg-surface-variant", texto: "text-on-surface" },
    ]);
    // Con muchos ids se usan varias parejas (no siempre la misma).
    const usados = new Set(Array.from({ length: 50 }, (_, i) => colorAvatar(`id${i}`).fondo));
    expect(usados.size).toBeGreaterThan(1);
  });

  test("T9.5 textoMiembros", () => {
    expect(textoMiembros(["Ana García"])).toBe("Ana García");
    expect(textoMiembros(["Ana García", "Bruno Díaz"])).toBe("Ana García, Bruno Díaz");
    expect(textoMiembros(["Ana García", "Bruno Díaz", "Carla"])).toBe("Ana, Bruno y 1 más");
    expect(textoMiembros(["Ana García", "Bruno Díaz", "Carla", "Dani"])).toBe("Ana, Bruno y 2 más");
  });

  test("T9.6 signoZodiacal en las fronteras de la tabla", () => {
    expect(signoZodiacal(19, 2)).toBe("Piscis");
    expect(signoZodiacal(20, 3)).toBe("Piscis");
    expect(signoZodiacal(21, 3)).toBe("Aries");
    expect(signoZodiacal(19, 4)).toBe("Aries");
    expect(signoZodiacal(20, 4)).toBe("Tauro");
    expect(signoZodiacal(18, 2)).toBe("Acuario");
    expect(signoZodiacal(29, 2)).toBe("Piscis");
    expect(signoZodiacal(31, 12)).toBe("Capricornio");
    expect(signoZodiacal(1, 1)).toBe("Capricornio");
    expect(signoZodiacal(19, 1)).toBe("Capricornio");
    expect(signoZodiacal(20, 1)).toBe("Acuario");
    expect(signoZodiacal(22, 12)).toBe("Capricornio");
    expect(signoZodiacal(21, 12)).toBe("Sagitario");
  });

  test("T9.7 edad: años cumplidos hoy; sin año, null", () => {
    const hoy = new Date(2026, 5, 15); // 15/06/2026
    expect(edad({ dia: 14, mes: 6, anio: 1990 }, hoy)).toBe(36); // ya los cumplió
    expect(edad({ dia: 15, mes: 6, anio: 1990 }, hoy)).toBe(36); // los cumple hoy
    expect(edad({ dia: 16, mes: 6, anio: 1990 }, hoy)).toBe(35); // aún no
    expect(edad({ dia: 1, mes: 12, anio: 2000 }, hoy)).toBe(25);
    expect(edad({ dia: 1, mes: 1, anio: 2000 }, hoy)).toBe(26);
    expect(edad({ dia: 14, mes: 6 }, hoy)).toBeNull();
  });

  test("T9.8 etiquetaProximaFecha, diasHasta y fecha cercana", () => {
    const hoy = new Date(2026, 2, 10, 18, 30); // 10/03/2026 por la tarde
    expect(etiquetaProximaFecha({ dia: 10, mes: 3 }, hoy)).toBe("Hoy");
    expect(etiquetaProximaFecha({ dia: 11, mes: 3 }, hoy)).toBe("Mañana");
    expect(etiquetaProximaFecha({ dia: 15, mes: 3 }, hoy)).toBe("En 5 días");
    expect(diasHasta({ dia: 9, mes: 3 }, hoy)).toBe(364); // ya pasó: el año que viene
    expect(diasHasta({ dia: 17, mes: 3 }, hoy)).toBe(7);
    expect(esCercana({ dia: 17, mes: 3 }, hoy)).toBe(true);
    expect(diasHasta({ dia: 18, mes: 3 }, hoy)).toBe(8);
    expect(esCercana({ dia: 18, mes: 3 }, hoy)).toBe(false);
  });

  test("T9.8 formatos de fecha y contador de seleccionados", () => {
    expect(fechaCorta({ dia: 2, mes: 6 })).toBe("02 Jun");
    expect(fechaCorta({ dia: 14, mes: 12 })).toBe("14 Dic");
    expect(fechaLarga({ dia: 14, mes: 3 })).toBe("14 de Marzo");
    expect(fechaConDiaSemana(new Date(2026, 2, 14))).toBe("Sábado, 14 de Marzo");
    expect(textoSeleccionados(0)).toBe("0 seleccionados");
    expect(textoSeleccionados(1)).toBe("1 seleccionado");
    expect(textoSeleccionados(3)).toBe("3 seleccionados");
  });
});
