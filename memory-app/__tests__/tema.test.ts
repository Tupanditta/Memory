// T9.1: los tokens de `tailwind.config.ts` coinciden con el bloque `tailwind.config` de los
// `code.html` del prototipo; la tipografía es Lora y Playfair Display (desviación de design.md).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import config, { prototipo } from "../tailwind.config";

const carpetaPrototipo = resolve(__dirname, "../../Software/prototipo");

/** Bloque `tailwind.config = {...}` de cada `code.html`, evaluado como objeto. */
function bloques(): { pantalla: string; extend: Record<string, unknown> }[] {
  return readdirSync(carpetaPrototipo)
    .filter((nombre) => statSync(resolve(carpetaPrototipo, nombre)).isDirectory())
    .flatMap((pantalla) => {
      const ruta = resolve(carpetaPrototipo, pantalla, "code.html");
      let html: string;
      try {
        html = readFileSync(ruta, "utf8");
      } catch {
        return [];
      }
      const texto = /tailwind\.config\s*=\s*(\{[\s\S]*?\});\s*<\/script>/.exec(html)?.[1];
      if (!texto) throw new Error(`Sin bloque tailwind.config en ${pantalla}`);
      const objeto = new Function(`return (${texto});`)() as { theme: { extend: Record<string, unknown> } };
      return [{ pantalla, extend: objeto.theme.extend }];
    });
}

describe("Sprint 9: tokens del prototipo", () => {
  const todos = bloques();

  test("hay un bloque por cada pantalla del prototipo", () => {
    expect(todos.length).toBe(6);
  });

  test.each(["colors", "borderRadius", "spacing", "fontSize"] as const)("T9.1 %s coincide con todos los code.html", (clave) => {
    for (const { pantalla, extend } of todos) {
      expect(prototipo?.[clave], `${clave} en ${pantalla}`).toEqual(extend[clave]);
    }
  });

  test("T9.1 la configuración final usa esos tokens y añade las sombras con nombre", () => {
    const extend = config.theme.extend;
    expect(extend.colors).toEqual(todos[0].extend.colors);
    expect(Object.keys(extend.boxShadow)).toEqual(["tarjeta", "buscador", "buscador-foco", "barra", "boton-azul", "boton-lila", "cabecera"]);
  });

  test("T9.1 fontFamily: Playfair Display en los títulos y Lora en el resto, con respaldo Georgia", () => {
    const familias = prototipo?.fontFamily as Record<string, string[]>;
    expect(Object.keys(familias).sort()).toEqual(Object.keys(todos[0].extend.fontFamily as object).sort());
    for (const [clave, pila] of Object.entries(familias)) {
      expect(pila[0], clave).toBe(clave.startsWith("headline-") ? "Playfair Display" : "Lora");
      expect(pila.slice(1)).toEqual(["Georgia", "serif"]);
    }
  });
});
