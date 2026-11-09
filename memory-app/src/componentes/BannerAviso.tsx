// Aviso que no es un fallo de guardado (p. ej. notificaciones sin permiso, T7.6).
import { useApp } from "../estado/contexto";

export default function BannerAviso() {
  const { aviso, limpiarAviso } = useApp();
  if (!aviso) return null;
  return (
    <div role="status" className="mx-margin mt-space-sm flex items-start justify-between gap-space-sm rounded bg-secondary-fixed p-space-md text-body-md text-on-secondary-fixed">
      <p>{aviso}</p>
      <button type="button" onClick={limpiarAviso} aria-label="Cerrar aviso de notificaciones" className="text-label-lg">
        ×
      </button>
    </div>
  );
}
