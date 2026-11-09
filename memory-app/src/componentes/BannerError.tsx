// Mensaje de error de un guardado que ha fallado (RNF9).
import { useApp } from "../estado/contexto";

export default function BannerError() {
  const { error, limpiarError } = useApp();
  if (!error) return null;
  return (
    <div role="alert" className="mx-margin mt-space-sm flex items-start justify-between gap-space-sm rounded bg-error-container p-space-md text-body-md text-on-error-container">
      <p>{error}</p>
      <button type="button" onClick={limpiarError} aria-label="Cerrar aviso" className="text-label-lg">
        ×
      </button>
    </div>
  );
}
