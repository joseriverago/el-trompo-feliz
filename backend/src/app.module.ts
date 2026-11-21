import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { opcionesBaseDeDatos } from './database/opciones-base-de-datos.js';

@Module({
  imports: [
    // useFactory se ejecuta al iniciar la app, cuando las variables de entorno ya están cargadas.
    TypeOrmModule.forRootAsync({ useFactory: () => opcionesBaseDeDatos() }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
