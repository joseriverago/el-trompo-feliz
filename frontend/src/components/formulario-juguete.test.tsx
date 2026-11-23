import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormularioJuguete } from "@/components/formulario-juguete";
import type { JugueteDetalle } from "@/lib/juguetes";
import { llamada, simularApi } from "@/test/respuestas";

const CATEGORIAS = [
  { id: 1, nombre: "Didácticos" },
  { id: 2, nombre: "Peluches" },
];

const CUY: JugueteDetalle = {
  id: 21,
  nombre: "Cuy de peluche Ñuñu",
  descripcion: "Peluche suave de cuy andino.",
  precio: 39.9,
  imagenUrl: "https://placehold.co/600x400?text=Cuy",
  edadMinima: 0,
  edadMaxima: 5,
  stock: 12,
  agotado: false,
  categoria: { id: 2, nombre: "Peluches" },
};

function mostrar(juguete?: JugueteDetalle) {
  const onGuardado = vi.fn();
  render(<FormularioJuguete token="token-de-prueba" categorias={CATEGORIAS} juguete={juguete} onGuardado={onGuardado} />);
  return { onGuardado };
}

async function llenarNuevo(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText("Nombre"), "Cuy de peluche Ñuñu");
  await usuario.type(screen.getByLabelText("Descripción"), "Peluche suave de cuy andino.");
  await usuario.type(screen.getByLabelText("Precio (S/)"), "39.90");
  await usuario.selectOptions(screen.getByLabelText("Categoría"), "Peluches");
  await usuario.type(screen.getByLabelText("Imagen (URL)"), "https://placehold.co/600x400?text=Cuy");
  await usuario.type(screen.getByLabelText("Edad mínima (años)"), "0");
  await usuario.type(screen.getByLabelText("Edad máxima (años)"), "5");
  await usuario.type(screen.getByLabelText("Stock inicial (unidades)"), "12");
}

describe("FormularioJuguete (HU-12)", () => {
  it("con los campos vacíos muestra cada mensaje, lleva el foco al nombre y no llama a la API", async () => {
    const api = simularApi();
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(screen.getByRole("button", { name: "Registrar juguete" }));

    expect(screen.getByText("Ingresa el nombre")).toBeInTheDocument();
    expect(screen.getByText("Elige una categoría de la lista")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el stock inicial")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveFocus();
    expect(api).not.toHaveBeenCalled();
  });

  it("con precio 0 y edades invertidas no envía nada y lleva el foco al precio", async () => {
    const api = simularApi();
    const usuario = userEvent.setup();
    mostrar();

    await llenarNuevo(usuario);
    await usuario.clear(screen.getByLabelText("Precio (S/)"));
    await usuario.type(screen.getByLabelText("Precio (S/)"), "0");
    await usuario.clear(screen.getByLabelText("Edad mínima (años)"));
    await usuario.type(screen.getByLabelText("Edad mínima (años)"), "8");
    await usuario.click(screen.getByRole("button", { name: "Registrar juguete" }));

    expect(screen.getByText("El precio debe ser mayor que 0")).toBeInTheDocument();
    expect(screen.getByText("La edad mínima no puede ser mayor que la máxima")).toBeInTheDocument();
    expect(screen.getByLabelText("Precio (S/)")).toHaveFocus();
    expect(api).not.toHaveBeenCalled();
  });

  it("registra con POST /juguetes, con números y el stock inicial", async () => {
    const api = simularApi({ estado: 201, cuerpo: CUY });
    const usuario = userEvent.setup();
    const { onGuardado } = mostrar();

    await llenarNuevo(usuario);
    await usuario.click(screen.getByRole("button", { name: "Registrar juguete" }));

    expect(llamada(api)).toEqual({
      ruta: "/juguetes",
      metodo: "POST",
      cuerpo: {
        nombre: "Cuy de peluche Ñuñu",
        descripcion: "Peluche suave de cuy andino.",
        precio: 39.9,
        imagenUrl: "https://placehold.co/600x400?text=Cuy",
        categoriaId: 2,
        edadMinima: 0,
        edadMaxima: 5,
        stock: 12,
      },
    });
    expect(onGuardado).toHaveBeenCalledWith(CUY);
  });

  it("al editar muestra los datos actuales, no pide stock y envía PUT /juguetes/21", async () => {
    const api = simularApi({ estado: 200, cuerpo: { ...CUY, precio: 42.5 } });
    const usuario = userEvent.setup();
    mostrar(CUY);

    expect(screen.getByLabelText("Precio (S/)")).toHaveValue("39.90");
    expect(screen.getByLabelText("Categoría")).toHaveValue("2");
    expect(screen.queryByLabelText("Stock inicial (unidades)")).not.toBeInTheDocument();
    expect(screen.getByText("12 unidades")).toBeInTheDocument();

    await usuario.clear(screen.getByLabelText("Precio (S/)"));
    await usuario.type(screen.getByLabelText("Precio (S/)"), "42.50");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const enviada = llamada(api);
    expect(enviada).toMatchObject({ ruta: "/juguetes/21", metodo: "PUT" });
    expect(enviada.cuerpo).toMatchObject({ precio: 42.5 });
    expect(enviada.cuerpo).not.toHaveProperty("stock");
  });

  it("muestra junto al campo el error que devuelve la API (categoría que ya no existe)", async () => {
    simularApi({ estado: 400, cuerpo: { errores: { categoriaId: "Elige una categoría de la lista" } } });
    const usuario = userEvent.setup();
    mostrar(CUY);

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Elige una categoría de la lista")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoría")).toHaveFocus();
  });

  it("si la cuenta no es de administrador (403), muestra que no tiene acceso", async () => {
    simularApi({ estado: 403, cuerpo: { message: "No tienes permiso para esta acción" } });
    const usuario = userEvent.setup();
    mostrar(CUY);

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Tu cuenta no tiene acceso a la administración")).toBeInTheDocument();
  });
});
