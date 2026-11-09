// Estado de la app (design.md, "Estado y pantallas"). Carga los datos al arrancar,
// crea la `Tienda` y los servicios, y solo actualiza los datos con resultado `ok` (RNF9).
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { Direccion, Resultado } from "../modelos/tipos";
import type { Almacen } from "../repositorio/almacen";
import { crearAlmacen, Repositorio, type Datos } from "../repositorio/repositorio";
import { AjustesService } from "../servicios/ajustesService";
import { crearCompartidor, SelectorArchivoInput, type Compartidor, type SelectorArchivo } from "../servicios/archivosExternos";
import { CasasService } from "../servicios/casasService";
import { IntercambioService, type ResumenImportacion } from "../servicios/intercambioService";
import { NotificacionesService, type EstadoNotificaciones } from "../servicios/notificacionesService";
import { crearNotificador, type EstadoPermiso, type Notificador } from "../servicios/notificador";
import type { NombreIcono } from "../componentes/Icono";
import { PersonasService } from "../servicios/personasService";
import { Tienda } from "../servicios/tienda";
import { crearSplash, fuentesListas, type Splash } from "./arranque";

export type Fase = "cargando" | "listo" | "fallo";

export interface EstadoApp {
  fase: Fase;
  datos: Datos | null;
  /** Error de carga (fase `fallo`) o del último guardado que falló. */
  error: string | null;
  /** Aviso que no es un fallo de guardado (p. ej. notificaciones sin permiso). */
  aviso: string | null;
  /** Aviso emergente tras una acción correcta (p. ej. "Persona guardada…"); no se guarda. */
  emergente: Emergente | null;
  /** Permiso de notificaciones; `null` mientras no se conoce. */
  permiso: EstadoPermiso | null;
  /** Última copia de seguridad de la sesión (Ajustes); no se guarda en ningún archivo. */
  copia: EstadoCopia | null;
}

/** Línea de estado de la copia de seguridad: tras exportar o tras importar. */
export type EstadoCopia = { tipo: "exportada"; hora: string; bytes: number } | { tipo: "importada"; resumen: string };

export interface Emergente {
  texto: string;
  icono: NombreIcono;
}

export type Accion =
  | { tipo: "cargado"; datos: Datos }
  | { tipo: "falloCarga"; error: string }
  | { tipo: "guardado"; datos: Datos }
  | { tipo: "error"; error: string }
  | { tipo: "limpiarError" }
  | { tipo: "aviso"; aviso: string }
  | { tipo: "limpiarAviso" }
  | { tipo: "emergente"; emergente: Emergente | null }
  | { tipo: "permiso"; permiso: EstadoPermiso }
  | { tipo: "copia"; copia: EstadoCopia };

export const estadoInicial: EstadoApp = { fase: "cargando", datos: null, error: null, aviso: null, emergente: null, permiso: null, copia: null };

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case "cargado":
      return { ...estado, fase: "listo", datos: accion.datos, error: null };
    case "falloCarga":
      return { ...estado, fase: "fallo", datos: null, error: accion.error };
    case "guardado":
      return { ...estado, datos: accion.datos, error: null };
    case "error":
      // Los datos anteriores se mantienen (RNF9).
      return { ...estado, error: accion.error };
    case "limpiarError":
      return { ...estado, error: null };
    case "aviso":
      return { ...estado, aviso: accion.aviso };
    case "limpiarAviso":
      return { ...estado, aviso: null };
    case "emergente":
      return { ...estado, emergente: accion.emergente };
    case "permiso":
      return { ...estado, permiso: accion.permiso };
    case "copia":
      return { ...estado, copia: accion.copia };
  }
}

interface Servicios {
  tienda: Tienda;
  notificador: Notificador;
  personas: PersonasService;
  casas: CasasService;
  ajustes: AjustesService;
  notificaciones: NotificacionesService;
  intercambio: IntercambioService;
}

/**
 * Lo escrito en el formulario de casa mientras se crea una persona con "Añadir nueva
 * persona" (design.md, "Formulario de casa"). Solo vive en memoria: no se guarda.
 */
export interface BorradorCasa {
  /** `"nueva"` o el `id` de la casa que se edita. */
  casaId: string;
  apodo: string;
  direccion: Direccion;
  personas: string[];
}

