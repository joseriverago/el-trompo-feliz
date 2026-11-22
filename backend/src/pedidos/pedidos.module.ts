import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CarritoModule } from '../carrito/carrito.module.js';
import { JuguetesModule } from '../juguetes/juguetes.module.js';
import { DetallePedido } from './entities/detalle-pedido.entity.js';
import { Pedido } from './entities/pedido.entity.js';
import { PedidosController } from './pedidos.controller.js';
import { PedidosService } from './pedidos.service.js';

/** Subsistema Pedidos: requiere ISesion (AuthModule), ICarrito (CarritoModule) e IInventario (JuguetesModule). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, DetallePedido]),
    AuthModule,
    CarritoModule,
    JuguetesModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  // Pagos marcará el pedido Pagado (HU-09).
  exports: [PedidosService],
})
export class PedidosModule {}
