// Chip de elección (`aria-pressed`): tipo de fecha o casa a la que pertenece una persona.
import type { ReactNode } from "react";
import Icono from "./Icono";

interface Props {
  activo: boolean;
  onClick(): void;
  /** `tipo` (tipo de fecha) o `casa` (con check al final cuando está activo). */
  uso?: "tipo" | "casa";
  /** Medidas; por defecto 16 × 8 con `label-md`. */
  className?: string;
  children: ReactNode;
}

const ACTIVO = {
  tipo: "bg-primary-container text-on-primary-container shadow-sm",
  casa: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
};

export default function ChipSeleccion({ activo, onClick, uso = "tipo", className = "px-4 py-2 text-label-md", children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`zona-tactil inline-flex items-center gap-1.5 rounded-full active:scale-95 ${activo ? ACTIVO[uso] : "bg-surface-container-low text-on-surface-variant"} ${className}`}
    >
      {children}
      {uso === "casa" && activo && <Icono nombre="check" tamano={16} className="text-tertiary" />}
    </button>
  );
}