export interface ValorContexto {
  datos: Datos;
  error: string | null;
  aviso: string | null;
  emergente: Emergente | null;
  /** Permiso de notificaciones; `null` mientras no se conoce. */
  permiso: EstadoPermiso | null;
  copia: EstadoCopia | null;
  /** Anota la última exportación o importación de la sesión. */
  anotarCopia(copia: EstadoCopia): void;
  personas: PersonasService;
  casas: CasasService;
  ajustes: AjustesService;
  /**
   * Ejecuta una operación de un servicio. Si devuelve `ok`, el estado recibe los
   * datos guardados; si no, solo se guarda el error y los datos no cambian.
   */
  ejecutar<T>(operacion: (servicios: Servicios) => Promise<Resultado<T>>): Promise<Resultado<T>>;
  limpiarError(): void;
  limpiarAviso(): void;
  /** Muestra un aviso emergente (2,4 s); sigue visible aunque se cambie de pantalla. */
  mostrarEmergente(texto: string, icono: NombreIcono): void;
  limpiarEmergente(): void;
  /** Elige un archivo e importa su contenido; `null` si el usuario cancela. */
  importarDesdeArchivo(): Promise<Resultado<ResumenImportacion> | null>;
  /** Guarda lo escrito en el formulario de casa antes de ir a crear una persona. */
  guardarBorradorCasa(borrador: BorradorCasa): void;
  /** Borrador pendiente, si lo hay (no lo quita). */
  verBorradorCasa(): BorradorCasa | null;
  /** Marca a la persona recién creada en el borrador pendiente. */
  anadirPersonaABorrador(personaId: string): void;
  descartarBorradorCasa(): void;
}

/** Lo que toca el sistema; se inyecta en las pruebas. */
export interface Externos {
  notificador?: Notificador;
  compartidor?: Compartidor;
  selector?: SelectorArchivo;
  /** Splash de arranque; se oculta al tener fuentes y datos. */
  splash?: Splash;
  /** Espera a que las fuentes estén cargadas. */
  fuentes?: () => Promise<unknown>;
}

export const AVISO_SIN_PERMISO =
  "Los avisos de fechas están desactivados porque la app no tiene permiso para mostrar notificaciones. Puedes activarlo en los ajustes de Android.";
export const AVISO_FALLO_NOTIFICACIONES = "No se pudieron programar los avisos de fechas. Los datos sí se han guardado.";

const Contexto = createContext<ValorContexto | null>(null);

export interface PropsProveedor {
  /** Almacén de datos; por defecto `localStorage` en web y archivos en Android. */
  almacen?: Almacen;
  externos?: Externos;
  children: ReactNode;
}

