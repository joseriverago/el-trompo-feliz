import { API_URL } from "@/lib/api";
import type { Sesion } from "@/lib/sesion";

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
}

export type ErroresRegistro = Partial<Record<keyof DatosRegistro, string>>;

export type ResultadoRegistro =
  | { ok: true; sesion: Sesion }
  | { ok: false; errores: ErroresRegistro };

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Las mismas reglas que valida la API, para avisar antes de enviar el formulario.
 * La API vuelve a validar todo: es la que decide.
 */
export function validarRegistro(datos: DatosRegistro): ErroresRegistro {
  const errores: ErroresRegistro = {};
  const nombre = datos.nombre.trim();
  const correo = datos.correo.trim();

  if (!nombre) errores.nombre = "Ingresa tu nombre";
  else if (nombre.length > 100) errores.nombre = "El nombre puede tener hasta 100 caracteres";

  if (!correo) errores.correo = "Ingresa tu correo";
  else if (!CORREO_VALIDO.test(correo))
    errores.correo = "Ingresa un correo válido, por ejemplo nombre@correo.com";
  else if (correo.length > 150) errores.correo = "El correo puede tener hasta 150 caracteres";

  if (!datos.contrasena) errores.contrasena = "Ingresa una contraseña";
  else if (datos.contrasena.length < 8)
    errores.contrasena = "La contraseña debe tener al menos 8 caracteres";
  else if (datos.contrasena.length > 72)
    errores.contrasena = "La contraseña puede tener hasta 72 caracteres";

  return errores;
}

/**
 * POST /auth/registro. Si la API rechaza los datos (400) o el correo ya existe (409),
 * devuelve un mensaje por campo. Lanza un error si la API no responde.
 */
export async function registrar(datos: DatosRegistro): Promise<ResultadoRegistro> {
  const respuesta = await fetch(`${API_URL}/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (respuesta.ok) {
    return { ok: true, sesion: (await respuesta.json()) as Sesion };
  }
  if (respuesta.status === 400 || respuesta.status === 409) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { errores?: ErroresRegistro };
    return { ok: false, errores: cuerpo.errores ?? {} };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}
