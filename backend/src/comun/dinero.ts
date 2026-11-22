/**
 * Cálculos con soles. Se hacen en céntimos enteros para no arrastrar errores de
 * redondeo: 24.90 × 3 da 74.70 y no 74.69999999999999.
 */
function aCentimos(soles: number): number {
  return Math.round(soles * 100);
}

/** Precio × cantidad, en soles con dos decimales. */
export function multiplicarPrecio(precio: number, cantidad: number): number {
  return (aCentimos(precio) * cantidad) / 100;
}

/** Suma de montos en soles, con dos decimales. */
export function sumarMontos(montos: number[]): number {
  return montos.reduce((suma, monto) => suma + aCentimos(monto), 0) / 100;
}
