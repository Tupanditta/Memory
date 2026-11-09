// Avatares de 24 px solapados; con más de 2 personas, 2 avatares y un tercero "+N".
import Avatar from "./Avatar";

interface Props {
  personas: readonly { id: string; nombre: string }[];
}

export default function FilaAvatares({ personas }: Props) {
  const visibles = personas.length > 2 ? personas.slice(0, 2) : personas;
  const resto = personas.length - visibles.length;
  return (
    <span aria-hidden="true" className="flex items-center">
      {visibles.map((p, i) => (
        <Avatar key={p.id} id={p.id} nombre={p.nombre} tamano={24} letras={1} className={`ring-2 ring-surface-container-lowest ${i > 0 ? "-ml-1.5" : ""}`} />
      ))}
      {resto > 0 && (
        <span className="-ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[9px] font-bold text-on-surface-variant ring-2 ring-surface-container-lowest">
          +{resto}
        </span>
      )}
    </span>
  );
}
