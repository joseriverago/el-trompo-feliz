import { useSyncExternalStore } from "react";

/** Datos públicos del usuario que devuelve la API al registrarse o iniciar sesión. */
export interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: "CLIENTE" | "ADMINISTRADOR";
}

/** Sesión del navegador: el JWT, que se envía en la cabecera Authorization, y el usuario. */
export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

const CLAVE = "trompo-feliz.sesion";
const oyentes = new Set<() => void>();

// useSyncExternalStore necesita recibir el mismo objeto mientras el valor guardado no cambie.
let crudoEnCache: string | null = null;
let sesionEnCache: Sesion | null = null;

/** El JWT dura 7 días: si ya venció, la sesión guardada no sirve y se trata como si no hubiera. */
function tokenVigente(token: string): boolean {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64)) as { exp?: number };
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function interpretar(crudo: string | null): Sesion | null {
  if (!crudo) return null;
  try {
    const valor = JSON.parse(crudo) as Partial<Sesion>;
    return typeof valor.token === "string" &&
      typeof valor.usuario?.nombre === "string" &&
      tokenVigente(valor.token)
      ? (valor as Sesion)
      : null;
  } catch {
    return null;
  }
}

function leerSesion(): Sesion | null {
  let crudo: string | null;
  try {
    crudo = localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
  if (crudo !== crudoEnCache) {
    crudoEnCache = crudo;
    sesionEnCache = interpretar(crudo);
  }
  return sesionEnCache;
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  // El evento «storage» avisa cuando la sesión cambia en otra pestaña.
  window.addEventListener("storage", oyente);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", oyente);
  };
}

/** Guarda la sesión en el navegador; se conserva al recargar la página. */
export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
  oyentes.forEach((oyente) => oyente());
}

/** Olvida la sesión guardada, por ejemplo cuando la API dice que el token ya no sirve. */
export function borrarSesion(): void {
  localStorage.removeItem(CLAVE);
  oyentes.forEach((oyente) => oyente());
}

/**
 * Sesión actual. Devuelve `undefined` mientras se genera la página en el servidor y durante
 * la hidratación (todavía no se sabe), y después la sesión guardada o `null`.
 */
export function useSesion(): Sesion | null | undefined {
  return useSyncExternalStore(suscribir, leerSesion, () => undefined);
}
