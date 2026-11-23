import type { Metadata } from "next";
import { VistaMisPedidos } from "@/components/vista-mis-pedidos";

export const metadata: Metadata = {
  title: "Mis pedidos · El Trompo Feliz",
};

export default function PaginaMisPedidos() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Mis pedidos</h1>
      <VistaMisPedidos />
    </main>
  );
}
