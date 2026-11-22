/** Código de PostgreSQL para una restricción UNIQUE violada. */
const VIOLACION_UNICA = '23505';

/**
 * Indica si la base de datos rechazó una fila porque repetía un valor único
 * (por ejemplo, un correo ya registrado o la misma línea del carrito dos veces).
 */
export function esViolacionUnica(error: unknown): boolean {
  const conCodigo = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return (
    conCodigo?.code === VIOLACION_UNICA ||
    conCodigo?.driverError?.code === VIOLACION_UNICA
  );
}
