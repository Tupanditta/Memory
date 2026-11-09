// Sprint 13: comprobaciones de cierre sobre el código y los archivos del proyecto.
// Cubren las restricciones que no dependen de una pantalla (R2 a R7, R9, R10, R12),
// RNF2/RNF4 (sin red), la reconciliación de design.md con package.json y los JSON de ejemplo.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { rutas } from "../src/App";
import { TIPOS_FECHA } from "../src/modelos/tipos";
import { validarCasa, validarFecha, validarPersona } from "../src/modelos/validadores";
import { ARCHIVOS } from "../src/repositorio/repositorio";
import paquete from "../package.json";

const app = resolve(__dirname, "..");
const repo = resolve(app, "..");
const software = resolve(repo, "Software");
const leer = (ruta: string) => readFileSync(ruta, "utf8");

/** Todos los archivos de código de la app (`src/`), más `index.html` y la configuración de Capacitor. */
function archivosDeCodigo(): { ruta: string; texto: string }[] {
  const resultado: { ruta: string; texto: string }[] = [];
  const recorrer = (carpeta: string) => {
    for (const nombre of readdirSync(carpeta)) {
      const ruta = join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.(ts|tsx|css|html)$/.test(nombre)) resultado.push({ ruta: relative(app, ruta), texto: leer(ruta) });
    }
  };
  recorrer(resolve(app, "src"));
  for (const nombre of ["index.html", "capacitor.config.ts"]) resultado.push({ ruta: nombre, texto: leer(resolve(app, nombre)) });
  return resultado;
}

const codigo = archivosDeCodigo();
const dependencias = Object.keys({ ...paquete.dependencies, ...paquete.devDependencies });

/** Archivos de código que contienen el patrón (para que el fallo diga dónde). */
const conPatron = (patron: RegExp) => codigo.filter((archivo) => patron.test(archivo.texto)).map((archivo) => archivo.ruta);

