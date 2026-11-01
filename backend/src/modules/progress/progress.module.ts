import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Comment,
  EnterpriseRep,
  InternshipProfile,
  ProgressUpdate,
  Result,
} from '../../database/entities.entity';
import { AuthModule } from '../auth/auth.module';
import { ProgressController } from './progress.controller';
import { ProgressRepository } from './progress.repository';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ProgressUpdate, Comment, InternshipProfile, EnterpriseRep, Result]),
  ],
  controllers: [ProgressController],
  providers: [ProgressRepository, ProgressService],
})
export class ProgressModule {}
