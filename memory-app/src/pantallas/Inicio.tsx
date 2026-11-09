// Inicio (CU3, CU9): buscador, lista de personas y lista de casas.
import { useState } from "react";
import { Link } from "react-router";
import Cabecera from "../componentes/Cabecera";
import { textoDireccion } from "../componentes/CamposDireccion";
import EstadoVacio from "../componentes/EstadoVacio";
import Icono from "../componentes/Icono";
import Pantalla from "../componentes/Pantalla";
import { useApp } from "../estado/contexto";
import { normalizarTexto } from "../utilidades/texto";

const porTexto = <T,>(clave: (x: T) => string) => (a: T, b: T) => normalizarTexto(clave(a)).localeCompare(normalizarTexto(clave(b)));

const claseFila = "flex flex-col rounded-lg bg-surface-container-lowest p-4 shadow-tarjeta";

export default function Inicio() {
  // `datos` hace que la lista se recalcule tras cada guardado correcto.
  const { datos, personas: servicioPersonas, casas: servicioCasas } = useApp();
  const [consulta, setConsulta] = useState("");

  const personas = [...servicioPersonas.buscar(consulta)].sort(porTexto((p) => p.nombre));
  const casas = [...servicioCasas.buscar(consulta)].sort(porTexto((c) => c.apodo));
  const nombre = (id: string) => datos.personas.find((p) => p.id === id)?.nombre ?? "";
  const vacia = datos.personas.length === 0 && datos.casas.length === 0;

  return (
    <>
      <Cabecera marcaComoTitulo />
      <Pantalla tipo="pestana">
        <label className="flex h-[52px] items-center gap-3 rounded-full bg-surface-container-lowest px-4 py-3 shadow-buscador focus-within:shadow-buscador-foco">
          <Icono nombre="search" tamano={22} className="text-outline" />
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Buscar persona, casa o dirección..."
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/persona/nueva"
            aria-label="Añadir persona"
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-primary-fixed px-4 py-3 text-label-lg text-on-primary-fixed shadow-boton-azul active:scale-95"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest/80 text-primary">
              <Icono nombre="add" tamano={16} />
            </span>
            Persona
          </Link>
          <Link
            to="/casa/nueva"
            aria-label="Añadir casa"
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-secondary-fixed px-4 py-3 text-label-lg text-on-secondary-fixed shadow-boton-lila active:scale-95"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest/80 text-secondary">
              <Icono nombre="add_home" tamano={16} />
            </span>
            Casa
          </Link>
        </div>

        {vacia && consulta.trim() === "" ? (
          <EstadoVacio icono="diversity_1" titulo="Todavía no hay nada guardado" />
        ) : personas.length === 0 && casas.length === 0 ? (
          <EstadoVacio icono="search_off" titulo="Sin coincidencias" />
        ) : null}

        {personas.length > 0 && (
          <section aria-label="Personas" className="flex flex-col gap-3">
            <h2 className="px-1 text-headline-sm text-on-surface">Personas</h2>
            <ul className="flex flex-col gap-3">
              {personas.map((p) => (
                <li key={p.id}>
                  <Link to={`/persona/${p.id}`} className={`${claseFila} active:scale-[0.98]`}>
                    <span className="text-label-lg text-on-surface">
                      {p.nombre}
                      {p.apodo && <span className="text-body-sm text-outline"> ({p.apodo})</span>}
                    </span>
                    {textoDireccion(p.direccion) && <span className="text-body-sm text-on-surface-variant">{textoDireccion(p.direccion)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {casas.length > 0 && (
          <section aria-label="Casas" className="flex flex-col gap-3">
            <h2 className="px-1 text-headline-sm text-on-surface">Casas</h2>
            <ul className="flex flex-col gap-3">
              {casas.map((c) => (
                <li key={c.id} className={claseFila}>
                  <Link to={`/casa/${c.id}`} className="flex flex-col active:scale-[0.98]">
                    <span className="text-label-lg text-on-surface">{c.apodo}</span>
                    {textoDireccion(c.direccion) && <span className="text-body-sm text-on-surface-variant">{textoDireccion(c.direccion)}</span>}
                  </Link>
                  <span className="text-body-sm text-on-surface-variant">{c.personas.map(nombre).join(", ")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Pantalla>
    </>
  );
}
