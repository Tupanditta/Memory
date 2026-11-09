import { createHashRouter, NavLink, Outlet, RouterProvider, type RouteObject } from "react-router";
import BannerAviso from "./componentes/BannerAviso";
import BannerError from "./componentes/BannerError";
import { ProveedorApp, type Externos } from "./estado/contexto";
import Ajustes from "./pantallas/Ajustes";
import Calendario from "./pantallas/Calendario";
import Inicio from "./pantallas/Inicio";
import Casa from "./pantallas/Casa";
import Persona from "./pantallas/Persona";

/** Marco común: los avisos van encima de todas las pantallas. */
function Marco() {
  return (
    <>
      <BannerError />
      <BannerAviso />
      <Outlet />
    </>
  );
}

const PESTANAS = [
  { ruta: "/", nombre: "Inicio" },
  { ruta: "/calendario", nombre: "Calendario" },
  { ruta: "/ajustes", nombre: "Ajustes" },
];

/** Pantallas de pestaña con su barra (versión básica; el Sprint 9 le da el diseño del prototipo). */
function ConPestanas() {
  return (
    <>
      <Outlet />
      <nav aria-label="Pestañas" className="sticky bottom-0 flex justify-around bg-surface-container-lowest py-space-sm shadow-sm">
        {PESTANAS.map(({ ruta, nombre }) => (
          <NavLink key={ruta} to={ruta} end className={({ isActive }) => `rounded-full px-space-md py-space-xs text-label-md ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
            {nombre}
          </NavLink>
        ))}
      </nav>
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
