import type { Metadata } from "next";
import { VistaDetallePedido } from "@/components/vista-detalle-pedido";

export const metadata: Metadata = {
  title: "Detalle del pedido · El Trompo Feliz",
};

export default async function PaginaDetallePedido(props: PageProps<"/pedidos/[numero]">) {
  const { numero } = await props.params;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Detalle del pedido</h1>
      {/* key: al pasar a otro pedido, la página empieza de nuevo en «Cargando». */}
      <VistaDetallePedido key={numero} numero={decodeURIComponent(numero)} />
    </main>
  );
}
