// Ajustes (CU10): hora de aviso, guardada en `ajustes.json`. Exportar e importar llegan en el Sprint 8.
import { useState, type FormEvent } from "react";
import { useApp } from "../estado/contexto";

export default function Ajustes() {
  const { datos, ejecutar } = useApp();
  const guardada = datos.ajustes.horaNotificacion;
  const [hora, setHora] = useState(guardada);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    try {
      const resultado = await ejecutar((s) => s.ajustes.cambiarHora(hora));
      // Si falla, el formulario vuelve a la hora guardada (RNF9).
      if (!resultado.ok) setHora(guardada);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-space-lg bg-surface px-margin py-space-lg">
      <h1 className="text-headline-md text-primary">Ajustes</h1>

      <section aria-label="Aviso de fechas" className="flex flex-col gap-space-sm rounded bg-surface-container-lowest p-space-md shadow-sm">
        <h2 className="text-headline-sm text-on-surface">Aviso de fechas</h2>
        <p className="text-body-md text-on-surface-variant">
          Los avisos llegan el día anterior a las {guardada}.
        </p>
        <form onSubmit={enviar} className="flex items-end gap-space-sm">
          <label className="flex flex-col gap-space-xs text-label-md text-on-surface-variant">
            Hora de aviso
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="rounded bg-surface-container-low px-space-md py-space-sm text-body-md text-on-surface"
            />
          </label>
          <button type="submit" disabled={guardando || hora === guardada} className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary disabled:opacity-50">
            Guardar
          </button>
        </form>
      </section>
    </main>
  );
}
