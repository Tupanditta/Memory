// Casa (CU7 a CU9; design.md, "Formulario de casa" y "Detalle de casa"): `id = "nueva"`
// crea; otro `id` muestra el detalle (dirección y miembros) con la hoja "Opciones de la
// casa" (editar, eliminar) y "Quitar" por miembro. Quitar al último miembro pide
// confirmación: aceptar borra la casa, cancelar no cambia nada (RF7b).
import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Avatar from "../componentes/Avatar";
import Boton from "../componentes/Boton";
import Cabecera from "../componentes/Cabecera";
import CirculoDifuso from "../componentes/CirculoDifuso";
import DialogoConfirmacion from "../componentes/DialogoConfirmacion";
import FormularioCasa, { type ValoresCasa } from "../componentes/FormularioCasa";
import HojaInferior from "../componentes/HojaInferior";
import Icono from "../componentes/Icono";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
import TarjetaDireccion from "../componentes/TarjetaDireccion";
import { useApp } from "../estado/contexto";
import type { Casa as TipoCasa, Persona } from "../modelos/tipos";
import { contar } from "../utilidades/presentacion";
import type { DesdeFormularioCasa } from "./Persona";

const AVISO_GUARDADA = "Casa guardada";

export default function Casa() {
  const { id = "nueva" } = useParams();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { datos, ejecutar, mostrarEmergente, guardarBorradorCasa, verBorradorCasa, descartarBorradorCasa } = useApp();
  /** Lo escrito antes de "Añadir nueva persona", si se vuelve de crearla. */
  const [borrador] = useState(() => {
    const b = verBorradorCasa();
    return b && b.casaId === id ? b : null;
  });
  const [editando, setEditando] = useState(borrador !== null && id !== "nueva");
  /** Tras borrar con éxito, la navegación a Inicio llega después que los datos: no se pinta "no existe". */
  const saliendo = useRef(false);

  // El borrador se usa una sola vez.
  useEffect(() => descartarBorradorCasa(), [descartarBorradorCasa]);

  const volver = () => navegar("/");
  /** La pantalla anterior o, si es la primera del historial, Inicio. */
  const atras = () => (ubicacion.key === "default" ? navegar("/") : navegar(-1));
  const anadirPersona = (valores: ValoresCasa) => {
    guardarBorradorCasa({ casaId: id, ...valores });
    navegar("/persona/nueva", { state: { desdeCasa: true } satisfies DesdeFormularioCasa });
  };

  if (id === "nueva") {
    const crear = async (v: ValoresCasa) => {
      const r = await ejecutar((s) => s.casas.crear(v));
      if (!r.ok) return false;
      mostrarEmergente(AVISO_GUARDADA, "check");
      navegar(`/casa/${r.valor.id}`, { replace: true });
      return true;
    };
    return <FormularioCasa borrador={borrador} personas={datos.personas} onGuardar={crear} onCancelar={atras} onAnadirPersona={anadirPersona} />;
  }

  const casa = datos.casas.find((c) => c.id === id);
  if (!casa) {
    if (saliendo.current) return null;
    return (
      <>
        <Cabecera titulo="Detalle Casa" />
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
      if (!r.ok) return false;
      mostrarEmergente(AVISO_GUARDADA, "check");
      setEditando(false);
      return true;
    };
    return (
      <FormularioCasa
        inicial={casa}
        borrador={borrador}
        personas={datos.personas}
        onGuardar={guardar}
        onCancelar={() => setEditando(false)}
        onAnadirPersona={anadirPersona}
      />
    );
  }

  return (
    <Detalle
      casa={casa}
      onEditar={() => setEditando(true)}
      onSalir={async (operacion) => {
        saliendo.current = true;
        const ok = await operacion();
        saliendo.current = ok;
        if (ok) volver();
      }}
    />
  );
}

interface PropsDetalle {
  casa: TipoCasa;
  onEditar(): void;
  /** Ejecuta una operación que borra la casa y, si sale bien, vuelve a Inicio. */
  onSalir(operacion: () => Promise<boolean>): Promise<void>;
}

