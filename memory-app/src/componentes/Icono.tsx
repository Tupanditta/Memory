// Icono de Material Symbols Outlined (fuente empaquetada del paquete `material-symbols`).
import type { MaterialSymbol } from "material-symbols";

export type NombreIcono = MaterialSymbol;

interface Props {
  nombre: NombreIcono;
  /** Tamaño en px. */
  tamano?: number;
  /** Icono relleno (`FILL` 1 del prototipo). */
  relleno?: boolean;
  className?: string;
}

export default function Icono({ nombre, tamano = 24, relleno = false, className = "" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none ${relleno ? "icono-relleno" : ""} ${className}`}
      style={{ fontSize: `${tamano}px` }}
    >
      {nombre}
    </span>
  );
}
