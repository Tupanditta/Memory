// Ajustes (CU10 a CU12): hora de aviso, guardada en `ajustes.json`, y copia de seguridad.
import { useState, type FormEvent } from "react";
import { useApp } from "../estado/contexto";
import { textoResumen } from "../servicios/intercambioService";

export default function Ajustes() {
  const { datos, ejecutar, importarDesdeArchivo } = useApp();
  const guardada = datos.ajustes.horaNotificacion;
  const [hora, setHora] = useState(guardada);
  const [guardando, setGuardando] = useState(false);

  const [ocupado, setOcupado] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);

  async function exportar() {
    setOcupado(true);
    try {
      await ejecutar((s) => s.intercambio.exportar());
    } finally {
      setOcupado(false);
    }
  }

  async function importar() {
    setOcupado(true);
    setResumen(null);
    try {
      const resultado = await importarDesdeArchivo();
      if (resultado?.ok) setResumen(textoResumen(resultado.valor));
    } finally {
      setOcupado(false);
    }
  }

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
    <main className="flex flex-col gap-space-lg bg-surface px-margin py-space-lg">
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

      <section aria-label="Copia de seguridad" className="flex flex-col gap-space-sm rounded bg-surface-container-lowest p-space-md shadow-sm">
        <h2 className="text-headline-sm text-on-surface">Copia de seguridad</h2>
        <p className="text-body-md text-on-surface-variant">Exporta todas las personas y casas a un archivo JSON. Importar solo añade lo que no tengas ya.</p>
        <div className="flex flex-wrap gap-space-sm">
          <button type="button" onClick={exportar} disabled={ocupado} className="rounded-full bg-primary-fixed px-space-lg py-space-sm text-label-lg text-on-primary-fixed">
            Exportar
          </button>
          <button type="button" onClick={importar} disabled={ocupado} className="rounded-full bg-secondary-fixed px-space-lg py-space-sm text-label-lg text-on-secondary-fixed">
            Importar
          </button>
        </div>
        {resumen && (
          <p aria-label="Resumen de importación" className="text-body-md text-on-surface">
            {resumen}
          </p>
        )}
      </section>
    </main>
  );
}
