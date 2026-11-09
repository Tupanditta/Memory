import { useEffect, useRef } from "react";
import { App as AppCapacitor } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { createHashRouter, Outlet, RouterProvider, useLocation, useNavigate, type RouteObject } from "react-router";
import { cerrarUltimo } from "./componentes/atras";
import BarraPestanas, { PESTANAS } from "./componentes/BarraPestanas";
import { ProveedorApp, type Externos } from "./estado/contexto";
import Ajustes from "./pantallas/Ajustes";
import Calendario from "./pantallas/Calendario";
import Inicio from "./pantallas/Inicio";
import Casa from "./pantallas/Casa";
import Persona from "./pantallas/Persona";

/**
 * Botón atrás de Android: cierra la hoja, el diálogo o la edición abierta; si no hay,
 * vuelve a la pantalla anterior; en una pestaña raíz, sale de la app.
 */
function useBotonAtrasAndroid() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const actual = useRef(ubicacion);
  actual.current = ubicacion;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const escucha = AppCapacitor.addListener("backButton", () => {
      if (cerrarUltimo()) return;
      const { pathname, key } = actual.current;
      if (PESTANAS.some((p) => p.ruta === pathname)) void AppCapacitor.exitApp();
      else if (key === "default") navegar("/");
      else navegar(-1);
    });
    return () => {
      void escucha.then((e) => e.remove());
    };
  }, [navegar]);
}

/** Marco común de todas las pantallas. */
function Marco() {
  useBotonAtrasAndroid();
  return <Outlet />;
}

/** Pantallas de pestaña con su barra. */
function ConPestanas() {
  return (
    <>
      <Outlet />
      <BarraPestanas />
    </>
  );
}

export const rutas: RouteObject[] = [
  {
    element: <Marco />,
    children: [
      {
        element: <ConPestanas />,
        children: [
          { path: "/", element: <Inicio /> },
          { path: "/calendario", element: <Calendario /> },
          { path: "/ajustes", element: <Ajustes /> },
        ],
      },
      { path: "/persona/:id", element: <Persona /> },
      { path: "/casa/:id", element: <Casa /> },
    ],
  },
];

const router = createHashRouter(rutas);

export default function App({ externos }: { externos?: Externos } = {}) {
  return (
    <ProveedorApp externos={externos}>
      <RouterProvider router={router} />
    </ProveedorApp>
  );
}
