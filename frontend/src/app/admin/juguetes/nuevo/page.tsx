import type { Metadata } from "next";
import { VistaFormularioJuguete } from "@/components/vista-formulario-juguete";

export const metadata: Metadata = {
  title: "Nuevo juguete · Administración · El Trompo Feliz",
};

export default function PaginaNuevoJuguete() {
  return <VistaFormularioJuguete />;
}
