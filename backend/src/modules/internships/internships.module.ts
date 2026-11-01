import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Enterprise,
  Criteria,
  EnterpriseRep,
  InternshipPeriod,
  InternshipProfile,
  StatusHistory,
  Supervisor,
} from '../../database/entities.entity';
import { AuthModule } from '../auth/auth.module';
import { InternshipsController } from './internships.controller';
import { InternshipsService } from './internships.service';
import { InternshipsRepository } from './internships.repository';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from './catalog.repository';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      InternshipPeriod,
      InternshipProfile,
      StatusHistory,
      Enterprise,
      Supervisor,
      Criteria,
      EnterpriseRep,
    ]),
  ],
  controllers: [InternshipsController, CatalogController],
  providers: [InternshipsService, InternshipsRepository, CatalogService, CatalogRepository],
})
export class InternshipsModule {}
