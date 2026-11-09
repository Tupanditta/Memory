// Cabecera de las tarjetas de detalle: círculo con icono, sobretítulo y título; chip opcional.
import type { ReactNode } from "react";
import Icono, { type NombreIcono } from "./Icono";

interface Props {
  icono: NombreIcono;
  /** Fondo y color del icono del círculo, p. ej. `bg-primary-fixed text-primary`. */
  colorCirculo: string;
  sobretitulo: string;
  titulo: string;
  chip?: ReactNode;
}

export default function CabeceraTarjeta({ icono, colorCirculo, sobretitulo, titulo, chip }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorCirculo}`}>
          <Icono nombre={icono} tamano={20} />
        </span>
        <div className="flex flex-col">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">{sobretitulo}</span>
          <h2 className="text-headline-sm text-on-surface">{titulo}</h2>
        </div>
      </div>
      {chip}
    </div>
  );
}
