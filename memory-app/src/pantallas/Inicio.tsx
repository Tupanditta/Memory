// Inicio (CU3, CU9; design.md, "Inicio"): saludo, buscador, acciones rápidas, filtros
// con recuentos y las secciones "Personas" y "Casas y lugares".
import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import Avatar from "../componentes/Avatar";
import Cabecera from "../componentes/Cabecera";
import CabeceraSeccion from "../componentes/CabeceraSeccion";
import Chip from "../componentes/Chip";
import EstadoVacio from "../componentes/EstadoVacio";
import FilaAvatares from "../componentes/FilaAvatares";
import Icono from "../componentes/Icono";
import Pantalla from "../componentes/Pantalla";
import Tarjeta from "../componentes/Tarjeta";
import { useApp } from "../estado/contexto";
import type { Casa, Persona } from "../modelos/tipos";
import {
  contar,
  direccionCorta,
  emojiFecha,
  esCercana,
  hashTexto,
  proximaDe,
  saludo,
  textoChipFecha,
  textoMiembros,
} from "../utilidades/presentacion";
import { normalizarTexto } from "../utilidades/texto";

type Filtro = "todos" | "personas" | "casas";

const porTexto = <T,>(clave: (x: T) => string) => (a: T, b: T) => normalizarTexto(clave(a)).localeCompare(normalizarTexto(clave(b)));

/** Casas que se muestran como chip en la tarjeta de una persona; el resto, "+N". */
const MAX_CHIPS_CASA = 2;

