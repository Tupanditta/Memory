// Hoja inferior modal: se cierra al pulsar fuera, con el botón de cerrar o con atrás.
import { useEffect, type ReactNode } from "react";
import { useCierreAtras } from "./atras";
import Icono from "./Icono";

export interface PropsHoja {
  abierta: boolean;
  onCerrar(): void;
  titulo: string;
  /** Nombre accesible; por defecto el título. */
  etiqueta?: string;
  rol?: "dialog" | "alertdialog";
  children?: ReactNode;
}

export default function HojaInferior({ abierta, onCerrar, titulo, etiqueta, rol = "dialog", children }: PropsHoja) {
  useCierreAtras(abierta, onCerrar);

  useEffect(() => {
    if (!abierta) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierta, onCerrar]);

  if (!abierta) return null;
  return (
    <div
      data-testid="capa-hoja"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      className="entrada-capa fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/30 p-4 pb-[calc(var(--margen-seguro-inf)+1rem)] backdrop-blur-sm"
    >
      <div role={rol} aria-modal="true" aria-label={etiqueta ?? titulo} className="entrada-hoja flex w-full max-w-sm flex-col gap-2 rounded-xl bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-label-lg text-label-lg text-on-surface">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="zona-tactil flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant active:scale-95">
            <Icono nombre="close" tamano={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
