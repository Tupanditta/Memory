// Botón atrás de Android (design.md, "Esqueleto común"): las hojas, diálogos y formularios
// en edición se registran aquí; atrás cierra el último abierto antes de cambiar de pantalla.
import { useEffect, useRef } from "react";

const pila: (() => void)[] = [];

/** Registra una función de cierre; devuelve la que la quita. */
export function registrarCierre(cerrar: () => void): () => void {
  pila.push(cerrar);
  return () => {
    const i = pila.lastIndexOf(cerrar);
    if (i >= 0) pila.splice(i, 1);
  };
}

/** Cierra lo último que se abrió; `false` si no había nada abierto. */
export function cerrarUltimo(): boolean {
  const cerrar = pila.at(-1);
  if (!cerrar) return false;
  cerrar();
  return true;
}

/** Mientras `activo` sea cierto, el botón atrás llama a `cerrar` en vez de volver. */
export function useCierreAtras(activo: boolean, cerrar: () => void): void {
  const ref = useRef(cerrar);
  ref.current = cerrar;
  useEffect(() => {
    if (!activo) return;
    return registrarCierre(() => ref.current());
  }, [activo]);
}
