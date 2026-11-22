"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BotonAgregarCarrito } from "@/components/boton-agregar-carrito";
import {
  formatearEdad,
  formatearPrecio,
  obtenerJuguete,
  type JugueteDetalle,
} from "@/lib/juguetes";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "listo"; juguete: JugueteDetalle }
  | { tipo: "no-encontrado" }
  | { tipo: "error" };

const BOTON_PRINCIPAL =
  "rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400";

function VolverAlCatalogo() {
  return (
    <Link href="/" className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
      ← Volver al catálogo
    </Link>
  );
}

function mayusculaInicial(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Página de detalle de un juguete. Se carga en el navegador, igual que el catálogo. */
export function DetalleJuguete({ id }: { id: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerJuguete(id, controlador.signal)
      .then((juguete) =>
        setEstado(juguete ? { tipo: "listo", juguete } : { tipo: "no-encontrado" }),
      )
      .catch(() => {
        if (!controlador.signal.aborted) setEstado({ tipo: "error" });
      });
    return () => controlador.abort();
  }, [id, intento]);

  function reintentar() {
    setEstado({ tipo: "cargando" });
    setIntento((anterior) => anterior + 1);
  }

  if (estado.tipo === "cargando") {
    return (
      <section aria-busy="true">
        <VolverAlCatalogo />
        <p role="status" className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Cargando juguete… Si la tienda estuvo inactiva, la primera carga puede tardar hasta un minuto.
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="aspect-[3/2] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (estado.tipo === "error") {
    return (
      <section>
        <VolverAlCatalogo />
        <div role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium">La tienda no responde en este momento.</p>
          <button type="button" onClick={reintentar} className={BOTON_PRINCIPAL}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (estado.tipo === "no-encontrado") {
    return (
      <section className="mt-16 flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Juguete no encontrado</h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Puede que la dirección esté mal escrita o que el juguete ya no se venda en la tienda.
        </p>
        <Link href="/" className={BOTON_PRINCIPAL}>
          Volver al catálogo
        </Link>
      </section>
    );
  }

  const { juguete } = estado;
  return (
    <article>
      <VolverAlCatalogo />
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {/* <img> y no next/image: el administrador puede registrar imágenes de cualquier sitio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={juguete.imagenUrl}
            alt={juguete.nombre}
            className={`h-full w-full object-cover ${juguete.agotado ? "opacity-60 grayscale" : ""}`}
          />
          {juguete.agotado && (
            <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white">
              Agotado
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              {juguete.categoria.nombre}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{juguete.nombre}</h1>
          </div>
          <p className="text-3xl font-bold">{formatearPrecio(juguete.precio)}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Edad recomendada</dt>
            <dd className="font-medium">
              {mayusculaInicial(formatearEdad(juguete.edadMinima, juguete.edadMaxima))}
            </dd>
            <dt className="text-zinc-500 dark:text-zinc-400">Unidades disponibles</dt>
            <dd className="font-medium">{juguete.stock}</dd>
          </dl>
          {juguete.agotado ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
              Agotado: por ahora no hay unidades de este juguete.
            </p>
          ) : (
            <BotonAgregarCarrito jugueteId={juguete.id} className="w-full sm:w-72 sm:self-start" />
          )}
          <div>
            <h2 className="text-lg font-semibold">Descripción</h2>
            <p className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
              {juguete.descripcion}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
