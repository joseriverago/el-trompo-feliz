"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CampoFormulario, clasesCampo } from "@/components/campo-formulario";
import {
  DATOS_VACIOS,
  datosDeJuguete,
  guardarJuguete,
  MENSAJE_SIN_ACCESO,
  validarJuguete,
  type DatosJuguete,
  type ErroresJuguete,
} from "@/lib/admin-juguetes";
import type { Categoria } from "@/lib/categorias";
import { BOTON_COMPRA, ENLACE } from "@/lib/estilos";
import type { JugueteDetalle } from "@/lib/juguetes";
import { borrarSesion } from "@/lib/sesion";

type Campo = keyof DatosJuguete;

/** Orden de los campos en pantalla: el foco va al primero que hay que corregir. */
const ORDEN: Campo[] = ["nombre", "descripcion", "precio", "categoriaId", "imagenUrl", "edadMinima", "edadMaxima", "stock"];

function Mensaje({ campo, error, ayuda }: { campo: Campo; error?: string; ayuda?: string }) {
  if (error)
    return (
      <p id={`${campo}-mensaje`} className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    );
  if (ayuda)
    return (
      <p id={`${campo}-mensaje`} className="text-sm text-zinc-500 dark:text-zinc-400">
        {ayuda}
      </p>
    );
  return null;
}

interface Props {
  token: string;
  categorias: Categoria[];
  /** Juguete a editar; sin él, el formulario registra uno nuevo con su stock inicial. */
  juguete?: JugueteDetalle;
  onGuardado: (juguete: JugueteDetalle) => void;
}

/**
 * Formulario para registrar o editar un juguete (HU-12, criterios 2 a 4). Valida antes de enviar;
 * con un dato inválido muestra el mensaje junto al campo, lleva el foco al primero y no llama a la API.
 */
