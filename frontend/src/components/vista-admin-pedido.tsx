"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccionesPedido, type AvisoEstado } from "@/components/acciones-pedido";
import { DatosPedido } from "@/components/datos-pedido";
import { MENSAJE_SIN_ACCESO } from "@/lib/admin-juguetes";
import { obtenerPedidoAdmin, type LecturaPedidoAdmin } from "@/lib/admin-pedidos";
import { BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { formatearFechaPedido } from "@/lib/pedidos";
import { borrarSesion, useSesion } from "@/lib/sesion";

/**
 * Detalle de un pedido para el administrador: juguetes, total y entrega (HU-14, criterio 3) y
 * el botón para avanzar su estado (HU-15).
 */
export function VistaAdminPedido({ numero }: { numero: string }) {
  const token = useSesion()?.token;
  const [lectura, setLectura] = useState<LecturaPedidoAdmin | "fallo" | null>(null);
  const [intento, setIntento] = useState(0);
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);

  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    obtenerPedidoAdmin(token, numero, controlador.signal)
      .then((leida) => {
        if (leida.tipo === "sesion-vencida") borrarSesion();
        else setLectura(leida);
      })
      .catch(() => {
        if (!controlador.signal.aborted) setLectura("fallo");
      });
    return () => controlador.abort();
  }, [token, numero, intento]);

  return (
    <section className="mt-6 max-w-3xl">
      <p>
        <Link href="/admin/pedidos" className={ENLACE}>
          ← Volver a los pedidos
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Detalle del pedido</h1>

      {lectura === null && (
        <div aria-busy="true" className="mt-6 flex flex-col gap-4">
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            Cargando el pedido…
          </p>
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      )}

      {lectura === "fallo" && (
        <div role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium">La tienda no responde en este momento.</p>
          <button
            type="button"
            onClick={() => {
              setLectura(null);
              setIntento((anterior) => anterior + 1);
            }}
            className={BOTON_PRINCIPAL}
          >
            Reintentar
          </button>
        </div>
      )}

      {lectura !== null && lectura !== "fallo" && lectura.tipo === "no-encontrado" && (
        <p className="mt-12 text-center text-xl font-semibold">Pedido no encontrado</p>
      )}
      {lectura !== null && lectura !== "fallo" && lectura.tipo === "sin-permiso" && (
        <p role="alert" className="mt-12 text-center text-lg font-medium">
          {MENSAJE_SIN_ACCESO}
        </p>
      )}

      {lectura !== null && lectura !== "fallo" && lectura.tipo === "listo" && (
        <>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Pedido de <strong className="text-zinc-900 dark:text-zinc-100">{lectura.pedido.cliente}</strong>, hecho el{" "}
            <time dateTime={lectura.pedido.creadoEn}>{formatearFechaPedido(lectura.pedido.creadoEn)}</time>
          </p>
          <DatosPedido pedido={lectura.pedido} />
          {token && (
            <AccionesPedido
              token={token}
              pedido={lectura.pedido}
              aviso={aviso}
              onAviso={setAviso}
              onCambiado={(pedido) => setLectura({ tipo: "listo", pedido })}
              onDesactualizado={() => setIntento((anterior) => anterior + 1)}
            />
          )}
        </>
      )}
    </section>
  );
}
