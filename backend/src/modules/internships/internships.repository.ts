import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InternshipPeriod, InternshipProfile, StatusHistory } from '../../database/entities.entity';

/** Persistence boundary for the internship aggregate and its status history. */
@Injectable()
export class InternshipsRepository {
  constructor(
    @InjectRepository(InternshipPeriod) private readonly periods: Repository<InternshipPeriod>,
    @InjectRepository(InternshipProfile) private readonly profiles: Repository<InternshipProfile>,
  ) {}

  listPeriods() {
    return this.periods.find({ order: { startDate: 'DESC' } });
  }

  findActivePeriod(id: string) {
    return this.periods.findOne({ where: { id, active: true } });
  }

  saveProfile(profile: InternshipProfile, manager?: EntityManager) {
    return (manager?.getRepository(InternshipProfile) ?? this.profiles).save(profile);
  }

  findProfile(id: string) {
    return this.profiles.findOne({
      where: { id },
      relations: { period: true, enterprise: true, supervisor: true },
    });
  }

  findProfileForTransition(id: string, manager: EntityManager) {
    return manager.findOne(InternshipProfile, { where: { id } });
  }

  saveStatusHistory(history: StatusHistory, manager: EntityManager) {
    return manager.save(StatusHistory, history);
  }

  createStatusHistory(
    values: Pick<StatusHistory, 'profileId' | 'fromStatus' | 'toStatus' | 'changedBy' | 'reason'>,
    manager: EntityManager,
  ) {
    return manager.create(StatusHistory, values);
  }
}
