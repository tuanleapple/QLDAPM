import { Type, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { addRoleAccessDescriptions } from './common/swagger-access';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({ origin: configService.get<string>('cors.origin') });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Student Internship Management API')
    .setDescription(
      'Backend API for student internship management. Only endpoints implemented in the current source are documented.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'HMAC access token' }, 'bearer')
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const controllerTypes = [...app.get(ModulesContainer).values()].flatMap((module) =>
    [...module.controllers.values()]
      .map((wrapper) => wrapper.metatype)
      .filter((type): type is Type<unknown> => typeof type === 'function'),
  );
  addRoleAccessDescriptions(openApiDocument, controllerTypes);
  SwaggerModule.setup('api/docs', app, openApiDocument);

  await app.listen(configService.get<number>('port', 3000));
}

void bootstrap();
