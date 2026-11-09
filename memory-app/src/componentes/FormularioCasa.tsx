// Formulario de casa (CU7, CU8; design.md, "Formulario de casa"): banner, apodo
// (obligatorio), selector de personas con contador (al menos una, R8), "Añadir nueva
// persona", dirección compartida y botones. Pinta la pantalla entera (cabecera incluida)
// para que atrás y "Cancelar" pidan confirmación si hay cambios.
import { useId, useState, type FormEvent } from "react";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../modelos/tipos";
import { textoSeleccionados } from "../utilidades/presentacion";
import { normalizarTexto } from "../utilidades/texto";
import { useCierreAtras } from "./atras";
import Boton from "./Boton";
import Cabecera from "./Cabecera";
import Campo from "./Campo";
import CamposDireccion from "./CamposDireccion";
import CirculoDifuso from "./CirculoDifuso";
import DialogoConfirmacion from "./DialogoConfirmacion";
import FilaPersonaSeleccionable from "./FilaPersonaSeleccionable";
import Icono from "./Icono";
import Pantalla from "./Pantalla";
import Tarjeta from "./Tarjeta";

export interface ValoresCasa {
  apodo: string;
  direccion: Direccion;
  personas: string[];
}

interface Props {
  /** Casa que se edita; sin ella, el formulario crea una nueva. */
  inicial?: Casa;
  /** Lo escrito antes de ir a "Añadir nueva persona"; sustituye a los valores iniciales. */
  borrador?: ValoresCasa | null;
  /** Todas las personas de la app, para elegir los miembros. */
  personas: readonly Persona[];
  /** Guarda; devuelve `true` si se ha guardado. */
  onGuardar(valores: ValoresCasa): Promise<boolean>;
  /** Sale sin guardar (tras confirmar si había cambios). */
  onCancelar(): void;
  /** Va a crear una persona, con lo escrito hasta ahora para recuperarlo al volver. */
  onAnadirPersona(valores: ValoresCasa): void;
}

export const AVISO_SIN_PERSONAS = "Elige al menos una persona";
export const AVISO_SIN_APODO = "Escribe el apodo";

/** Nombres (y marcadores) de los campos de la dirección compartida. */
const ETIQUETAS_DIRECCION_CASA = {
  calle: "Calle / Avenida",
  numero: "Nº",
  codigoPostal: "Código postal",
  ciudad: "Ciudad / Pueblo",
  notas: "Detalles útiles (ej. timbre con música, plaza de garaje, código de portal...)",
};

/** Huella de lo escrito, para saber si hay cambios sin guardar. */
const huella = (v: ValoresCasa) => JSON.stringify([v.apodo, v.direccion, [...v.personas].sort()]);

