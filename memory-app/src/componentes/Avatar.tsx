// Círculo con iniciales; el color sale de `colorAvatar(id)` (estable por persona).
import { colorAvatar, iniciales } from "../utilidades/presentacion";
import Icono from "./Icono";

export type TamanoAvatar = 20 | 24 | 40 | 44 | 48 | 112;

const MEDIDAS: Record<TamanoAvatar, string> = {
  20: "h-5 w-5",
  24: "h-6 w-6",
  40: "h-10 w-10",
  44: "h-11 w-11",
  48: "h-12 w-12",
  112: "h-28 w-28",
};

const LETRA: Record<TamanoAvatar, string> = {
  20: "text-[10px] font-bold",
  24: "text-[10px] font-bold",
  40: "text-label-md",
  44: "text-label-md",
  48: "text-label-lg",
  112: "text-headline-lg",
};

interface Props {
  id: string;
  nombre: string;
  tamano?: TamanoAvatar;
  /** Número de iniciales. */
  letras?: 1 | 2;
  /** Variante de Inicio: degradado y estrella (fecha a 7 días o menos). */
  destacado?: boolean;
  /** Letra en lugar de la del tamaño (p. ej. `text-headline-sm font-bold`). */
  claseTexto?: string;
  className?: string;
}

export default function Avatar({ id, nombre, tamano = 44, letras = 2, destacado = false, claseTexto, className = "" }: Props) {
  const color = destacado
    ? { fondo: "bg-gradient-to-tr from-primary-container to-secondary-container shadow-sm", texto: "text-on-primary" }
    : colorAvatar(id);
  return (
    <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${MEDIDAS[tamano]} ${claseTexto ?? LETRA[tamano]} ${color.fondo} ${color.texto} ${className}`}>
      {iniciales(nombre, letras)}
      {destacado && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
          <Icono nombre="star" tamano={10} relleno />
        </span>
      )}
    </span>
  );
}
