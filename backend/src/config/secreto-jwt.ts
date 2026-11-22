/** Largo mínimo de la clave: con menos de 32 caracteres un JWT firmado con HS256 es fácil de falsificar. */
const LARGO_MINIMO = 32;

/**
 * Clave con la que se firman los JWT de la sesión.
 * Va en la variable JWT_SECRET: en backend/.env en local y en el panel de Render en producción.
 * Si falta, la API no arranca, para no firmar sesiones con una clave vacía.
 */
export function secretoJwt(): string {
  const secreto = process.env.JWT_SECRET?.trim();
  if (!secreto || secreto.length < LARGO_MINIMO) {
    throw new Error(
      `Falta la variable de entorno JWT_SECRET o tiene menos de ${LARGO_MINIMO} caracteres.`,
    );
  }
  return secreto;
}
