// Cálculo de fechas de cumpleaños y aniversarios (design.md, "Notificaciones").
// Todas las fechas son locales y sin hora (medianoche).

export interface DiaMes {
  dia: number;
  mes: number;
}

export function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

/** Días del mes (1-12). Sin año, febrero tiene 29 (una fecha sin año puede ser el 29/02). */
export function diasDelMes(mes: number, anio?: number): number {
  if (mes === 2) return anio === undefined || esBisiesto(anio) ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

function soloDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** Día en que se celebra la fecha en un año: el 29/02 se celebra el 1 de marzo en años no bisiestos. */
function celebracionEn(fecha: DiaMes, anio: number): Date {
  if (fecha.dia === 29 && fecha.mes === 2 && !esBisiesto(anio)) return new Date(anio, 2, 1);
  return new Date(anio, fecha.mes - 1, fecha.dia);
}

/** Próxima ocurrencia de día/mes a partir de `desde` (incluye el propio día). */
export function proximaFecha(fecha: DiaMes, desde: Date): Date {
  const hoy = soloDia(desde);
  const esteAnio = celebracionEn(fecha, hoy.getFullYear());
  return esteAnio >= hoy ? esteAnio : celebracionEn(fecha, hoy.getFullYear() + 1);
}

/** Día del aviso: el día anterior a la próxima ocurrencia. */
export function fechaAviso(fecha: DiaMes, desde: Date): Date {
  const proxima = proximaFecha(fecha, desde);
  return new Date(proxima.getFullYear(), proxima.getMonth(), proxima.getDate() - 1);
}
