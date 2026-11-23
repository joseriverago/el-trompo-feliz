/** Código de PostgreSQL para una restricción UNIQUE violada. */
const VIOLACION_UNICA = '23505';
/** Código de PostgreSQL para una llave foránea que apunta a una fila que no existe (o que todavía la usan). */
const VIOLACION_LLAVE_FORANEA = '23503';

/** Compara el código de error de pg, que TypeORM deja en el error o dentro de driverError. */
function tieneCodigo(error: unknown, codigo: string): boolean {
  const conCodigo = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return conCodigo?.code === codigo || conCodigo?.driverError?.code === codigo;
}

/**
 * Indica si la base de datos rechazó una fila porque repetía un valor único
 * (por ejemplo, un correo ya registrado o la misma línea del carrito dos veces).
 */
export function esViolacionUnica(error: unknown): boolean {
  return tieneCodigo(error, VIOLACION_UNICA);
}

/**
 * Indica si la base de datos rechazó la operación por una llave foránea: por ejemplo,
 * un juguete con una categoría que ya no existe, o borrar una categoría que tiene juguetes.
 */
export function esViolacionLlaveForanea(error: unknown): boolean {
  return tieneCodigo(error, VIOLACION_LLAVE_FORANEA);
}
