import { createHashRouter, RouterProvider, type RouteObject } from "react-router";
import Inicio from "./pantallas/Inicio";

export const rutas: RouteObject[] = [{ path: "/", element: <Inicio /> }];

const router = createHashRouter(rutas);

export default function App() {
  return <RouterProvider router={router} />;
}
