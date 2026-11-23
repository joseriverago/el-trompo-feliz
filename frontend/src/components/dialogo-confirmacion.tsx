"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  titulo: string;
  children: ReactNode;
  textoConfirmar: string;
  /** Mientras espera la respuesta de la API, los botones se desactivan. */
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Mensaje de confirmación antes de una acción que no se deshace desde la tienda (por ejemplo,
 * eliminar un juguete). El foco empieza en «Cancelar» y Escape también cancela.
 */
export function DialogoConfirmacion({ titulo, children, textoConfirmar, ocupado, onConfirmar, onCancelar }: Props) {
  const cancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelar.current?.focus();
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !ocupado) onCancelar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCancelar, ocupado]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-texto"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h2 id="dialogo-titulo" className="text-lg font-semibold">
          {titulo}
        </h2>
        <div id="dialogo-texto" className="mt-2 text-zinc-600 dark:text-zinc-400">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelar}
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-70"
          >
            {ocupado ? "Eliminando…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
