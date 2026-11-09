// Píldora de texto con icono o emoji opcional. Las medidas y colores van en `className`.
import type { ReactNode } from "react";
import Icono, { type NombreIcono } from "./Icono";

interface Props {
  icono?: NombreIcono;
  tamanoIcono?: number;
  emoji?: string;
  /** Colores y medidas; por defecto 10 × 4 con `label-sm`. */
  className?: string;
  children: ReactNode;
}

export default function Chip({
  icono,
  tamanoIcono = 14,
  emoji,
  className = "bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface-variant",
  children,
}: Props) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full ${className}`}>
      {icono && <Icono nombre={icono} tamano={tamanoIcono} />}
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {children}
    </span>
  );
}
