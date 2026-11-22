import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity.js';
import { Rol } from './enums/rol.enum.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  /** Busca un usuario por su correo, que ya llega normalizado en minúsculas. */
  buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.usuarios.findOneBy({ correo });
  }

  /**
   * Igual que buscarPorCorreo, pero también lee el hash de la contraseña, que las demás
   * consultas no traen. Solo lo usa el inicio de sesión para comparar la contraseña.
   */
  buscarConContrasena(correo: string): Promise<Usuario | null> {
    return this.usuarios.findOne({
      where: { correo },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        contrasenaHash: true,
      },
    });
  }

  /** Crea una cuenta con el rol CLIENTE. La contraseña llega ya cifrada con bcrypt. */
  crearCliente(
    nombre: string,
    correo: string,
    contrasenaHash: string,
  ): Promise<Usuario> {
    return this.usuarios.save(
      this.usuarios.create({ nombre, correo, contrasenaHash, rol: Rol.CLIENTE }),
    );
  }
}