export function ProveedorApp({ almacen, externos, children }: PropsProveedor) {
  const [estado, despachar] = useReducer(reducer, estadoInicial);
  const servicios = useRef<Servicios | null>(null);
  const almacenElegido = useRef(almacen);
  const externosElegidos = useRef(externos);
  /** El aviso de permiso denegado se muestra una vez por sesión. */
  const avisoMostrado = useRef(false);
  const borradorCasa = useRef<BorradorCasa | null>(null);

  useEffect(() => {
    let cancelado = false;
    const repositorio = new Repositorio(almacenElegido.current ?? crearAlmacen());
    const fuentes = externosElegidos.current?.fuentes ?? fuentesListas;
    // Las pantallas no se pintan hasta tener los datos y las fuentes.
    Promise.all([repositorio.iniciar(), fuentes()]).then(([resultado]) => {
      if (cancelado) return;
      if (!resultado.ok) {
        despachar({ tipo: "falloCarga", error: resultado.error });
        return;
      }
      const tienda = new Tienda(repositorio, resultado.valor);
      const notificador = externosElegidos.current?.notificador ?? crearNotificador();
      servicios.current = {
        tienda,
        notificador,
        personas: new PersonasService(tienda),
        casas: new CasasService(tienda),
        ajustes: new AjustesService(tienda),
        notificaciones: new NotificacionesService(notificador),
        intercambio: new IntercambioService(tienda, externosElegidos.current?.compartidor ?? crearCompartidor()),
      };
      despachar({ tipo: "cargado", datos: tienda.datos });
      // El permiso se consulta sin esperar (no retrasa el arranque); un fallo se ignora.
      notificador.permiso().then(
        (permiso) => !cancelado && despachar({ tipo: "permiso", permiso }),
        () => undefined,
      );
    });
    return () => {
      cancelado = true;
    };
  }, []);

  // Con fuentes y datos (o con el error de carga a pantalla completa), se oculta el splash.
  const cargado = estado.fase !== "cargando";
  useEffect(() => {
    if (cargado) void (externosElegidos.current?.splash ?? crearSplash()).ocultar();
  }, [cargado]);

  const ejecutar = useCallback(async <T,>(operacion: (s: Servicios) => Promise<Resultado<T>>): Promise<Resultado<T>> => {
    const s = servicios.current;
    if (!s) return { ok: false, error: "Los datos todavía no están cargados" };
    const antes = s.tienda.datos;
    const resultado = await operacion(s);
    if (resultado.ok) {
      const despues = s.tienda.datos;
      despachar({ tipo: "guardado", datos: despues });
      // Tras un guardado que cambie personas (o sus fechas) o la hora, se reprograman
      // todas las notificaciones. No se espera: nunca falla ni deshace el guardado.
      if (despues.personas !== antes.personas || despues.ajustes !== antes.ajustes) {
        s.notificaciones.sincronizar(despues.personas, despues.ajustes.horaNotificacion).then(avisarSiHaceFalta);
      }
    } else despachar({ tipo: "error", error: resultado.error });
    return resultado;
  }, []);

  const avisarSiHaceFalta = (estadoNotificaciones: EstadoNotificaciones) => {
    if (estadoNotificaciones === "programadas") despachar({ tipo: "permiso", permiso: "concedido" });
    if (estadoNotificaciones === "sinPermiso") despachar({ tipo: "permiso", permiso: "denegado" });
    if (estadoNotificaciones === "error") despachar({ tipo: "aviso", aviso: AVISO_FALLO_NOTIFICACIONES });
    if (estadoNotificaciones === "sinPermiso" && !avisoMostrado.current) {
      avisoMostrado.current = true;
      despachar({ tipo: "aviso", aviso: AVISO_SIN_PERMISO });
    }
  };

  const limpiarError = useCallback(() => despachar({ tipo: "limpiarError" }), []);
  const limpiarAviso = useCallback(() => despachar({ tipo: "limpiarAviso" }), []);
  const mostrarEmergente = useCallback((texto: string, icono: NombreIcono) => despachar({ tipo: "emergente", emergente: { texto, icono } }), []);
  const limpiarEmergente = useCallback(() => despachar({ tipo: "emergente", emergente: null }), []);
  const anotarCopia = useCallback((copia: EstadoCopia) => despachar({ tipo: "copia", copia }), []);

  const importarDesdeArchivo = useCallback(async (): Promise<Resultado<ResumenImportacion> | null> => {
    const selector = externosElegidos.current?.selector ?? new SelectorArchivoInput();
    let texto: string | null;
    try {
      texto = await selector.elegir();
    } catch {
      const resultado: Resultado<ResumenImportacion> = { ok: false, error: "No se pudo leer el archivo" };
      despachar({ tipo: "error", error: resultado.error });
      return resultado;
    }
    if (texto === null) return null;
    const contenido = texto;
    return ejecutar((s) => s.intercambio.importar(contenido));
  }, [ejecutar]);

  const guardarBorradorCasa = useCallback((borrador: BorradorCasa) => {
    borradorCasa.current = borrador;
  }, []);
  const verBorradorCasa = useCallback(() => borradorCasa.current, []);
  const anadirPersonaABorrador = useCallback((personaId: string) => {
    const b = borradorCasa.current;
    if (b && !b.personas.includes(personaId)) borradorCasa.current = { ...b, personas: [...b.personas, personaId] };
  }, []);
  const descartarBorradorCasa = useCallback(() => {
    borradorCasa.current = null;
  }, []);

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
    aviso: estado.aviso,
    emergente: estado.emergente,
    permiso: estado.permiso,
    copia: estado.copia,
    anotarCopia,
    personas: servicios.current.personas,
    casas: servicios.current.casas,
    ajustes: servicios.current.ajustes,
    ejecutar,
    limpiarError,
    limpiarAviso,
    mostrarEmergente,
    limpiarEmergente,
    importarDesdeArchivo,
    guardarBorradorCasa,
    verBorradorCasa,
    anadirPersonaABorrador,
    descartarBorradorCasa,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useApp debe usarse dentro de ProveedorApp");
  return valor;
}
