import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EvaluationForm,
  EnterpriseRep,
  InternshipPeriod,
  InternshipProfile,
  Report,
  Result,
  StatusHistory,
} from '../../database/entities.entity';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Report,
      InternshipProfile,
      InternshipPeriod,
      EvaluationForm,
      Result,
      StatusHistory,
      EnterpriseRep,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