function Detalle({ casa, onEditar, onSalir }: PropsDetalle) {
  const { casas, ejecutar } = useApp();
  const idMiembros = useId();
  const [opciones, setOpciones] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  /** Miembro cuya salida borraría la casa, a la espera de confirmación. */
  const [ultimoMiembro, setUltimoMiembro] = useState<Persona | null>(null);
  const miembros = casas.miembros(casa.id);
  const textoMiembros = contar(miembros.length, "miembro", "miembros");

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

  return (
    <>
      <Cabecera titulo="Detalle Casa" />
      <Pantalla tipo="pila">
        <div className="flex flex-col gap-space-lg">
          <Tarjeta padding={24} fondo="bg-primary-fixed/30">
            <CirculoDifuso className="-bottom-4 -right-4 h-28 w-28 bg-secondary-container/20" />
            <div className="relative flex items-start gap-space-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/25 text-primary shadow-sm">
                <Icono nombre="cottage" tamano={22} relleno />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="text-headline-sm tracking-tight text-on-surface">{casa.apodo}</h2>
                <p className="text-body-sm text-on-surface-variant">{textoMiembros}</p>
              </div>
              <button
                type="button"
                aria-label="Opciones de la casa"
                onClick={() => setOpciones(true)}
                className="zona-tactil flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant shadow-sm active:scale-95"
              >
                <Icono nombre="more_horiz" tamano={20} />
              </button>
            </div>
          </Tarjeta>

          <TarjetaDireccion direccion={casa.direccion} sobretitulo="Ubicación compartida" titulo="Dirección compartida" tituloNotas="Detalles útiles" />

          <Tarjeta elemento="section" fondo="bg-surface-container-low" aria-labelledby={idMiembros} className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex flex-col">
                <h3 id={idMiembros} className="text-label-lg text-on-surface">
                  ¿Quiénes viven aquí?
                </h3>
                <p className="text-body-sm text-on-surface-variant">Personas que comparten esta casa.</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 text-label-sm font-medium text-primary">{textoMiembros}</span>
            </div>
            <ul className="mt-1 flex flex-col gap-2">
              {miembros.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded bg-surface-container-lowest p-2.5 shadow-sm">
                  <Link to={`/persona/${p.id}`} aria-label={p.nombre} className="flex min-w-0 flex-1 items-center gap-3 active:scale-[0.98]">
                    <Avatar id={p.id} nombre={p.nombre} tamano={44} claseTexto="text-label-md" className="shadow-sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-label-lg text-on-surface">{p.nombre}</span>
                      {p.apodo && <span className="truncate text-body-sm text-on-surface-variant">{p.apodo}</span>}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => quitar(p)}
                    aria-label={`Quitar a ${p.nombre}`}
                    className="zona-tactil shrink-0 rounded-full bg-error-container/40 px-2.5 py-1 text-label-sm text-error active:scale-95"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-1 flex justify-center">
              <button
                type="button"
                onClick={onEditar}
                className="zona-tactil inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-label-md text-secondary active:scale-95"
              >
                <Icono nombre="person_add" tamano={18} />
                Añadir persona
              </button>
            </div>
          </Tarjeta>
        </div>

        <HojaInferior abierta={opciones} onCerrar={() => setOpciones(false)} titulo="Opciones de la casa">
          <Boton
            variante="opcionHoja"
            onClick={() => {
              setOpciones(false);
              onEditar();
            }}
          >
            <Icono nombre="edit" className="text-primary" />
            Editar información
          </Boton>
          <Boton
            variante="opcionHojaPeligro"
            icono="delete"
            onClick={() => {
              setOpciones(false);
              setConfirmandoBorrado(true);
            }}
          >
            Eliminar casa
          </Boton>
        </HojaInferior>

        <DialogoConfirmacion
          abierta={ultimoMiembro !== null}
          titulo="Quitar al último miembro"
          etiqueta="Confirmar quitar último miembro"
          textoConfirmar="Borrar casa"
          iconoConfirmar="delete"
          peligro
          onConfirmar={async () => {
            const persona = ultimoMiembro;
            if (!persona) return;
            await onSalir(async () => (await ejecutar((s) => s.casas.quitarPersona(casa.id, persona.id, true))).ok);
            setUltimoMiembro(null);
          }}
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
          titulo={`¿Eliminar ${casa.apodo}?`}
          etiqueta="Confirmar borrado"
          textoConfirmar="Eliminar"
          iconoConfirmar="delete"
          peligro
          onConfirmar={async () => {
            await onSalir(async () => (await ejecutar((s) => s.casas.borrar(casa.id))).ok);
            setConfirmandoBorrado(false);
          }}
          onCancelar={() => setConfirmandoBorrado(false)}
        >
          <p>Se borrará la casa. Sus personas no se borran.</p>
        </DialogoConfirmacion>
      </Pantalla>
    </>
  );
}
