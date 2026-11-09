/** UUID v4 a partir de `Math.random` (no depende de `crypto.randomUUID`, que falta en WebViews antiguos). */
export function nuevoId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
