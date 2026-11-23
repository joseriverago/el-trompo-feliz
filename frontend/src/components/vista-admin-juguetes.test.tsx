import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VistaAdminJuguetes } from "@/components/vista-admin-juguetes";
import type { JugueteCatalogo } from "@/lib/juguetes";
import { llamada, simularApi } from "@/test/respuestas";

vi.mock("@/lib/sesion", async (original) => ({
  ...(await original<typeof import("@/lib/sesion")>()),
  useSesion: () => ({ token: "token-de-prueba", usuario: { id: 1, nombre: "Lucía", correo: "", rol: "ADMINISTRADOR" } }),
}));

function juguete(id: number, nombre: string): JugueteCatalogo {
  return {
    id,
    nombre,
    precio: 34.9,
    imagenUrl: "https://placehold.co/600x400",
    edadMinima: 0,
    edadMaxima: 5,
    stock: 3,
    agotado: false,
    categoria: { id: 1, nombre: "Peluches" },
  };
}

const CATALOGO = [juguete(13, "Trompo de madera"), juguete(14, "Cuy de peluche Ñuñu")];
const fila = (nombre: string) => screen.getByText(nombre).closest("tr") as HTMLElement;

describe("VistaAdminJuguetes: eliminar (HU-20)", () => {
  it("pide confirmación y, al cancelar, no llama a la API ni quita el juguete", async () => {
    const api = simularApi({ estado: 200, cuerpo: CATALOGO });
    const usuario = userEvent.setup();
    render(<VistaAdminJuguetes />);

    await usuario.click(await screen.findByRole("button", { name: "Eliminar Cuy de peluche Ñuñu" }));
    const dialogo = screen.getByRole("alertdialog");
    expect(within(dialogo).getByText("¿Eliminar este juguete? Dejará de aparecer en el catálogo.")).toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Cuy de peluche Ñuñu")).toBeInTheDocument();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("Escape también cancela", async () => {
    simularApi({ estado: 200, cuerpo: CATALOGO });
    const usuario = userEvent.setup();
    render(<VistaAdminJuguetes />);

    await usuario.click(await screen.findByRole("button", { name: "Eliminar Trompo de madera" }));
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("al confirmar envía DELETE /juguetes/:id y quita la fila", async () => {
    const api = simularApi({ estado: 200, cuerpo: CATALOGO }, { estado: 204 });
    const usuario = userEvent.setup();
    render(<VistaAdminJuguetes />);

    await usuario.click(await screen.findByRole("button", { name: "Eliminar Cuy de peluche Ñuñu" }));
    await usuario.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Juguete eliminado: Cuy de peluche Ñuñu. Ya no aparece en el catálogo.")).toBeInTheDocument();
    expect(llamada(api, 1)).toEqual({ ruta: "/juguetes/14", metodo: "DELETE", cuerpo: undefined });
    expect(screen.queryByText("Cuy de peluche Ñuñu")).not.toBeInTheDocument();
    expect(fila("Trompo de madera")).toBeInTheDocument();
  });

  it("si otro administrador ya lo eliminó (404), lo quita de la lista y lo avisa", async () => {
    simularApi({ estado: 200, cuerpo: CATALOGO }, { estado: 404, cuerpo: { statusCode: 404 } });
    const usuario = userEvent.setup();
    render(<VistaAdminJuguetes />);

    await usuario.click(await screen.findByRole("button", { name: "Eliminar Trompo de madera" }));
    await usuario.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("«Trompo de madera» ya había sido eliminado por otro administrador.");
    expect(screen.queryByRole("row", { name: /Trompo de madera/ })).not.toBeInTheDocument();
  });
});
