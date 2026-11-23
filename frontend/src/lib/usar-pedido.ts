import { useEffect, useState } from "react";
import { obtenerPedido, type LecturaPedido } from "@/lib/pedidos";
import { borrarSesion } from "@/lib/sesion";

/** null mientras carga; "fallo" si la API no responde. */
export type EstadoLectura = LecturaPedido | "fallo" | null;

/**
 * Lee un pedido del cliente con GET /pedidos/:numero, para la página de pago y el detalle.
 * Si la sesión venció, la borra: la página lleva entonces a iniciar sesión.
 * `releer` vuelve a pedirlo, por ejemplo después de «Reintentar».
 */
export function useLecturaPedido(token: string | undefined, numero: string) {
  const [lectura, setLectura] = useState<EstadoLectura>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    obtenerPedido(token, numero, controlador.signal)
      .then((leida) => {
        if (leida.tipo === "sesion-vencida") borrarSesion();
        else setLectura(leida);
      })
      .catch(() => {
        if (!controlador.signal.aborted) setLectura("fallo");
      });
    return () => controlador.abort();
  }, [token, numero, intento]);

  function releer() {
    setLectura(null);
    setIntento((anterior) => anterior + 1);
  }

  return { lectura, setLectura, releer };
}
