import type { Metadata } from "next";
import { VistaAdminPedidos } from "@/components/vista-admin-pedidos";

export const metadata: Metadata = {
  title: "Pedidos · Administración · El Trompo Feliz",
};

export default function PaginaAdminPedidos() {
  return <VistaAdminPedidos />;
}
