// Estado en memoria. Solo cambia si el repositorio guarda bien (RNF9).
import type { Resultado } from "../modelos/tipos";
import type { Datos, Repositorio } from "../repositorio/repositorio";

export class Tienda {
  private estado: Datos;

  constructor(
    private readonly repositorio: Pick<Repositorio, "guardar">,
    datos: Datos,
  ) {
    this.estado = datos;
  }

  get datos(): Datos {
    return this.estado;
  }

  /** Guarda los archivos que cambian en una sola operación y, solo si va bien, actualiza el estado. */
  async aplicar(cambios: Partial<Datos>): Promise<Resultado<Datos>> {
    const resultado = await this.repositorio.guardar(cambios);
    if (!resultado.ok) return resultado;
    this.estado = { ...this.estado, ...cambios };
    return { ok: true, valor: this.estado };
  }
}
