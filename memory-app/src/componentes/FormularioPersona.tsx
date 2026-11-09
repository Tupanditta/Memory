// Formulario de persona (CU1, CU2, CU4): nombre (obligatorio), apodo, dirección y fechas.
import { useState, type FormEvent } from "react";
import { direccionVacia, TIPOS_FECHA, type Direccion, type Fecha, type Persona, type TipoFecha } from "../modelos/tipos";
import { validarFecha } from "../modelos/validadores";
import CamposDireccion from "./CamposDireccion";

export interface ValoresPersona {
  nombre: string;
  apodo: string;
  direccion: Direccion;
  fechas: Fecha[];
}

/** Fecha mientras se edita: los números son texto hasta guardar. */
interface FechaEditable {
  tipo: TipoFecha;
  etiqueta: string;
  dia: string;
  mes: string;
  anio: string;
}

const ETIQUETA_TIPO: Record<TipoFecha, string> = { cumpleaños: "Cumpleaños", aniversario: "Aniversario" };

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

interface Props {
  inicial?: Persona;
  /** Guarda; devuelve `true` si se ha guardado. */
  onGuardar(valores: ValoresPersona): Promise<boolean>;
  onCancelar(): void;
}

const claseCampo = "rounded border border-outline-variant bg-surface-container-lowest p-space-sm text-body-md text-on-surface";
const claseEtiqueta = "flex flex-col gap-space-xs text-label-md text-on-surface-variant";

export default function FormularioPersona({ inicial, onGuardar, onCancelar }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [apodo, setApodo] = useState(inicial?.apodo ?? "");
  const [direccion, setDireccion] = useState<Direccion>(inicial?.direccion ?? direccionVacia());
  const [fechas, setFechas] = useState<FechaEditable[]>((inicial?.fechas ?? []).map(aEditable));
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarFecha = (indice: number, cambios: Partial<FechaEditable>) =>
    setFechas((actuales) => actuales.map((f, i) => (i === indice ? { ...f, ...cambios } : f)));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (nombre.trim() === "") {
      setAviso("Escribe el nombre");
      return;
    }
    const convertidas = fechas.map(aFecha);
    for (const [i, fecha] of convertidas.entries()) {
      const validacion = validarFecha(fecha);
      if (!validacion.ok) {
        setAviso(`Fecha ${i + 1}: ${validacion.error}`);
        return;
      }
    }
    setAviso(null);
    setGuardando(true);
    try {
      await onGuardar({ nombre, apodo, direccion, fechas: convertidas });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-space-lg">
      <label className={claseEtiqueta}>
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required aria-invalid={aviso === "Escribe el nombre"} className={claseCampo} />
      </label>
      <label className={claseEtiqueta}>
        Apodo
        <input value={apodo} onChange={(e) => setApodo(e.target.value)} className={claseCampo} />
      </label>

      <CamposDireccion valor={direccion} onChange={setDireccion} />

      <fieldset className="flex flex-col gap-space-md">
        <legend className="mb-space-sm text-label-lg text-on-surface">Fechas</legend>
        {fechas.map((fecha, i) => (
          <div key={i} role="group" aria-label={`Fecha ${i + 1}`} className="flex flex-col gap-space-sm rounded bg-surface-container-low p-space-md">
            <label className={claseEtiqueta}>
              Tipo
              <select value={fecha.tipo} onChange={(e) => cambiarFecha(i, { tipo: e.target.value as TipoFecha })} className={claseCampo}>
                {TIPOS_FECHA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ETIQUETA_TIPO[tipo]}
                  </option>
                ))}
              </select>
            </label>
            <label className={claseEtiqueta}>
              Etiqueta
              <input value={fecha.etiqueta} onChange={(e) => cambiarFecha(i, { etiqueta: e.target.value })} className={claseCampo} />
            </label>
            <div className="grid grid-cols-3 gap-space-sm">
              <label className={claseEtiqueta}>
                Día
                <input inputMode="numeric" value={fecha.dia} onChange={(e) => cambiarFecha(i, { dia: e.target.value })} className={claseCampo} />
              </label>
              <label className={claseEtiqueta}>
                Mes
                <input inputMode="numeric" value={fecha.mes} onChange={(e) => cambiarFecha(i, { mes: e.target.value })} className={claseCampo} />
              </label>
              <label className={claseEtiqueta}>
                Año (opcional)
                <input inputMode="numeric" value={fecha.anio} onChange={(e) => cambiarFecha(i, { anio: e.target.value })} className={claseCampo} />
              </label>
            </div>
            <button type="button" onClick={() => setFechas((actuales) => actuales.filter((_, j) => j !== i))} className="self-start text-label-md text-error">
              Quitar fecha
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFechas((actuales) => [...actuales, { tipo: "cumpleaños", etiqueta: "", dia: "", mes: "", anio: "" }])}
          className="self-start rounded-full bg-surface-container px-space-md py-space-sm text-label-lg text-primary"
        >
          Añadir fecha
        </button>
      </fieldset>

      {aviso && (
        <p role="alert" className="text-body-md text-error">
          {aviso}
        </p>
      )}

      <div className="flex gap-space-sm">
        <button type="submit" disabled={guardando} className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary">
          Guardar
        </button>
        <button type="button" onClick={onCancelar} className="rounded-full bg-surface-container-low px-space-lg py-space-sm text-label-lg text-on-surface-variant">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export { ETIQUETA_TIPO };
