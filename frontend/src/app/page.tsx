import { Catalogo } from "@/components/catalogo";

export default function Inicio() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Catálogo de juguetes</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Todos los juguetes de la tienda, con su precio y la edad recomendada.
      </p>
      <Catalogo />
    </main>
  );
}
