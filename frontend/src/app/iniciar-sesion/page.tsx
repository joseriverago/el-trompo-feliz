import type { Metadata } from "next";
import { FormularioInicioSesion } from "@/components/formulario-inicio-sesion";
import { PARAMETRO_VOLVER, rutaDeVuelta } from "@/lib/rutas";

export const metadata: Metadata = {
  title: "Iniciar sesión · El Trompo Feliz",
};

export default async function IniciarSesion(props: PageProps<"/iniciar-sesion">) {
  const destino = rutaDeVuelta((await props.searchParams)[PARAMETRO_VOLVER]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Entra con tu correo y tu contraseña para usar tu carrito y ver tus pedidos.
      </p>
      {destino !== "/" && (
        // Llegó aquí desde una acción que necesita sesión, como «Agregar al carrito» (HU-05).
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          Inicia sesión para continuar. Después te llevamos de vuelta a donde estabas.
        </p>
      )}
      <FormularioInicioSesion destino={destino} />
    </main>
  );
}
