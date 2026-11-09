// Confirmación en una hoja inferior (sustituye a `window.confirm`): confirmar o cancelar.
import type { ReactNode } from "react";
import Boton from "./Boton";
import HojaInferior from "./HojaInferior";
import type { NombreIcono } from "./Icono";

interface Props {
  abierta: boolean;
  titulo: string;
  /** Nombre accesible; por defecto el título. */
  etiqueta?: string;
  /** Texto de la confirmación. */
  children: ReactNode;
  textoConfirmar: string;
  iconoConfirmar?: NombreIcono;
  /** Acción destructiva: botón rojo. */
  peligro?: boolean;
  onConfirmar(): void;
  onCancelar(): void;
}

export default function DialogoConfirmacion({ abierta, titulo, etiqueta, children, textoConfirmar, iconoConfirmar, peligro = false, onConfirmar, onCancelar }: Props) {
  return (
    <HojaInferior abierta={abierta} onCerrar={onCancelar} titulo={titulo} etiqueta={etiqueta} rol="alertdialog">
      <div className="flex flex-col gap-2 pb-2 text-body-md text-on-surface-variant">{children}</div>
      <Boton variante={peligro ? "opcionHojaPeligro" : "opcionHoja"} icono={iconoConfirmar} onClick={onConfirmar}>
        {textoConfirmar}
      </Boton>
      <Boton variante="texto" onClick={onCancelar}>
        Cancelar
      </Boton>
    </HojaInferior>
  );
}
