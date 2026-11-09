// Casa (CU7 a CU9): `id = "nueva"` crea; otro `id` muestra el detalle (dirección
// y miembros) con "Editar", "Borrar" y "Quitar" por miembro. Quitar al último
// miembro pide confirmación: aceptar borra la casa, cancelar no cambia nada (RF7b).
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCierreAtras } from "../componentes/atras";
import Boton from "../componentes/Boton";
import Cabecera from "../componentes/Cabecera";
import { ETIQUETAS_DIRECCION } from "../componentes/CamposDireccion";
import DialogoConfirmacion from "../componentes/DialogoConfirmacion";
import FormularioCasa, { type ValoresCasa } from "../componentes/FormularioCasa";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
import { useApp } from "../estado/contexto";
import { CAMPOS_DIRECCION, type Persona } from "../modelos/tipos";

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
  // Atrás durante la edición la cancela.
  useCierreAtras(editando, () => setEditando(false));

  const volver = () => navegar("/");

  if (id === "nueva") {
    const crear = async (v: ValoresCasa) => {
      const r = await ejecutar((s) => s.casas.crear(v));
      if (r.ok) navegar(`/casa/${r.valor.id}`, { replace: true });
      return r.ok;
    };
    return (
      <>
        <Cabecera titulo="Nueva casa" />
        <Pantalla tipo="pila">
          <FormularioCasa personas={datos.personas} onGuardar={crear} onCancelar={volver} />
        </Pantalla>
      </>
    );
  }

  const casa = datos.casas.find((c) => c.id === id);
  if (!casa) {
    if (saliendo.current) return null;
    return (
      <>
        <Cabecera titulo="Casa" />
        <Pantalla tipo="pila">
          <p className="text-body-md text-on-surface-variant">Esta casa no existe</p>
          <Link to="/" className="text-label-lg text-primary">
            Volver
          </Link>
        </Pantalla>
      </>
    );
  }

  if (editando) {
    const guardar = async (v: ValoresCasa) => {
      const r = await ejecutar((s) => s.casas.editar(casa.id, v));
      if (r.ok) setEditando(false);
      return r.ok;
    };
    return (
      <>
        <Cabecera titulo="Editar casa" onAtras={() => setEditando(false)} />
        <Pantalla tipo="pila">
          <FormularioCasa inicial={casa} personas={datos.personas} onGuardar={guardar} onCancelar={() => setEditando(false)} />
        </Pantalla>
      </>
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
    <>
      <Cabecera titulo={casa.apodo} />
      <Pantalla tipo="pila">
        <p className="text-body-sm text-on-surface-variant">{miembros.length === 1 ? "1 miembro" : `${miembros.length} miembros`}</p>

        <Tarjeta elemento="section" aria-label="Dirección" className="flex flex-col gap-2">
          <h2 className="text-label-lg text-on-surface">Dirección</h2>
          {camposDireccion.length === 0 ? (
            <p className="text-body-md text-outline">Sin dirección</p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body-md">
              {camposDireccion.map((campo) => (
                <div key={campo} className="contents">
                  <dt className="text-on-surface-variant">{ETIQUETAS_DIRECCION[campo]}</dt>
                  <dd className="text-on-surface">{casa.direccion[campo]}</dd>
                </div>
              ))}
            </dl>
          )}
        </Tarjeta>

        <Tarjeta elemento="section" aria-label="Miembros" className="flex flex-col gap-2">
          <h2 className="text-label-lg text-on-surface">¿Quiénes viven aquí?</h2>
          <ul className="flex flex-col gap-2">
            {miembros.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded bg-surface-container-low p-4">
                <Link to={`/persona/${p.id}`} className="text-label-lg text-on-surface">
                  {p.nombre}
                </Link>
                <button
                  type="button"
                  onClick={() => quitar(p)}
                  aria-label={`Quitar a ${p.nombre}`}
                  className="zona-tactil rounded-full bg-error-container/40 px-3 py-1 text-label-sm text-error active:scale-95"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </Tarjeta>

        {!confirmandoBorrado && !ultimoMiembro && (
          <div className="flex gap-2">
            <Boton variante="primarioSuave" icono="edit" onClick={() => setEditando(true)} className="flex-1">
              Editar
            </Boton>
            <Boton variante="opcionHojaPeligro" icono="delete" onClick={() => setConfirmandoBorrado(true)} className="flex-1 !w-auto !justify-center !rounded-full">
              Borrar
            </Boton>
          </div>
        )}

        <DialogoConfirmacion
          abierta={ultimoMiembro !== null}
          titulo="Quitar al último miembro"
          etiqueta="Confirmar quitar último miembro"
          textoConfirmar="Borrar casa"
          iconoConfirmar="delete"
          peligro
          onConfirmar={confirmarQuitarUltimo}
          onCancelar={() => setUltimoMiembro(null)}
        >
          {ultimoMiembro && (
            <p>
              {ultimoMiembro.nombre} es la última persona de {casa.apodo}. Una casa no puede quedarse vacía: si la quitas, se borrará la casa.
            </p>
          )}
        </DialogoConfirmacion>

        <DialogoConfirmacion
          abierta={confirmandoBorrado}
          titulo="Confirmar borrado"
          textoConfirmar="Confirmar borrado"
          iconoConfirmar="delete"
          peligro
          onConfirmar={borrar}
          onCancelar={() => setConfirmandoBorrado(false)}
        >
          <p>¿Borrar {casa.apodo}? Sus personas no se borran.</p>
        </DialogoConfirmacion>
      </Pantalla>
    </>
  );
}
