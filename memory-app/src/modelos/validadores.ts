// Validadores del modelo de datos. Reciben `unknown` para poder comprobar también
// lo que se lee de los JSON (repositorio) o de un archivo importado.
import { diasDelMes } from "../utilidades/fechas";
import { CAMPOS_DIRECCION, TIPOS_FECHA, type Ajustes, type Casa, type Direccion, type Fecha, type Persona, type Validacion } from "./tipos";

const OK: Validacion = { ok: true };
const error = (motivo: string): Validacion => ({ ok: false, error: motivo });

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esEntero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor);
}

function esTextoNoVacio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim() !== "";
}

export function validarDireccion(valor: unknown): Validacion {
  if (!esObjeto(valor)) return error("La dirección no es válida");
  for (const campo of CAMPOS_DIRECCION) {
    if (typeof valor[campo] !== "string") return error("La dirección no es válida");
  }
  return OK;
}

/** Día y mes válidos (el 29/02 es válido sin año o con año bisiesto); año opcional. */
export function validarFecha(valor: unknown): Validacion {
  if (!esObjeto(valor)) return error("La fecha no es válida");
  const { tipo, etiqueta, dia, mes, anio } = valor;
  if (!TIPOS_FECHA.includes(tipo as Fecha["tipo"])) return error("El tipo de fecha debe ser cumpleaños o aniversario");
  if (typeof etiqueta !== "string") return error("La etiqueta de la fecha no es válida");
  if (anio !== undefined && (!esEntero(anio) || anio < 1 || anio > 9999)) return error("El año no es válido");
  if (!esEntero(mes) || mes < 1 || mes > 12) return error("El mes no es válido");
  if (!esEntero(dia) || dia < 1 || dia > diasDelMes(mes, anio as number | undefined)) return error("El día no existe en ese mes");
  return OK;
}

/** Solo el nombre es obligatorio (RF1, RNF1). */
export function validarPersona(valor: unknown): Validacion {
  if (!esObjeto(valor)) return error("La persona no es válida");
  if (!esTextoNoVacio(valor.id)) return error("La persona no tiene id");
  if (!esTextoNoVacio(valor.nombre)) return error("Escribe el nombre");
  if (typeof valor.apodo !== "string") return error("El apodo no es válido");
  const direccion = validarDireccion(valor.direccion);
  if (!direccion.ok) return direccion;
  if (!Array.isArray(valor.fechas)) return error("Las fechas no son válidas");
  for (const fecha of valor.fechas) {
    const resultado = validarFecha(fecha);
    if (!resultado.ok) return resultado;
  }
  return OK;
}

/** Apodo obligatorio y al menos una persona, sin repetir (R8). */
export function validarCasa(valor: unknown): Validacion {
  if (!esObjeto(valor)) return error("La casa no es válida");
  if (!esTextoNoVacio(valor.id)) return error("La casa no tiene id");
  if (!esTextoNoVacio(valor.apodo)) return error("Escribe el apodo de la casa");
  const direccion = validarDireccion(valor.direccion);
  if (!direccion.ok) return direccion;
  const personas = valor.personas;
  if (!Array.isArray(personas) || !personas.every(esTextoNoVacio)) return error("Los miembros de la casa no son válidos");
  if (personas.length === 0) return error("Elige al menos una persona");
  if (new Set(personas).size !== personas.length) return error("Una persona está repetida en la casa");
  return OK;
}

/** Hora `HH:MM` de 00:00 a 23:59. */
export function validarHora(valor: unknown): Validacion {
  if (typeof valor !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(valor)) return error("La hora debe tener el formato HH:MM");
  return OK;
}

export function validarAjustes(valor: unknown): Validacion {
  if (!esObjeto(valor)) return error("Los ajustes no son válidos");
  return validarHora(valor.horaNotificacion);
}

// Guardas de tipo para el repositorio y la importación.
export const esPersona = (valor: unknown): valor is Persona => validarPersona(valor).ok;
export const esCasa = (valor: unknown): valor is Casa => validarCasa(valor).ok;
export const esAjustes = (valor: unknown): valor is Ajustes => validarAjustes(valor).ok;
export const esDireccion = (valor: unknown): valor is Direccion => validarDireccion(valor).ok;
