"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MENSAJE_SIN_ACCESO } from "@/lib/admin-juguetes";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";

/** Secciones de «Administración»; cada historia agrega la suya. */
const SECCIONES = [
  { ruta: "/admin/juguetes", nombre: "Juguetes" },
  { ruta: "/admin/inventario", nombre: "Inventario" },
];

function NavegacionAdministracion() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones de administración" className="mt-4 border-b border-zinc-200 dark:border-zinc-800">
      <ul className="-mb-px flex gap-6 overflow-x-auto">
        {SECCIONES.map((seccion) => {
          const activa = ruta === seccion.ruta || ruta.startsWith(`${seccion.ruta}/`);
          return (
            <li key={seccion.ruta}>
              <Link
                href={seccion.ruta}
                aria-current={activa ? "page" : undefined}
                className={`inline-block border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                  activa
                    ? "border-amber-500 text-zinc-950 dark:text-zinc-50"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {seccion.nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Páginas de «Administración» (HU-12 a HU-15, HU-19, HU-20). Sin sesión lleva a iniciarla y vuelve;
 * con una cuenta de cliente muestra «Tu cuenta no tiene acceso a la administración» y no llama a la
 * API (HU-12, criterio 5). La API también lo exige: sus rutas de administración responden 403.
 */
export function ZonaAdministracion({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const sesion = useSesionObligatoria(ruta);

  if (!sesion) {
    return (
      <p role="status" className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Verificando tu cuenta…
      </p>
    );
  }

  if (sesion.usuario.rol !== "ADMINISTRADOR") {
    return (
      <div role="alert" className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
        <p className="text-xl font-semibold">{MENSAJE_SIN_ACCESO}</p>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Esta sección es solo para el personal de la tienda. Si necesitas ayuda con un pedido, revisa «Mis pedidos».
        </p>
        <Link href="/" className={BOTON_PRINCIPAL}>
          Ver el catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <NavegacionAdministracion />
      {children}
    </>
  );
}
