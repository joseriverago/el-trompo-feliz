import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { opcionesBaseDeDatos } from './database/opciones-base-de-datos.js';
import { JuguetesModule } from './juguetes/juguetes.module.js';

@Module({
  imports: [
    // useFactory se ejecuta al iniciar la app, cuando las variables de entorno ya están cargadas.
    TypeOrmModule.forRootAsync({ useFactory: () => opcionesBaseDeDatos() }),
    JuguetesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
