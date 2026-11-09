// Formulario de persona (CU1, CU2, CU4; design.md, "Formulario de persona"): identidad,
// dirección, fechas, casas a las que pertenece y botones. Pinta la pantalla entera
// (cabecera incluida) para que atrás y "Cancelar" pidan confirmación si hay cambios.
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { direccionVacia, type Casa, type Direccion, type Fecha, type Persona, type TipoFecha } from "../modelos/tipos";
import { validarFecha } from "../modelos/validadores";
import { colorAvatar, MESES, MESES_CORTOS } from "../utilidades/presentacion";
import { normalizarTexto } from "../utilidades/texto";
import { useCierreAtras } from "./atras";
import Boton from "./Boton";
import Cabecera from "./Cabecera";
import Campo, { ETIQUETA_FORMULARIO } from "./Campo";
import CamposDireccion from "./CamposDireccion";
import ChipSeleccion from "./ChipSeleccion";
import DialogoConfirmacion from "./DialogoConfirmacion";
import HojaInferior from "./HojaInferior";
import Icono, { type NombreIcono } from "./Icono";
import Pantalla from "./Pantalla";
import Tarjeta from "./Tarjeta";

export interface ValoresPersona {
  nombre: string;
  apodo: string;
  direccion: Direccion;
  fechas: Fecha[];
  /** Casas a las que pertenece (formulario "Asignar a una casa"). */
  casasIds: string[];
}

/** Fecha mientras se edita: los números son texto hasta guardar. */
interface FechaEditable {
  tipo: TipoFecha;
  etiqueta: string;
  dia: string;
  /** "1" a "12", o "" sin elegir. */
  mes: string;
  anio: string;
}

const ETIQUETA_TIPO: Record<TipoFecha, string> = { cumpleaños: "Cumpleaños", aniversario: "Aniversario" };
const ICONO_TIPO: Record<TipoFecha, NombreIcono> = { cumpleaños: "cake", aniversario: "celebration" };

const fechaVacia = (): FechaEditable => ({ tipo: "cumpleaños", etiqueta: "", dia: "", mes: "", anio: "" });

/** Un bloque sin día, mes, año ni etiqueta no es una fecha: no se guarda. */
const estaVacia = (f: FechaEditable) => [f.etiqueta, f.dia, f.mes, f.anio].every((t) => t.trim() === "");

const aEditable = (f: Fecha): FechaEditable => ({
  tipo: f.tipo,
  etiqueta: f.etiqueta,
  dia: String(f.dia),
  mes: String(f.mes),
  anio: f.anio === undefined ? "" : String(f.anio),
});

const aNumero = (texto: string): number => (/^\d+$/.test(texto.trim()) ? Number(texto.trim()) : NaN);

function aFecha(f: FechaEditable): Fecha {
  const fecha: Fecha = { tipo: f.tipo, etiqueta: f.etiqueta.trim(), dia: aNumero(f.dia), mes: aNumero(f.mes) };
  if (f.anio.trim() !== "") fecha.anio = aNumero(f.anio);
  return fecha;
}

/** Huella de lo escrito, para saber si hay cambios sin guardar. */
function huella(v: { nombre: string; apodo: string; direccion: Direccion; fechas: FechaEditable[]; casasIds: string[] }): string {
  return JSON.stringify([v.nombre, v.apodo, v.direccion, v.fechas.filter((f) => !estaVacia(f)), [...v.casasIds].sort()]);
}

/** Etiquetas fuera de los campos: las mismas que en el formulario de casa. */
const ETIQUETA = ETIQUETA_FORMULARIO;

/** Color del punto de cada casa, por orden. */
const PUNTOS = ["bg-tertiary-fixed-dim", "bg-secondary-container", "bg-primary-fixed-dim"];

interface Props {
  /** Persona que se edita; sin ella, el formulario crea una nueva. */
  inicial?: Persona;
  /** Todas las casas, para "Asignar a una casa". */
  casas: readonly Casa[];
  /** Guarda; devuelve `true` si se ha guardado. */
  onGuardar(valores: ValoresPersona): Promise<boolean>;
  /** Sale sin guardar (tras confirmar si había cambios). */
  onCancelar(): void;
}

