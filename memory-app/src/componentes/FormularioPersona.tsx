// Formulario de persona (CU1, CU2, CU4): nombre (obligatorio), apodo, dirección y fechas.
import { useState, type FormEvent } from "react";
import { direccionVacia, TIPOS_FECHA, type Direccion, type Fecha, type Persona, type TipoFecha } from "../modelos/tipos";
import { validarFecha } from "../modelos/validadores";
import Boton from "./Boton";
import Campo from "./Campo";
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

const claseSelector =
  "w-full rounded bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container";

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
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required aria-invalid={aviso === "Escribe el nombre"} />
      <Campo etiqueta="Apodo" value={apodo} onChange={(e) => setApodo(e.target.value)} />

      <CamposDireccion valor={direccion} onChange={setDireccion} />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 px-1 text-label-lg text-on-surface">Fechas</legend>
        {fechas.map((fecha, i) => (
          <div key={i} role="group" aria-label={`Fecha ${i + 1}`} className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4">
            <label className="flex flex-col gap-1.5 px-1 text-label-sm text-on-surface-variant">
              Tipo
              <select value={fecha.tipo} onChange={(e) => cambiarFecha(i, { tipo: e.target.value as TipoFecha })} className={claseSelector}>
                {TIPOS_FECHA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ETIQUETA_TIPO[tipo]}
                  </option>
                ))}
              </select>
            </label>
            <Campo etiqueta="Etiqueta" variante="blanco" value={fecha.etiqueta} onChange={(e) => cambiarFecha(i, { etiqueta: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Campo etiqueta="Día" variante="blanco" inputMode="numeric" value={fecha.dia} onChange={(e) => cambiarFecha(i, { dia: e.target.value })} />
              <Campo etiqueta="Mes" variante="blanco" inputMode="numeric" value={fecha.mes} onChange={(e) => cambiarFecha(i, { mes: e.target.value })} />
              <Campo etiqueta="Año (opcional)" variante="blanco" inputMode="numeric" value={fecha.anio} onChange={(e) => cambiarFecha(i, { anio: e.target.value })} />
            </div>
            <Boton variante="texto" icono="delete" tamanoIcono={18} onClick={() => setFechas((actuales) => actuales.filter((_, j) => j !== i))} className="self-start !px-2 !text-error">
              Quitar fecha
            </Boton>
          </div>
        ))}
        <Boton
          variante="azulSuave"
          icono="add"
          onClick={() => setFechas((actuales) => [...actuales, { tipo: "cumpleaños", etiqueta: "", dia: "", mes: "", anio: "" }])}
          className="self-start"
        >
          Añadir fecha
        </Boton>
      </fieldset>

      {aviso && (
        <p role="alert" className="px-1 text-body-md text-error">
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Boton type="submit" variante="primarioSuave" icono="check" disabled={guardando} className="w-full">
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

export { ETIQUETA_TIPO };
