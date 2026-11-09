// Fila de persona que se marca o desmarca (selector de miembros de una casa).
import Avatar from "./Avatar";
import Icono from "./Icono";

interface Props {
  id: string;
  nombre: string;
  apodo?: string;
  seleccionada: boolean;
  onAlternar(): void;
}

export default function FilaPersonaSeleccionable({ id, nombre, apodo, seleccionada, onAlternar }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={seleccionada}
      aria-label={nombre}
      onClick={onAlternar}
      className={`flex w-full items-center gap-3 rounded p-2.5 text-left shadow-sm active:scale-[0.98] ${seleccionada ? "bg-primary-fixed/20" : "bg-surface-container-lowest"}`}
    >
      <Avatar id={id} nombre={nombre} tamano={44} className="shadow-sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label-lg text-on-surface">{nombre}</span>
        {apodo && <span className="truncate text-body-sm text-on-surface-variant">{apodo}</span>}
      </span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${seleccionada ? "bg-primary text-on-primary" : "bg-surface-container text-transparent"}`}
      >
        <Icono nombre="check" tamano={18} />
      </span>
    </button>
  );
}
