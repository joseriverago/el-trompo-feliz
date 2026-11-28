"use client";

import { useState } from "react";
import { MENSAJE_SIN_ACCESO } from "@/lib/admin-juguetes";
import { cambiarEstadoPedido, SIGUIENTE_ESTADO, type PedidoAdmin } from "@/lib/admin-pedidos";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { NOMBRE_ESTADO } from "@/lib/pedidos";
import { borrarSesion } from "@/lib/sesion";

interface Props {
  token: string;
  pedido: PedidoAdmin;
  onCambiado: (pedido: PedidoAdmin) => void;
  /** Vuelve a leer el pedido cuando la API dice que ya cambió. */
  onDesactualizado: () => void;
  aviso: AvisoEstado | null;
  onAviso: (aviso: AvisoEstado | null) => void;
}

export interface AvisoEstado {
  tipo: "listo" | "error";
  texto: string;
}

/**
 * Acciones del pedido en administración (HU-15): un solo botón con el paso que sigue (Pagado →
 * Enviado → Entregado). Un pedido Pendiente espera el pago y uno Entregado ya no cambia.
 */
export function AccionesPedido({ token, pedido, onCambiado, onDesactualizado, aviso, onAviso }: Props) {
  const [guardando, setGuardando] = useState(false);
  const siguiente = SIGUIENTE_ESTADO[pedido.estado];

  async function avanzar() {
    if (!siguiente) return;
    setGuardando(true);
    onAviso(null);
    try {
      const resultado = await cambiarEstadoPedido(token, pedido.numero, siguiente);
      if (resultado.tipo === "listo") {
        onCambiado(resultado.pedido);
        onAviso({ tipo: "listo", texto: `Pedido marcado como ${NOMBRE_ESTADO[resultado.pedido.estado]}.` });
      } else if (resultado.tipo === "no-permitido") {
        onAviso({ tipo: "error", texto: resultado.mensaje });
        onDesactualizado();
      } else if (resultado.tipo === "no-encontrado") {
        onDesactualizado();
      } else if (resultado.tipo === "sin-permiso") {
        onAviso({ tipo: "error", texto: MENSAJE_SIN_ACCESO });
      } else {
        borrarSesion();
      }
    } catch {
      onAviso({ tipo: "error", texto: "No pudimos conectar con la tienda. Inténtalo de nuevo." });
    }
    setGuardando(false);
  }

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <h2 className="font-semibold">Estado del pedido</h2>
      {aviso && (
        <p
          role={aviso.tipo === "listo" ? "status" : "alert"}
          className={`mt-2 text-sm font-medium ${
            aviso.tipo === "listo" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {aviso.texto}
        </p>
      )}
      {siguiente ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            El siguiente paso es {NOMBRE_ESTADO[siguiente]}. El cliente lo verá en «Mis pedidos».
          </p>
          <button type="button" onClick={avanzar} disabled={guardando} className={BOTON_PRINCIPAL}>
            {guardando ? "Guardando…" : `Marcar como ${NOMBRE_ESTADO[siguiente]}`}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {pedido.estado === "PENDIENTE"
            ? "Espera el pago del cliente. Cuando esté Pagado podrás marcarlo como Enviado."
            : "El pedido está Entregado: ya no cambia de estado."}
        </p>
      )}
    </div>
  );
}
