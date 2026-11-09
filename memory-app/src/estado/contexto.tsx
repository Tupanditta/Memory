// Estado de la app (design.md, "Estado y pantallas"). Carga los datos al arrancar,
// crea la `Tienda` y los servicios, y solo actualiza los datos con resultado `ok` (RNF9).
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { Resultado } from "../modelos/tipos";
import type { Almacen } from "../repositorio/almacen";
import { crearAlmacen, Repositorio, type Datos } from "../repositorio/repositorio";
import { CasasService } from "../servicios/casasService";
import { PersonasService } from "../servicios/personasService";
import { Tienda } from "../servicios/tienda";

export type Fase = "cargando" | "listo" | "fallo";

export interface EstadoApp {
  fase: Fase;
  datos: Datos | null;
  /** Error de carga (fase `fallo`) o del último guardado que falló. */
  error: string | null;
}

export type Accion =
  | { tipo: "cargado"; datos: Datos }
  | { tipo: "falloCarga"; error: string }
  | { tipo: "guardado"; datos: Datos }
  | { tipo: "error"; error: string }
  | { tipo: "limpiarError" };

export const estadoInicial: EstadoApp = { fase: "cargando", datos: null, error: null };

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case "cargado":
      return { fase: "listo", datos: accion.datos, error: null };
    case "falloCarga":
      return { fase: "fallo", datos: null, error: accion.error };
    case "guardado":
      return { ...estado, datos: accion.datos, error: null };
    case "error":
      // Los datos anteriores se mantienen (RNF9).
      return { ...estado, error: accion.error };
    case "limpiarError":
      return { ...estado, error: null };
  }
}

interface Servicios {
  tienda: Tienda;
  personas: PersonasService;
  casas: CasasService;
}

export interface ValorContexto {
  datos: Datos;
  error: string | null;
  personas: PersonasService;
  casas: CasasService;
  /**
   * Ejecuta una operación de un servicio. Si devuelve `ok`, el estado recibe los
   * datos guardados; si no, solo se guarda el error y los datos no cambian.
   */
  ejecutar<T>(operacion: (servicios: Servicios) => Promise<Resultado<T>>): Promise<Resultado<T>>;
  limpiarError(): void;
}

const Contexto = createContext<ValorContexto | null>(null);

export interface PropsProveedor {
  /** Almacén de datos; por defecto `localStorage` en web y archivos en Android. */
  almacen?: Almacen;
  children: ReactNode;
}

export function ProveedorApp({ almacen, children }: PropsProveedor) {
  const [estado, despachar] = useReducer(reducer, estadoInicial);
  const servicios = useRef<Servicios | null>(null);
  const almacenElegido = useRef(almacen);

  useEffect(() => {
    let cancelado = false;
    const repositorio = new Repositorio(almacenElegido.current ?? crearAlmacen());
    repositorio.iniciar().then((resultado) => {
      if (cancelado) return;
      if (!resultado.ok) {
        despachar({ tipo: "falloCarga", error: resultado.error });
        return;
      }
      const tienda = new Tienda(repositorio, resultado.valor);
      servicios.current = { tienda, personas: new PersonasService(tienda), casas: new CasasService(tienda) };
      despachar({ tipo: "cargado", datos: tienda.datos });
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const ejecutar = useCallback(async <T,>(operacion: (s: Servicios) => Promise<Resultado<T>>): Promise<Resultado<T>> => {
    const s = servicios.current;
    if (!s) return { ok: false, error: "Los datos todavía no están cargados" };
    const resultado = await operacion(s);
    if (resultado.ok) despachar({ tipo: "guardado", datos: s.tienda.datos });
    else despachar({ tipo: "error", error: resultado.error });
    return resultado;
  }, []);

  const limpiarError = useCallback(() => despachar({ tipo: "limpiarError" }), []);

  if (estado.fase === "cargando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-margin">
        <p className="text-body-md text-on-surface-variant">Cargando…</p>
      </main>
    );
  }

  if (estado.fase === "fallo" || !estado.datos || !servicios.current) {
    return (
      <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-space-sm bg-surface px-margin text-center">
        <h1 className="text-headline-sm text-error">No se pudieron cargar los datos</h1>
        <p className="text-body-md text-on-surface-variant">{estado.error}</p>
      </main>
    );
  }

  const valor: ValorContexto = {
    datos: estado.datos,
    error: estado.error,
    personas: servicios.current.personas,
    casas: servicios.current.casas,
    ejecutar,
    limpiarError,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useApp debe usarse dentro de ProveedorApp");
  return valor;
}
