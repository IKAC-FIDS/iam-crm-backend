import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';

function parseCorsOrigins(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const httpAdapter = app.getHttpAdapter().getInstance();

  httpAdapter.set('trust proxy', 1);

  // Run before CORS and all Nest route middleware so even bootstrap-level
  // failures have a correlation id available to the global exception filter.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const suppliedRequestId = req.header('x-request-id')?.trim();
    const requestId = suppliedRequestId || randomUUID();

    (req as Request & { requestId?: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.use(cookieParser());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowedOrigins = parseCorsOrigins(
    config.get<string>('CORS_ORIGINS', 'http://localhost:5173'),
  );

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: config.get<boolean>('CORS_CREDENTIALS', true),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
    ],
    exposedHeaders: [
      'x-request-id',
      'Content-Disposition',
      'Content-Length',
      'Content-Type',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`IAM CRM API is running on port ${port}`);
}

bootstrap();
