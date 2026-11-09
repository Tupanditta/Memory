// Calendario (CU5, RF8, R5; design.md, "Calendario"): solo cumpleaños y aniversarios,
// agrupados por el mes de su próxima ocurrencia y ordenados por la más próxima.
import { Link } from "react-router";
import Avatar from "../componentes/Avatar";
import Cabecera from "../componentes/Cabecera";
import CirculoDifuso from "../componentes/CirculoDifuso";
import EstadoVacio from "../componentes/EstadoVacio";
import Icono from "../componentes/Icono";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
import { useApp } from "../estado/contexto";
import { agruparPorMes, diaAvisoAnual, entradasCalendario, type EntradaCalendario } from "../utilidades/calendario";
import {
  contar,
  cuandoEnFrase,
  DIAS_CERCANA,
  etiquetaDias,
  fechaConDiaSemana,
  fechaCorta,
  MESES,
  MESES_CORTOS,
  nombreFecha,
} from "../utilidades/presentacion";

/** Punto de cada mes: rota por orden en la lista. */
const PUNTOS = ["bg-primary", "bg-secondary", "bg-tertiary"] as const;

/** Años que se cumplen en la próxima ocurrencia; `null` sin año. */
const anosEnLaFecha = ({ fecha, proxima }: EntradaCalendario) => (fecha.anio === undefined ? null : proxima.getFullYear() - fecha.anio);

