import { DetalleJuguete } from "@/components/detalle-juguete";

export default async function PaginaJuguete(props: PageProps<"/juguetes/[id]">) {
  const { id } = await props.params;
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      {/* key: al pasar de un juguete a otro, el detalle empieza de nuevo en «Cargando». */}
      <DetalleJuguete key={id} id={id} />
    </main>
  );
}
