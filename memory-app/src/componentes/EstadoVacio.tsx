// Estado vacío: círculo con icono, título y texto centrados.
import Icono, { type NombreIcono } from "./Icono";

interface Props {
  icono: NombreIcono;
  titulo: string;
  texto?: string;
}

export default function EstadoVacio({ icono, titulo, texto }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary">
        <Icono nombre={icono} tamano={32} />
      </span>
      <p className="text-headline-sm text-on-surface">{titulo}</p>
      {texto && <p className="max-w-xs text-body-md text-outline">{texto}</p>}
    </div>
  );
}