export default function FormularioPersona({ inicial, casas, onGuardar, onCancelar }: Props) {
  const idNombre = useId();
  const casasIniciales = inicial ? casas.filter((c) => c.personas.includes(inicial.id)).map((c) => c.id) : [];
  const [valoresIniciales] = useState(() => ({
    nombre: inicial?.nombre ?? "",
    apodo: inicial?.apodo ?? "",
    direccion: inicial?.direccion ?? direccionVacia(),
    fechas: inicial && inicial.fechas.length > 0 ? inicial.fechas.map(aEditable) : [fechaVacia()],
    casasIds: casasIniciales,
  }));
  const [nombre, setNombre] = useState(valoresIniciales.nombre);
  const [apodo, setApodo] = useState(valoresIniciales.apodo);
  const [direccion, setDireccion] = useState<Direccion>(valoresIniciales.direccion);
  const [fechas, setFechas] = useState<FechaEditable[]>(valoresIniciales.fechas);
  const [casasIds, setCasasIds] = useState<string[]>(valoresIniciales.casasIds);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [erroresFecha, setErroresFecha] = useState<(string | null)[]>([]);
  /** Índice de la fecha cuya hoja de meses está abierta. */
  const [hojaMes, setHojaMes] = useState<number | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  /** Casa que se va a desmarcar y que se borraría (la persona es su único miembro). */
  const [casaPorQuitar, setCasaPorQuitar] = useState<Casa | null>(null);
  const [guardando, setGuardando] = useState(false);

  const hayCambios = huella({ nombre, apodo, direccion, fechas, casasIds }) !== huella(valoresIniciales);
  const cancelar = () => (hayCambios ? setConfirmandoDescarte(true) : onCancelar());
  // Atrás de Android también cancela (con confirmación si hay cambios).
  useCierreAtras(true, cancelar);

  const cambiarFecha = (indice: number, cambios: Partial<FechaEditable>) => {
    setFechas((actuales) => actuales.map((f, i) => (i === indice ? { ...f, ...cambios } : f)));
    setErroresFecha((actuales) => actuales.map((e, i) => (i === indice ? null : e)));
  };
  /** Quita el bloque; si era el único, queda uno vacío. */
  const quitarFecha = (indice: number) => {
    setFechas((actuales) => {
      const resto = actuales.filter((_, i) => i !== indice);
      return resto.length > 0 ? resto : [fechaVacia()];
    });
    setErroresFecha((actuales) => actuales.filter((_, i) => i !== indice));
  };

  const casasOrdenadas = [...casas].sort((a, b) => normalizarTexto(a.apodo).localeCompare(normalizarTexto(b.apodo)));
  const alternarCasa = (casa: Casa) => {
    if (!casasIds.includes(casa.id)) return setCasasIds((ids) => [...ids, casa.id]);
    // Desmarcar la casa de la que es el único miembro la borraría: se confirma (RF7b).
    const seBorraria = inicial !== undefined && casa.personas.length === 1 && casa.personas[0] === inicial.id;
    if (seBorraria) setCasaPorQuitar(casa);
    else setCasasIds((ids) => ids.filter((id) => id !== casa.id));
  };

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    let valido = true;
    if (nombre.trim() === "") {
      setErrorNombre("Escribe el nombre");
      document.getElementById(idNombre)?.focus();
      valido = false;
    } else setErrorNombre(null);
    const errores = fechas.map((f) => {
      if (estaVacia(f)) return null;
      const validacion = validarFecha(aFecha(f));
      return validacion.ok ? null : validacion.error;
    });
    setErroresFecha(errores);
    if (errores.some((e) => e !== null)) valido = false;
    if (!valido) return;

    setGuardando(true);
    try {
      await onGuardar({ nombre, apodo, direccion, fechas: fechas.filter((f) => !estaVacia(f)).map(aFecha), casasIds });
    } finally {
      setGuardando(false);
    }
  }

  const inicialNombre = nombre.trim().charAt(0).toUpperCase();
  const colorIdentidad = colorAvatar(inicial?.id ?? nombre.trim());

  return (
    <>
      <Cabecera titulo="Detalle Persona" onAtras={cancelar} />
      <Pantalla tipo="pila">
        <div className="flex flex-col">
          <div className="mb-space-md flex items-center justify-between py-space-sm">
            <div className="flex flex-col">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-primary">Memoria compartida</span>
              <h2 className="text-headline-md text-on-surface">{inicial ? "Editar Persona" : "Nueva Persona"}</h2>
            </div>
            <button
              type="button"
              onClick={cancelar}
              className="zona-tactil flex items-center gap-1 rounded-full bg-surface-container px-space-md py-space-xs text-label-md text-on-surface-variant active:scale-95"
            >
              <Icono nombre="close" tamano={16} />
              Cancelar
            </button>
          </div>

          <div className="mb-space-lg flex items-center gap-space-md rounded-lg bg-surface-container-low p-space-md shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-primary">
              <Icono nombre="favorite" tamano={26} />
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-label-lg font-semibold text-on-surface">Guarda los detalles que importan</p>
              <p className="line-clamp-1 text-body-sm text-on-surface-variant">Su dirección, cumpleaños y peculiaridades en un lugar seguro.</p>
            </div>
          </div>

          <form onSubmit={enviar} noValidate className="flex flex-col gap-space-xl">
            <Tarjeta padding={24} className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-md pb-space-sm">
                <span
                  aria-hidden="true"
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-inner ${
                    inicialNombre ? `${colorIdentidad.fondo} ${colorIdentidad.texto} text-headline-md` : "bg-surface-container-high text-primary"
                  }`}
                >
                  {inicialNombre || <Icono nombre="face" tamano={32} />}
                </span>
                <div className="flex flex-col">
                  <span className="text-label-md text-on-surface">Icono de contacto</span>
                  <span className="text-body-sm text-on-surface-variant">Se crea con la inicial del nombre</span>
                </div>
              </div>
              <Campo
                id={idNombre}
                etiqueta="Nombre completo"
                asterisco
                claseEtiqueta="text-label-lg text-on-surface"
                icono="person"
                claseRelleno="px-4 py-3.5"
                placeholder="Ej. Lucía Sánchez"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrorNombre(null);
                }}
                error={errorNombre}
                required
              />
              <Campo
                etiqueta="Apodo o alias"
                rotulo="Opcional"
                claseEtiqueta={ETIQUETA}
                icono="sentiment_satisfied"
                placeholder="Ej. Luci"
                value={apodo}
                onChange={(e) => setApodo(e.target.value)}
              />
            </Tarjeta>

            <Seccion icono="home_pin" colorIcono="text-primary" titulo="Dirección particular" ayuda="Para recordar dónde visitarle o enviar detalles especiales.">
              <CamposDireccion
                valor={direccion}
                onChange={setDireccion}
                leyenda="Dirección particular"
                leyendaOculta
                forma="pildora"
                etiquetas={{ numero: "Nº", codigoPostal: "Código Postal", ciudad: "Ciudad o Localidad", notas: "Notas de llegada o acceso" }}
                lineasNotas={3}
              />
            </Seccion>

            <Seccion icono="calendar_today" colorIcono="text-secondary" titulo="Fechas memorables" ayuda="Nunca olvides un momento para felicitarle o celebrar juntos.">
              {fechas.map((fecha, i) => (
                <BloqueFecha
                  key={i}
                  indice={i}
                  fecha={fecha}
                  error={erroresFecha[i] ?? null}
                  // La primera fecha solo se puede quitar (vaciar) si tiene datos.
                  quitable={i > 0 || !estaVacia(fecha)}
                  onCambiar={(cambios) => cambiarFecha(i, cambios)}
                  onQuitar={() => quitarFecha(i)}
                  onElegirMes={() => setHojaMes(i)}
                />
              ))}
              <button
                type="button"
                onClick={() => setFechas((actuales) => [...actuales, fechaVacia()])}
                className="zona-tactil mt-2 flex items-center gap-1.5 self-start rounded-full bg-secondary-fixed/50 px-space-md py-2 text-label-md text-on-secondary-fixed-variant active:scale-95"
              >
                <Icono nombre="add" tamano={18} />
                Añadir otra fecha
              </button>
            </Seccion>

            <Seccion icono="cottage" colorIcono="text-tertiary" titulo="Asignar a una casa" ayuda="Vincúlala a un núcleo o espacio familiar preexistente en Memory.">
              {casasOrdenadas.length === 0 ? (
                <p className="text-body-sm text-outline">Aún no hay casas. Crea una desde Inicio.</p>
              ) : (
                <div role="group" aria-label="Casas" className="flex flex-wrap gap-2.5 pt-1">
                  {casasOrdenadas.map((casa, i) => (
                    <ChipSeleccion key={casa.id} uso="casa" activo={casasIds.includes(casa.id)} onClick={() => alternarCasa(casa)} className="!gap-2 px-4 py-2.5 text-label-md">
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${PUNTOS[i % PUNTOS.length]}`} />
                      {casa.apodo}
                    </ChipSeleccion>
                  ))}
                </div>
              )}
            </Seccion>

            <div className="flex items-center justify-center gap-2 py-1 text-on-surface-variant">
              <Icono nombre="lock" tamano={18} className="text-tertiary" />
              <span className="text-label-sm">Información privada guardada en tu santuario personal</span>
            </div>

            <div className="flex flex-col gap-space-sm pt-space-xs">
              <Boton type="submit" variante="primarioSuave" icono="save" aria-label="Guardar" disabled={guardando} className="w-full">
                Guardar persona
              </Boton>
              <Boton variante="texto" onClick={cancelar} className="w-full !py-3 !text-label-md">
                Cancelar y descartar
              </Boton>
            </div>
          </form>
        </div>

        <HojaInferior abierta={hojaMes !== null} onCerrar={() => setHojaMes(null)} titulo="Mes">
          <div className="grid grid-cols-4 gap-2">
            {MESES_CORTOS.map((corto, m) => {
              const elegido = hojaMes !== null && fechas[hojaMes]?.mes === String(m + 1);
              return (
                <button
                  key={corto}
                  type="button"
                  aria-label={MESES[m]}
                  aria-pressed={elegido}
                  onClick={() => {
                    if (hojaMes !== null) cambiarFecha(hojaMes, { mes: String(m + 1) });
                    setHojaMes(null);
                  }}
                  className={`min-h-12 rounded text-label-md active:scale-95 ${elegido ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant"}`}
                >
                  {corto}
                </button>
              );
            })}
          </div>
        </HojaInferior>

        <DialogoConfirmacion
          abierta={confirmandoDescarte}
          titulo="¿Descartar los cambios?"
          textoConfirmar="Descartar"
          iconoConfirmar="delete"
          peligro
          onConfirmar={() => {
            setConfirmandoDescarte(false);
            onCancelar();
          }}
          onCancelar={() => setConfirmandoDescarte(false)}
        >
          <p>Lo que has escrito no se guardará.</p>
        </DialogoConfirmacion>

        <DialogoConfirmacion
          abierta={casaPorQuitar !== null}
          titulo={`¿Quitar de ${casaPorQuitar?.apodo ?? ""}?`}
          etiqueta="Confirmar quitar de la casa"
          textoConfirmar="Quitar y borrar la casa"
          iconoConfirmar="delete"
          peligro
          onConfirmar={() => {
            const casa = casaPorQuitar;
            if (casa) setCasasIds((ids) => ids.filter((id) => id !== casa.id));
            setCasaPorQuitar(null);
          }}
          onCancelar={() => setCasaPorQuitar(null)}
        >
          {casaPorQuitar && (
            <p>
              {inicial?.nombre} es la única persona de {casaPorQuitar.apodo}. Una casa no puede quedarse vacía: si la quitas, la casa se borrará al guardar.
            </p>
          )}
        </DialogoConfirmacion>
      </Pantalla>
    </>
  );
}

