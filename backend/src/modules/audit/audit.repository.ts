import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from '../../database/entities.entity';

@Injectable()
export class AuditRepository {
  constructor(@InjectRepository(SystemLog) private readonly logs: Repository<SystemLog>) {}

  save(values: Pick<SystemLog, 'actorId' | 'action' | 'resource' | 'resourceId' | 'metadata'>) {
    return this.logs.save(this.logs.create(values));
  }
}