describe("Sprint 13: cierre", () => {
  test("el recorrido encuentra el código de la app", () => {
    expect(codigo.map((archivo) => archivo.ruta.replace(/\\/g, "/"))).toEqual(
      expect.arrayContaining(["src/App.tsx", "src/repositorio/repositorio.ts", "src/estilos.css", "index.html"]),
    );
  });

  test("RNF2, RNF4, R2, R3: el código no usa red (fetch, XHR, sockets ni URL remotas)", () => {
    expect(conPatron(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/)).toEqual([]);
    expect(conPatron(/https?:\/\//)).toEqual([]);
    expect(conPatron(/@import\s+url\(\s*["']?(https?:)?\/\//)).toEqual([]);
  });

  test("RNF2: fuentes e iconos van empaquetados en la app", () => {
    for (const paqueteFuente of ["@fontsource/lora", "@fontsource/playfair-display", "material-symbols"]) {
      expect(dependencias).toContain(paqueteFuente);
    }
    expect(conPatron(/fonts\.googleapis|fonts\.gstatic/)).toEqual([]);
  });

  test("R2, R3, R7: sin backend, cuentas, nube ni sincronización", () => {
    const prohibidas = /firebase|supabase|amplify|aws-sdk|@aws|appwrite|parse-server|axios|auth0|@capacitor\/preferences|@capacitor\/http|socket\.io|graphql|apollo/i;
    expect(dependencias.filter((nombre) => prohibidas.test(nombre))).toEqual([]);
    expect(conPatron(/\blogin\b|iniciar sesi[oó]n|contrase[ñn]a|password/i)).toEqual([]);
  });

  test("R4: notificaciones solo locales (sin push)", () => {
    expect(dependencias).toContain("@capacitor/local-notifications");
    expect(dependencias.filter((nombre) => /push|fcm|onesignal|firebase/i.test(nombre))).toEqual([]);
    expect(conPatron(/PushNotifications/)).toEqual([]);
  });

  test("R5: el calendario solo admite cumpleaños y aniversarios", () => {
    expect([...TIPOS_FECHA]).toEqual(["cumpleaños", "aniversario"]);
    expect(validarFecha({ tipo: "reunión", etiqueta: "", dia: 1, mes: 1 }).ok).toBe(false);
  });

  test("R6: sin mapas, geolocalización ni navegación", () => {
    expect(dependencias.filter((nombre) => /geolocation|maps|leaflet|mapbox|google/i.test(nombre))).toEqual([]);
    expect(conPatron(/navigator\.geolocation|Geolocation/)).toEqual([]);
  });

  test("R10: solo las pantallas descritas (Inicio, Calendario, Ajustes, Persona y Casa)", () => {
    const caminos: string[] = [];
    const recorrer = (lista: typeof rutas) => {
      for (const ruta of lista) {
        if (ruta.path) caminos.push(ruta.path);
        if (ruta.children) recorrer(ruta.children);
      }
    };
    recorrer(rutas);
    expect(caminos.sort()).toEqual(["/", "/ajustes", "/calendario", "/casa/:id", "/persona/:id"]);
  });

  test("R9: los datos solo viven en personas.json, casas.json y ajustes.json", () => {
    expect(Object.values(ARCHIVOS).sort()).toEqual(["ajustes.json", "casas.json", "personas.json"]);
    // Solo el almacén de la vista previa web usa almacenamiento del navegador.
    expect(conPatron(/localStorage\.|sessionStorage|indexedDB|document\.cookie/).map((ruta) => ruta.replace(/\\/g, "/"))).toEqual([]);
    expect(conPatron(/window\.localStorage/).map((ruta) => ruta.replace(/\\/g, "/"))).toEqual(["src/repositorio/almacenLocalStorage.ts"]);
  });

  test("R12: en la raíz del repositorio solo hay .gitignore, .gitattributes y README.md", () => {
    const archivos = readdirSync(repo).filter((nombre) => statSync(resolve(repo, nombre)).isFile());
    expect(archivos.filter((nombre) => ![".gitignore", ".gitattributes", "README.md"].includes(nombre))).toEqual([]);
    for (const carpeta of ["Software", "memory-app"]) expect(statSync(resolve(repo, carpeta)).isDirectory()).toBe(true);
  });

  test("JSON de ejemplo de Software/ válidos según el modelo de datos (RNF10)", () => {
    const personas: unknown = JSON.parse(leer(resolve(software, "personas.json")));
    const casas: unknown = JSON.parse(leer(resolve(software, "casas.json")));
    expect(Array.isArray(personas)).toBe(true);
    expect(Array.isArray(casas)).toBe(true);
    const listaPersonas = personas as { id: string }[];
    for (const persona of listaPersonas) expect(validarPersona(persona)).toEqual({ ok: true });
    const ids = new Set(listaPersonas.map((persona) => persona.id));
    for (const casa of casas as { personas: string[] }[]) {
      expect(validarCasa(casa)).toEqual({ ok: true });
      for (const id of casa.personas) expect(ids.has(id)).toBe(true);
    }
  });

  test("design.md recoge las versiones exactas de package.json", () => {
    const design = leer(resolve(software, "design.md"));
    const tabla = design.slice(design.indexOf("Versiones exactas"), design.indexOf("#### Versión de Android"));
    const filas = tabla.split("\n").filter((linea) => linea.startsWith("| ") && !linea.startsWith("| Paquete") && !linea.startsWith("|---"));
    const enDesign = new Map<string, string>();
    for (const fila of filas) {
      const [nombres, versiones] = fila.split("|").slice(1, 3).map((celda) => celda.replace(/\(.*\)/, "").trim());
      const listaNombres = nombres.split(" / ");
      const listaVersiones = versiones.split(" / ");
      const prefijo = listaNombres[0].includes("/") ? listaNombres[0].slice(0, listaNombres[0].indexOf("/") + 1) : "";
      listaNombres.forEach((nombre, indice) => {
        const completo = nombre.startsWith("@") || !prefijo ? nombre : prefijo + nombre;
        enDesign.set(completo, listaVersiones[Math.min(indice, listaVersiones.length - 1)]);
      });
    }
    const todas: Record<string, string> = { ...paquete.dependencies, ...paquete.devDependencies };
    for (const [nombre, version] of Object.entries(todas)) {
      expect(version, `${nombre} sin ^ ni ~`).toMatch(/^\d+\.\d+\.\d+$/);
      expect(enDesign.get(nombre), `${nombre} en design.md`).toBe(version);
    }
  });
});
