"use client";

import { useState, type FormEvent } from "react";
import { clasesCampo } from "@/components/campo-formulario";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import type { FiltrosCatalogo } from "@/lib/juguetes";

/** Búsqueda del catálogo por nombre (HU-16). Buscar con el campo vacío muestra todo. */
export function BuscadorCatalogo({ onBuscar }: { onBuscar: (filtros: FiltrosCatalogo) => void }) {
  const [nombre, setNombre] = useState("");

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onBuscar({ nombre });
  }

  return (
    <form role="search" noValidate onSubmit={enviar} className="mt-6 flex max-w-xl gap-2">
      <label htmlFor="busqueda" className="sr-only">
        Buscar juguetes por nombre
      </label>
      <input
        id="busqueda"
        type="search"
        value={nombre}
        maxLength={120}
        placeholder="Buscar por nombre, por ejemplo «peluche»"
        onChange={(evento) => setNombre(evento.target.value)}
        className={`h-11 min-w-0 flex-1 ${clasesCampo(undefined)}`}
      />
      <button type="submit" className={BOTON_PRINCIPAL}>
        Buscar
      </button>
    </form>
  );
}
