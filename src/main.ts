import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const appVersion =
    process.env.APP_VERSION ||
    `v${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`;
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();

  (global as any).APP_VERSION = appVersion;
  (global as any).BUILD_TIME = buildTime;

  console.log(`🚀 App Version: ${appVersion}`);
  console.log(`🏗️  Build Time: ${buildTime}`);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: ['X-App-Version', 'X-Build-Time', 'X-Cache-Bust'],
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.includes('/swagger')) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    res.setHeader('X-App-Version', appVersion);
    res.setHeader('X-Build-Time', buildTime);
    res.setHeader('X-Cache-Bust', Date.now().toString());

    next();
  });

  app.useStaticAssets(join(process.cwd(), 'public'), {
    maxAge: 0,
    etag: false,
    lastModified: false,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    maxAge: 86400000,
    etag: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('TomerBlackburn Authentication API')
    .setDescription(
      'A secure authentication API with JWT tokens, featuring user registration and login endpoints. Built with NestJS and PostgreSQL.',
    )
    .setVersion('1.0.0')
    .addTag('authentication', 'User authentication endpoints')
    .addTag('health', 'Health check and system status')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT! || 3000;
  await app.listen(process.env.PORT ?? port);
  console.log(`the server running at http://localhost:${port}/api`);
}
bootstrap();
