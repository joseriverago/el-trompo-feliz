import { CATEGORIAS_SEMILLA, JUGUETES_SEMILLA } from './datos-semilla.js';

describe('Datos semilla', () => {
  const nombresCategorias = CATEGORIAS_SEMILLA.map((c) => c.nombre);

  it('no repite nombres de categorías ni de juguetes', () => {
    expect(new Set(nombresCategorias).size).toBe(nombresCategorias.length);
    const nombresJuguetes = JUGUETES_SEMILLA.map((j) => j.nombre);
    expect(new Set(nombresJuguetes).size).toBe(nombresJuguetes.length);
  });

  it('asigna cada juguete a una categoría existente', () => {
    for (const juguete of JUGUETES_SEMILLA) {
      expect(nombresCategorias).toContain(juguete.categoria);
    }
  });

  it('incluye al menos un juguete agotado (stock 0)', () => {
    expect(JUGUETES_SEMILLA.some((j) => j.stock === 0)).toBe(true);
  });

  it('incluye varios juguetes con stock bajo (entre 1 y 5 unidades)', () => {
    const stockBajo = JUGUETES_SEMILLA.filter((j) => j.stock >= 1 && j.stock <= 5);
    expect(stockBajo.length).toBeGreaterThanOrEqual(2);
  });

  it('cumple las reglas de registro de juguetes de HU-12', () => {
    for (const juguete of JUGUETES_SEMILLA) {
      expect(juguete.precio).toBeGreaterThan(0);
      expect(Number.isInteger(Math.round(juguete.precio * 100))).toBe(true);
      expect(juguete.edadMinima).toBeLessThanOrEqual(juguete.edadMaxima);
      expect(Number.isInteger(juguete.stock) && juguete.stock >= 0).toBe(true);
      expect(juguete.descripcion.trim()).not.toBe('');
      expect(juguete.imagenUrl).toMatch(/^https:\/\//);
    }
  });
});
