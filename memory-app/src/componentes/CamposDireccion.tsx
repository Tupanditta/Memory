// Campos de dirección, compartidos por los formularios de persona y de casa.
// Disposición: Calle (2/3) + Nº (1/3) / Portal + Piso + Puerta / Código postal + Ciudad / Notas.
import type { Direccion } from "../modelos/tipos";
import Campo from "./Campo";

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
  /** `suave` (persona: con etiquetas) o `pildora` (casa: solo marcadores). */
  forma?: "suave" | "pildora";
}

const FILAS: { campos: (keyof Direccion)[]; columnas: string; anchos?: string[] }[] = [
  { campos: ["calle", "numero"], columnas: "grid-cols-3", anchos: ["col-span-2", ""] },
  { campos: ["portal", "piso", "puerta"], columnas: "grid-cols-3" },
  { campos: ["codigoPostal", "ciudad"], columnas: "grid-cols-2" },
];

export default function CamposDireccion({ valor, onChange, forma = "suave" }: Props) {
  const cambiar = (campo: keyof Direccion) => (e: { target: { value: string } }) => onChange({ ...valor, [campo]: e.target.value });
  return (
    <fieldset className={`flex flex-col ${forma === "pildora" ? "gap-3" : "gap-2"}`}>
      <legend className="mb-2 px-1 text-label-lg text-on-surface">Dirección</legend>
      {FILAS.map(({ campos, columnas, anchos }) => (
        <div key={campos.join()} className={`grid gap-2 ${columnas}`}>
          {campos.map((campo, i) => (
            <Campo
              key={campo}
              etiqueta={ETIQUETAS_DIRECCION[campo]}
              variante={forma}
              value={valor[campo]}
              onChange={cambiar(campo)}
              className={anchos?.[i] ?? ""}
              claseEntrada={campo === "numero" ? "text-center" : ""}
            />
          ))}
        </div>
      ))}
      <Campo etiqueta={ETIQUETAS_DIRECCION.notas} variante={forma} multilinea value={valor.notas} onChange={cambiar("notas")} />
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
