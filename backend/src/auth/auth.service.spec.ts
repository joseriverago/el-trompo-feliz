import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import type { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Rol } from '../usuarios/enums/rol.enum.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { AuthService, CORREO_REGISTRADO } from './auth.service.js';
import type { RegistroDto } from './dto/registro.dto.js';

const SECRETO = 'clave-de-prueba-de-al-menos-32-caracteres';

const datos: RegistroDto = {
  nombre: 'Begoña Ñahui Ávila',
  correo: 'begona.nahui@correo.pe',
  contrasena: 'trompo-de-prueba',
};

describe('AuthService.registrar', () => {
  let servicio: AuthService;
  const usuariosService = { buscarPorCorreo: vi.fn(), crearCliente: vi.fn() };

  beforeEach(async () => {
    usuariosService.buscarPorCorreo.mockReset().mockResolvedValue(null);
    usuariosService.crearCliente
      .mockReset()
      .mockImplementation(
        (nombre: string, correo: string, contrasenaHash: string) =>
          Promise.resolve({
            id: 7,
            nombre,
            correo,
            contrasenaHash,
            rol: Rol.CLIENTE,
            creadoEn: new Date(),
          } satisfies Usuario),
      );

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: usuariosService },
        { provide: JwtService, useValue: new JwtService({ secret: SECRETO }) },
      ],
    }).compile();

    servicio = modulo.get(AuthService);
  });

  it('crea la cuenta como cliente con la contraseña cifrada con bcrypt', async () => {
    await servicio.registrar(datos);

    const [nombre, correo, contrasenaHash] = usuariosService.crearCliente.mock
      .calls[0] as [string, string, string];
    expect(nombre).toBe('Begoña Ñahui Ávila');
    expect(correo).toBe('begona.nahui@correo.pe');
    expect(contrasenaHash).not.toBe(datos.contrasena);
    expect(contrasenaHash).toMatch(/^\$2[aby]\$10\$/);
    expect(await compare(datos.contrasena, contrasenaHash)).toBe(true);
  });

  it('deja la sesión iniciada: devuelve un JWT y los datos públicos, sin el hash', async () => {
    const sesion = await servicio.registrar(datos);

    expect(sesion.usuario).toEqual({
      id: 7,
      nombre: 'Begoña Ñahui Ávila',
      correo: 'begona.nahui@correo.pe',
      rol: Rol.CLIENTE,
    });
    expect(JSON.stringify(sesion)).not.toContain('$2');

    const contenido = new JwtService({ secret: SECRETO }).verify<{
      sub: number;
      nombre: string;
      rol: Rol;
      exp: number;
      iat: number;
    }>(sesion.token);
    expect(contenido).toMatchObject({ sub: 7, nombre: 'Begoña Ñahui Ávila', rol: Rol.CLIENTE });
  });

  it('responde 409 «Este correo ya está registrado» y no crea otra cuenta', async () => {
    usuariosService.buscarPorCorreo.mockResolvedValue({ id: 1 } as Usuario);

    const intento = servicio.registrar(datos);

    await expect(intento).rejects.toBeInstanceOf(ConflictException);
    await expect(intento).rejects.toThrow(CORREO_REGISTRADO);
    expect(usuariosService.crearCliente).not.toHaveBeenCalled();
  });

  it('responde 409 si otro registro con el mismo correo se guardó un instante antes', async () => {
    usuariosService.crearCliente.mockRejectedValue(
      Object.assign(new Error('duplicate key'), { driverError: { code: '23505' } }),
    );

    await expect(servicio.registrar(datos)).rejects.toThrow(CORREO_REGISTRADO);
  });

  it('no oculta los demás errores de la base de datos', async () => {
    usuariosService.crearCliente.mockRejectedValue(new Error('sin conexión'));

    await expect(servicio.registrar(datos)).rejects.toThrow('sin conexión');
  });
});
