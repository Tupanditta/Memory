// Persona (CU1 a CU4): `id = "nueva"` crea; otro `id` muestra el detalle (RF7)
// con "Editar" y "Borrar" (con confirmación y aviso de las casas que se borrarían).
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCierreAtras } from "../componentes/atras";
import Boton from "../componentes/Boton";
import Cabecera from "../componentes/Cabecera";
import { ETIQUETAS_DIRECCION, textoDireccion } from "../componentes/CamposDireccion";
import DialogoConfirmacion from "../componentes/DialogoConfirmacion";
import FormularioPersona, { ETIQUETA_TIPO, type ValoresPersona } from "../componentes/FormularioPersona";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
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
  /** Tras borrar con éxito, la navegación a Inicio llega después que los datos: no se pinta "no existe". */
  const saliendo = useRef(false);
  // Atrás durante la edición la cancela.
  useCierreAtras(editando, () => setEditando(false));

  const volver = () => navegar("/");

  if (id === "nueva") {
    const crear = async (v: ValoresPersona) => {
      const r = await ejecutar((s) => s.personas.crear(v));
      if (r.ok) navegar(`/persona/${r.valor.id}`, { replace: true });
      return r.ok;
    };
    return (
      <>
        <Cabecera titulo="Nueva persona" />
        <Pantalla tipo="pila">
          <FormularioPersona onGuardar={crear} onCancelar={volver} />
        </Pantalla>
      </>
    );
  }

  const persona = datos.personas.find((p) => p.id === id);
  if (!persona) {
    if (saliendo.current) return null;
    return (
      <>
        <Cabecera titulo="Persona" />
        <Pantalla tipo="pila">
          <p className="text-body-md text-on-surface-variant">Esta persona no existe</p>
          <Link to="/" className="text-label-lg text-primary">
            Volver
          </Link>
        </Pantalla>
      </>
    );
  }

  if (editando) {
    const guardar = async (v: ValoresPersona) => {
      const r = await ejecutar((s) => s.personas.editar(persona.id, v));
      if (r.ok) setEditando(false);
      return r.ok;
    };
    return (
      <>
        <Cabecera titulo="Editar persona" onAtras={() => setEditando(false)} />
        <Pantalla tipo="pila">
          <FormularioPersona inicial={persona} onGuardar={guardar} onCancelar={() => setEditando(false)} />
        </Pantalla>
      </>
    );
  }

  const susCasas = casas.casasDePersona(persona.id);
  const casasQueSeBorran = personas.casasQueSeBorrarian(persona.id);
  const camposDireccion = CAMPOS_DIRECCION.filter((campo) => persona.direccion[campo] !== "");

  const borrar = async () => {
    saliendo.current = true;
    const r = await ejecutar((s) => s.personas.borrar(persona.id));
    saliendo.current = r.ok;
    setConfirmandoBorrado(false);
    if (r.ok) volver();
  };

  return (
    <>
      <Cabecera titulo={persona.nombre} />
      <Pantalla tipo="pila">
        {persona.apodo && <p className="text-label-md italic text-secondary">“{persona.apodo}”</p>}

        <Tarjeta elemento="section" aria-label="Dirección" className="flex flex-col gap-2">
          <h2 className="text-label-lg text-on-surface">Dirección</h2>
          {camposDireccion.length === 0 ? (
            <p className="text-body-md text-outline">Sin dirección</p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body-md">
              {camposDireccion.map((campo) => (
                <div key={campo} className="contents">
                  <dt className="text-on-surface-variant">{ETIQUETAS_DIRECCION[campo]}</dt>
                  <dd className="text-on-surface">{persona.direccion[campo]}</dd>
                </div>
              ))}
            </dl>
          )}
        </Tarjeta>

        <Tarjeta elemento="section" aria-label="Fechas" className="flex flex-col gap-2">
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
        </Tarjeta>

        <Tarjeta elemento="section" aria-label="Casas" className="flex flex-col gap-2">
          <h2 className="text-label-lg text-on-surface">Casas</h2>
          {susCasas.length === 0 ? (
            <p className="text-body-md text-outline">No está en ninguna casa</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {susCasas.map(({ casa, convivientes }) => (
                <li key={casa.id} className="rounded bg-surface-container-low p-4 text-body-md">
                  <Link to={`/casa/${casa.id}`} className="text-label-lg text-on-surface">
                    {casa.apodo}
                  </Link>
                  {textoDireccion(casa.direccion) && <p className="text-on-surface-variant">{textoDireccion(casa.direccion)}</p>}
                  <p className="text-on-surface-variant">
                    {convivientes.length === 0 ? "Vive sola en esta casa" : `Con: ${convivientes.map((p) => p.nombre).join(", ")}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {!confirmandoBorrado && (
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
          abierta={confirmandoBorrado}
          titulo="Confirmar borrado"
          textoConfirmar="Confirmar borrado"
          iconoConfirmar="delete"
          peligro
          onConfirmar={borrar}
          onCancelar={() => setConfirmandoBorrado(false)}
        >
          <p>¿Borrar a {persona.nombre}?</p>
          {casasQueSeBorran.length > 0 && <p>También se borrarán estas casas, porque se quedarían vacías: {casasQueSeBorran.map((c) => c.apodo).join(", ")}</p>}
        </DialogoConfirmacion>
      </Pantalla>
    </>
  );
}
