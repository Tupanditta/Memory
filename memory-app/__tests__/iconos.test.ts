// T9.2: todos los nombres de icono usados en la app existen en el paquete `material-symbols`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const raiz = resolve(__dirname, "..");

/** Nombres que publica el paquete (`index.d.ts`). */
function nombresDelPaquete(): Set<string> {
  const tipos = readFileSync(resolve(raiz, "node_modules/material-symbols/index.d.ts"), "utf8");
  return new Set([...tipos.matchAll(/^\s*"([a-z0-9_]+)",?$/gm)].map((m) => m[1]));
}

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = resolve(carpeta, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

/** Iconos usados: `<Icono nombre="x">` y las props o campos `icono…="x"` / `icono: "x"`. */
function iconosUsados(): Map<string, string> {
  const usados = new Map<string, string>();
  for (const archivo of archivos(resolve(raiz, "src"))) {
    const codigo = readFileSync(archivo, "utf8");
    const patrones = [/<Icono\b[^>]*?\snombre="([^"]+)"/g, /\bicono\w*(?:=|:\s*)"([^"]+)"/g];
    for (const patron of patrones) for (const m of codigo.matchAll(patron)) usados.set(m[1], archivo);
  }
  return usados;
}

describe("Sprint 9: iconos", () => {
  test("T9.2 todos los iconos usados existen en material-symbols", () => {
    const paquete = nombresDelPaquete();
    expect(paquete.size).toBeGreaterThan(1000);
    const usados = iconosUsados();
    // Comprueba que la búsqueda encuentra los iconos (si no, el test no probaría nada).
    for (const conocido of ["cottage", "calendar_month", "tune", "arrow_back", "close", "star"]) expect(usados.has(conocido), conocido).toBe(true);
    const inexistentes = [...usados].filter(([nombre]) => !paquete.has(nombre)).map(([nombre, archivo]) => `${nombre} (${archivo})`);
    expect(inexistentes).toEqual([]);
  });

  test("T9.2 un nombre inventado no está en la lista", () => {
    expect(nombresDelPaquete().has("icono_que_no_existe")).toBe(false);
  });
});
