"use client";

import Link from "next/link";
import { useSesion } from "@/lib/sesion";

/** Parte derecha del encabezado: el nombre del cliente con sesión iniciada, o los enlaces para entrar o crear una cuenta. */
export function MenuCuenta() {
  const sesion = useSesion();

  // Mientras se lee la sesión guardada, se reserva el espacio para que el encabezado no salte.
  if (sesion === undefined) return <span className="h-9" aria-hidden="true" />;

  if (sesion) {
    const primerNombre = sesion.usuario.nombre.split(" ")[0];
    return (
      <p className="text-sm" title={sesion.usuario.nombre}>
        Hola, <span className="font-semibold">{primerNombre}</span>
      </p>
    );
  }

  return (
    <nav aria-label="Cuenta" className="flex items-center gap-4">
      <Link href="/iniciar-sesion" className="text-sm font-semibold hover:underline">
        Iniciar sesión
      </Link>
      <Link
        href="/registro"
        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-zinc-800"
      >
        Crear cuenta
      </Link>
    </nav>
  );
}
