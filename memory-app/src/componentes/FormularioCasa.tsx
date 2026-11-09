// Formulario de casa (CU7, CU8): apodo (obligatorio), dirección y selector de
// personas (varias). Sin personas seleccionadas no se puede guardar (R8).
import { useState, type FormEvent } from "react";
import { direccionVacia, type Casa, type Direccion, type Persona } from "../modelos/tipos";
import { normalizarTexto } from "../utilidades/texto";
import Boton from "./Boton";
import Campo, { ETIQUETA_FORMULARIO } from "./Campo";
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
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <Campo etiqueta="Apodo" claseEtiqueta={ETIQUETA_FORMULARIO} value={apodo} onChange={(e) => setApodo(e.target.value)} required aria-invalid={aviso === AVISO_SIN_APODO} />

      <CamposDireccion valor={direccion} onChange={setDireccion} forma="pildora" />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 px-1 text-label-lg text-on-surface">¿Quiénes viven aquí?</legend>
        {ordenadas.length === 0 ? (
          <p className="text-body-sm text-outline">Aún no hay personas. Añade una primero.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ordenadas.map((p) => (
              <li key={p.id}>
                <label className="flex min-h-12 items-center gap-3 rounded bg-surface-container-lowest px-4 py-2 text-label-lg text-on-surface shadow-sm">
                  <input className="h-5 w-5 accent-primary" type="checkbox" checked={seleccion.includes(p.id)} onChange={() => alternar(p.id)} />
                  {p.nombre}
                </label>
              </li>
            ))}
          </ul>
        )}
        {sinSeleccion && <p className="px-1 text-label-sm text-error">{AVISO_SIN_PERSONAS}</p>}
      </fieldset>

      {aviso && (
        <p role="alert" className="px-1 text-body-md text-error">
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Boton type="submit" variante="primario" icono="check" disabled={guardando || sinSeleccion} className="w-full">
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
