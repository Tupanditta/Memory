// Botón en píldora del prototipo, con icono opcional a la izquierda.
import type { ButtonHTMLAttributes } from "react";
import Icono, { type NombreIcono } from "./Icono";

export type VarianteBoton = "azulSuave" | "lilaSuave" | "primario" | "primarioSuave" | "texto" | "opcionHoja" | "opcionHojaPeligro";

const VARIANTES: Record<VarianteBoton, string> = {
  azulSuave: "gap-2 rounded-full bg-primary-fixed px-6 py-3 text-label-lg text-on-primary-fixed",
  lilaSuave: "gap-2 rounded-full bg-secondary-fixed px-6 py-3 text-label-lg text-on-secondary-fixed",
  primario: "h-14 gap-2 rounded-full bg-primary px-6 text-label-lg text-on-primary shadow-md",
  primarioSuave: "gap-2 rounded-full bg-primary-container px-6 py-4 text-label-lg text-on-primary-container shadow-sm",
  texto: "gap-2 rounded-full bg-transparent px-6 py-3 text-label-lg text-on-surface-variant",
  opcionHoja: "w-full justify-start gap-4 rounded bg-surface-container p-4 text-label-lg text-on-surface",
  opcionHojaPeligro: "w-full justify-start gap-4 rounded bg-error-container/40 p-4 text-label-lg text-error",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  icono?: NombreIcono;
  tamanoIcono?: number;
  /** `95` donde el prototipo pone `active:scale-95`; `98` en el resto. */
  escala?: 95 | 98;
}

export default function Boton({ variante = "primario", icono, tamanoIcono = 20, escala = 98, type = "button", className = "", children, ...resto }: Props) {
  return (
    <button
      type={type}
      {...resto}
      className={`inline-flex min-h-12 items-center justify-center ${VARIANTES[variante]} ${escala === 95 ? "active:scale-95" : "active:scale-[0.98]"} disabled:opacity-50 ${className}`}
    >
      {icono && <Icono nombre={icono} tamano={tamanoIcono} />}
      {children}
    </button>
  );
}
