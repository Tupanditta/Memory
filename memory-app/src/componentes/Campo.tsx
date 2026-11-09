// Campo de formulario: etiqueta, entrada (o área de texto) con icono opcional y mensaje de error.
import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Icono, { type NombreIcono } from "./Icono";

export type VarianteCampo = "suave" | "blanco" | "pildora";

type AtributosEntrada = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "onChange">;

interface Props extends AtributosEntrada {
  /** Texto de la etiqueta; en `pildora` no se ve y es el `aria-label` y el marcador. */
  etiqueta: string;
  variante?: VarianteCampo;
  icono?: NombreIcono;
  /** Mensaje de error bajo la entrada; marca la entrada como no válida. */
  error?: string | null;
  /** Rótulo a la derecha de la etiqueta. */
  rotulo?: "Obligatorio" | "Opcional";
  multilinea?: boolean;
  /** Clases del contenedor (p. ej. `col-span-2`). */
  className?: string;
  /** Clases extra de la entrada (p. ej. `text-center`). */
  claseEntrada?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>["onChange"];
}

const ENTRADA: Record<VarianteCampo, string> = {
  suave: "rounded bg-surface-container-low px-4 py-3 text-body-md",
  blanco: "h-14 rounded bg-surface-container-lowest px-4 text-body-md shadow-sm",
  pildora: "h-12 rounded-xl bg-surface-container-low px-3.5 text-body-md",
};

export default function Campo({
  etiqueta,
  variante = "suave",
  icono,
  error,
  rotulo,
  multilinea = false,
  className = "",
  claseEntrada = "",
  id,
  ...resto
}: Props) {
  const generado = useId();
  const idEntrada = id ?? generado;
  const idError = `${idEntrada}-error`;
  const invalido = Boolean(error) || resto["aria-invalid"] === true || resto["aria-invalid"] === "true";
  const conEtiqueta = variante !== "pildora";

  const clases = [
    "w-full text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container",
    ENTRADA[variante],
    multilinea ? "h-auto min-h-24 py-3" : "",
    icono ? (variante === "blanco" ? "pl-12" : "pl-11") : "",
    invalido ? "ring-2 ring-error" : "",
    claseEntrada,
  ].join(" ");

  const comunes = {
    id: idEntrada,
    "aria-invalid": invalido || undefined,
    "aria-describedby": error ? idError : undefined,
    "aria-label": conEtiqueta ? undefined : etiqueta,
    placeholder: resto.placeholder ?? (conEtiqueta ? undefined : etiqueta),
    className: clases,
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {conEtiqueta && (
        <div className="flex items-center justify-between gap-2 px-1">
          <label htmlFor={idEntrada} className="text-label-sm text-on-surface-variant">
            {etiqueta}
          </label>
          {rotulo && <span className="text-label-sm text-outline">{rotulo}</span>}
        </div>
      )}
      <div className="relative">
        {icono && (
          <Icono nombre={icono} tamano={20} className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-outline ${variante === "blanco" ? "left-4" : "left-3.5"}`} />
        )}
        {multilinea ? (
          <textarea {...(resto as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...comunes} />
        ) : (
          <input {...(resto as InputHTMLAttributes<HTMLInputElement>)} {...comunes} />
        )}
      </div>
      {error && (
        <p id={idError} className="px-1 text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
