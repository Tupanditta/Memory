// T0.2 (test de humo) y T0.3 (la app arranca con la pantalla inicial vacía en español, RNF6).
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import App from "../src/App";

describe("Sprint 0: pantalla inicial", () => {
  test("T0.2 la suite de Vitest se ejecuta", () => {
    expect(1 + 1).toBe(2);
  });

  test("T0.3 la app arranca y muestra la pantalla inicial vacía en español", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Memory" })).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay nada guardado")).toBeInTheDocument();
    expect(document.documentElement.lang === "" || document.documentElement.lang === "es").toBe(true);
  });
});
