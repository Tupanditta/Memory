// Aviso que no es un fallo de guardado (p. ej. notificaciones sin permiso, T7.6).
import { useApp } from "../estado/contexto";
import Icono from "./Icono";

export default function BannerAviso() {
  const { aviso, limpiarAviso } = useApp();
  if (!aviso) return null;
  return (
    <div role="status" aria-label="Aviso de notificaciones" className="flex items-start gap-2 rounded bg-secondary-fixed px-4 py-3 text-label-md text-on-secondary-fixed">
      <Icono nombre="notifications_off" tamano={18} className="text-secondary" />
      <p className="flex-1">{aviso}</p>
      <button type="button" onClick={limpiarAviso} aria-label="Cerrar aviso de notificaciones" className="zona-tactil flex items-center active:scale-95">
        <Icono nombre="close" tamano={18} />
      </button>
    </div>
  );
}
