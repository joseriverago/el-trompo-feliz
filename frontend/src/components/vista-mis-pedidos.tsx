"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import { formatearFechaPedido, listarMisPedidos, type PedidoResumen } from "@/lib/pedidos";
import { borrarSesion } from "@/lib/sesion";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";

function FilaPedido({ pedido }: { pedido: PedidoResumen }) {
  const unidades = pedido.unidades === 1 ? "1 juguete" : `${pedido.unidades} juguetes`;
  return (
    <li>
      {/* HU-11: toda la fila lleva al detalle del pedido. */}
      <Link
        href={`/pedidos/${encodeURIComponent(pedido.numero)}`}
        className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 rounded-xl px-2 py-4 transition-colors hover:bg-amber-50 sm:grid-cols-[auto_1fr_auto_7rem_auto] dark:hover:bg-zinc-900"
      >
        <span className="font-mono font-semibold">{pedido.numero}</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          <time dateTime={pedido.creadoEn} className="block">
            {formatearFechaPedido(pedido.creadoEn)}
          </time>
          {unidades}
        </span>
        <span className="font-semibold tabular-nums sm:text-right">{formatearPrecio(pedido.total)}</span>
        <span className="justify-self-end">
          <EtiquetaEstado estado={pedido.estado} />
        </span>
        <span aria-hidden="true" className="hidden text-zinc-400 sm:block">
          ›
        </span>
      </Link>
    </li>
  );
}

/**
 * «Mis pedidos» (HU-10): los pedidos del cliente con su número, fecha, total y estado, del más
 * reciente al más antiguo; cada uno lleva a su detalle (HU-11). La API solo devuelve los del cliente del token. Sin pedidos, muestra
 * «Todavía no tienes pedidos» y un enlace al catálogo.
 */
export function VistaMisPedidos() {
  const sesion = useSesionObligatoria("/pedidos");
  const token = sesion?.token;
  const [pedidos, setPedidos] = useState<PedidoResumen[] | "fallo" | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    listarMisPedidos(token, controlador.signal)
      .then((lectura) => {
        if (lectura.tipo === "sesion-vencida") borrarSesion();
        else setPedidos(lectura.pedidos);
      })
      .catch(() => {
        if (!controlador.signal.aborted) setPedidos("fallo");
      });
    return () => controlador.abort();
  }, [token, intento]);

  if (!token || pedidos === null) {
    return (
      <div aria-busy="true" className="mt-8 flex flex-col gap-4">
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Cargando tus pedidos…
        </p>
        {[0, 1, 2].map((fila) => (
          <div key={fila} className="h-14 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (pedidos === "fallo") {
    return (
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
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
        <p className="text-xl font-semibold">Todavía no tienes pedidos</p>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Cuando compres, aquí verás cada pedido con su estado.
        </p>
        <Link href="/" className={BOTON_PRINCIPAL}>
          Ver el catálogo
        </Link>
      </div>
    );
  }

  const cantidad = pedidos.length === 1 ? "1 pedido" : `${pedidos.length} pedidos`;
  return (
    <section>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{cantidad}, del más reciente al más antiguo.</p>
      <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {pedidos.map((pedido) => (
          <FilaPedido key={pedido.numero} pedido={pedido} />
        ))}
      </ul>
    </section>
  );
}
