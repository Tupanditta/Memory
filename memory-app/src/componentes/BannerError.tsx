// Mensaje de error de un guardado que ha fallado (RNF9), bajo la cabecera.
import { useApp } from "../estado/contexto";
import Icono from "./Icono";

export default function BannerError() {
  const { error, limpiarError } = useApp();
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded bg-error-container px-4 py-3 text-label-md text-on-error-container">
      <Icono nombre="error" tamano={18} className="text-error" />
      <p className="flex-1">{error}</p>
      <button type="button" onClick={limpiarError} aria-label="Cerrar aviso" className="zona-tactil flex items-center text-on-error-container active:scale-95">
        <Icono nombre="close" tamano={18} />
      </button>
    </div>
  );
}
