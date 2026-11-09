import { createHashRouter, Outlet, RouterProvider, type RouteObject } from "react-router";
import BannerError from "./componentes/BannerError";
import { ProveedorApp } from "./estado/contexto";
import Inicio from "./pantallas/Inicio";
import Casa from "./pantallas/Casa";
import Persona from "./pantallas/Persona";

/** Marco común: el banner de error va encima de todas las pantallas. */
function Marco() {
  return (
    <>
      <BannerError />
      <Outlet />
    </>
  );
}

export const rutas: RouteObject[] = [
  {
    element: <Marco />,
    children: [
      { path: "/", element: <Inicio /> },
      { path: "/persona/:id", element: <Persona /> },
      { path: "/casa/:id", element: <Casa /> },
    ],
  },
];

const router = createHashRouter(rutas);

export default function App() {
  return (
    <ProveedorApp>
      <RouterProvider router={router} />
    </ProveedorApp>
  );
}
