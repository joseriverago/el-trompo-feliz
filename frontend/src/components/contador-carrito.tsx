"use client";

import Link from "next/link";
import { useEffect } from "react";
import { IconoCarrito } from "@/components/icono-carrito";
import { guardarCarrito, obtenerCarrito, useCarrito } from "@/lib/carrito";
import { borrarSesion } from "@/lib/sesion";

/**
 * Contador del carrito en el encabezado: cuántas unidades tiene el cliente. Es un enlace a /carrito.
 * Lee el carrito de la API al iniciar la sesión; después lo actualiza cada cambio del carrito.
 */
export function ContadorCarrito({ token }: { token: string }) {
  const carrito = useCarrito();

  useEffect(() => {
    const controlador = new AbortController();
    obtenerCarrito(token, controlador.signal)
      .then((leido) => {
        // 401: el token ya no sirve (por ejemplo, venció): se cierra la sesión del navegador.
        if (leido) guardarCarrito(leido);
        else borrarSesion();
      })
      .catch(() => {
        // Sin conexión con la API: el contador queda sin número y se vuelve a pedir al recargar.
      });
    return () => {
      controlador.abort();
      guardarCarrito(null);
    };
  }, [token]);

  const unidades = carrito?.unidades;
  return (
    <Link
      href="/carrito"
      title="Ver tu carrito"
      className="-mx-2 flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold transition-colors hover:bg-amber-300"
    >
      <IconoCarrito className="h-5 w-5" />
      <span className="sr-only">Ver tu carrito:</span>
      {unidades !== undefined && (
        <span className="min-w-6 rounded-full bg-zinc-950 px-2 py-0.5 text-center text-xs text-amber-300">
          {unidades}
          <span className="sr-only">{unidades === 1 ? " unidad" : " unidades"}</span>
        </span>
      )}
    </Link>
  );
}
