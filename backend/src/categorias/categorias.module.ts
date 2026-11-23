import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CategoriasController } from './categorias.controller.js';
import { CategoriasService } from './categorias.service.js';
import { Categoria } from './entities/categoria.entity.js';

/** Parte del subsistema Catálogo: las categorías de los juguetes. */
@Module({
  imports: [TypeOrmModule.forFeature([Categoria]), AuthModule],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}
