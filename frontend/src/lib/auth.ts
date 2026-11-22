import { API_URL } from "@/lib/api";
import type { Sesion } from "@/lib/sesion";

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface DatosInicioSesion {
  correo: string;
  contrasena: string;
}

export type ErroresRegistro = Partial<Record<keyof DatosRegistro, string>>;
export type ErroresInicioSesion = Partial<Record<keyof DatosInicioSesion, string>>;

export type ResultadoRegistro =
  | { ok: true; sesion: Sesion }
  | { ok: false; errores: ErroresRegistro };

/** Si la API rechaza las credenciales, `mensaje` trae el texto genérico y `errores` llega vacío. */
export type ResultadoInicioSesion =
  | { ok: true; sesion: Sesion }
  | { ok: false; errores: ErroresInicioSesion; mensaje?: string };

/** El mismo texto que responde la API: no dice si falló el correo o la contraseña. */
export const CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function errorDeCorreo(correo: string): string | undefined {
  if (!correo) return "Ingresa tu correo";
  if (!CORREO_VALIDO.test(correo)) return "Ingresa un correo válido, por ejemplo nombre@correo.com";
  return undefined;
}

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

  errores.correo = errorDeCorreo(correo);
  if (!errores.correo && correo.length > 150) errores.correo = "El correo puede tener hasta 150 caracteres";

  if (!datos.contrasena) errores.contrasena = "Ingresa una contraseña";
  else if (datos.contrasena.length < 8)
    errores.contrasena = "La contraseña debe tener al menos 8 caracteres";
  else if (datos.contrasena.length > 72)
    errores.contrasena = "La contraseña puede tener hasta 72 caracteres";

  return sinVacios(errores);
}

/** Para iniciar sesión solo se pide que los dos campos estén completos y que el correo tenga forma de correo. */
export function validarInicioSesion(datos: DatosInicioSesion): ErroresInicioSesion {
  return sinVacios({
    correo: errorDeCorreo(datos.correo.trim()),
    contrasena: datos.contrasena ? undefined : "Ingresa tu contraseña",
  });
}

function sinVacios<T extends Record<string, string | undefined>>(errores: T): T {
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje)) as T;
}

function enviar(ruta: string, datos: object): Promise<Response> {
  return fetch(`${API_URL}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

async function erroresDe<T>(respuesta: Response): Promise<T> {
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { errores?: T };
  return cuerpo.errores ?? ({} as T);
}

/**
 * POST /auth/registro. Si la API rechaza los datos (400) o el correo ya existe (409),
 * devuelve un mensaje por campo. Lanza un error si la API no responde.
 */
export async function registrar(datos: DatosRegistro): Promise<ResultadoRegistro> {
  const respuesta = await enviar("/auth/registro", datos);

  if (respuesta.ok) {
    return { ok: true, sesion: (await respuesta.json()) as Sesion };
  }
  if (respuesta.status === 400 || respuesta.status === 409) {
    return { ok: false, errores: await erroresDe<ErroresRegistro>(respuesta) };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}

/**
 * POST /auth/inicio-sesion. Si falta un dato (400) devuelve un mensaje por campo; si el correo
 * o la contraseña no coinciden (401), el mensaje genérico. Lanza un error si la API no responde.
 */
export async function iniciarSesion(datos: DatosInicioSesion): Promise<ResultadoInicioSesion> {
  const respuesta = await enviar("/auth/inicio-sesion", datos);

  if (respuesta.ok) {
    return { ok: true, sesion: (await respuesta.json()) as Sesion };
  }
  if (respuesta.status === 401) {
    return { ok: false, errores: {}, mensaje: CREDENCIALES_INCORRECTAS };
  }
  if (respuesta.status === 400) {
    return { ok: false, errores: await erroresDe<ErroresInicioSesion>(respuesta) };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}
