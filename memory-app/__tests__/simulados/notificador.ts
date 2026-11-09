// Notificador simulado en memoria (Sprint 7): guarda lo programado y permite elegir
// el estado del permiso y la respuesta del usuario al pedirlo.
import type { Aviso, EstadoPermiso, Notificador } from "../../src/servicios/notificador";

export class NotificadorSimulado implements Notificador {
  /** Avisos pendientes; `cancelarTodas` los vacía. Un aviso repetido aparece dos veces. */
  programadas: Aviso[] = [];
  /** Veces que se ha pedido el permiso. */
  pedidos = 0;
  /** Veces que se ha llamado a `programar`. */
  programaciones = 0;
  /** La próxima llamada a `programar` lanza un error. */
  fallarProgramar = false;

  constructor(
    public estado: EstadoPermiso = "concedido",
    /** Lo que responde el usuario al pedir el permiso. */
    public respuesta: EstadoPermiso = "concedido",
  ) {}

  async permiso(): Promise<EstadoPermiso> {
    return this.estado;
  }

  async pedirPermiso(): Promise<EstadoPermiso> {
    this.pedidos++;
    this.estado = this.respuesta;
    return this.estado;
  }

  async cancelarTodas(): Promise<void> {
    this.programadas = [];
  }

  async programar(avisos: readonly Aviso[]): Promise<void> {
    this.programaciones++;
    if (this.fallarProgramar) {
      this.fallarProgramar = false;
      throw new Error("Fallo del sistema de notificaciones");
    }
    this.programadas.push(...avisos);
  }
}
