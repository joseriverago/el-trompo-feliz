import type { Metadata } from "next";
import { PasosCompra } from "@/components/pasos-compra";
import { VistaComprar } from "@/components/vista-comprar";

export const metadata: Metadata = {
  title: "Comprar · El Trompo Feliz",
};

export default function PaginaComprar() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <PasosCompra actual="Entrega" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight">Comprar</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Dinos a quién y dónde entregamos tu pedido. Después pasas al pago.
      </p>
      <VistaComprar />
    </main>
  );
}
