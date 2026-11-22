import {
  BadRequestException,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';

/** Mensaje general de un 400 por datos del formulario; el detalle va en `errores`. */
export const REVISA_FORMULARIO = 'Revisa los datos del formulario.';

/**
 * Un mensaje por campo, para que el formulario lo muestre junto al campo que hay que corregir.
 * Si un campo está vacío, se muestra ese mensaje antes que los demás.
 */
export function erroresPorCampo(
  errores: ValidationError[],
): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const error of errores) {
    const restricciones = error.constraints ?? {};
    const mensaje =
      restricciones.isNotEmpty ?? Object.values(restricciones).at(0);
    if (mensaje) resultado[error.property] = mensaje;
  }
  return resultado;
}

/**
 * Validación de los cuerpos de las peticiones con los DTO de class-validator.
 * - whitelist: descarta los campos que el DTO no declara (por ejemplo, un «rol» enviado al registrarse).
 * - transform: aplica los @Transform del DTO (recortar espacios, correo en minúsculas).
 * Responde 400 con { message, errores: { campo: mensaje } }.
 */
export function crearPipeValidacion(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errores) =>
      new BadRequestException({
        statusCode: 400,
        message: REVISA_FORMULARIO,
        errores: erroresPorCampo(errores),
      }),
  });
}
