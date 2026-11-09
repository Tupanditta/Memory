// Casa (CU7 a CU9): `id = "nueva"` crea; otro `id` muestra el detalle (dirección
// y miembros) con "Editar", "Borrar" y "Quitar" por miembro. Quitar al último
// miembro pide confirmación: aceptar borra la casa, cancelar no cambia nada (RF7b).
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ETIQUETAS_DIRECCION } from "../componentes/CamposDireccion";
import FormularioCasa, { type ValoresCasa } from "../componentes/FormularioCasa";
import { useApp } from "../estado/contexto";
import { CAMPOS_DIRECCION, type Persona } from "../modelos/tipos";

const claseBotonPrincipal = "rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary";
const claseBotonPeligro = "rounded-full bg-error px-space-lg py-space-sm text-label-lg text-on-error";
const claseBotonNeutro = "rounded-full bg-surface-container-low px-space-lg py-space-sm text-label-lg text-on-surface-variant";

export default function Casa() {
  const { id = "nueva" } = useParams();
  const navegar = useNavigate();
  const { datos, casas, ejecutar } = useApp();
  const [editando, setEditando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  /** Miembro cuya salida borraría la casa, a la espera de confirmación. */
  const [ultimoMiembro, setUltimoMiembro] = useState<Persona | null>(null);
  /** Tras borrar con éxito, la navegación a Inicio llega después que los datos: no se pinta "no existe". */
  const saliendo = useRef(false);

  const volver = () => navegar("/");

  if (id === "nueva") {
    const crear = async (v: ValoresCasa) => {
      const r = await ejecutar((s) => s.casas.crear(v));
      if (r.ok) navegar(`/casa/${r.valor.id}`, { replace: true });
      return r.ok;
    };
    return (
      <main className="flex flex-col gap-space-lg bg-surface px-margin py-space-lg">
        <h1 className="text-headline-md text-on-surface">Nueva casa</h1>
        <FormularioCasa personas={datos.personas} onGuardar={crear} onCancelar={volver} />
      </main>
    );
  }

  const casa = datos.casas.find((c) => c.id === id);
  if (!casa) {
    if (saliendo.current) return null;
    return (
      <main className="flex flex-col gap-space-md bg-surface px-margin py-space-lg">
        <p className="text-body-md text-on-surface-variant">Esta casa no existe</p>
        <Link to="/" className="text-label-lg text-primary">
          Volver
        </Link>
      </main>
    );
  }

  if (editando) {
    const guardar = async (v: ValoresCasa) => {
      const r = await ejecutar((s) => s.casas.editar(casa.id, v));
      if (r.ok) setEditando(false);
      return r.ok;
    };
    return (
      <main className="flex flex-col gap-space-lg bg-surface px-margin py-space-lg">
        <h1 className="text-headline-md text-on-surface">Editar casa</h1>
        <FormularioCasa inicial={casa} personas={datos.personas} onGuardar={guardar} onCancelar={() => setEditando(false)} />
      </main>
    );
  }

  const miembros = casas.miembros(casa.id);
  const camposDireccion = CAMPOS_DIRECCION.filter((campo) => casa.direccion[campo] !== "");

  const borrar = async () => {
    saliendo.current = true;
    const r = await ejecutar((s) => s.casas.borrar(casa.id));
    saliendo.current = r.ok;
    setConfirmandoBorrado(false);
    if (r.ok) volver();
  };

  /** Pide al servicio quitar al miembro; si es el último, el servicio pide confirmación y no cambia nada. */
  const quitar = async (persona: Persona) => {
    let pideConfirmacion = false;
    await ejecutar(async (s) => {
      const r = await s.casas.quitarPersona(casa.id, persona.id);
      if (!r.ok && "requiereConfirmacion" in r) {
        pideConfirmacion = true;
        return { ok: true, valor: null };
      }
      return r;
    });
    if (pideConfirmacion) setUltimoMiembro(persona);
  };

  const confirmarQuitarUltimo = async () => {
    if (!ultimoMiembro) return;
    saliendo.current = true;
    const r = await ejecutar((s) => s.casas.quitarPersona(casa.id, ultimoMiembro.id, true));
    saliendo.current = r.ok;
    setUltimoMiembro(null);
    if (r.ok) volver();
  };

  return (
    <main className="flex flex-col gap-space-lg bg-surface px-margin py-space-lg">
      <Link to="/" aria-label="Volver" className="text-label-lg text-primary">
        ← Volver
      </Link>
      <header className="flex flex-col gap-space-xs">
        <h1 className="text-headline-md text-on-surface">{casa.apodo}</h1>
        <p className="text-body-sm text-on-surface-variant">{miembros.length === 1 ? "1 miembro" : `${miembros.length} miembros`}</p>
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
                <dd className="text-on-surface">{casa.direccion[campo]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-label="Miembros" className="flex flex-col gap-space-xs">
        <h2 className="text-label-lg text-on-surface">¿Quiénes viven aquí?</h2>
        <ul className="flex flex-col gap-space-sm">
          {miembros.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-space-sm rounded bg-surface-container-lowest p-space-md shadow-sm">
              <Link to={`/persona/${p.id}`} className="text-label-lg text-on-surface">
                {p.nombre}
              </Link>
              <button
                type="button"
                onClick={() => quitar(p)}
                aria-label={`Quitar a ${p.nombre}`}
                className="rounded-full bg-error-container/40 px-space-sm py-space-xs text-label-sm text-error"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {ultimoMiembro && (
        <div role="alertdialog" aria-label="Confirmar quitar último miembro" className="flex flex-col gap-space-sm rounded bg-error-container p-space-md text-on-error-container">
          <p className="text-body-md">
            {ultimoMiembro.nombre} es la última persona de {casa.apodo}. Una casa no puede quedarse vacía: si la quitas, se borrará la casa.
          </p>
          <div className="flex gap-space-sm">
            <button type="button" onClick={confirmarQuitarUltimo} className={claseBotonPeligro}>
              Borrar casa
            </button>
            <button type="button" onClick={() => setUltimoMiembro(null)} className={claseBotonNeutro}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {confirmandoBorrado ? (
        <div role="alertdialog" aria-label="Confirmar borrado" className="flex flex-col gap-space-sm rounded bg-error-container p-space-md text-on-error-container">
          <p className="text-body-md">¿Borrar {casa.apodo}? Sus personas no se borran.</p>
          <div className="flex gap-space-sm">
            <button type="button" onClick={borrar} className={claseBotonPeligro}>
              Confirmar borrado
            </button>
            <button type="button" onClick={() => setConfirmandoBorrado(false)} className={claseBotonNeutro}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        !ultimoMiembro && (
          <div className="flex gap-space-sm">
            <button type="button" onClick={() => setEditando(true)} className={claseBotonPrincipal}>
              Editar
            </button>
            <button type="button" onClick={() => setConfirmandoBorrado(true)} className="rounded-full bg-error-container px-space-lg py-space-sm text-label-lg text-on-error-container">
              Borrar
            </button>
          </div>
        )
      )}
    </main>
  );
}
