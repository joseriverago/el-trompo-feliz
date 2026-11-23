import type { Metadata } from "next";
import { VistaAdminJuguetes } from "@/components/vista-admin-juguetes";

export const metadata: Metadata = {
  title: "Juguetes · Administración · El Trompo Feliz",
};

export default async function PaginaAdminJuguetes(props: PageProps<"/admin/juguetes">) {
  const { guardado } = await props.searchParams;
  const guardadoId = Number(Array.isArray(guardado) ? guardado[0] : guardado);
  return <VistaAdminJuguetes guardadoId={Number.isInteger(guardadoId) ? guardadoId : undefined} />;
}
