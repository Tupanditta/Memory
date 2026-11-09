// T9.12: mientras las fuentes o los datos no están cargados, la raíz no pinta las pantallas
// y no oculta el splash; cuando ambos están listos, sí.
import { act, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ProveedorApp } from "../src/estado/contexto";
import type { Almacen } from "../src/repositorio/almacen";
import { bancoArchivos } from "./simulados/almacenes";

/** Promesa que se resuelve a mano. */
function pendiente() {
  let resolver!: () => void;
  const promesa = new Promise<void>((r) => (resolver = r));
  return { promesa, resolver };
}

/** Almacén cuya lectura espera a `puerta`. */
function almacenConPuerta(puerta: Promise<void>): Almacen {
  const banco = bancoArchivos();
  banco.poner("personas.json", "[]");
  banco.poner("casas.json", "[]");
  banco.poner("ajustes.json", JSON.stringify({ horaNotificacion: "09:00" }));
  const base = banco.almacen;
  return new Proxy(base, {
    get(objetivo, propiedad, receptor) {
      const valor = Reflect.get(objetivo, propiedad, receptor);
      if (propiedad === "leer") return async (...args: unknown[]) => (await puerta, (valor as (...a: unknown[]) => unknown).apply(objetivo, args));
      return typeof valor === "function" ? valor.bind(objetivo) : valor;
    },
  });
}

/** Deja correr las promesas pendientes. */
const vaciarCola = () => act(async () => new Promise((r) => setTimeout(r, 0)));

describe("Sprint 9: arranque y splash", () => {
  test("T9.12 sin fuentes no se pintan las pantallas ni se oculta el splash; al cargarlas, sí", async () => {
    const fuentes = pendiente();
    const ocultar = vi.fn(async () => undefined);
    render(
      <ProveedorApp almacen={almacenConPuerta(Promise.resolve())} externos={{ fuentes: () => fuentes.promesa, splash: { ocultar } }}>
        <h1>Pantalla de la app</h1>
      </ProveedorApp>,
    );
    await vaciarCola();
    expect(screen.queryByRole("heading", { name: "Pantalla de la app" })).toBeNull();
    expect(ocultar).not.toHaveBeenCalled();

    await act(async () => fuentes.resolver());
    expect(await screen.findByRole("heading", { name: "Pantalla de la app" })).toBeInTheDocument();
    expect(ocultar).toHaveBeenCalledTimes(1);
  });

  test("T9.12 sin datos no se pintan las pantallas ni se oculta el splash; al cargarlos, sí", async () => {
    const datos = pendiente();
    const ocultar = vi.fn(async () => undefined);
    render(
      <ProveedorApp almacen={almacenConPuerta(datos.promesa)} externos={{ fuentes: () => Promise.resolve(), splash: { ocultar } }}>
        <h1>Pantalla de la app</h1>
      </ProveedorApp>,
    );
    await vaciarCola();
    expect(screen.queryByRole("heading", { name: "Pantalla de la app" })).toBeNull();
    expect(ocultar).not.toHaveBeenCalled();

    await act(async () => datos.resolver());
    expect(await screen.findByRole("heading", { name: "Pantalla de la app" })).toBeInTheDocument();
    expect(ocultar).toHaveBeenCalledTimes(1);
  });

  test("T9.12 si la carga de datos falla, se oculta el splash y se ve el error a pantalla completa", async () => {
    const banco = bancoArchivos();
    banco.poner("personas.json", "{dañado");
    const ocultar = vi.fn(async () => undefined);
    render(
      <ProveedorApp almacen={banco.almacen} externos={{ fuentes: () => Promise.resolve(), splash: { ocultar } }}>
        <h1>Pantalla de la app</h1>
      </ProveedorApp>,
    );
    expect(await screen.findByText("No se pudieron cargar los datos")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pantalla de la app" })).toBeNull();
    expect(ocultar).toHaveBeenCalledTimes(1);
  });
});
