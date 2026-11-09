// Frontera con las notificaciones del sistema (design.md, "Notificaciones").
// `NotificadorCapacitor` usa `@capacitor/local-notifications` en Android;
// `NotificadorNulo` se usa en la vista previa web y no hace nada.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications, type LocalNotificationsPlugin } from "@capacitor/local-notifications";

export type EstadoPermiso = "concedido" | "denegado" | "preguntar";

/** Un aviso anual: se repite cada año el día `dia` del mes `mes` (1-12) a la hora indicada. */
export interface Aviso {
  id: number;
  titulo: string;
  cuerpo: string;
  dia: number;
  mes: number;
  hora: number;
  minuto: number;
}

export interface Notificador {
  permiso(): Promise<EstadoPermiso>;
  /** Pide el permiso al usuario y devuelve el estado resultante. */
  pedirPermiso(): Promise<EstadoPermiso>;
  /** Cancela todas las notificaciones pendientes de la app. */
  cancelarTodas(): Promise<void>;
  programar(avisos: readonly Aviso[]): Promise<void>;
}

/** Vista previa web: no hay notificaciones del móvil; no hace nada y nunca falla. */
export class NotificadorNulo implements Notificador {
  async permiso(): Promise<EstadoPermiso> {
    return "concedido";
  }
  async pedirPermiso(): Promise<EstadoPermiso> {
    return "concedido";
  }
  async cancelarTodas(): Promise<void> {}
  async programar(): Promise<void> {}
}

export const CANAL_AVISOS = "avisos";

type Plugin = Pick<LocalNotificationsPlugin, "checkPermissions" | "requestPermissions" | "cancelAll" | "createChannel" | "schedule">;

function aEstado(estado: string): EstadoPermiso {
  if (estado === "granted") return "concedido";
  if (estado === "denied") return "denegado";
  return "preguntar"; // "prompt" y "prompt-with-rationale"
}

/** Android. Recibe el plugin por parámetro para las pruebas. */
export class NotificadorCapacitor implements Notificador {
  private canalCreado = false;

  constructor(private readonly plugin: Plugin = LocalNotifications) {}

  async permiso(): Promise<EstadoPermiso> {
    return aEstado((await this.plugin.checkPermissions()).display);
  }

  async pedirPermiso(): Promise<EstadoPermiso> {
    return aEstado((await this.plugin.requestPermissions()).display);
  }

  async cancelarTodas(): Promise<void> {
    await this.plugin.cancelAll();
  }

  async programar(avisos: readonly Aviso[]): Promise<void> {
    if (avisos.length === 0) return;
    if (!this.canalCreado) {
      await this.plugin.createChannel({ id: CANAL_AVISOS, name: "Avisos de fechas", description: "Cumpleaños y aniversarios del día siguiente", importance: 4 });
      this.canalCreado = true;
    }
    await this.plugin.schedule({
      notifications: avisos.map((aviso) => ({
        id: aviso.id,
        title: aviso.titulo,
        body: aviso.cuerpo,
        channelId: CANAL_AVISOS,
        schedule: {
          // En Android el plugin pasa `month` tal cual a `Calendar.MONTH`, que empieza en 0
          // (enero = 0). Lo fija un test del Sprint 7.
          on: { month: aviso.mes - 1, day: aviso.dia, hour: aviso.hora, minute: aviso.minuto, second: 0 },
          allowWhileIdle: true,
        },
      })),
    });
  }
}

/** Archivos y notificaciones reales en Android; nada en la vista previa web. */
export function crearNotificador(): Notificador {
  return Capacitor.isNativePlatform() ? new NotificadorCapacitor() : new NotificadorNulo();
}
