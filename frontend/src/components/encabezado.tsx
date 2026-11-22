import Link from "next/link";

export function Encabezado() {
  return (
    <header className="bg-amber-400 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          El Trompo Feliz
        </Link>
      </div>
    </header>
  );
}
