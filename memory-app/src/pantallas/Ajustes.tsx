// Ajustes (CU10 a CU12; design.md, "Ajustes"): hora de aviso, guardada en `ajustes.json`,
// y copia de seguridad (exportar e importar).
import { useEffect, useRef, useState } from "react";
import { version } from "../../package.json";
import AvisoEmergente from "../componentes/AvisoEmergente";
import Boton from "../componentes/Boton";
import Cabecera from "../componentes/Cabecera";
import Icono, { type NombreIcono } from "../componentes/Icono";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
import { useApp } from "../estado/contexto";
import { bytesExportacion, textoResumen } from "../servicios/intercambioService";
import { horaDeMinutos, minutosDeHora, textoTamano } from "../utilidades/presentacion";

/** Deslizador de 06:00 a 22:00 en pasos de 30 minutos. */
export const HORA_MIN = 6 * 60;
export const HORA_MAX = 22 * 60;
export const PASO_HORA = 30;
export const HORAS_RAPIDAS = ["08:00", "09:00", "10:30", "20:00"] as const;

/** Paso del deslizador más cercano a una hora (dentro de 06:00–22:00). */
export function pasoMasCercano(hora: string): number {
  const minutos = Math.round(minutosDeHora(hora) / PASO_HORA) * PASO_HORA;
  return Math.min(HORA_MAX, Math.max(HORA_MIN, minutos));
}

