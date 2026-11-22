import { multiplicarPrecio, sumarMontos } from './dinero.js';

describe('dinero', () => {
  it('multiplica el precio por la cantidad sin errores de redondeo', () => {
    expect(24.9 * 3).not.toBe(74.7);
    expect(multiplicarPrecio(24.9, 3)).toBe(74.7);
    expect(multiplicarPrecio(0.1, 3)).toBe(0.3);
  });

  it('suma montos con dos decimales exactos', () => {
    expect(sumarMontos([74.7, 59.9, 0.1, 0.2])).toBe(134.9);
    expect(sumarMontos([])).toBe(0);
  });
});
