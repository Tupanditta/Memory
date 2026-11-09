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

/**
 * Pantallas de pestaña con su barra (versión básica; el Sprint 9 le da el diseño del prototipo).
 * La barra flota sobre el margen seguro inferior, separada del borde; el contenido deja
 * hueco debajo para que la barra no lo tape.
 */
function ConPestanas() {
  return (
    <>
      <div className="pb-[calc(var(--margen-seguro-inf)+6.5rem)]">
        <Outlet />
      </div>
      <nav
        aria-label="Pestañas"
        className="fixed inset-x-margin bottom-[calc(var(--margen-seguro-inf)+1.5rem)] mx-auto flex max-w-sm justify-around rounded-full bg-surface-container-lowest px-space-sm py-space-sm shadow-lg"
      >
        {PESTANAS.map(({ ruta, nombre }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end
            className={({ isActive }) => `rounded-full px-space-md py-space-sm text-base font-bold ${isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
          >
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
