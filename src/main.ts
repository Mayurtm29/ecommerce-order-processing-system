import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('POC Order API')
    .setDescription(
      'E-commerce order processing HTTP API. Use **Authentication** first (sign-up, login), then **Authorize** with the JWT for **products** and **orders** (numeric product ids from GET /products).',
    )
    .setVersion('1.0')
    .addTag('app', 'Public health check (GET /).')
    .addTag(
      'Authentication',
      'Public: POST /auth/sign-up and POST /auth/login. Copy access_token into Authorize (Bearer JWT).',
    )
    .addTag(
      'orders',
      'All routes require Authorization: Bearer <JWT>. Line items use numeric productId (see products).',
    )
    .addTag(
      'products',
      'JWT required. GET list/detail for any user; POST/PATCH/DELETE require ADMIN (seed admin@example.com).',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste access_token from POST /auth/login',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
