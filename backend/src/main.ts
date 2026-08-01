import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation: every incoming request body is checked against its
  // DTO's class-validator decorators before it reaches a controller.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // reject requests that include extra properties
      transform: true, // auto-convert payloads into DTO class instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
