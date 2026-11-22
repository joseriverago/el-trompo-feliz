"use client";

import { useEffect } from "react";
import { guardarCarrito, obtenerCarrito, useCarrito } from "@/lib/carrito";
import { borrarSesion } from "@/lib/sesion";

/**
 * Contador del carrito en el encabezado: cuántas unidades tiene el cliente.
 * Lee el carrito de la API al iniciar la sesión; después lo actualiza cada «Agregar al carrito».
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
    <p className="flex items-center gap-1.5 text-sm font-semibold" title="Tu carrito">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3h2.6l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6" />
      </svg>
      <span className="sr-only">Carrito:</span>
      {unidades !== undefined && (
        <span className="min-w-6 rounded-full bg-zinc-950 px-2 py-0.5 text-center text-xs text-amber-300">
          {unidades}
          <span className="sr-only">{unidades === 1 ? " unidad" : " unidades"}</span>
        </span>
      )}
    </p>
  );
}
