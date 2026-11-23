import type { Metadata } from "next";
import { VistaFormularioJuguete } from "@/components/vista-formulario-juguete";

export const metadata: Metadata = {
  title: "Editar juguete · Administración · El Trompo Feliz",
};

export default async function PaginaEditarJuguete(props: PageProps<"/admin/juguetes/[id]">) {
  const { id } = await props.params;
  return <VistaFormularioJuguete key={id} id={id} />;
}
