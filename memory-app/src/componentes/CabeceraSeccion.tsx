// Cabecera de una sección de lista: icono y título a la izquierda, contador a la derecha.
import Icono, { type NombreIcono } from "./Icono";

interface Props {
  icono: NombreIcono;
  /** Color del icono, p. ej. `text-primary`. */
  colorIcono?: string;
  titulo: string;
  contador?: string;
  /** `id` del título, para nombrar la sección (`aria-labelledby`). */
  id?: string;
}

export default function CabeceraSeccion({ icono, colorIcono = "text-primary", titulo, contador, id }: Props) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 id={id} className="flex items-center gap-2 text-headline-sm text-on-surface">
        <Icono nombre={icono} tamano={18} relleno className={colorIcono} />
        {titulo}
      </h2>
      {contador && <span className="text-label-sm text-outline">{contador}</span>}
    </div>
  );
}
