"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CampoFormulario } from "@/components/campo-formulario";
import {
  iniciarSesion,
  validarInicioSesion,
  type DatosInicioSesion,
  type ErroresInicioSesion,
} from "@/lib/auth";
import { ENLACE } from "@/lib/estilos";
import { guardarSesion, useSesion } from "@/lib/sesion";

type Campo = keyof DatosInicioSesion;

const CAMPOS: { campo: Campo; etiqueta: string; tipo: string; autocompletar: string }[] = [
  { campo: "correo", etiqueta: "Correo", tipo: "email", autocompletar: "email" },
  { campo: "contrasena", etiqueta: "Contraseña", tipo: "password", autocompletar: "current-password" },
];

/**
 * Formulario de inicio de sesión (HU-04). Al entrar lleva a `destino`: la página desde la que
 * se pidió iniciar sesión (por ejemplo, el juguete que se quería agregar al carrito) o el catálogo.
 */
export function FormularioInicioSesion({ destino }: { destino: string }) {
  const router = useRouter();
  const sesion = useSesion();
  const [valores, setValores] = useState<DatosInicioSesion>({ correo: "", contrasena: "" });
  const [errores, setErrores] = useState<ErroresInicioSesion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [iniciada, setIniciada] = useState(false);
  const entradas = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({});

  function cambiar(campo: Campo, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  function mostrarErrores(nuevos: ErroresInicioSesion): boolean {
    setErrores(nuevos);
    const primero = CAMPOS.find(({ campo }) => nuevos[campo]);
    if (primero) entradas.current[primero.campo]?.focus();
    return Boolean(primero);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (mostrarErrores(validarInicioSesion(valores))) return;

    setEnviando(true);
    try {
      const resultado = await iniciarSesion(valores);
      if (resultado.ok) {
        setIniciada(true);
        guardarSesion(resultado.sesion);
        router.push(destino);
        return;
      }
      if (resultado.mensaje) {
        // Correo o contraseña incorrectos: se borra la contraseña para volver a escribirla.
        setErrorGeneral(resultado.mensaje);
        setValores((anteriores) => ({ ...anteriores, contrasena: "" }));
        entradas.current.contrasena?.focus();
      } else if (!mostrarErrores(resultado.errores)) {
        setErrorGeneral("No pudimos iniciar tu sesión. Revisa los datos e inténtalo de nuevo.");
      }
    } catch {
      setErrorGeneral("No pudimos conectar con la tienda. Inténtalo de nuevo en unos segundos.");
    } finally {
      setEnviando(false);
    }
  }

  if (iniciada) {
    return (
      <p role="status" className="mt-8 text-zinc-700 dark:text-zinc-300">
        ¡Sesión iniciada! {destino === "/" ? "Te llevamos al catálogo…" : "Te llevamos de vuelta…"}
      </p>
    );
  }

  if (sesion) {
    return (
      <p className="mt-8 text-zinc-700 dark:text-zinc-300">
        Ya tienes la sesión iniciada como <strong>{sesion.usuario.nombre}</strong>.{" "}
        <Link href="/" className={ENLACE}>
          Ir al catálogo
        </Link>
      </p>
    );
  }

  return (
    <>
      <form noValidate onSubmit={enviar} className="mt-8 flex flex-col gap-5">
        {CAMPOS.map(({ campo, etiqueta, tipo, autocompletar }) => (
          <CampoFormulario
            key={campo}
            campo={campo}
            etiqueta={etiqueta}
            tipo={tipo}
            autocompletar={autocompletar}
            valor={valores[campo]}
            error={errores[campo]}
            onCambio={(valor) => cambiar(campo, valor)}
            ref={(elemento) => {
              entradas.current[campo] = elemento;
            }}
          />
        ))}

        {errorGeneral && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {errorGeneral}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="h-11 rounded-full bg-amber-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70"
        >
          {enviando ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
        {enviando && (
          <p role="status" className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Si la tienda estuvo inactiva, puede tardar hasta un minuto.
          </p>
        )}
      </form>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes una cuenta?{" "}
        <Link href="/registro" className={ENLACE}>
          Crea una
        </Link>
      </p>
    </>
  );
}
