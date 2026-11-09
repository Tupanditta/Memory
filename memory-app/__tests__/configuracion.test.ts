// T0.5: identificador, minSdkVersion 24 y solo Android (R1, R13, RNF11).
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import config from "../capacitor.config";
import paquete from "../package.json";

const raiz = resolve(__dirname, "..");
const leer = (ruta: string) => readFileSync(resolve(raiz, ruta), "utf8");

describe("Sprint 0: configuración de Android", () => {
  test("R13 el appId es com.tupanditta.memory en Capacitor y en Gradle", () => {
    expect(config.appId).toBe("com.tupanditta.memory");
    expect(leer("android/app/build.gradle")).toMatch(/applicationId "com\.tupanditta\.memory"/);
  });

  test("T0.5 minSdkVersion es 24", () => {
    expect(leer("android/variables.gradle")).toMatch(/minSdkVersion = 24\b/);
  });

  test("T0.5 no incluye iOS", () => {
    expect(existsSync(resolve(raiz, "ios"))).toBe(false);
    const todas = { ...paquete.dependencies, ...paquete.devDependencies };
    expect(Object.keys(todas)).not.toContain("@capacitor/ios");
  });

  test("Capacitor empaqueta la web de dist/", () => {
    expect(config.webDir).toBe("dist");
  });
});
