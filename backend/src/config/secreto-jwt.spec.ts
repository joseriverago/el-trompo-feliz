import { secretoJwt } from './secreto-jwt.js';

describe('secretoJwt', () => {
  const original = process.env.JWT_SECRET;

  afterEach(() => {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  });

  it('devuelve la clave sin espacios en los extremos', () => {
    process.env.JWT_SECRET = '  0123456789abcdef0123456789abcdef  ';
    expect(secretoJwt()).toBe('0123456789abcdef0123456789abcdef');
  });

  it('impide arrancar sin JWT_SECRET', () => {
    delete process.env.JWT_SECRET;
    expect(() => secretoJwt()).toThrow('JWT_SECRET');
  });

  it('impide arrancar con una clave de menos de 32 caracteres', () => {
    process.env.JWT_SECRET = 'corta';
    expect(() => secretoJwt()).toThrow('32 caracteres');
  });
});