export default function FormularioCasa({ inicial, borrador, personas, onGuardar, onCancelar, onAnadirPersona }: Props) {
  const idApodo = useId();
  const idLista = useId();
  const [valoresIniciales] = useState<ValoresCasa>(() => ({
    apodo: inicial?.apodo ?? "",
    direccion: inicial?.direccion ?? direccionVacia(),
    personas: inicial?.personas ?? [],
  }));
  const [apodo, setApodo] = useState(borrador?.apodo ?? valoresIniciales.apodo);
  const [direccion, setDireccion] = useState<Direccion>(borrador?.direccion ?? valoresIniciales.direccion);
  const [seleccion, setSeleccion] = useState<string[]>(borrador?.personas ?? valoresIniciales.personas);
  const [errorApodo, setErrorApodo] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const valores: ValoresCasa = { apodo, direccion, personas: seleccion };
  const hayCambios = huella(valores) !== huella(valoresIniciales);
  const cancelar = () => (hayCambios ? setConfirmandoDescarte(true) : onCancelar());
  // Atrás de Android también cancela (con confirmación si hay cambios).
  useCierreAtras(true, cancelar);

  const ordenadas = [...personas].sort((a, b) => normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre)));
  const sinSeleccion = seleccion.length === 0;
  const titulo = inicial ? "Editar Casa" : "Nueva Casa";

  const alternar = (id: string) => setSeleccion((actual) => (actual.includes(id) ? actual.filter((p) => p !== id) : [...actual, id]));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (apodo.trim() === "") {
      setErrorApodo(AVISO_SIN_APODO);
      document.getElementById(idApodo)?.focus();
      return;
    }
    if (sinSeleccion) return;
    setGuardando(true);
    try {
      await onGuardar(valores);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Cabecera titulo={titulo} onAtras={cancelar} />
      <Pantalla tipo="pila">
        <div className="flex flex-col pb-8">
          <Tarjeta padding={24} fondo="bg-primary-fixed/30" className="mb-space-lg">
            <CirculoDifuso className="-bottom-4 -right-4 h-28 w-28 bg-secondary-container/20" />
            <div className="relative flex items-start gap-space-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/25 text-primary shadow-sm">
                <Icono nombre="cottage" tamano={22} relleno />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-headline-sm tracking-tight text-on-surface">{titulo}</h2>
                <p className="text-body-sm leading-relaxed text-on-surface-variant">
                  Las casas agrupan a familiares y amigos para que recuerdes dónde viven y con quién comparten sus días.
                </p>
              </div>
            </div>
          </Tarjeta>

          <form onSubmit={enviar} noValidate className="flex flex-col gap-space-lg">
            <Campo
                id={idApodo}
                etiqueta="Apodo del hogar"
                asterisco
                rotulo="Obligatorio"
                variante="blanco"
                icono="roofing"
                claseEtiqueta="text-label-lg text-on-surface"
                placeholder="Ej. Casa del pueblo, Piso de Lucía..."
                value={apodo}
                onChange={(e) => {
                  setApodo(e.target.value);
                  setErrorApodo(null);
                }}
                error={errorApodo}
                required
              />

            <Tarjeta elemento="section" fondo="bg-surface-container-low" aria-labelledby={idLista} className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h3 id={idLista} className="text-label-lg text-on-surface">
                      ¿Quiénes viven aquí?
                    </h3>
                    <span aria-hidden="true" className="font-bold text-primary">
                      *
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Selecciona al menos una persona conviviente.</p>
                </div>
                <span
                  aria-live="polite"
                  className={`shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 text-label-sm font-medium ${sinSeleccion ? "text-on-surface-variant" : "text-primary"}`}
                >
                  {textoSeleccionados(seleccion.length)}
                </span>
              </div>
              {ordenadas.length === 0 ? (
                <p className="mt-1 px-1 text-body-sm text-outline">Aún no hay personas. Añade una primero.</p>
              ) : (
                <div role="group" aria-labelledby={idLista} className="mt-1 flex flex-col gap-2">
                  {ordenadas.map((p) => (
                    <FilaPersonaSeleccionable key={p.id} id={p.id} nombre={p.nombre} apodo={p.apodo} seleccionada={seleccion.includes(p.id)} onAlternar={() => alternar(p.id)} />
                  ))}
                </div>
              )}
              {sinSeleccion && <p className="px-1 text-label-sm text-error">{AVISO_SIN_PERSONAS}</p>}
              <div className="mt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => onAnadirPersona(valores)}
                  className="zona-tactil inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-label-md text-secondary active:scale-95"
                >
                  <Icono nombre="person_add" tamano={18} />
                  Añadir nueva persona
                </button>
              </div>
            </Tarjeta>

            <Tarjeta elemento="section" aria-label="Dirección compartida" className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-2 px-1 text-on-surface">
                <Icono nombre="location_on" tamano={20} className="text-primary" />
                <span className="text-label-lg">Dirección compartida</span>
                <span className="ml-auto text-label-sm font-normal text-on-surface-variant">Opcional</span>
              </div>
              <div className="mt-1">
                <CamposDireccion valor={direccion} onChange={setDireccion} forma="pildora" leyenda="Dirección compartida" leyendaOculta etiquetas={ETIQUETAS_DIRECCION_CASA} lineasNotas={2} />
              </div>
            </Tarjeta>

            <div className="flex flex-col gap-2.5 pt-space-sm">
              <Boton type="submit" variante="primario" icono="check" aria-label="Guardar" disabled={guardando || sinSeleccion} className="w-full">
                Guardar casa
              </Boton>
              <Boton variante="texto" onClick={cancelar} className="h-12 w-full">
                Cancelar
              </Boton>
            </div>
          </form>
        </div>

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
      </Pantalla>
    </>
  );
}