export function FormularioJuguete({ token, categorias, juguete, onGuardado }: Props) {
  const nuevo = juguete === undefined;
  const [valores, setValores] = useState<DatosJuguete>(juguete ? datosDeJuguete(juguete) : DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresJuguete>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [imagenFallo, setImagenFallo] = useState(false);
  function cambiar(campo: Campo, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
    if (campo === "imagenUrl") setImagenFallo(false);
  }

  function mostrarErrores(nuevos: ErroresJuguete): boolean {
    setErrores(nuevos);
    const primero = ORDEN.find((campo) => nuevos[campo]);
    // Cada campo tiene como id el nombre del dato: «precio», «categoriaId»…
    if (primero) document.getElementById(primero)?.focus();
    return Boolean(primero);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (mostrarErrores(validarJuguete(valores, nuevo))) return;

    setEnviando(true);
    try {
      const resultado = await guardarJuguete(token, valores, juguete?.id);
      if (resultado.tipo === "listo") {
        onGuardado(resultado.juguete);
        return; // La página cambia: el botón sigue desactivado para no guardar dos veces.
      }
      if (resultado.tipo === "datos-invalidos") {
        if (!mostrarErrores(resultado.errores)) setErrorGeneral("Revisa los datos del juguete.");
      } else if (resultado.tipo === "no-encontrado") {
        setErrorGeneral("Este juguete ya no existe: otro administrador lo eliminó.");
      } else if (resultado.tipo === "sin-permiso") {
        setErrorGeneral(MENSAJE_SIN_ACCESO);
      } else {
        borrarSesion(); // 401: la zona de administración lleva a iniciar sesión.
      }
    } catch {
      setErrorGeneral("No pudimos conectar con la tienda. Inténtalo de nuevo en unos segundos.");
    }
    setEnviando(false);
  }

  const urlParaVista = valores.imagenUrl.trim();
  const mostrarVista = /^https?:\/\/\S+$/.test(urlParaVista) && !imagenFallo;

  return (
    <form noValidate onSubmit={enviar} className="mt-6 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <CampoFormulario
          campo="nombre"
          etiqueta="Nombre"
          tipo="text"
          autocompletar="off"
          largoMaximo={120}
          valor={valores.nombre}
          error={errores.nombre}
          onCambio={(valor) => cambiar("nombre", valor)}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          maxLength={1000}
          value={valores.descripcion}
          onChange={(evento) => cambiar("descripcion", evento.target.value)}
          aria-invalid={errores.descripcion ? true : undefined}
          aria-describedby="descripcion-mensaje"
          className={`py-2 ${clasesCampo(errores.descripcion)}`}
        />
        <Mensaje campo="descripcion" error={errores.descripcion} ayuda="Qué es, de qué material y cómo se juega." />
      </div>

      <CampoFormulario
        campo="precio"
        etiqueta="Precio (S/)"
        tipo="text"
        autocompletar="off"
        modoTeclado="decimal"
        marcador="39.90"
        valor={valores.precio}
        error={errores.precio}
        ayuda="Mayor que 0, con hasta 2 decimales."
        onCambio={(valor) => cambiar("precio", valor)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoriaId" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoriaId"
          name="categoriaId"
          value={valores.categoriaId}
          onChange={(evento) => cambiar("categoriaId", evento.target.value)}
          aria-invalid={errores.categoriaId ? true : undefined}
          aria-describedby={errores.categoriaId ? "categoriaId-mensaje" : undefined}
          className={`h-11 ${clasesCampo(errores.categoriaId)}`}
        >
          <option value="">Elige una categoría</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
        <Mensaje campo="categoriaId" error={errores.categoriaId} />
      </div>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <CampoFormulario
            campo="imagenUrl"
            etiqueta="Imagen (URL)"
            tipo="url"
            autocompletar="off"
            largoMaximo={500}
            marcador="https://sitio.com/foto.jpg"
            valor={valores.imagenUrl}
            error={errores.imagenUrl}
            ayuda="Dirección de una foto publicada en internet."
            onCambio={(valor) => cambiar("imagenUrl", valor)}
          />
        </div>
        <div className="flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-center text-xs text-zinc-500 sm:mt-7 dark:border-zinc-700 dark:bg-zinc-900">
          {mostrarVista ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlParaVista}
              alt="Vista previa de la imagen"
              className="h-full w-full object-cover"
              onError={() => setImagenFallo(true)}
            />
          ) : (
            <span className="px-2">{imagenFallo ? "No se pudo cargar la imagen" : "Vista previa"}</span>
          )}
        </div>
      </div>

      <CampoFormulario
        campo="edadMinima"
        etiqueta="Edad mínima (años)"
        tipo="text"
        autocompletar="off"
        modoTeclado="numeric"
        valor={valores.edadMinima}
        error={errores.edadMinima}
        onCambio={(valor) => cambiar("edadMinima", valor)}
      />
      <CampoFormulario
        campo="edadMaxima"
        etiqueta="Edad máxima (años)"
        tipo="text"
        autocompletar="off"
        modoTeclado="numeric"
        valor={valores.edadMaxima}
        error={errores.edadMaxima}
        ayuda="Escribe 99 si no tiene límite."
        onCambio={(valor) => cambiar("edadMaxima", valor)}
      />

      {nuevo ? (
        <CampoFormulario
          campo="stock"
          etiqueta="Stock inicial (unidades)"
          tipo="text"
          autocompletar="off"
          modoTeclado="numeric"
          valor={valores.stock}
          error={errores.stock}
          ayuda="Entero de 0 o más. Con 0, el juguete aparece como «Agotado»."
          onCambio={(valor) => cambiar("stock", valor)}
        />
      ) : (
        <p className="self-end rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700 sm:col-span-2 dark:bg-zinc-800 dark:text-zinc-300">
          Stock actual: <strong>{juguete.stock === 1 ? "1 unidad" : `${juguete.stock} unidades`}</strong>. El stock no se
          cambia aquí, para no pisar las ventas que ocurran mientras editas: se actualiza en el{" "}
          <Link href="/admin/inventario" className={ENLACE}>
            inventario
          </Link>
          .
        </p>
      )}

      {errorGeneral && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2 dark:bg-red-950 dark:text-red-300"
        >
          {errorGeneral}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        <button type="submit" disabled={enviando} className={BOTON_COMPRA}>
          {enviando ? "Guardando…" : nuevo ? "Registrar juguete" : "Guardar cambios"}
        </button>
        <Link href="/admin/juguetes" className={ENLACE}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