export default function Inicio() {
  // `datos` hace que la lista se recalcule tras cada guardado correcto.
  const { datos, personas: servicioPersonas, casas: servicioCasas } = useApp();
  const [consulta, setConsulta] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const buscador = useRef<HTMLInputElement>(null);
  const ids = { personas: useId(), casas: useId() };

  const personas = [...servicioPersonas.buscar(consulta)].sort(porTexto((p) => p.nombre));
  const casas = [...servicioCasas.buscar(consulta)].sort(porTexto((c) => c.apodo));
  const vacia = datos.personas.length === 0 && datos.casas.length === 0;
  const verPersonas = filtro !== "casas" && personas.length > 0;
  const verCasas = filtro !== "personas" && casas.length > 0;
  const hoy = new Date();

  const filtros: { valor: Filtro; texto: string }[] = [
    { valor: "todos", texto: `Todos (${personas.length + casas.length})` },
    { valor: "personas", texto: `Personas (${personas.length})` },
    { valor: "casas", texto: `Casas (${casas.length})` },
  ];

  return (
    <>
      <Cabecera marcaComoTitulo />
      <Pantalla tipo="pestana">
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-label-md font-medium tracking-wide text-primary">{saludo(hoy)}</span>
            <h2 className="text-headline-md text-on-surface">Tus recuerdos cerca</h2>
          </div>
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-sm">
            <Icono nombre="star_shine" tamano={20} relleno />
          </span>
        </div>

        <div className="flex h-[52px] w-full items-center rounded-full bg-surface-container-lowest px-4 py-3 shadow-buscador focus-within:shadow-buscador-foco">
          <Icono nombre="search" tamano={22} className="mr-3 text-outline" />
          <input
            ref={buscador}
            type="search"
            aria-label="Buscar"
            placeholder="Buscar persona, casa o dirección..."
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {consulta !== "" && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setConsulta("");
                buscador.current?.focus();
              }}
              className="zona-tactil p-1 text-outline active:scale-95"
            >
              <Icono nombre="close" tamano={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/persona/nueva"
            aria-label="Añadir persona"
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-primary-fixed px-4 py-3 text-label-lg text-on-primary-fixed shadow-boton-azul transition-transform duration-150 active:scale-95"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest/80 text-primary">
              <Icono nombre="add" tamano={16} />
            </span>
            Persona
          </Link>
          <Link
            to="/casa/nueva"
            aria-label="Añadir casa"
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-secondary-fixed px-4 py-3 text-label-lg text-on-secondary-fixed shadow-boton-lila transition-transform duration-150 active:scale-95"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest/80 text-secondary">
              <Icono nombre="add_home" tamano={16} />
            </span>
            Casa
          </Link>
        </div>

        <div role="group" aria-label="Filtros" className="flex items-center gap-2 overflow-x-auto py-0.5">
          {filtros.map(({ valor, texto }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
              className={`zona-tactil shrink-0 rounded-full px-4 py-1.5 text-label-md active:scale-95 ${
                filtro === valor ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        {vacia && consulta.trim() === "" ? (
          <EstadoVacio icono="favorite" titulo="Todavía no hay nada guardado" texto="Añade una persona o una casa con los botones de arriba." />
        ) : personas.length === 0 && casas.length === 0 ? (
          <EstadoVacio icono="manage_search" titulo="Sin coincidencias" texto="No encontramos a nadie ni ninguna casa con ese término. Prueba con otro nombre." />
        ) : null}

        {verPersonas && (
          <section aria-labelledby={ids.personas} className="flex flex-col gap-3">
            <CabeceraSeccion id={ids.personas} icono="favorite" colorIcono="text-primary" titulo="Personas" contador={contar(personas.length, "guardada", "guardadas")} />
            <ul className="flex flex-col gap-3">
              {personas.map((p) => (
                <li key={p.id}>
                  <TarjetaPersona persona={p} casas={datos.casas.filter((c) => c.personas.includes(p.id))} hoy={hoy} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {verCasas && (
          <section aria-labelledby={ids.casas} className="flex flex-col gap-3">
            <CabeceraSeccion id={ids.casas} icono="holiday_village" colorIcono="text-secondary" titulo="Casas y lugares" contador={contar(casas.length, "hogar", "hogares")} />
            <ul className="flex flex-col gap-3">
              {casas.map((c) => (
                <li key={c.id}>
                  <TarjetaCasa casa={c} personas={datos.personas} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Pantalla>
    </>
  );
}

const claseTarjeta = "block transition-transform duration-150 active:scale-[0.98]";

function TarjetaPersona({ persona, casas, hoy }: { persona: Persona; casas: Casa[]; hoy: Date }) {
  const idNombre = useId();
  const proxima = proximaDe(persona.fechas, hoy);
  const cercana = proxima !== null && esCercana(proxima.fecha, hoy);
  const direccion = direccionCorta(persona.direccion);
  const casasOrdenadas = [...casas].sort(porTexto((c) => c.apodo));
  const visibles = casasOrdenadas.slice(0, MAX_CHIPS_CASA);
  const resto = casasOrdenadas.length - visibles.length;
  return (
    <Link to={`/persona/${persona.id}`} aria-labelledby={idNombre} className={claseTarjeta}>
      <Tarjeta sombra="tarjeta" className="flex items-start gap-3.5">
        <Avatar id={persona.id} nombre={persona.nombre} tamano={48} letras={1} destacado={cercana} claseTexto="text-headline-sm font-bold" className="shadow-sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div id={idNombre} className="flex items-center gap-1.5 truncate">
            <h3 className="truncate text-label-lg text-on-surface">{persona.nombre}</h3>
            {persona.apodo && <span className="shrink-0 text-body-sm text-outline">({persona.apodo})</span>}
          </div>
          {direccion && (
            <div className="mt-0.5 flex items-center gap-1 truncate text-body-sm text-on-surface-variant">
              <Icono nombre="location_on" tamano={15} className="shrink-0 text-outline" />
              <span className="truncate">{direccion}</span>
            </div>
          )}
          {(proxima || visibles.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {proxima && (
                <Chip
                  emoji={emojiFecha(proxima.fecha.tipo)}
                  className={`px-2.5 py-1 text-label-sm ${cercana ? "bg-error-container text-on-error-container" : "bg-surface-container text-primary"}`}
                >
                  {textoChipFecha(proxima.fecha, hoy)}
                </Chip>
              )}
              {visibles.map((c) => (
                <Chip key={c.id} icono="cottage" tamanoIcono={13} className="bg-secondary-fixed px-2.5 py-1 text-label-sm text-on-secondary-fixed-variant">
                  {c.apodo}
                </Chip>
              ))}
              {resto > 0 && <Chip className="bg-secondary-fixed px-2.5 py-1 text-label-sm text-on-secondary-fixed-variant">+{resto}</Chip>}
            </div>
          )}
        </div>
      </Tarjeta>
    </Link>
  );
}

const ESTILOS_CASA = [
  { icono: "villa", color: "bg-secondary-fixed text-on-secondary-fixed" },
  { icono: "cabin", color: "bg-primary-fixed text-on-primary-fixed" },
] as const;

function TarjetaCasa({ casa, personas }: { casa: Casa; personas: readonly Persona[] }) {
  const idApodo = useId();
  const miembros = casa.personas.map((id) => personas.find((p) => p.id === id)).filter((p): p is Persona => p !== undefined);
  const estilo = ESTILOS_CASA[hashTexto(casa.id) % ESTILOS_CASA.length];
  const direccion = direccionCorta(casa.direccion);
  return (
    <Link to={`/casa/${casa.id}`} aria-labelledby={idApodo} className={claseTarjeta}>
      <Tarjeta sombra="tarjeta" className="flex items-start gap-3.5">
        <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm ${estilo.color}`}>
          <Icono nombre={estilo.icono} tamano={24} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 id={idApodo} className="truncate text-label-lg text-on-surface">
              {casa.apodo}
            </h3>
            <span className="shrink-0 rounded-full bg-surface-container-low px-2 py-0.5 text-label-sm text-outline">{contar(miembros.length, "miembro", "miembros")}</span>
          </div>
          {direccion && (
            <div className="mt-0.5 flex items-center gap-1 truncate text-body-sm text-on-surface-variant">
              <Icono nombre="pin_drop" tamano={15} className="shrink-0 text-outline" />
              <span className="truncate">{direccion}</span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <FilaAvatares personas={miembros} />
            <span className="truncate text-body-sm text-on-surface-variant">{textoMiembros(miembros.map((p) => p.nombre))}</span>
          </div>
        </div>
      </Tarjeta>
    </Link>
  );
}