/** Tarjeta de sección del formulario: icono, título, "Opcional" y texto de ayuda. */
function Seccion({ icono, colorIcono, titulo, ayuda, children }: { icono: NombreIcono; colorIcono: string; titulo: string; ayuda: string; children: ReactNode }) {
  const id = useId();
  return (
    <Tarjeta elemento="section" padding={24} aria-labelledby={id} className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icono nombre={icono} tamano={22} className={colorIcono} />
          <h3 id={id} className="text-headline-sm text-on-surface">
            {titulo}
          </h3>
        </div>
        <span className="text-label-sm text-outline">Opcional</span>
      </div>
      <p className="-mt-1 text-body-sm text-on-surface-variant">{ayuda}</p>
      {children}
    </Tarjeta>
  );
}

interface PropsBloque {
  indice: number;
  fecha: FechaEditable;
  error: string | null;
  quitable: boolean;
  onCambiar(cambios: Partial<FechaEditable>): void;
  onQuitar(): void;
  onElegirMes(): void;
}

/** Una fecha: tipo, etiqueta, día, mes (en hoja) y año opcional. */
function BloqueFecha({ indice, fecha, error, quitable, onCambiar, onQuitar, onElegirMes }: PropsBloque) {
  const idMes = useId();
  const idError = useId();
  const mes = Number(fecha.mes);
  return (
    <div role="group" aria-label={`Fecha ${indice + 1}`} className="relative flex flex-col gap-space-md">
      {quitable && (
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar fecha"
          className="zona-tactil absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant active:scale-95"
        >
          <Icono nombre="close" tamano={18} />
        </button>
      )}
      <div className="flex flex-col gap-2">
        <span className={ETIQUETA}>Tipo de conmemoración</span>
        <div className="flex flex-wrap gap-2">
          {(["cumpleaños", "aniversario"] as const).map((tipo) => (
            <ChipSeleccion key={tipo} activo={fecha.tipo === tipo} onClick={() => onCambiar({ tipo })}>
              <Icono nombre={ICONO_TIPO[tipo]} tamano={18} />
              {ETIQUETA_TIPO[tipo]}
            </ChipSeleccion>
          ))}
        </div>
      </div>
      <Campo etiqueta="Etiqueta" claseEtiqueta={ETIQUETA} rotulo="Opcional" placeholder="Ej. Aniversario de bodas" value={fecha.etiqueta} onChange={(e) => onCambiar({ etiqueta: e.target.value })} />
      <div className="grid grid-cols-3 gap-space-sm pt-1">
        <Campo
          etiqueta="Día"
          claseEtiqueta={ETIQUETA}
          inputMode="numeric"
          placeholder="14"
          claseTexto="text-label-lg"
          claseEntrada="text-center"
          value={fecha.dia}
          aria-invalid={error !== null || undefined}
          onChange={(e) => onCambiar({ dia: e.target.value })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idMes} className={ETIQUETA}>
            Mes
          </label>
          <button
            id={idMes}
            type="button"
            aria-haspopup="dialog"
            onClick={onElegirMes}
            className={`w-full rounded bg-surface-container-low px-2 py-3 text-center text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container ${
              mes >= 1 && mes <= 12 ? "text-on-surface" : "text-outline"
            } ${error ? "ring-2 ring-error" : ""}`}
          >
            {mes >= 1 && mes <= 12 ? MESES_CORTOS[mes - 1] : "Mes"}
          </button>
        </div>
        <Campo
          etiqueta="Año (opc.)"
          claseEtiqueta={ETIQUETA}
          inputMode="numeric"
          placeholder="1992"
          claseTexto="text-label-lg"
          claseEntrada="text-center"
          value={fecha.anio}
          onChange={(e) => onCambiar({ anio: e.target.value })}
        />
      </div>
      {error && (
        <p id={idError} role="alert" className="px-1 text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export { ETIQUETA_TIPO };
