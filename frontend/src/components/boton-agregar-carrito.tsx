"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { agregarAlCarrito, guardarCarrito } from "@/lib/carrito";
import { rutaIniciarSesion } from "@/lib/rutas";
import { borrarSesion, useSesion } from "@/lib/sesion";

type Aviso = { tipo: "exito" | "error"; texto: string };

const COLOR_AVISO: Record<Aviso["tipo"], string> = {
  exito: "text-emerald-700 dark:text-emerald-400",
  error: "text-red-700 dark:text-red-400",
};

/**
 * Botón «Agregar al carrito» del catálogo y del detalle (HU-05). Solo se muestra si el
 * juguete tiene stock. Sin sesión lleva a iniciar sesión y después vuelve a esta página.
 */
export function BotonAgregarCarrito({ jugueteId, className = "" }: { jugueteId: number; className?: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const sesion = useSesion();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  function irAIniciarSesion() {
    router.push(rutaIniciarSesion(ruta));
  }

  async function agregar() {
    if (sesion === undefined) return; // Todavía se está leyendo la sesión guardada.
    if (!sesion) {
      irAIniciarSesion();
      return;
    }

    setEnviando(true);
    setAviso(null);
    try {
      const resultado = await agregarAlCarrito(sesion.token, jugueteId);
      if (resultado.tipo === "agregado") {
        guardarCarrito(resultado.carrito);
        const cantidad = resultado.carrito.items.find((item) => item.jugueteId === jugueteId)?.cantidad ?? 1;
        setAviso({
          tipo: "exito",
          texto: cantidad === 1 ? "Agregado a tu carrito" : `Agregado: tienes ${cantidad} en tu carrito`,
        });
      } else if (resultado.tipo === "sin-stock") {
        setAviso({ tipo: "error", texto: resultado.mensaje });
      } else if (resultado.tipo === "no-disponible") {
        setAviso({ tipo: "error", texto: "Este juguete ya no está disponible" });
      } else {
        // La API ya no acepta el token: se cierra la sesión y se pide iniciarla otra vez.
        borrarSesion();
        irAIniciarSesion();
      }
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectar con la tienda. Inténtalo de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={agregar}
        disabled={enviando}
        className="h-10 rounded-full bg-amber-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Agregando…" : "Agregar al carrito"}
      </button>
      {/* aria-live: el lector de pantalla anuncia el resultado sin mover el foco. */}
      <p aria-live="polite" className={`min-h-5 text-center text-sm font-medium ${aviso ? COLOR_AVISO[aviso.tipo] : ""}`}>
        {aviso?.texto}
      </p>
    </div>
  );
}
