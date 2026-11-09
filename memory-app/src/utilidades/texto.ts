/** Minúsculas y sin acentos ni diacríticos (RNF3): "ÁNGEL Ñu" → "angel nu". */
export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
