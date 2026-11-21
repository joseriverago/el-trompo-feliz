"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Estado = "comprobando" | "en-linea" | "sin-conexion";

const TEXTOS: Record<Estado, string> = {
  comprobando: "Conectando con la tienda…",
  "en-linea": "Tienda en línea",
  "sin-conexion": "La tienda no responde en este momento",
};

const COLORES: Record<Estado, string> = {
  comprobando: "bg-amber-400",
  "en-linea": "bg-emerald-500",
  "sin-conexion": "bg-red-500",
};

/** Indica si el frontend llega a la API y la API a PostgreSQL (ruta GET /salud). */
export function EstadoServicio() {
  const [estado, setEstado] = useState<Estado>("comprobando");

  useEffect(() => {
    const controlador = new AbortController();
    fetch(`${API_URL}/salud`, { signal: controlador.signal })
      .then((respuesta) => setEstado(respuesta.ok ? "en-linea" : "sin-conexion"))
      .catch(() => {
        if (!controlador.signal.aborted) setEstado("sin-conexion");
      });
    return () => controlador.abort();
  }, []);

  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
    >
      <span className={`h-2 w-2 rounded-full ${COLORES[estado]}`} aria-hidden="true" />
      {TEXTOS[estado]}
    </p>
  );
}
