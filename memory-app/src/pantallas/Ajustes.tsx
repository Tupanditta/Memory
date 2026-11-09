// Ajustes (CU10 a CU12): hora de aviso, guardada en `ajustes.json`, y copia de seguridad.
import { useState, type FormEvent } from "react";
import Boton from "../componentes/Boton";
import Cabecera from "../componentes/Cabecera";
import Campo from "../componentes/Campo";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
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
    <>
      <Cabecera />
      <Pantalla tipo="pestana">
        <h1 className="text-headline-md text-on-surface">Ajustes</h1>

        <Tarjeta elemento="section" aria-label="Aviso de fechas" padding={24} className="flex flex-col gap-4">
          <h2 className="text-headline-sm text-on-surface">Aviso de fechas</h2>
          <p className="text-body-md text-on-surface-variant">Los avisos llegan el día anterior a las {guardada}.</p>
          <form onSubmit={enviar} className="flex items-end gap-2">
            <Campo etiqueta="Hora de aviso" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="flex-1" />
            <Boton type="submit" variante="primarioSuave" disabled={guardando || hora === guardada}>
              Guardar
            </Boton>
          </form>
        </Tarjeta>

        <Tarjeta elemento="section" aria-label="Copia de seguridad" padding={24} className="flex flex-col gap-4">
          <h2 className="text-headline-sm text-on-surface">Copia de seguridad</h2>
          <p className="text-body-md text-on-surface-variant">Exporta todas las personas y casas a un archivo JSON. Importar solo añade lo que no tengas ya.</p>
          <div className="flex flex-col gap-2">
            <Boton variante="azulSuave" icono="ios_share" escala={95} onClick={exportar} disabled={ocupado} className="w-full shadow-sm">
              Exportar
            </Boton>
            <Boton variante="lilaSuave" icono="system_update_alt" escala={95} onClick={importar} disabled={ocupado} className="w-full shadow-sm">
              Importar
            </Boton>
          </div>
          {resumen && (
            <p aria-label="Resumen de importación" className="px-1 text-body-md text-on-surface">
              {resumen}
            </p>
          )}
        </Tarjeta>
      </Pantalla>
    </>
  );
}
