// Búsqueda en memoria (design.md, "Búsqueda"; RF4, RNF3).
import { CAMPOS_DIRECCION, type Casa, type Direccion, type Persona } from "../modelos/tipos";
import { normalizarTexto } from "./texto";

function textoDireccion(direccion: Direccion): string[] {
  return CAMPOS_DIRECCION.map((campo) => direccion[campo]);
}

/**
 * Texto de una persona: nombre, apodo, dirección (con notas), tipo y etiqueta de
 * sus fechas, y apodo y dirección de sus casas (no los nombres de sus convivientes).
 */
export function textoPersona(persona: Persona, casas: Casa[]): string {
  const partes = [persona.nombre, persona.apodo, ...textoDireccion(persona.direccion)];
  for (const fecha of persona.fechas) partes.push(fecha.tipo, fecha.etiqueta);
  for (const casa of casas) {
    if (casa.personas.includes(persona.id)) partes.push(casa.apodo, ...textoDireccion(casa.direccion));
  }
  return normalizarTexto(partes.join(" "));
}

/** Texto de una casa: apodo, dirección y nombres de sus miembros. */
export function textoCasa(casa: Casa, personas: Persona[]): string {
  const nombres = casa.personas.map((id) => personas.find((p) => p.id === id)?.nombre ?? "");
  return normalizarTexto([casa.apodo, ...textoDireccion(casa.direccion), ...nombres].join(" "));
}

/** Palabras normalizadas de la consulta; todas deben aparecer, en cualquier orden. */
export function palabrasConsulta(consulta: string): string[] {
  return normalizarTexto(consulta)
    .split(/\s+/)
    .filter((palabra) => palabra !== "");
}

export function coincide(texto: string, palabras: string[]): boolean {
  return palabras.every((palabra) => texto.includes(palabra));
}
