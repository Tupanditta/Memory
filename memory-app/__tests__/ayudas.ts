// Pasos de interfaz comunes a las pruebas de pantallas desde el rediseño (Sprint 10).
import { fireEvent, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/** Elige el mes de una fecha del formulario en su hoja de meses ("Marzo"). */
export async function elegirMes(usuario: UserEvent, grupo: HTMLElement, mes: string) {
  await usuario.click(within(grupo).getByLabelText("Mes"));
  await usuario.click(within(screen.getByRole("dialog", { name: "Mes" })).getByRole("button", { name: mes }));
}

/** Abre la hoja de opciones de la ficha de persona y pulsa una opción. */
export async function opcionDePerfil(usuario: UserEvent, opcion: "Editar información" | "Eliminar de contactos") {
  await usuario.click(screen.getByRole("button", { name: "Opciones de perfil" }));
  await usuario.click(within(screen.getByRole("dialog", { name: "Opciones de contacto" })).getByRole("button", { name: opcion }));
}

/** Región de Inicio por su título ("Personas", "Casas y lugares"); `null` si no se muestra. */
export const seccionInicio = (titulo: "Personas" | "Casas y lugares") => screen.queryByRole("region", { name: titulo });

/** Tarjetas (enlaces) de una sección de Inicio, en orden. */
export const tarjetasInicio = (titulo: "Personas" | "Casas y lugares") => {
  const region = seccionInicio(titulo);
  return region ? within(region).getAllByRole("link") : [];
};

/** Nombres (o apodos de casa) de las tarjetas de una sección de Inicio, en orden. */
export const titulosInicio = (titulo: "Personas" | "Casas y lugares") =>
  tarjetasInicio(titulo).map((tarjeta) => within(tarjeta).getByRole("heading", { level: 3 }).textContent);

/** Tarjeta de Inicio cuyo título es `nombre`. */
export const tarjetaInicio = (titulo: "Personas" | "Casas y lugares", nombre: string) => {
  const tarjeta = tarjetasInicio(titulo).find((t) => within(t).getByRole("heading", { level: 3 }).textContent === nombre);
  if (!tarjeta) throw new Error(`No hay tarjeta "${nombre}" en ${titulo}`);
  return tarjeta;
};

/** Aviso de notificaciones (`BannerAviso`), distinto del aviso emergente de "guardado". */
export const avisoNotificaciones = () => screen.queryByRole("status", { name: "Aviso de notificaciones" });

/** Deslizador de la hora de aviso en Ajustes (Sprint 12). */
export const deslizadorHora = () => screen.getByRole("slider", { name: "Hora de aviso" });

/** Lectura de la hora en Ajustes ("09:00"). */
export const lecturaHora = () => screen.getByLabelText("Hora elegida");

/**
 * Arrastra el deslizador hasta una hora (`input` en cada paso) y, si `soltar`,
 * lo suelta (`change` nativo, que es cuando se guarda).
 */
export function moverHora(hora: string, soltar = true) {
  const [h, m] = hora.split(":").map(Number);
  const deslizador = deslizadorHora();
  fireEvent.input(deslizador, { target: { value: String(h * 60 + m) } });
  if (soltar) fireEvent.change(deslizador);
}
