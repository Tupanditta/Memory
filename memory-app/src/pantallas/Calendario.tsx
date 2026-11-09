// Calendario (CU5, RF8, R5): solo cumpleaños y aniversarios, por la próxima fecha.
import { Link } from "react-router";
import { ETIQUETA_TIPO } from "../componentes/FormularioPersona";
import { useApp } from "../estado/contexto";
import { entradasCalendario, textoDiaMes } from "../utilidades/calendario";

function textoFalta(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

export default function Calendario() {
  const { datos } = useApp();
  const entradas = entradasCalendario(datos.personas, new Date());

  return (
    <main className="flex min-h-screen flex-col gap-space-lg bg-surface px-margin py-space-lg">
      <h1 className="text-headline-md text-primary">Calendario</h1>
      <p className="text-body-md text-on-surface-variant">Aviso el día anterior a las {datos.ajustes.horaNotificacion}</p>

      {entradas.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Sin fechas guardadas</p>
      ) : (
        <ul aria-label="Próximas fechas" className="flex flex-col gap-space-sm">
          {entradas.map(({ persona, fecha, indice, dias }) => (
            <li key={`${persona.id}:${indice}`}>
              <Link to={`/persona/${persona.id}`} className="flex items-center justify-between gap-space-sm rounded bg-surface-container-lowest p-space-md shadow-sm">
                <span className="flex flex-col">
                  <span className="text-label-lg text-on-surface">{persona.nombre}</span>
                  <span className="text-body-sm text-on-surface-variant">
                    {ETIQUETA_TIPO[fecha.tipo]}
                    {fecha.etiqueta && ` (${fecha.etiqueta})`} · {textoDiaMes(fecha)}
                  </span>
                </span>
                <span className="text-label-md text-primary">{textoFalta(dias)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
