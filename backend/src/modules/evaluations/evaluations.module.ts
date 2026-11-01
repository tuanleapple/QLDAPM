import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Criteria,
  EnterpriseRep,
  EvaluationDetail,
  EvaluationForm,
  InternshipPeriod,
  InternshipProfile,
  Report,
  Result,
  ScoreAdjustment,
} from '../../database/entities.entity';
import { AuthModule } from '../auth/auth.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsRepository } from './evaluations.repository';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Criteria,
      EnterpriseRep,
      EvaluationDetail,
      EvaluationForm,
      InternshipPeriod,
      InternshipProfile,
      Report,
      Result,
      ScoreAdjustment,
    ]),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsRepository, EvaluationsService],
})
export class EvaluationsModule {}
