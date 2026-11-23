import { redirect } from "next/navigation";

/** «Administración» abre la primera sección: los juguetes. */
export default function PaginaAdministracion() {
  redirect("/admin/juguetes");
}
