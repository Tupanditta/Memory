// Cabecera fija. En las pestañas muestra "Memory"; en las pantallas de pila, el botón
// atrás y el título de la pantalla (que es su `h1`).
import { useLocation, useNavigate } from "react-router";
import Icono from "./Icono";

interface Props {
  /** Título de una pantalla de pila; sin título, la cabecera es la de las pestañas. */
  titulo?: string;
  /** Acción del botón atrás; por defecto, la pantalla anterior (o Inicio si no la hay). */
  onAtras?: () => void;
  /** En Inicio, "Memory" es el título (`h1`) de la pantalla. */
  marcaComoTitulo?: boolean;
}

export default function Cabecera({ titulo, onAtras, marcaComoTitulo = false }: Props) {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const volver = onAtras ?? (() => (ubicacion.key === "default" ? navegar("/") : navegar(-1)));
  const Marca = marcaComoTitulo ? "h1" : "p";

  return (
    <header className="fondo-cabecera fixed inset-x-0 top-0 z-40 pt-[var(--margen-seguro-sup)] shadow-cabecera">
      <div className="flex h-16 items-center px-5">
        {titulo === undefined ? (
          <Marca className="text-headline-sm tracking-tight text-primary">Memory</Marca>
        ) : (
          <>
            <button
              type="button"
              onClick={volver}
              aria-label="Volver"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant active:scale-95"
            >
              <Icono nombre="arrow_back" tamano={22} />
            </button>
            <h1 className="ml-2 max-w-[160px] truncate text-headline-sm tracking-tight text-on-surface">{titulo}</h1>
          </>
        )}
      </div>
    </header>
  );
}
