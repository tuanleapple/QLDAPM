import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternshipPeriod, InternshipProfile, StatusHistory } from '../../database/entities.entity';
import { AuthModule } from '../auth/auth.module';
import { InternshipsController } from './internships.controller';
import { InternshipsService } from './internships.service';
import { InternshipsRepository } from './internships.repository';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([InternshipPeriod, InternshipProfile, StatusHistory]),
  ],
  controllers: [InternshipsController],
  providers: [InternshipsService, InternshipsRepository],
})
export class InternshipsModule {}
