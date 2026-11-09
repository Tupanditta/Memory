// Tarjeta de dirección de las fichas (design.md, "Detalle de persona" y "Detalle de casa"):
// franja superior, cabecera, las tres líneas de la dirección (partes vacías omitidas) y notas.
import { useId } from "react";
import type { Direccion } from "../modelos/tipos";
import { lineasDireccion } from "../utilidades/presentacion";
import CabeceraTarjeta from "./CabeceraTarjeta";
import Icono from "./Icono";
import Tarjeta from "./Tarjeta";

interface Props {
  direccion: Direccion;
  /** "Ubicación principal" (persona) o "Ubicación compartida" (casa). */
  sobretitulo: string;
  /** Título y nombre de la región: "Dirección particular" o "Dirección compartida". */
  titulo: string;
  /** Título de las notas: "Nota para visitas" o "Detalles útiles". */
  tituloNotas: string;
}

export default function TarjetaDireccion({ direccion, sobretitulo, titulo, tituloNotas }: Props) {
  const id = useId();
  const lineas = lineasDireccion(direccion);
  const sinDireccion = !lineas.via && !lineas.vivienda && !lineas.localidad;
  return (
    <Tarjeta elemento="section" padding={24} aria-labelledby={id} className="flex flex-col gap-space-md">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-container/40 via-primary-fixed to-transparent" />
      <CabeceraTarjeta id={id} icono="pin_drop" colorCirculo="bg-primary-fixed/60 text-primary" sobretitulo={sobretitulo} titulo={titulo} />
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
      {direccion.notas.trim() && (
        <div className="flex items-start gap-space-sm rounded bg-surface-container p-space-md">
          <Icono nombre="lightbulb" tamano={20} className="mt-0.5 shrink-0 text-secondary" />
          <div className="flex flex-col gap-0.5">
            <span className="text-label-sm font-semibold text-secondary">{tituloNotas}</span>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">{direccion.notas}</p>
          </div>
        </div>
      )}
    </Tarjeta>
  );
}
