import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  // Configure Winston Logger for structured, production-ready logging
  const winstonLogger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf((info) => {
            const ts = typeof info.timestamp === 'string' ? info.timestamp : '';
            const lvl = typeof info.level === 'string' ? info.level : '';
            const msg = typeof info.message === 'string' ? info.message : '';
            const ctx =
              typeof info.context === 'string' ? info.context : 'Application';
            const m = typeof info.ms === 'string' ? info.ms : '';
            return `[Nest] - ${ts} ${lvl} [${ctx}] ${msg} ${m}`;
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
    cors: true,
  });

  // Global settings
  app.setGlobalPrefix('api/v1');

  // Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties not in the DTO
      transform: true, // Automatically converts payloads to DTO instances
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors and Filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Collaborative Task & Scheduling Platform API')
    .setDescription(
      'Production-grade SaaS Task Board API with Multi-tenancy, Realtime Socket.io, BullMQ Jobs, and CTE hierarchies.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`Application successfully listening on port ${port}`, 'Bootstrap');
  Logger.log(
    `Swagger documentation UI available at: http://localhost:${port}/docs`,
    'Bootstrap',
  );
}
void bootstrap();
