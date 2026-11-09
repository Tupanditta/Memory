// Ajustes de la app (CU10): la hora de aviso se guarda en `ajustes.json` (RNF7).
import type { Ajustes, Resultado } from "../modelos/tipos";
import { validarHora } from "../modelos/validadores";
import type { Tienda } from "./tienda";

export class AjustesService {
  constructor(private readonly tienda: Tienda) {}

  /** Cambia la hora de aviso (`HH:MM`). Las notificaciones se reprograman tras guardar. */
  async cambiarHora(hora: string): Promise<Resultado<Ajustes>> {
    const valor = hora.trim();
    const validacion = validarHora(valor);
    if (!validacion.ok) return validacion;
    const ajustes: Ajustes = { ...this.tienda.datos.ajustes, horaNotificacion: valor };
    const resultado = await this.tienda.aplicar({ ajustes });
    return resultado.ok ? { ok: true, valor: ajustes } : resultado;
  }
}
