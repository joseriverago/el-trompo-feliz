"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clasesCampo } from "@/components/campo-formulario";
import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { MENSAJE_SIN_ACCESO } from "@/lib/admin-juguetes";
import { listarPedidosAdmin, type PedidoAdminResumen } from "@/lib/admin-pedidos";
import { BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import { formatearFechaPedido, NOMBRE_ESTADO, type EstadoPedido } from "@/lib/pedidos";
import { borrarSesion, useSesion } from "@/lib/sesion";

const ESTADOS = Object.keys(NOMBRE_ESTADO) as EstadoPedido[];

/**
 * «Administración > Pedidos» (HU-14): todos los pedidos con número, cliente, fecha, total y
 * estado, del más reciente al más antiguo, y un filtro por estado.
 */
export function VistaAdminPedidos() {
  const token = useSesion()?.token;
  const [estado, setEstado] = useState<EstadoPedido | "">("");
  const [pedidos, setPedidos] = useState<PedidoAdminResumen[] | "fallo" | "sin-permiso" | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    listarPedidosAdmin(token, estado, controlador.signal)
      .then((lectura) => {
        if (lectura.tipo === "sesion-vencida") borrarSesion();
        else setPedidos(lectura.tipo === "listo" ? lectura.pedidos : "sin-permiso");
      })
      .catch(() => {
        if (!controlador.signal.aborted) setPedidos("fallo");
      });
    return () => controlador.abort();
  }, [token, estado, intento]);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {Array.isArray(pedidos)
              ? `${pedidos.length === 1 ? "1 pedido" : `${pedidos.length} pedidos`}, del más reciente al más antiguo.`
              : "Del más reciente al más antiguo."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          Estado
          <select
            value={estado}
            onChange={(evento) => {
              setPedidos(null);
              setEstado(evento.target.value as EstadoPedido | "");
            }}
            className={`h-10 ${clasesCampo(undefined)}`}
          >
            <option value="">Todos</option>
            {ESTADOS.map((opcion) => (
              <option key={opcion} value={opcion}>
                {NOMBRE_ESTADO[opcion]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pedidos === null && (
        <div aria-busy="true" className="mt-6 flex flex-col gap-3">
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            Cargando los pedidos…
          </p>
          {[0, 1, 2].map((fila) => (
            <div key={fila} className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}

      {pedidos === "sin-permiso" && (
        <p role="alert" className="mt-8 text-center text-lg font-medium">
          {MENSAJE_SIN_ACCESO}
        </p>
      )}

      {pedidos === "fallo" && (
        <div role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium">La tienda no responde en este momento.</p>
          <button
            type="button"
            onClick={() => {
              setPedidos(null);
              setIntento((anterior) => anterior + 1);
            }}
            className={BOTON_PRINCIPAL}
          >
            Reintentar
          </button>
        </div>
      )}

      {Array.isArray(pedidos) && pedidos.length === 0 && (
        <p className="mt-8 py-10 text-center text-zinc-600 dark:text-zinc-400">
          {estado ? `No hay pedidos en estado ${NOMBRE_ESTADO[estado]}.` : "Todavía no hay pedidos."}
        </p>
      )}

      {Array.isArray(pedidos) && pedidos.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-3 pr-4 font-semibold">Número</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Cliente</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Fecha</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Total</th>
                <th scope="col" className="py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {pedidos.map((pedido) => (
                <tr key={pedido.numero}>
                  <td className="py-3 pr-4 font-mono font-semibold">
                    <Link href={`/admin/pedidos/${encodeURIComponent(pedido.numero)}`} className={ENLACE}>
                      {pedido.numero}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{pedido.cliente}</td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                    <time dateTime={pedido.creadoEn}>{formatearFechaPedido(pedido.creadoEn)}</time>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatearPrecio(pedido.total)}</td>
                  <td className="py-3">
                    <EtiquetaEstado estado={pedido.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
