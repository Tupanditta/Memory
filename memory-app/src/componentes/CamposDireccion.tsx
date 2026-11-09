// Campos de dirección, compartidos por los formularios de persona y de casa.
// Disposición: Calle (2/3) + Nº (1/3) / Portal + Piso + Puerta / Código postal + Ciudad / Notas.
import type { Direccion } from "../modelos/tipos";
import Campo from "./Campo";
import type { NombreIcono } from "./Icono";

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

type Textos = Partial<Record<keyof Direccion, string>>;

interface Props {
  valor: Direccion;
  onChange(direccion: Direccion): void;
  /** `suave` (persona: con etiquetas) o `pildora` (casa: solo marcadores). */
  forma?: "suave" | "pildora";
  /** Etiquetas que sustituyen a las de `ETIQUETAS_DIRECCION`. */
  etiquetas?: Textos;
  /** Marcadores de posición por campo. */
  marcadores?: Textos;
  /** Título del grupo; si la tarjeta ya lo muestra, `leyendaOculta` lo deja solo para lectores de pantalla. */
  leyenda?: string;
  leyendaOculta?: boolean;
  /** Icono delante de la etiqueta de las notas. */
  iconoNotas?: NombreIcono;
  /** Líneas del área de notas. */
  lineasNotas?: number;
  /** Estilo de las etiquetas (forma `suave`); por defecto el de `Campo`. */
  claseEtiqueta?: string;
}

const FILAS: { campos: (keyof Direccion)[]; columnas: string; anchos?: string[] }[] = [
  { campos: ["calle", "numero"], columnas: "grid-cols-3", anchos: ["col-span-2", ""] },
  { campos: ["portal", "piso", "puerta"], columnas: "grid-cols-3" },
  { campos: ["codigoPostal", "ciudad"], columnas: "grid-cols-2" },
];

export default function CamposDireccion({
  valor,
  onChange,
  forma = "suave",
  etiquetas = {},
  marcadores = {},
  leyenda = "Dirección",
  leyendaOculta = false,
  iconoNotas,
  lineasNotas,
  claseEtiqueta,
}: Props) {
  const cambiar = (campo: keyof Direccion) => (e: { target: { value: string } }) => onChange({ ...valor, [campo]: e.target.value });
  const etiqueta = (campo: keyof Direccion) => etiquetas[campo] ?? ETIQUETAS_DIRECCION[campo];
  return (
    <fieldset className={`flex flex-col ${forma === "pildora" ? "gap-3" : "gap-2"}`}>
      <legend className={leyendaOculta ? "sr-only" : "mb-2 px-1 text-label-lg text-on-surface"}>{leyenda}</legend>
      {FILAS.map(({ campos, columnas, anchos }) => (
        <div key={campos.join()} className={`grid gap-2 ${columnas}`}>
          {campos.map((campo, i) => (
            <Campo
              key={campo}
              etiqueta={etiqueta(campo)}
              variante={forma}
              value={valor[campo]}
              placeholder={marcadores[campo]}
              onChange={cambiar(campo)}
              className={anchos?.[i] ?? ""}
              claseEntrada={campo === "numero" ? "text-center" : ""}
              claseEtiqueta={claseEtiqueta}
            />
          ))}
        </div>
      ))}
      <Campo
        etiqueta={etiqueta("notas")}
        variante={forma}
        multilinea
        rows={lineasNotas}
        iconoEtiqueta={iconoNotas}
        claseEtiqueta={claseEtiqueta}
        className={forma === "suave" ? "pt-1" : ""}
        value={valor.notas}
        placeholder={marcadores.notas}
        onChange={cambiar("notas")}
      />
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
