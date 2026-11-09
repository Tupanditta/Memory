// Calendario (CU5, RF8, R5): solo cumpleaños y aniversarios, por la próxima fecha.
import { Link } from "react-router";
import Cabecera from "../componentes/Cabecera";
import EstadoVacio from "../componentes/EstadoVacio";
import { ETIQUETA_TIPO } from "../componentes/FormularioPersona";
import Pantalla from "../componentes/Pantalla";
import { useApp } from "../estado/contexto";
import { entradasCalendario, textoDiaMes } from "../utilidades/calendario";
import { etiquetaProximaFecha } from "../utilidades/presentacion";

export default function Calendario() {
  const { datos } = useApp();
  const hoy = new Date();
  const entradas = entradasCalendario(datos.personas, hoy);

  return (
    <>
      <Cabecera />
      <Pantalla tipo="pestana">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-md text-on-surface">Calendario</h1>
          <p className="text-body-md text-on-surface-variant">Aviso el día anterior a las {datos.ajustes.horaNotificacion}</p>
        </div>

        {entradas.length === 0 ? (
          <EstadoVacio icono="event_busy" titulo="Sin fechas guardadas" />
        ) : (
          <ul aria-label="Próximas fechas" className="flex flex-col gap-3">
            {entradas.map(({ persona, fecha, indice }) => (
              <li key={`${persona.id}:${indice}`}>
                <Link
                  to={`/persona/${persona.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest p-4 shadow-sm active:scale-[0.98]"
                >
                  <span className="flex flex-col">
                    <span className="text-label-lg text-on-surface">{persona.nombre}</span>
                    <span className="text-body-sm text-on-surface-variant">
                      {ETIQUETA_TIPO[fecha.tipo]}
                      {fecha.etiqueta && ` (${fecha.etiqueta})`} · {textoDiaMes(fecha)}
                    </span>
                  </span>
                  <span className="text-label-md text-primary">{etiquetaProximaFecha(fecha, hoy)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Pantalla>
    </>
  );
}