export default function Ajustes() {
  const { datos, ejecutar, importarDesdeArchivo, copia, anotarCopia } = useApp();
  const guardada = datos.ajustes.horaNotificacion;

  // Hora elegida mientras se arrastra o se guarda; `null` = se muestra la guardada.
  const [eleccion, setEleccion] = useState<number | null>(null);
  const lectura = eleccion === null ? guardada : horaDeMinutos(eleccion);
  const deslizador = useRef<HTMLInputElement>(null);

  /** Guarda la hora elegida (al soltar el deslizador o al pulsar un chip), no en cada paso. */
  async function confirmarHora(minutos: number) {
    const hora = horaDeMinutos(minutos);
    if (hora === guardada) {
      setEleccion(null);
      return;
    }
    setEleccion(minutos);
    // Si falla, se vuelve a la hora guardada y se ve el banner de error (RNF9).
    await ejecutar((s) => s.ajustes.cambiarHora(hora));
    setEleccion(null);
  }
  const confirmar = useRef(confirmarHora);
  confirmar.current = confirmarHora;

  // El evento nativo `change` de un `range` llega al soltarlo (o con cada tecla);
  // el `onChange` de React llega con cada paso (`input`).
  useEffect(() => {
    const elemento = deslizador.current;
    if (!elemento) return;
    const alSoltar = () => void confirmar.current(Number(elemento.value));
    elemento.addEventListener("change", alSoltar);
    return () => elemento.removeEventListener("change", alSoltar);
  }, []);

  const [ocupado, setOcupado] = useState(false);
  const [avisoCopia, setAvisoCopia] = useState<{ texto: string; n: number } | null>(null);
  const avisar = (texto: string) => setAvisoCopia((previo) => ({ texto, n: (previo?.n ?? 0) + 1 }));

  async function exportar() {
    setOcupado(true);
    try {
      const resultado = await ejecutar((s) => s.intercambio.exportar());
      if (resultado.ok) {
        const ahora = new Date();
        anotarCopia({ tipo: "exportada", hora: horaDeMinutos(ahora.getHours() * 60 + ahora.getMinutes()), bytes: bytesExportacion(resultado.valor) });
        avisar("Copia exportada en formato JSON");
      }
    } finally {
      setOcupado(false);
    }
  }

  async function importar() {
    setOcupado(true);
    try {
      const resultado = await importarDesdeArchivo();
      if (resultado?.ok) {
        anotarCopia({ tipo: "importada", resumen: textoResumen(resultado.valor) });
        avisar("Datos importados correctamente");
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Cabecera />
      <Pantalla tipo="pestana">
        <div className="flex flex-col gap-space-xs pt-space-xs">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-headline-md tracking-tight text-on-surface">Ajustes y Datos</h1>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary-fixed px-3 py-1 text-label-sm text-on-secondary-fixed shadow-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              Guardado local
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">Personaliza tus recordatorios y gestiona la privacidad de tus recuerdos.</p>
        </div>

        <div className="relative flex h-36 w-full items-center justify-between overflow-hidden rounded-lg bg-surface-container-low px-space-lg shadow-sm">
          <div className="relative z-10 flex max-w-[62%] flex-col gap-1">
            <span className="text-label-md uppercase tracking-wider text-primary">Tranquilidad diaria</span>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Tus recuerdos no se apresuran. Configura momentos serenos para conectar con quienes más quieres.
            </p>
          </div>
          <span aria-hidden="true" className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed text-primary shadow-sm">
            <Icono nombre="local_cafe" tamano={40} />
          </span>
        </div>

        <Tarjeta elemento="section" aria-labelledby="titulo-aviso" padding={24} className="flex flex-col gap-space-md">
          <CabeceraAjuste id="titulo-aviso" icono="notifications_active" colorCirculo="bg-secondary-fixed text-secondary" titulo="Aviso de fechas" subtitulo="Notificaciones serenas y puntuales" />
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            Recibirás un aviso el día anterior a cada cumpleaños o aniversario para que siempre tengas tiempo de celebrar.
          </p>
          <div role="group" aria-labelledby="titulo-hora" className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icono nombre="schedule" tamano={20} className="text-primary" />
                <span id="titulo-hora" className="text-label-lg text-on-surface">
                  Hora de notificación
                </span>
              </div>
              <span
                aria-label="Hora elegida"
                className="rounded-full bg-primary-fixed px-3 py-1.5 text-headline-sm font-semibold tracking-tight text-on-primary-fixed shadow-sm transition-all duration-200"
              >
                {lectura}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {HORAS_RAPIDAS.map((hora) => {
                const activa = hora === lectura;
                return (
                  <button
                    key={hora}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => void confirmarHora(minutosDeHora(hora))}
                    className={`zona-tactil relative rounded-full px-3.5 py-1.5 text-label-md shadow-sm transition-transform duration-150 active:scale-95 ${activa ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest text-on-surface-variant"}`}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
                <span>Mañana temprano</span>
                <span>Noche</span>
              </div>
              <input
                ref={deslizador}
                type="range"
                aria-label="Hora de aviso"
                aria-valuetext={lectura}
                min={HORA_MIN}
                max={HORA_MAX}
                step={PASO_HORA}
                value={eleccion ?? pasoMasCercano(guardada)}
                onChange={(e) => setEleccion(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-container-highest accent-primary focus:outline-none"
              />
            </div>
          </div>
        </Tarjeta>

        <Tarjeta elemento="section" aria-labelledby="titulo-copia" padding={24} className="flex flex-col gap-space-md">
          <CabeceraAjuste id="titulo-copia" icono="shield_lock" colorCirculo="bg-primary-fixed text-primary" titulo="Copia de seguridad local" subtitulo="Control absoluto de tus recuerdos" />
          <div className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-md">
            <Icono nombre="verified_user" tamano={20} className="mt-0.5 text-tertiary" />
            <p className="text-body-sm leading-relaxed text-on-surface">
              Tus datos son 100% privados y se guardan solo en tu dispositivo. Puedes exportarlos a un archivo JSON o restaurarlos cuando quieras sin servidores externos.
            </p>
          </div>
          <div className="flex flex-col gap-space-sm pt-space-xs">
            <Boton variante="azulSuave" icono="ios_share" escala={95} aria-label="Exportar" onClick={exportar} disabled={ocupado} className="min-h-[50px] w-full shadow-sm">
              Exportar datos (JSON)
            </Boton>
            <Boton variante="lilaSuave" icono="system_update_alt" escala={95} aria-label="Importar" onClick={importar} disabled={ocupado} className="min-h-[50px] w-full shadow-sm">
              Importar datos (JSON)
            </Boton>
          </div>
          {copia?.tipo === "exportada" && (
            <div aria-label="Última copia" className="flex items-center justify-between px-1 pt-1 text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <Icono nombre="check_circle" tamano={16} className="text-tertiary" />
                <span>Realizada hoy a las {copia.hora}</span>
              </span>
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm">{textoTamano(copia.bytes)}</span>
            </div>
          )}
          {copia?.tipo === "importada" && (
            <p aria-label="Resumen de importación" className="flex items-center gap-1.5 px-1 pt-1 text-label-sm text-on-surface-variant">
              <Icono nombre="check_circle" tamano={16} className="shrink-0 text-tertiary" />
              <span>{copia.resumen}</span>
            </p>
          )}
        </Tarjeta>

        <AvisoEmergente key={avisoCopia?.n} variante="enLinea" icono="check" mensaje={avisoCopia?.texto ?? null} onTerminar={() => setAvisoCopia(null)} />

        <div className="flex items-center gap-space-md rounded-lg bg-surface-container-high/60 p-space-md shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-secondary">
            <Icono nombre="favorite" tamano={20} />
          </span>
          <p className="text-body-sm italic text-on-surface-variant">"Recordar es volver a pasar por el corazón."</p>
        </div>

        <footer className="flex flex-col items-center gap-1 pb-space-sm pt-space-xs text-center">
          <p className="text-label-sm text-outline">Memory v{version} • Hecho para recordar lo importante</p>
          <div className="flex items-center gap-2 text-label-sm text-outline-variant">
            <span>Privacidad local</span>
            <span aria-hidden="true">•</span>
            <span>Sin conexión</span>
          </div>
        </footer>
      </Pantalla>
    </>
  );
}

interface PropsCabecera {
  id: string;
  icono: NombreIcono;
  colorCirculo: string;
  titulo: string;
  subtitulo: string;
}

/** Cabecera de las tarjetas de Ajustes: círculo de 48 con icono relleno, título y subtítulo. */
function CabeceraAjuste({ id, icono, colorCirculo, titulo, subtitulo }: PropsCabecera) {
  return (
    <div className="flex items-center gap-space-md">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${colorCirculo}`}>
        <Icono nombre={icono} tamano={24} relleno />
      </span>
      <div className="flex min-w-0 flex-col">
        <h2 id={id} className="text-headline-sm leading-tight text-on-surface">
          {titulo}
        </h2>
        <span className="text-label-sm text-on-surface-variant">{subtitulo}</span>
      </div>
    </div>
  );
}
