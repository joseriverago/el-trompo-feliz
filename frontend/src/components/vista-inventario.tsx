"use client";

import { useEffect, useState, type FormEvent } from "react";
import { clasesCampo } from "@/components/campo-formulario";
import {
  actualizarStock,
  MENSAJE_SIN_ACCESO,
  STOCK_BAJO,
  tieneStockBajo,
  validarStock,
} from "@/lib/admin-juguetes";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { obtenerCatalogo, type JugueteCatalogo } from "@/lib/juguetes";
import { borrarSesion, useSesion } from "@/lib/sesion";

interface PropsFila {
  token: string;
  juguete: JugueteCatalogo;
  onActualizado: (id: number, stock: number) => void;
  onEliminado: (id: number) => void;
}

/** Un juguete del inventario con su stock actual y el campo para la nueva cantidad. */
function FilaInventario({ token, juguete, onActualizado, onEliminado }: PropsFila) {
  const [valor, setValor] = useState(String(juguete.stock));
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<"guardando" | "guardado" | null>(null);
  const idCampo = `stock-${juguete.id}`;
  const bajo = tieneStockBajo(juguete.stock);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const mensaje = validarStock(valor);
    setError(mensaje);
    setEstado(null);
    if (mensaje) {
      document.getElementById(idCampo)?.focus();
      return;
    }
    setEstado("guardando");
    try {
      const resultado = await actualizarStock(token, juguete.id, Number(valor));
      if (resultado.tipo === "listo") {
        onActualizado(juguete.id, resultado.juguete.stock);
        setValor(String(resultado.juguete.stock));
        setEstado("guardado");
        return;
      }
      setEstado(null);
      if (resultado.tipo === "datos-invalidos") setError(resultado.mensaje);
      else if (resultado.tipo === "no-encontrado") onEliminado(juguete.id);
      else if (resultado.tipo === "sin-permiso") setError(MENSAJE_SIN_ACCESO);
      else borrarSesion();
    } catch {
      setEstado(null);
      setError("No pudimos conectar con la tienda. Inténtalo de nuevo.");
    }
  }

  return (
    <tr className={bajo ? "bg-amber-50 dark:bg-amber-950/30" : undefined}>
      <td className="py-3 pl-2 pr-4">
        <span className="font-medium">{juguete.nombre}</span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{juguete.categoria.nombre}</span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 text-right text-base font-semibold tabular-nums">{juguete.stock}</span>
          {bajo && (
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/25 dark:text-amber-200">
              Stock bajo
            </span>
          )}
          {juguete.stock === 0 && (
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">Agotado</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-2">
        <form noValidate onSubmit={guardar} className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <label htmlFor={idCampo} className="sr-only">
              Nueva cantidad de {juguete.nombre}
            </label>
            <input
              id={idCampo}
              inputMode="numeric"
              value={valor}
              onChange={(evento) => {
                setValor(evento.target.value);
                setError(null);
                setEstado(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error || estado === "guardado" ? `${idCampo}-mensaje` : undefined}
              className={`h-10 w-24 text-right tabular-nums ${clasesCampo(error ?? undefined)}`}
            />
            <button
              type="submit"
              disabled={estado === "guardando"}
              className="h-10 rounded-full bg-zinc-950 px-4 text-sm font-semibold text-amber-300 transition-colors hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              {estado === "guardando" ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {error ? (
            <p id={`${idCampo}-mensaje`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : estado === "guardado" ? (
            <p id={`${idCampo}-mensaje`} role="status" className="text-sm text-green-700 dark:text-green-400">
              Stock actualizado
            </p>
          ) : null}
        </form>
      </td>
    </tr>
  );
}

/**
 * «Administración > Inventario» (HU-13): cada juguete con su stock actual; los que tienen 5 unidades
 * o menos se resaltan como «Stock bajo». La nueva cantidad debe ser un entero de 0 o más; con 0 el
 * catálogo muestra el juguete «Agotado».
 */
export function VistaInventario() {
  const token = useSesion()?.token;
  const [juguetes, setJuguetes] = useState<JugueteCatalogo[] | "fallo" | null>(null);
  const [soloBajo, setSoloBajo] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerCatalogo(controlador.signal)
      .then(setJuguetes)
      .catch(() => {
        if (!controlador.signal.aborted) setJuguetes("fallo");
      });
    return () => controlador.abort();
  }, [intento]);

  function cambiarStock(id: number, stock: number) {
    setJuguetes((anteriores) =>
      Array.isArray(anteriores)
        ? anteriores.map((juguete) => (juguete.id === id ? { ...juguete, stock, agotado: stock <= 0 } : juguete))
        : anteriores,
    );
  }

  function quitar(id: number) {
    setJuguetes((anteriores) => (Array.isArray(anteriores) ? anteriores.filter((juguete) => juguete.id !== id) : anteriores));
  }

  const lista = Array.isArray(juguetes) ? juguetes : [];
  const conStockBajo = lista.filter((juguete) => tieneStockBajo(juguete.stock)).length;
  const visibles = soloBajo ? lista.filter((juguete) => tieneStockBajo(juguete.stock)) : lista;

  return (
    <section className="mt-6">
      <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
      {Array.isArray(juguetes) && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-zinc-600 dark:text-zinc-400">
            {lista.length === 1 ? "1 juguete" : `${lista.length} juguetes`};{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {conStockBajo === 1 ? "1 con stock bajo" : `${conStockBajo} con stock bajo`}
            </strong>{" "}
            ({STOCK_BAJO} unidades o menos).
          </p>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={soloBajo}
              onChange={(evento) => setSoloBajo(evento.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            Ver solo los de stock bajo
          </label>
        </div>
      )}

      {(juguetes === null || !token) && juguetes !== "fallo" && (
        <div aria-busy="true" className="mt-6 flex flex-col gap-3">
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            Cargando el inventario…
          </p>
          {[0, 1, 2, 3].map((fila) => (
            <div key={fila} className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}

      {juguetes === "fallo" && (
        <div role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium">La tienda no responde en este momento.</p>
          <button
            type="button"
            onClick={() => {
              setJuguetes(null);
              setIntento((anterior) => anterior + 1);
            }}
            className={BOTON_PRINCIPAL}
          >
            Reintentar
          </button>
        </div>
      )}

      {Array.isArray(juguetes) && token && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-3 pl-2 pr-4 font-semibold">Juguete</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Stock actual</th>
                <th scope="col" className="py-3 pr-2 text-right font-semibold">Nueva cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {visibles.map((juguete) => (
                <FilaInventario
                  key={juguete.id}
                  token={token}
                  juguete={juguete}
                  onActualizado={cambiarStock}
                  onEliminado={quitar}
                />
              ))}
            </tbody>
          </table>
          {visibles.length === 0 && (
            <p className="py-10 text-center text-zinc-600 dark:text-zinc-400">Ningún juguete tiene stock bajo.</p>
          )}
        </div>
      )}
    </section>
  );
}
