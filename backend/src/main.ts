import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The frontend runs on a different origin (port) than this API, so the browser
  // blocks requests unless the server explicitly allows it via CORS.
  // FRONTEND_URL supports a comma-separated list — the normal dev server (3001)
  // and Playwright's dedicated E2E test server (3002, see frontend/playwright.config.ts)
  // are different origins and both need to be allowed.
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation: every incoming request body is checked against its
  // DTO's class-validator decorators before it reaches a controller.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // reject requests that include extra properties
      transform: true, // auto-convert payloads into DTO class instances
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Onboarding & Asset Management API')
    .setDescription(
      'Admin/Employee onboarding portal — auth, user management, onboarding tasks, and document uploads.',
    )
    .setVersion('1.0')
    // Registers the "Authorize" button in the Swagger UI; any route with
    // @ApiBearerAuth() will let you attach a JWT and test protected routes directly.
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
