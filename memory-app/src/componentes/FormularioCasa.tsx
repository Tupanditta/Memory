// Formulario de casa (CU7, CU8): apodo (obligatorio), dirección y selector de
// personas (varias). Sin personas seleccionadas no se puede guardar (R8).
import { useState, type FormEvent } from "react";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../modelos/tipos";
import { normalizarTexto } from "../utilidades/texto";
import CamposDireccion from "./CamposDireccion";

export interface ValoresCasa {
  apodo: string;
  direccion: Direccion;
  personas: string[];
}

interface Props {
  inicial?: Casa;
  /** Todas las personas de la app, para elegir los miembros. */
  personas: Persona[];
  /** Guarda; devuelve `true` si se ha guardado. */
  onGuardar(valores: ValoresCasa): Promise<boolean>;
  onCancelar(): void;
}

export const AVISO_SIN_PERSONAS = "Elige al menos una persona";
export const AVISO_SIN_APODO = "Escribe el apodo";

const claseCampo = "rounded border border-outline-variant bg-surface-container-lowest p-space-sm text-body-md text-on-surface";
const claseEtiqueta = "flex flex-col gap-space-xs text-label-md text-on-surface-variant";

export default function FormularioCasa({ inicial, personas, onGuardar, onCancelar }: Props) {
  const [apodo, setApodo] = useState(inicial?.apodo ?? "");
  const [direccion, setDireccion] = useState<Direccion>(inicial?.direccion ?? direccionVacia());
  const [seleccion, setSeleccion] = useState<string[]>(inicial?.personas ?? []);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const ordenadas = [...personas].sort((a, b) => normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre)));
  const sinSeleccion = seleccion.length === 0;

  const alternar = (id: string) =>
    setSeleccion((actual) => (actual.includes(id) ? actual.filter((p) => p !== id) : [...actual, id]));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (apodo.trim() === "") {
      setAviso(AVISO_SIN_APODO);
      return;
    }
    if (sinSeleccion) {
      setAviso(AVISO_SIN_PERSONAS);
      return;
    }
    setAviso(null);
    setGuardando(true);
    try {
      await onGuardar({ apodo, direccion, personas: seleccion });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-space-lg">
      <label className={claseEtiqueta}>
        Apodo
        <input value={apodo} onChange={(e) => setApodo(e.target.value)} required aria-invalid={aviso === AVISO_SIN_APODO} className={claseCampo} />
      </label>

      <CamposDireccion valor={direccion} onChange={setDireccion} />

      <fieldset className="flex flex-col gap-space-sm">
        <legend className="mb-space-sm text-label-lg text-on-surface">¿Quiénes viven aquí?</legend>
        {ordenadas.length === 0 ? (
          <p className="text-body-sm text-outline">Aún no hay personas. Añade una primero.</p>
        ) : (
          <ul className="flex flex-col gap-space-xs">
            {ordenadas.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-space-sm rounded bg-surface-container-lowest p-space-sm text-body-md text-on-surface">
                  <input type="checkbox" checked={seleccion.includes(p.id)} onChange={() => alternar(p.id)} />
                  {p.nombre}
                </label>
              </li>
            ))}
          </ul>
        )}
        {sinSeleccion && <p className="text-label-sm text-error">{AVISO_SIN_PERSONAS}</p>}
      </fieldset>

      {aviso && (
        <p role="alert" className="text-body-md text-error">
          {aviso}
        </p>
      )}

      <div className="flex gap-space-sm">
        <button type="submit" disabled={guardando || sinSeleccion} className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary disabled:opacity-50">
          Guardar
        </button>
        <button type="button" onClick={onCancelar} className="rounded-full bg-surface-container-low px-space-lg py-space-sm text-label-lg text-on-surface-variant">
          Cancelar
        </button>
      </div>
    </form>
  );
}
