import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { JuguetesModule } from '../juguetes/juguetes.module.js';
import { CarritoController } from './carrito.controller.js';
import { CarritoService } from './carrito.service.js';
import { Carrito } from './entities/carrito.entity.js';
import { ItemCarrito } from './entities/item-carrito.entity.js';

/** Subsistema Carrito: requiere ISesion (AuthModule) e IInventario (JuguetesModule). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Carrito, ItemCarrito]),
    AuthModule,
    JuguetesModule,
  ],
  controllers: [CarritoController],
  providers: [CarritoService],
  // ICarrito: Pedidos lee y vacía el carrito al generar el pedido (HU-08).
  exports: [CarritoService],
})
export class CarritoModule {}
