import type { Metadata } from "next";
import { VistaInventario } from "@/components/vista-inventario";

export const metadata: Metadata = {
  title: "Inventario · Administración · El Trompo Feliz",
};

export default function PaginaInventario() {
  return <VistaInventario />;
}
