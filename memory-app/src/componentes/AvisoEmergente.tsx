// Aviso breve (2,4 s) tras una acción correcta: flotante abajo o en el flujo de la página.
import { useEffect, useRef } from "react";
import Icono, { type NombreIcono } from "./Icono";

export const DURACION_AVISO_MS = 2400;

interface Props {
  /** Texto del aviso; `null` = oculto. */
  mensaje: string | null;
  /** Se llama al terminar los 2,4 s. */
  onTerminar(): void;
  variante?: "flotante" | "enLinea";
  icono?: NombreIcono;
}

export default function AvisoEmergente({ mensaje, onTerminar, variante = "flotante", icono = "check_circle" }: Props) {
  const terminar = useRef(onTerminar);
  terminar.current = onTerminar;

  useEffect(() => {
    if (mensaje === null) return;
    const temporizador = setTimeout(() => terminar.current(), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  if (mensaje === null) return null;
  const contenido = (
    <div
      role="status"
      className={`entrada-aviso flex items-center gap-2 rounded-full bg-inverse-surface text-label-md text-inverse-on-surface ${variante === "flotante" ? "px-6 py-3 shadow-xl" : "px-4 py-2 shadow-md"}`}
    >
      <Icono nombre={icono} tamano={18} className="text-tertiary-fixed" />
      {mensaje}
    </div>
  );
  if (variante === "enLinea") return <div className="flex justify-center">{contenido}</div>;
  return <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--margen-seguro-inf)+1.5rem)] z-50 flex justify-center px-5">{contenido}</div>;
}
