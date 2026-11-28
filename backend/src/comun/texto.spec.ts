import { normalizarTexto } from './texto.js';

describe('normalizarTexto', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalizarTexto('ÁBACO de Construcción')).toBe(
      'abaco de construccion',
    );
  });

  it('conserva la ñ, que es otra letra', () => {
    expect(normalizarTexto('Ñuñu')).toBe('ñuñu');
  });
});
