import type { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL devuelve las columnas numeric como texto para no perder precisión.
 * Este transformador las convierte a number al leerlas (por ejemplo, precios en soles).
 */
export const transformadorDecimal: ValueTransformer = {
  to: (valor: number | null | undefined) => valor,
  from: (valor: string | null | undefined) =>
    valor === null || valor === undefined ? valor : Number(valor),
};
