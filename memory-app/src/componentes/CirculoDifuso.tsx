// Círculo decorativo translúcido en una esquina de una tarjeta (no recibe pulsaciones).
interface Props {
  /** Posición, tamaño y color, p. ej. `-right-6 -top-6 h-24 w-24 bg-primary-container/30`. */
  className: string;
  desenfoque?: "xl" | "2xl";
}

export default function CirculoDifuso({ className, desenfoque = "xl" }: Props) {
  return <div aria-hidden="true" className={`pointer-events-none absolute rounded-full ${desenfoque === "xl" ? "blur-xl" : "blur-2xl"} ${className}`} />;
}
