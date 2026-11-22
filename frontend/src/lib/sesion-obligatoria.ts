import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { rutaIniciarSesion } from "@/lib/rutas";
import { useSesion, type Sesion } from "@/lib/sesion";

/**
 * Para las páginas que necesitan sesión (carrito, compra, pago): sin sesión lleva a iniciarla
 * y, al terminar, vuelve a `ruta`. Devuelve la sesión (undefined mientras se lee).
 */
export function useSesionObligatoria(ruta: string): Sesion | null | undefined {
  const router = useRouter();
  const sesion = useSesion();
  useEffect(() => {
    if (sesion === null) router.replace(rutaIniciarSesion(ruta));
  }, [sesion, router, ruta]);
  return sesion;
}
