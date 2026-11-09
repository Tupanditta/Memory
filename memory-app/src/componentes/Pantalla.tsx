// Cuerpo de una pantalla bajo la cabecera fija: márgenes, hueco inferior y avisos.
import type { ReactNode } from "react";
import BannerAviso from "./BannerAviso";
import BannerError from "./BannerError";

interface Props {
  /** `pestana` deja hueco para la barra de pestañas; `pila`, solo el margen seguro + 40. */
  tipo: "pestana" | "pila";
  children: ReactNode;
}

export default function Pantalla({ tipo, children }: Props) {
  const inferior = tipo === "pestana" ? "pb-[calc(var(--margen-seguro-inf)+7rem)]" : "pb-[calc(var(--margen-seguro-inf)+2.5rem)]";
  return (
    <main className={`flex min-h-screen flex-col gap-space-lg bg-surface px-margin pt-16 ${inferior}`}>
      <BannerError />
      <BannerAviso />
      {children}
    </main>
  );
}
