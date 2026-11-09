// Campo de formulario: etiqueta, entrada (o área de texto) con icono opcional y mensaje de error.
import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Icono, { type NombreIcono } from "./Icono";

export type VarianteCampo = "suave" | "blanco" | "pildora";

/**
 * Etiqueta fuera del campo en los formularios de persona y de casa: `label-lg`, el mismo
 * tamaño en los dos (petición del usuario, 2026-11-09).
 */
export const ETIQUETA_FORMULARIO = "text-label-lg text-on-surface-variant";

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
  /** Asterisco `primary` tras la etiqueta (campo obligatorio). */
  asterisco?: boolean;
  /** Icono de 16 px `secondary` delante de la etiqueta. */
  iconoEtiqueta?: NombreIcono;
  /** Estilo de la etiqueta; por defecto `label-sm` `on-surface-variant`. */
  claseEtiqueta?: string;
  multilinea?: boolean;
  /** Clases del contenedor (p. ej. `col-span-2`). */
  className?: string;
  /** Relleno de la entrada en lugar del de la variante (p. ej. `px-4 py-3.5`). */
  claseRelleno?: string;
  /** Letra de la entrada en lugar de `body-md` (p. ej. `text-label-lg`). */
  claseTexto?: string;
  /** Clases extra de la entrada (p. ej. `text-center`). */
  claseEntrada?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>["onChange"];
}

const FORMA: Record<VarianteCampo, string> = {
  suave: "rounded bg-surface-container-low",
  blanco: "h-14 rounded bg-surface-container-lowest shadow-sm",
  pildora: "h-12 rounded-xl bg-surface-container-low",
};

const RELLENO: Record<VarianteCampo, string> = {
  suave: "px-4 py-3",
  blanco: "px-4",
  pildora: "px-3.5",
};

export default function Campo({
  etiqueta,
  variante = "suave",
  icono,
  error,
  rotulo,
  asterisco = false,
  iconoEtiqueta,
  claseEtiqueta = "text-label-sm text-on-surface-variant",
  multilinea = false,
  className = "",
  claseRelleno,
  claseTexto = "text-body-md",
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
    FORMA[variante],
    claseRelleno ?? (multilinea ? "p-4" : RELLENO[variante]),
    claseTexto,
    multilinea ? "h-auto min-h-24 resize-none" : "",
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {iconoEtiqueta && <Icono nombre={iconoEtiqueta} tamano={16} className="text-secondary" />}
            <label htmlFor={idEntrada} className={claseEtiqueta}>
              {etiqueta}
            </label>
            {asterisco && (
              <span aria-hidden="true" className="font-bold text-primary">
                *
              </span>
            )}
          </div>
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
        <p id={idError} role="alert" className="px-1 text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
