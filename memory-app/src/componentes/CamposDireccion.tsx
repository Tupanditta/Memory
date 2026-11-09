// Campos de dirección, compartidos por los formularios de persona y de casa.
import { CAMPOS_DIRECCION, type Direccion } from "../modelos/tipos";

export const ETIQUETAS_DIRECCION: Record<keyof Direccion, string> = {
  calle: "Calle",
  numero: "Número",
  portal: "Portal",
  piso: "Piso",
  puerta: "Puerta",
  codigoPostal: "Código postal",
  ciudad: "Ciudad",
  notas: "Notas",
};

interface Props {
  valor: Direccion;
  onChange(direccion: Direccion): void;
}

export default function CamposDireccion({ valor, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-space-sm">
      <legend className="mb-space-sm text-label-lg text-on-surface">Dirección</legend>
      {CAMPOS_DIRECCION.map((campo) => (
        <label key={campo} className="flex flex-col gap-space-xs text-label-md text-on-surface-variant">
          {ETIQUETAS_DIRECCION[campo]}
          {campo === "notas" ? (
            <textarea
              value={valor[campo]}
              onChange={(e) => onChange({ ...valor, [campo]: e.target.value })}
              className="rounded border border-outline-variant bg-surface-container-lowest p-space-sm text-body-md text-on-surface"
            />
          ) : (
            <input
              value={valor[campo]}
              onChange={(e) => onChange({ ...valor, [campo]: e.target.value })}
              className="rounded border border-outline-variant bg-surface-container-lowest p-space-sm text-body-md text-on-surface"
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}

/** Dirección en una línea con los campos que tienen valor (sin notas). */
export function textoDireccion(direccion: Direccion): string {
  const { calle, numero, portal, piso, puerta, codigoPostal, ciudad } = direccion;
  const partes = [
    [calle, numero].filter(Boolean).join(" "),
    portal && `portal ${portal}`,
    [piso, puerta].filter(Boolean).join(""),
    [codigoPostal, ciudad].filter(Boolean).join(" "),
  ];
  return partes.filter(Boolean).join(", ");
}
