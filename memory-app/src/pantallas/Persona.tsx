// Persona (CU1 a CU4): `id = "nueva"` crea; otro `id` muestra el detalle (RF7)
// con "Editar" y "Borrar" (con confirmación y aviso de las casas que se borrarían).
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ETIQUETAS_DIRECCION, textoDireccion } from "../componentes/CamposDireccion";
import FormularioPersona, { ETIQUETA_TIPO, type ValoresPersona } from "../componentes/FormularioPersona";
import { useApp } from "../estado/contexto";
import { CAMPOS_DIRECCION, type Fecha } from "../modelos/tipos";

const dosCifras = (n: number) => String(n).padStart(2, "0");

export function textoFecha(fecha: Fecha): string {
  const dia = `${dosCifras(fecha.dia)}/${dosCifras(fecha.mes)}${fecha.anio !== undefined ? `/${fecha.anio}` : ""}`;
  return `${ETIQUETA_TIPO[fecha.tipo]}${fecha.etiqueta ? ` (${fecha.etiqueta})` : ""}: ${dia}`;
}

export default function Persona() {
  const { id = "nueva" } = useParams();
  const navegar = useNavigate();
  const { datos, personas, casas, ejecutar } = useApp();
  const [editando, setEditando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const volver = () => navegar("/");

  if (id === "nueva") {
    const crear = async (v: ValoresPersona) => {
      const r = await ejecutar((s) => s.personas.crear(v));
      if (r.ok) navegar(`/persona/${r.valor.id}`, { replace: true });
      return r.ok;
    };
    return (
      <main className="flex min-h-screen flex-col gap-space-lg bg-surface px-margin py-space-lg">
        <h1 className="text-headline-md text-on-surface">Nueva persona</h1>
        <FormularioPersona onGuardar={crear} onCancelar={volver} />
      </main>
    );
  }

  const persona = datos.personas.find((p) => p.id === id);
  if (!persona) {
    return (
      <main className="flex min-h-screen flex-col gap-space-md bg-surface px-margin py-space-lg">
        <p className="text-body-md text-on-surface-variant">Esta persona no existe</p>
        <Link to="/" className="text-label-lg text-primary">
          Volver
        </Link>
      </main>
    );
  }

  if (editando) {
    const guardar = async (v: ValoresPersona) => {
      const r = await ejecutar((s) => s.personas.editar(persona.id, v));
      if (r.ok) setEditando(false);
      return r.ok;
    };
    return (
      <main className="flex min-h-screen flex-col gap-space-lg bg-surface px-margin py-space-lg">
        <h1 className="text-headline-md text-on-surface">Editar persona</h1>
        <FormularioPersona inicial={persona} onGuardar={guardar} onCancelar={() => setEditando(false)} />
      </main>
    );
  }

  const susCasas = casas.casasDePersona(persona.id);
  const casasQueSeBorran = personas.casasQueSeBorrarian(persona.id);
  const camposDireccion = CAMPOS_DIRECCION.filter((campo) => persona.direccion[campo] !== "");

  const borrar = async () => {
    const r = await ejecutar((s) => s.personas.borrar(persona.id));
    setConfirmandoBorrado(false);
    if (r.ok) volver();
  };

  return (
    <main className="flex min-h-screen flex-col gap-space-lg bg-surface px-margin py-space-lg">
      <Link to="/" aria-label="Volver" className="text-label-lg text-primary">
        ← Volver
      </Link>
      <header className="flex flex-col gap-space-xs">
        <h1 className="text-headline-md text-on-surface">{persona.nombre}</h1>
        {persona.apodo && <p className="text-label-md italic text-secondary">“{persona.apodo}”</p>}
      </header>

      <section aria-label="Dirección" className="flex flex-col gap-space-xs">
        <h2 className="text-label-lg text-on-surface">Dirección</h2>
        {camposDireccion.length === 0 ? (
          <p className="text-body-md text-outline">Sin dirección</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-space-md gap-y-space-xs text-body-md">
            {camposDireccion.map((campo) => (
              <div key={campo} className="contents">
                <dt className="text-on-surface-variant">{ETIQUETAS_DIRECCION[campo]}</dt>
                <dd className="text-on-surface">{persona.direccion[campo]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-label="Fechas" className="flex flex-col gap-space-xs">
        <h2 className="text-label-lg text-on-surface">Fechas</h2>
        {persona.fechas.length === 0 ? (
          <p className="text-body-md text-outline">Sin fechas</p>
        ) : (
          <ul className="text-body-md text-on-surface">
            {persona.fechas.map((f, i) => (
              <li key={i}>{textoFecha(f)}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Casas" className="flex flex-col gap-space-xs">
        <h2 className="text-label-lg text-on-surface">Casas</h2>
        {susCasas.length === 0 ? (
          <p className="text-body-md text-outline">No está en ninguna casa</p>
        ) : (
          <ul className="flex flex-col gap-space-sm">
            {susCasas.map(({ casa, convivientes }) => (
              <li key={casa.id} className="rounded bg-surface-container-lowest p-space-md text-body-md shadow-sm">
                <p className="text-label-lg text-on-surface">{casa.apodo}</p>
                {textoDireccion(casa.direccion) && <p className="text-on-surface-variant">{textoDireccion(casa.direccion)}</p>}
                <p className="text-on-surface-variant">
                  {convivientes.length === 0 ? "Vive sola en esta casa" : `Con: ${convivientes.map((p) => p.nombre).join(", ")}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmandoBorrado ? (
        <div role="alertdialog" aria-label="Confirmar borrado" className="flex flex-col gap-space-sm rounded bg-error-container p-space-md text-on-error-container">
          <p className="text-body-md">¿Borrar a {persona.nombre}?</p>
          {casasQueSeBorran.length > 0 && (
            <p className="text-body-md">También se borrarán estas casas, porque se quedarían vacías: {casasQueSeBorran.map((c) => c.apodo).join(", ")}</p>
          )}
          <div className="flex gap-space-sm">
            <button type="button" onClick={borrar} className="rounded-full bg-error px-space-lg py-space-sm text-label-lg text-on-error">
              Confirmar borrado
            </button>
            <button type="button" onClick={() => setConfirmandoBorrado(false)} className="rounded-full bg-surface-container-low px-space-lg py-space-sm text-label-lg text-on-surface-variant">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-space-sm">
          <button type="button" onClick={() => setEditando(true)} className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary">
            Editar
          </button>
          <button type="button" onClick={() => setConfirmandoBorrado(true)} className="rounded-full bg-error-container px-space-lg py-space-sm text-label-lg text-on-error-container">
            Borrar
          </button>
        </div>
      )}
    </main>
  );
}
