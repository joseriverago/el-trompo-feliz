import Link from "next/link";
import { MenuCuenta } from "@/components/menu-cuenta";

export function Encabezado() {
  return (
    <header className="bg-amber-400 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          El Trompo Feliz
        </Link>
        <MenuCuenta />
      </div>
    </header>
  );
}
