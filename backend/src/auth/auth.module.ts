import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { secretoJwt } from '../config/secreto-jwt.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    UsuariosModule,
    // useFactory se ejecuta al iniciar la app: si falta JWT_SECRET, la API no arranca.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: secretoJwt(),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
