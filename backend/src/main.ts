import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Render asigna PORT en producción; en local se usa 4000 para no chocar con Next.js (3000).
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