export default function Calendario() {
  const { datos } = useApp();
  const hoy = new Date();
  const entradas = entradasCalendario(datos.personas, hoy);
  const meses = agruparPorMes(entradas);
  const primera = entradas[0];

  return (
    <>
      <Cabecera />
      <Pantalla tipo="pestana">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <Icono nombre="star_shine" tamano={20} relleno className="text-secondary" />
            <span className="text-label-md uppercase tracking-wider text-secondary">Fechas señaladas</span>
          </div>
          <h1 className="text-headline-md text-on-surface">Próximas fechas</h1>
        </div>

        {primera ? (
          <>
            <ProximoAviso entrada={primera} hora={datos.ajustes.horaNotificacion} />
            <section aria-label="Próximas fechas" className="flex flex-col gap-space-xl">
              {meses.map((grupo, i) => {
                // Si el mes ya salió antes (el de hoy, otra vez el año que viene), se añade el año.
                const repetido = meses.slice(0, i).some((m) => m.mes === grupo.mes);
                const titulo = repetido ? `${MESES[grupo.mes - 1]} ${grupo.anio}` : MESES[grupo.mes - 1];
                const idTitulo = `mes-${grupo.anio}-${grupo.mes}`;
                return (
                  <section key={idTitulo} aria-labelledby={idTitulo} className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between px-space-xs">
                      <div className="flex items-center gap-space-xs">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${PUNTOS[i % PUNTOS.length]}`} />
                        <h3 id={idTitulo} className="text-headline-sm font-semibold text-on-surface">
                          {titulo}
                        </h3>
                      </div>
                      <span className="text-label-sm text-outline">{contar(grupo.entradas.length, "momento", "momentos")}</span>
                    </div>
                    <ul className="flex flex-col gap-space-sm">
                      {grupo.entradas.map((entrada) => (
                        <FilaFecha key={`${entrada.persona.id}:${entrada.indice}`} entrada={entrada} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </section>
          </>
        ) : (
          <EstadoVacio icono="event" titulo="Aún no hay fechas guardadas" texto="Añade cumpleaños o aniversarios en la ficha de una persona." />
        )}

        <div className="mt-space-sm flex flex-col items-center justify-center gap-space-xs rounded-lg bg-surface-container-low p-space-lg text-center">
          <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <Icono nombre="calendar_add_on" tamano={20} />
          </span>
          <p className="text-body-md font-semibold text-on-surface">Cada día guarda una historia</p>
          <p className="max-w-xs text-body-sm text-outline">Memory te avisa el día anterior para que estés presente en el momento adecuado.</p>
        </div>
      </Pantalla>
    </>
  );
}

/** Tarjeta "Próximo aviso": la primera fecha del calendario (RF8, RF9). */
function ProximoAviso({ entrada, hora }: { entrada: EntradaCalendario; hora: string }) {
  const { persona, fecha, proxima, dias } = entrada;
  // El día del aviso es el que se programa de verdad (nunca el 29/02; ver "Notificaciones").
  const aviso = diaAvisoAnual({ dia: proxima.getDate(), mes: proxima.getMonth() + 1 });
  return (
    <Tarjeta
      elemento="section"
      aria-label="Próximo aviso"
      padding={24}
      sombra="ninguna"
      fondo="bg-gradient-to-br from-primary-fixed via-secondary-fixed to-surface-container"
      className="shadow-md"
    >
      <CirculoDifuso desenfoque="2xl" className="-bottom-6 -right-6 h-32 w-32 bg-secondary-container/30" />
      <div className="relative z-10 flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/80 px-3 py-1 backdrop-blur-md">
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-label-sm font-semibold text-primary">Próximo aviso</span>
          </span>
          <Avatar id={persona.id} nombre={persona.nombre} tamano={40} className="border-2 border-surface-container-lowest shadow-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-headline-sm text-on-primary-fixed">{persona.nombre}</h2>
          <div className="flex items-center gap-space-xs text-on-primary-fixed-variant">
            <Icono nombre={fecha.tipo === "cumpleaños" ? "cake" : "favorite"} tamano={18} />
            <p className="text-body-md font-medium">
              {nombreFecha(fecha)} {cuandoEnFrase(dias)} • {fechaConDiaSemana(proxima)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm pt-space-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1.5 text-on-surface">
            <Icono nombre="notifications_active" tamano={16} className="text-secondary" />
            <span className="text-body-sm text-on-surface-variant">
              {hora} h el día anterior ({fechaCorta(aviso)})
            </span>
          </span>
        </div>
      </div>
    </Tarjeta>
  );
}

/** Fila de una fecha: insignia con mes y día, persona, tipo y chip de días que faltan. */
function FilaFecha({ entrada }: { entrada: EntradaCalendario }) {
  const { persona, fecha, proxima, dias } = entrada;
  const cumple = fecha.tipo === "cumpleaños";
  const anos = anosEnLaFecha(entrada);
  const colorChip = !cumple
    ? "bg-secondary-fixed text-on-secondary-fixed"
    : dias <= DIAS_CERCANA
      ? "bg-primary-fixed text-on-primary-fixed-variant"
      : "bg-surface-container-high text-on-surface-variant";
  return (
    <li>
      <Link
        to={`/persona/${persona.id}`}
        className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-md shadow-sm transition-transform duration-150 active:scale-[0.98]"
      >
        <span className="flex min-w-0 items-center gap-space-md">
          <span
            aria-hidden="true"
            className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full shadow-inner ${cumple ? "bg-surface-container-high text-primary" : "bg-secondary-fixed text-secondary"}`}
          >
            <span className="-mb-1 text-label-sm uppercase">{MESES_CORTOS[proxima.getMonth()]}</span>
            <span className="text-headline-sm font-bold">{proxima.getDate()}</span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-body-lg font-bold text-on-surface">{persona.nombre}</span>
              {persona.apodo.trim() && <span className="text-body-sm font-normal text-outline">({persona.apodo.trim()})</span>}
            </span>
            <span className="flex items-center gap-1 text-on-surface-variant">
              <Icono nombre={cumple ? "cake" : "favorite"} tamano={15} relleno={!cumple} className={cumple ? "text-secondary" : "text-primary"} />
              <span className="truncate text-body-sm">
                {nombreFecha(fecha)}
                {anos !== null && ` (${contar(anos, "año", "años")})`}
              </span>
            </span>
          </span>
        </span>
        <span className="shrink-0 pl-space-xs">
          <span className={`rounded-full px-2.5 py-1 text-label-sm font-semibold ${colorChip}`}>{etiquetaDias(dias)}</span>
        </span>
      </Link>
    </li>
  );
}
