import { origenesPermitidos } from './origenes-cors.js';

describe('origenesPermitidos', () => {
  it('permite solo el frontend local si FRONTEND_URL no está definida o está vacía', () => {
    expect(origenesPermitidos(undefined)).toEqual(['http://localhost:3000']);
    expect(origenesPermitidos('  ')).toEqual(['http://localhost:3000']);
  });

  it('acepta varias URL separadas por comas y quita espacios y barras finales', () => {
    expect(
      origenesPermitidos(' https://el-trompo-feliz-jrivera.vercel.app/ , http://localhost:3000'),
    ).toEqual(['https://el-trompo-feliz-jrivera.vercel.app', 'http://localhost:3000']);
  });
});
