import type { Metadata } from "next";
import { VistaAdminPedido } from "@/components/vista-admin-pedido";

export const metadata: Metadata = {
  title: "Detalle del pedido · Administración · El Trompo Feliz",
};

export default async function PaginaAdminPedido(props: PageProps<"/admin/pedidos/[numero]">) {
  const { numero } = await props.params;
  return <VistaAdminPedido key={numero} numero={decodeURIComponent(numero)} />;
}
