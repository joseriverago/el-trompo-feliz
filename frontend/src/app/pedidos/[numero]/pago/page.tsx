import type { Metadata } from "next";
import { PasosCompra } from "@/components/pasos-compra";
import { VistaPago } from "@/components/vista-pago";

export const metadata: Metadata = {
  title: "Pago del pedido · El Trompo Feliz",
};

export default async function PaginaPago(props: PageProps<"/pedidos/[numero]/pago">) {
  const { numero } = await props.params;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <PasosCompra actual="Pago" />
      <h1 className="mt-5 text-3xl font-bold tracking-tight">Pago del pedido</h1>
      {/* key: al pasar a otro pedido, la página empieza de nuevo en «Cargando». */}
      <VistaPago key={numero} numero={decodeURIComponent(numero)} />
    </main>
  );
}
