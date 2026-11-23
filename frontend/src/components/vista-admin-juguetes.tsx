"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { formatearPrecio, obtenerCatalogo, type JugueteCatalogo } from "@/lib/juguetes";

interface Props {
  /** Id del juguete recién registrado o editado: se resalta y se avisa «Juguete guardado». */
  guardadoId?: number;
}

/**
 * «Administración > Juguetes» (HU-12, criterio 1): la lista de juguetes con su nombre, categoría,
 * precio y stock, el botón «Nuevo juguete» y «Editar» en cada uno. Usa la ruta pública del catálogo,
 * que solo devuelve los juguetes activos.
 */
export function VistaAdminJuguetes({ guardadoId }: Props) {
  const [juguetes, setJuguetes] = useState<JugueteCatalogo[] | "fallo" | null>(null);
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

  const guardado = Array.isArray(juguetes) ? juguetes.find((juguete) => juguete.id === guardadoId) : undefined;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Juguetes</h1>
          {Array.isArray(juguetes) && (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {juguetes.length === 1 ? "1 juguete a la venta" : `${juguetes.length} juguetes a la venta`}, por nombre.
            </p>
          )}
        </div>
        <Link href="/admin/juguetes/nuevo" className={BOTON_PRINCIPAL}>
          Nuevo juguete
        </Link>
      </div>

      {guardado && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
        >
          <strong>Juguete guardado:</strong> {guardado.nombre}.{" "}
          <Link href={`/juguetes/${guardado.id}`} className="font-semibold underline">
            Verlo en el catálogo
          </Link>
        </p>
      )}

      {juguetes === null && (
        <div aria-busy="true" className="mt-6 flex flex-col gap-3">
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            Cargando los juguetes…
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

      {Array.isArray(juguetes) && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-3 pr-4 font-semibold">Juguete</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Categoría</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Precio</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Stock</th>
                <th scope="col" className="py-3 text-right font-semibold">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {juguetes.map((juguete) => (
                <tr key={juguete.id} className={juguete.id === guardadoId ? "bg-green-50 dark:bg-green-950/40" : undefined}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={juguete.imagenUrl}
                        alt=""
                        loading="lazy"
                        className="h-10 w-14 shrink-0 rounded-md bg-zinc-100 object-cover dark:bg-zinc-800"
                      />
                      <span className="font-medium">{juguete.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{juguete.categoria.nombre}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatearPrecio(juguete.precio)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {juguete.agotado ? <span className="font-semibold text-red-600 dark:text-red-400">Agotado</span> : juguete.stock}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/juguetes/${juguete.id}`} className={ENLACE} aria-label={`Editar ${juguete.nombre}`}>
                      Editar
                    </Link>
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
