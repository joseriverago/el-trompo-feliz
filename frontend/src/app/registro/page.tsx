import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/formulario-registro";

export const metadata: Metadata = {
  title: "Crear cuenta · El Trompo Feliz",
};

export default function Registro() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Regístrate para comprar juguetes y seguir tus pedidos.
      </p>
      <FormularioRegistro />
    </main>
  );
}
