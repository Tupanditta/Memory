// Tarjeta del prototipo: blanca, radio 32, con franjas o círculos decorativos recortados.
import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLElement> {
  /** Relleno interior en px. */
  padding?: 16 | 24;
  /** `tarjeta` en Inicio, `sm` en el resto. */
  sombra?: "tarjeta" | "sm" | "ninguna";
  /** Fondo distinto del blanco (p. ej. `bg-secondary-fixed/20`) o degradado (`bg-gradient-to-*` con colores). */
  fondo?: string;
  elemento?: "div" | "section" | "article" | "li";
  children?: ReactNode;
}

const SOMBRAS = { tarjeta: "shadow-tarjeta", sm: "shadow-sm", ninguna: "" } as const;

export default function Tarjeta({
  padding = 16,
  sombra = "sm",
  fondo = "bg-surface-container-lowest",
  elemento: Elemento = "div",
  className = "",
  children,
  ...resto
}: Props) {
  return (
    <Elemento {...resto} className={`relative overflow-hidden rounded-lg ${fondo} ${padding === 24 ? "p-6" : "p-4"} ${SOMBRAS[sombra]} ${className}`}>
      {children}
    </Elemento>
  );
}
