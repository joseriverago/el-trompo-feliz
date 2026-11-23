import { ZonaAdministracion } from "@/components/zona-administracion";

export default function LayoutAdministracion({ children }: LayoutProps<"/admin">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Administración</p>
      <ZonaAdministracion>{children}</ZonaAdministracion>
    </main>
  );
}
