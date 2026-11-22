import type { Metadata } from "next";
import { VistaCarrito } from "@/components/vista-carrito";

export const metadata: Metadata = {
  title: "Tu carrito · El Trompo Feliz",
};

export default function PaginaCarrito() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Tu carrito</h1>
      <VistaCarrito />
    </main>
  );
}
