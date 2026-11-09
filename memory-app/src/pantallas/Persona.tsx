// Persona (CU1 a CU4; design.md, "Detalle de persona"): `id = "nueva"` crea; otro `id`
// muestra la ficha (RF7) con la hoja de opciones (editar, eliminar con aviso de las
// casas que se borrarían).
import { useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Avatar from "../componentes/Avatar";
import Boton from "../componentes/Boton";
import Cabecera from "../componentes/Cabecera";
import CabeceraTarjeta from "../componentes/CabeceraTarjeta";
import DialogoConfirmacion from "../componentes/DialogoConfirmacion";
import FormularioPersona, { type ValoresPersona } from "../componentes/FormularioPersona";
import HojaInferior from "../componentes/HojaInferior";
import Icono from "../componentes/Icono";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
import { useApp } from "../estado/contexto";
import type { Persona as TipoPersona } from "../modelos/tipos";
import type { CasaDePersona } from "../servicios/casasService";
import { contar, direccionCorta, edad, emojiFecha, fechaLarga, lineasDireccion, nombreFecha, signoZodiacal } from "../utilidades/presentacion";

const AVISO_GUARDADA = "Persona guardada con éxito en Memory";

export default function Persona() {
  const { id = "nueva" } = useParams();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { datos, casas, ejecutar, mostrarEmergente } = useApp();
  const [editando, setEditando] = useState(false);
  /** Tras borrar con éxito, la navegación a Inicio llega después que los datos: no se pinta "no existe". */
  const saliendo = useRef(false);

  /** La pantalla anterior o, si es la primera del historial, Inicio. */
  const volver = () => (ubicacion.key === "default" ? navegar("/") : navegar(-1));

  if (id === "nueva") {
    const crear = async ({ casasIds, ...datosPersona }: ValoresPersona) => {
      const r = await ejecutar((s) => s.personas.crear(datosPersona, casasIds));
      if (!r.ok) return false;
      mostrarEmergente(AVISO_GUARDADA, "favorite");
      navegar(`/persona/${r.valor.id}`, { replace: true });
      return true;
    };
    return <FormularioPersona casas={datos.casas} onGuardar={crear} onCancelar={volver} />;
  }

  const persona = datos.personas.find((p) => p.id === id);
  if (!persona) {
    if (saliendo.current) return null;
    return (
      <>
        <Cabecera titulo="Detalle Persona" />
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
    const guardar = async ({ casasIds, ...cambios }: ValoresPersona) => {
      const r = await ejecutar((s) => s.personas.editar(persona.id, cambios, casasIds));
      if (!r.ok) return false;
      mostrarEmergente(AVISO_GUARDADA, "favorite");
      setEditando(false);
      return true;
    };
    return <FormularioPersona inicial={persona} casas={datos.casas} onGuardar={guardar} onCancelar={() => setEditando(false)} />;
  }

  return (
    <Ficha
      persona={persona}
      susCasas={casas.casasDePersona(persona.id)}
      onEditar={() => setEditando(true)}
      onBorrar={async () => {
        saliendo.current = true;
        const r = await ejecutar((s) => s.personas.borrar(persona.id));
        saliendo.current = r.ok;
        if (r.ok) navegar("/");
        return r.ok;
      }}
    />
  );
}

interface PropsFicha {
  persona: TipoPersona;
  susCasas: CasaDePersona[];
  onEditar(): void;
  /** Borra; devuelve `true` si se ha borrado. */
  onBorrar(): Promise<boolean>;
}

function Ficha({ persona, susCasas, onEditar, onBorrar }: PropsFicha) {
  const { datos, personas, permiso } = useApp();
  const [opciones, setOpciones] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const ids = { direccion: useId(), fechas: useId(), casas: useId() };
  const casasQueSeBorran = personas.casasQueSeBorrarian(persona.id);
  const hoy = new Date();
  const lineas = lineasDireccion(persona.direccion);
  const sinDireccion = !lineas.via && !lineas.vivienda && !lineas.localidad;
  const hora = datos.ajustes.horaNotificacion;

  return (
    <>
      <Cabecera titulo="Detalle Persona" />
      <Pantalla tipo="pila">
        <div className="flex flex-col">
          <div className="relative flex flex-col items-center pb-space-xl pt-space-md">
            <div className="absolute right-0 top-0">
              <button
                type="button"
                aria-label="Opciones de perfil"
                onClick={() => setOpciones(true)}
                className="zona-tactil flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant shadow-sm active:scale-95"
              >
                <Icono nombre="more_horiz" tamano={20} />
              </button>
            </div>
            <div aria-hidden="true" className="relative mb-space-md mt-space-sm">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-secondary-fixed via-primary-fixed to-secondary-container opacity-60 blur-md" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-primary-fixed via-secondary-fixed to-secondary-container shadow-md">
                <span className="select-none text-headline-lg font-bold text-on-secondary-container">{persona.nombre.trim().charAt(0).toUpperCase()}</span>
              </div>
              <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
                <Icono nombre="favorite" tamano={14} relleno className="text-tertiary" />
              </div>
            </div>
            <h2 className="text-center text-headline-md tracking-tight text-on-surface">{persona.nombre}</h2>
            {persona.apodo && (
              <div className="mt-space-xs rounded-full bg-surface-container-high/60 px-space-md py-0.5">
                <p className="text-label-md italic tracking-wide text-secondary">“{persona.apodo}”</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-space-lg">
            <Tarjeta elemento="section" padding={24} aria-labelledby={ids.direccion} className="flex flex-col gap-space-md">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-container/40 via-primary-fixed to-transparent" />
              <CabeceraTarjeta id={ids.direccion} icono="pin_drop" colorCirculo="bg-primary-fixed/60 text-primary" sobretitulo="Ubicación principal" titulo="Dirección particular" />
              <div className="flex flex-col gap-1 rounded bg-surface-container-low p-space-md">
                {sinDireccion ? (
                  <span className="text-body-md text-outline">Sin dirección guardada</span>
                ) : (
                  <>
                    {lineas.via && <span className="text-label-lg font-semibold text-on-surface">{lineas.via}</span>}
                    {lineas.vivienda && <span className="text-body-md text-on-surface-variant">{lineas.vivienda}</span>}
                    {lineas.localidad && <span className="text-body-sm text-outline">{lineas.localidad}</span>}
                  </>
                )}
              </div>
              {persona.direccion.notas.trim() && (
                <div className="flex items-start gap-space-sm rounded bg-surface-container p-space-md">
                  <Icono nombre="lightbulb" tamano={20} className="mt-0.5 shrink-0 text-secondary" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-label-sm font-semibold text-secondary">Nota para visitas</span>
                    <p className="text-body-sm leading-relaxed text-on-surface-variant">{persona.direccion.notas}</p>
                  </div>
                </div>
              )}
            </Tarjeta>

            <Tarjeta
              elemento="section"
              padding={24}
              fondo="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container"
              aria-labelledby={ids.fechas}
              className="flex flex-col gap-space-md"
            >
              <CabeceraTarjeta id={ids.fechas} icono="cake" colorCirculo="bg-secondary-fixed text-on-secondary-fixed" sobretitulo="Recordatorio" titulo="Fechas memorables" />
              {persona.fechas.length === 0 ? (
                <div className="rounded bg-surface-container-lowest p-space-md text-body-md text-outline">Sin fechas guardadas</div>
              ) : (
                <>
                  <ul className="flex flex-col gap-space-sm">
                    {persona.fechas.map((fecha, i) => {
                      const anios = edad(fecha, hoy);
                      return (
                        <li key={i} className="flex items-center justify-between gap-2 rounded bg-surface-container-lowest p-space-md">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1.5 text-label-lg text-on-surface">
                              <span aria-hidden="true">{emojiFecha(fecha.tipo)}</span>
                              {nombreFecha(fecha)}
                            </span>
                            <span className="mt-0.5 text-body-md text-on-surface-variant">
                              {fechaLarga(fecha)}
                              {fecha.anio !== undefined && anios !== null && (
                                <span className="text-body-sm text-outline">
                                  {" "}
                                  ({fecha.anio} — {contar(anios, "año", "años")})
                                </span>
                              )}
                            </span>
                          </div>
                          {fecha.tipo === "cumpleaños" && (
                            <span className="inline-block rounded-full bg-primary-fixed/40 px-space-sm py-1 text-label-sm font-bold text-primary">{signoZodiacal(fecha.dia, fecha.mes)}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex items-center justify-between rounded bg-secondary-fixed/40 px-space-md py-space-sm">
                    <div className="flex items-center gap-space-xs text-on-secondary-fixed-variant">
                      <Icono nombre={permiso === "denegado" ? "notifications_off" : "notifications_active"} tamano={18} />
                      <span className="text-label-sm">{permiso === "denegado" ? "Avisos desactivados (sin permiso)" : `Aviso activado día anterior a las ${hora}`}</span>
                    </div>
                    {permiso !== "denegado" && <Icono nombre="check_circle" tamano={16} className="text-secondary" />}
                  </div>
                </>
              )}
            </Tarjeta>

            <Tarjeta elemento="section" padding={24} fondo="bg-secondary-fixed/20" aria-labelledby={ids.casas} className="flex flex-col gap-space-md">
              <CabeceraTarjeta
                id={ids.casas}
                icono="cottage"
                colorCirculo="bg-secondary-container text-on-secondary-container"
                sobretitulo="Círculo familiar"
                titulo="Casas a las que pertenece"
                chip={<span className="shrink-0 rounded-full bg-surface-container-lowest px-space-sm py-0.5 text-label-sm text-secondary">{contar(susCasas.length, "hogar", "hogares")}</span>}
              />
              {susCasas.length === 0 ? (
                <div className="rounded bg-surface-container-lowest p-space-md text-body-md text-outline">No pertenece a ninguna casa</div>
              ) : (
                <ul className="flex flex-col gap-space-sm">
                  {susCasas.map(({ casa, convivientes }) => {
                    const direccion = direccionCorta(casa.direccion);
                    return (
                      <li key={casa.id} className="flex flex-col gap-space-sm rounded bg-surface-container-lowest p-space-md">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-col">
                            <h3 className="text-label-lg font-semibold text-on-surface">{casa.apodo}</h3>
                            {direccion && (
                              <span className="mt-0.5 flex items-center gap-1 text-body-sm text-on-surface-variant">
                                <Icono nombre="location_on" tamano={14} className="text-outline" />
                                {direccion}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/casa/${casa.id}`}
                            aria-label={`Abrir ${casa.apodo}`}
                            className="zona-tactil flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-95"
                          >
                            <Icono nombre="arrow_forward" tamano={16} />
                          </Link>
                        </div>
                        {convivientes.length === 0 ? (
                          <span className="pt-space-xs text-label-sm text-outline">Vive sola en esta casa</span>
                        ) : (
                          <div className="flex flex-col gap-space-xs pt-space-xs">
                            <span className="text-label-sm text-outline">Convivientes en esta casa</span>
                            <div className="flex flex-wrap gap-space-xs pt-0.5">
                              {convivientes.map((p) => (
                                <Link
                                  key={p.id}
                                  to={`/persona/${p.id}`}
                                  className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-space-sm py-1 active:scale-95"
                                >
                                  <Avatar id={p.id} nombre={p.nombre} tamano={20} letras={1} />
                                  <span className="text-label-sm text-on-surface">{p.nombre}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Tarjeta>
          </div>

          <div className="mt-space-xl flex items-center justify-center gap-1 text-center text-on-surface-variant opacity-70">
            <Icono nombre="auto_stories" tamano={16} className="text-primary" />
            <span className="text-body-sm">Libreta personal de memorias</span>
          </div>
        </div>

        <HojaInferior abierta={opciones} onCerrar={() => setOpciones(false)} titulo="Opciones de contacto">
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
            Eliminar de contactos
          </Boton>
        </HojaInferior>

        <DialogoConfirmacion
          abierta={confirmandoBorrado}
          titulo={`¿Eliminar a ${persona.nombre}?`}
          textoConfirmar="Eliminar"
          iconoConfirmar="delete"
          peligro
          onConfirmar={async () => {
            await onBorrar();
            setConfirmandoBorrado(false);
          }}
          onCancelar={() => setConfirmandoBorrado(false)}
        >
          <p>Se borrarán sus datos y sus fechas.</p>
          {casasQueSeBorran.length > 0 && <p>También se borrarán estas casas, porque se quedarían vacías: {casasQueSeBorran.map((c) => c.apodo).join(", ")}</p>}
        </DialogoConfirmacion>
      </Pantalla>
    </>
  );
}
