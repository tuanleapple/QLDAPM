import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  Criteria,
  Enterprise,
  EnterpriseRep,
  InternshipPeriod,
  InternshipProfile,
  Supervisor,
} from '../../database/entities.entity';

@Injectable()
export class CatalogRepository {
  constructor(
    @InjectRepository(InternshipPeriod) private readonly periods: Repository<InternshipPeriod>,
    @InjectRepository(InternshipProfile) private readonly profiles: Repository<InternshipProfile>,
    @InjectRepository(Enterprise) private readonly enterprises: Repository<Enterprise>,
    @InjectRepository(Supervisor) private readonly supervisors: Repository<Supervisor>,
  ) {}
  async listPeriods(page = 1, limit = 20, search?: string) {
    const query = this.periods.createQueryBuilder('period').orderBy('period.startDate', 'DESC');
    if (search?.trim()) query.where('period.name ILIKE :search', { search: `%${search.trim()}%` });
    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findPeriod(id: string) {
    return this.periods.findOne({ where: { id } });
  }

  savePeriod(period: InternshipPeriod) {
    return this.periods.save(period);
  }
  removePeriod(period: InternshipPeriod) {
    return this.periods.remove(period);
  }
  countPeriodReferences(id: string) {
    return Promise.all([
      this.profiles.count({ where: { periodId: id } }),
      this.periods.manager.getRepository(Criteria).count({ where: { periodId: id } }),
    ]).then(([profiles, criteria]) => profiles + criteria);
  }

  async listEnterprises(page = 1, limit = 20, search?: string) {
    const query = this.enterprises
      .createQueryBuilder('enterprise')
      .orderBy('enterprise.name', 'ASC');
    if (search?.trim()) {
      query.where('enterprise.name ILIKE :search', { search: `%${search.trim()}%` });
    }
    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findEnterprise(id: string) {
    return this.enterprises.findOne({ where: { id } });
  }

  saveEnterprise(enterprise: Enterprise) {
    return this.enterprises.save(enterprise);
  }
  removeEnterprise(enterprise: Enterprise) {
    return this.enterprises.remove(enterprise);
  }
  countEnterpriseReferences(id: string) {
    return Promise.all([
      this.profiles.count({ where: { enterpriseId: id } }),
      this.profiles.manager.getRepository(EnterpriseRep).count({ where: { enterpriseId: id } }),
    ]).then(([profiles, representatives]) => profiles + representatives);
  }

  async listSupervisors(page = 1, limit = 20, search?: string) {
    const query = this.supervisors
      .createQueryBuilder('supervisor')
      .leftJoinAndSelect('supervisor.user', 'user')
      .orderBy('supervisor.fullName', 'ASC');
    if (search?.trim()) {
      query.where(
        new Brackets((where) =>
          where
            .where('supervisor.fullName ILIKE :search', { search: `%${search.trim()}%` })
            .orWhere('user.email ILIKE :search', { search: `%${search.trim()}%` }),
        ),
      );
    }
    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: items.map((item) => ({
        id: item.userId,
        fullName: item.fullName,
        department: item.department,
        email: item.user.email,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
