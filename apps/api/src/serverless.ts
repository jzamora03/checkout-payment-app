import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import serverlessExpress from '@codegenie/serverless-express';
import helmet from 'helmet';
import { Context } from 'aws-lambda';
import { AppModule } from './app.module';

/**
 * Entry point serverless para desplegar la misma API en AWS Lambda.
 * Reutiliza la configuración de `main.ts` (prefijo, validación, CORS,
 * webhook con raw body) y la envuelve con @codegenie/serverless-express.
 */
async function bootstrapServer(): Promise<ReturnType<typeof serverlessExpress>> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.setGlobalPrefix('api/v1');
  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

let cachedHandler: ReturnType<typeof serverlessExpress> | undefined;

export const handler = async (
  event: Parameters<ReturnType<typeof serverlessExpress>>[0],
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: any,
) => {
  if (!cachedHandler) {
    Logger.log('Inicializando handler serverless...', 'Serverless');
    cachedHandler = await bootstrapServer();
  }
  return cachedHandler!(event, context, callback);
};