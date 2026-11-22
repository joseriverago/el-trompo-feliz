import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CarritoModule } from './carrito/carrito.module.js';
import { opcionesBaseDeDatos } from './database/opciones-base-de-datos.js';
import { JuguetesModule } from './juguetes/juguetes.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';

@Module({
  imports: [
    // useFactory se ejecuta al iniciar la app, cuando las variables de entorno ya están cargadas.
    TypeOrmModule.forRootAsync({ useFactory: () => opcionesBaseDeDatos() }),
    JuguetesModule,
    AuthModule,
    CarritoModule,
    PedidosModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
