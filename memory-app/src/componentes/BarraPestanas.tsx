// Barra de pestañas flotante (Inicio, Calendario, Ajustes). Solo en las rutas de pestaña.
// Desviación pedida por el usuario: 24 px sobre el margen seguro y etiquetas de 16 px en negrita.
import { NavLink } from "react-router";
import Icono, { type NombreIcono } from "./Icono";

export const PESTANAS: { ruta: string; nombre: string; icono: NombreIcono }[] = [
  { ruta: "/", nombre: "Inicio", icono: "cottage" },
  { ruta: "/calendario", nombre: "Calendario", icono: "calendar_month" },
  { ruta: "/ajustes", nombre: "Ajustes", icono: "tune" },
];

export default function BarraPestanas() {
  return (
    <div className="pointer-events-none fixed inset-x-5 bottom-[calc(var(--margen-seguro-inf)+1.5rem)] z-40 flex justify-center">
      <nav aria-label="Pestañas" className="fondo-barra pointer-events-auto flex h-16 w-full max-w-sm items-center justify-around rounded-full px-2 shadow-barra">
        {PESTANAS.map(({ ruta, nombre, icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end
            className={({ isActive }) =>
              `flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 rounded-full px-4 py-1.5 text-base font-bold leading-5 active:scale-95 ${isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`
            }
          >
            <Icono nombre={icono} tamano={22} />
            {nombre}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
