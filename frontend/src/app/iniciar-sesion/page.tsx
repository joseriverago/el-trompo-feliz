import type { Metadata } from "next";
import { FormularioInicioSesion } from "@/components/formulario-inicio-sesion";

export const metadata: Metadata = {
  title: "Iniciar sesión · El Trompo Feliz",
};

export default function IniciarSesion() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Entra con tu correo y tu contraseña para usar tu carrito y ver tus pedidos.
      </p>
      <FormularioInicioSesion />
    </main>
  );
}
