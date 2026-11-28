"use client";

import { useEffect, useState, type FormEvent } from "react";
import { clasesCampo } from "@/components/campo-formulario";
import { obtenerCategorias, type Categoria } from "@/lib/categorias";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { RANGOS_EDAD, validarPrecios, type ErroresPrecio, type FiltrosCatalogo } from "@/lib/filtros-catalogo";

const VACIOS = { nombre: "", categoriaId: "", edad: "", precioMin: "", precioMax: "" };

const CAMPO = "flex flex-col gap-1 text-sm font-medium";

/**
 * Búsqueda por nombre (HU-16) y filtros por categoría, edad y precio (HU-17). Todo se aplica a la
 * vez; «Limpiar filtros» vuelve al catálogo completo.
 */
export function BuscadorCatalogo({ onBuscar }: { onBuscar: (filtros: FiltrosCatalogo) => void }) {
  const [valores, setValores] = useState(VACIOS);
  const [errores, setErrores] = useState<ErroresPrecio>({});
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const controlador = new AbortController();
    // Si las categorías no cargan, se puede seguir buscando por los demás campos.
    obtenerCategorias(controlador.signal)
      .then(setCategorias)
      .catch(() => {});
    return () => controlador.abort();
  }, []);

  function cambiar(campo: keyof typeof VACIOS, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    if (campo === "precioMin" || campo === "precioMax") setErrores({});
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const { errores: nuevos, precioMin, precioMax } = validarPrecios(valores.precioMin, valores.precioMax);
    setErrores(nuevos);
    const primero = nuevos.precioMin ? "precioMin" : nuevos.precioMax ? "precioMax" : null;
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }
    onBuscar({ nombre: valores.nombre, categoriaId: valores.categoriaId, edad: valores.edad, precioMin, precioMax });
  }

  function limpiar() {
    setValores(VACIOS);
    setErrores({});
    onBuscar({});
  }

  const precio = (campo: "precioMin" | "precioMax", etiqueta: string) => (
    <label className={CAMPO}>
      {etiqueta}
      <input
        id={campo}
        inputMode="decimal"
        value={valores[campo]}
        onChange={(evento) => cambiar(campo, evento.target.value)}
        aria-invalid={errores[campo] ? true : undefined}
        aria-describedby={errores[campo] ? `${campo}-error` : undefined}
        className={`h-11 w-32 ${clasesCampo(errores[campo])}`}
      />
    </label>
  );

  return (
    <form role="search" noValidate onSubmit={enviar} className="mt-6 flex flex-col gap-4">
      <div className="flex max-w-xl gap-2">
        <label htmlFor="busqueda" className="sr-only">
          Buscar juguetes por nombre
        </label>
        <input
          id="busqueda"
          type="search"
          value={valores.nombre}
          maxLength={120}
          placeholder="Buscar por nombre, por ejemplo «peluche»"
          onChange={(evento) => cambiar("nombre", evento.target.value)}
          className={`h-11 min-w-0 flex-1 ${clasesCampo(undefined)}`}
        />
        <button type="submit" className={BOTON_PRINCIPAL}>
          Buscar
        </button>
      </div>

      <fieldset className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Filtros del catálogo</legend>
        <label className={CAMPO}>
          Categoría
          <select
            value={valores.categoriaId}
            onChange={(evento) => cambiar("categoriaId", evento.target.value)}
            className={`h-11 ${clasesCampo(undefined)}`}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={CAMPO}>
          Edad
          <select
            value={valores.edad}
            onChange={(evento) => cambiar("edad", evento.target.value)}
            className={`h-11 ${clasesCampo(undefined)}`}
          >
            <option value="">Todas</option>
            {RANGOS_EDAD.map((rango) => (
              <option key={rango.valor} value={rango.valor}>
                {rango.nombre}
              </option>
            ))}
          </select>
        </label>
        {precio("precioMin", "Precio mínimo (S/)")}
        {precio("precioMax", "Precio máximo (S/)")}
        <button type="submit" className={`h-11 ${BOTON_PRINCIPAL}`}>
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={limpiar}
          className="h-11 rounded-full border border-zinc-300 px-5 text-sm font-semibold transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Limpiar filtros
        </button>
      </fieldset>

      {(["precioMin", "precioMax"] as const).map(
        (campo) =>
          errores[campo] && (
            <p key={campo} id={`${campo}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errores[campo]}
            </p>
          ),
      )}
    </form>
  );
}
