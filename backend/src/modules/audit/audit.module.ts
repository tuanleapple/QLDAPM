import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLog } from '../../database/entities.entity';
import { AuditRepository } from './audit.repository';
import { AuditLogService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemLog])],
  providers: [AuditLogService, AuditRepository],
  exports: [AuditLogService],
})
export class AuditModule {}
