// Inicio (CU3, CU9): buscador, lista de personas y lista de casas.
import { useState } from "react";
import { Link } from "react-router";
import { textoDireccion } from "../componentes/CamposDireccion";
import { useApp } from "../estado/contexto";
import { normalizarTexto } from "../utilidades/texto";

const porTexto = <T,>(clave: (x: T) => string) => (a: T, b: T) => normalizarTexto(clave(a)).localeCompare(normalizarTexto(clave(b)));

export default function Inicio() {
  // `datos` hace que la lista se recalcule tras cada guardado correcto.
  const { datos, personas: servicioPersonas, casas: servicioCasas } = useApp();
  const [consulta, setConsulta] = useState("");

  const personas = [...servicioPersonas.buscar(consulta)].sort(porTexto((p) => p.nombre));
  const casas = [...servicioCasas.buscar(consulta)].sort(porTexto((c) => c.apodo));
  const nombre = (id: string) => datos.personas.find((p) => p.id === id)?.nombre ?? "";
  const vacia = datos.personas.length === 0 && datos.casas.length === 0;

  return (
    <main className="flex min-h-screen flex-col gap-space-lg bg-surface px-margin py-space-lg">
      <h1 className="text-headline-md text-primary">Memory</h1>

      <input
        type="search"
        aria-label="Buscar"
        placeholder="Buscar persona, casa o dirección..."
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        className="rounded-full bg-surface-container-lowest px-space-md py-space-sm text-body-md text-on-surface shadow-sm"
      />

      <div className="flex gap-space-sm">
        <Link to="/persona/nueva" aria-label="Añadir persona" className="rounded-full bg-primary-fixed px-space-md py-space-sm text-label-lg text-on-primary-fixed">
          Persona
        </Link>
      </div>

      {vacia && consulta.trim() === "" ? (
        <p className="text-body-md text-on-surface-variant">Todavía no hay nada guardado</p>
      ) : personas.length === 0 && casas.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Sin coincidencias</p>
      ) : null}

      {personas.length > 0 && (
        <section aria-label="Personas" className="flex flex-col gap-space-sm">
          <h2 className="text-headline-sm text-on-surface">Personas</h2>
          <ul className="flex flex-col gap-space-sm">
            {personas.map((p) => (
              <li key={p.id}>
                <Link to={`/persona/${p.id}`} className="flex flex-col rounded bg-surface-container-lowest p-space-md shadow-sm">
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
        <section aria-label="Casas" className="flex flex-col gap-space-sm">
          <h2 className="text-headline-sm text-on-surface">Casas</h2>
          <ul className="flex flex-col gap-space-sm">
            {casas.map((c) => (
              <li key={c.id} className="flex flex-col rounded bg-surface-container-lowest p-space-md shadow-sm">
                <span className="text-label-lg text-on-surface">{c.apodo}</span>
                {textoDireccion(c.direccion) && <span className="text-body-sm text-on-surface-variant">{textoDireccion(c.direccion)}</span>}
                <span className="text-body-sm text-on-surface-variant">{c.personas.map(nombre).join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
