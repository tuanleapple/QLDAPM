import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Enterprise, InternshipPeriod } from '../../database/entities.entity';
import { AuditLogService } from '../audit/audit.service';

import { CatalogListQuery } from './internships.repository';
import { CatalogRepository } from './catalog.repository';

interface PeriodInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  enterpriseWeight?: string | number;
  supervisorProcessWeight?: string | number;
  supervisorReportWeight?: string | number;
  registrationOpenAt?: string | Date;
  registrationCloseAt?: string | Date;
  reportDeadline?: string | Date | null;
}

/** Quản lý danh mục đợt, doanh nghiệp và danh sách GVHD; workflow hồ sơ ở InternshipsService. */
@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly audit: AuditLogService,
  ) {}
  listPeriods(options: CatalogListQuery) {
    return this.catalogRepository.listPeriods(options.page, options.limit, options.search);
  }

  getPeriod(id: string) {
    return this.catalogRepository.findPeriod(id);
  }

  async createPeriod(input: PeriodInput, actorId: string) {
    const period = Object.assign(new InternshipPeriod(), input, {
      registrationOpenAt: input.registrationOpenAt ? new Date(input.registrationOpenAt) : undefined,
      registrationCloseAt: input.registrationCloseAt
        ? new Date(input.registrationCloseAt)
        : undefined,
      reportDeadline: input.reportDeadline ? new Date(input.reportDeadline) : null,
      enterpriseWeight: String(input.enterpriseWeight ?? 0.4),
      supervisorProcessWeight: String(input.supervisorProcessWeight ?? 0.3),
      supervisorReportWeight: String(input.supervisorReportWeight ?? 0.3),
    });
    this.validatePeriod(period);
    const saved = await this.catalogRepository.savePeriod(period);
    await this.audit.record({
      actorId,
      action: 'PERIOD_CREATED',
      resource: 'internship_period',
      resourceId: saved.id,
    });
    return saved;
  }

  async updatePeriod(id: string, input: PeriodInput, actorId: string) {
    const period = await this.catalogRepository.findPeriod(id);
    if (!period) throw new NotFoundException('Internship period not found');
    Object.assign(period, input, {
      ...(input.registrationOpenAt
        ? { registrationOpenAt: new Date(input.registrationOpenAt) }
        : {}),
      ...(input.registrationCloseAt
        ? { registrationCloseAt: new Date(input.registrationCloseAt) }
        : {}),
      ...(input.reportDeadline !== undefined
        ? { reportDeadline: input.reportDeadline ? new Date(input.reportDeadline) : null }
        : {}),
      ...(input.enterpriseWeight !== undefined
        ? { enterpriseWeight: String(input.enterpriseWeight) }
        : {}),
      ...(input.supervisorProcessWeight !== undefined
        ? { supervisorProcessWeight: String(input.supervisorProcessWeight) }
        : {}),
      ...(input.supervisorReportWeight !== undefined
        ? { supervisorReportWeight: String(input.supervisorReportWeight) }
        : {}),
    });
    this.validatePeriod(period);
    const saved = await this.catalogRepository.savePeriod(period);
    await this.audit.record({
      actorId,
      action: 'PERIOD_UPDATED',
      resource: 'internship_period',
      resourceId: id,
    });
    return saved;
  }

  async deletePeriod(id: string, actorId: string) {
    const period = await this.catalogRepository.findPeriod(id);
    if (!period) throw new NotFoundException('Internship period not found');
    if (await this.catalogRepository.countPeriodReferences(id))
      throw new BadRequestException(
        'Period is referenced by profiles or evaluation criteria and cannot be deleted',
      );
    await this.catalogRepository.removePeriod(period);
    await this.audit.record({
      actorId,
      action: 'PERIOD_DELETED',
      resource: 'internship_period',
      resourceId: id,
    });
  }

  private validatePeriod(period: PeriodInput) {
    if (period.startDate && period.endDate && period.startDate > period.endDate)
      throw new BadRequestException('startDate must be on or before endDate');
    if (
      period.registrationOpenAt &&
      period.registrationCloseAt &&
      new Date(period.registrationOpenAt) >= new Date(period.registrationCloseAt)
    )
      throw new BadRequestException('registrationOpenAt must be before registrationCloseAt');
    const weights = [
      period.enterpriseWeight,
      period.supervisorProcessWeight,
      period.supervisorReportWeight,
    ];
    if (weights.every((weight) => weight !== undefined)) {
      const numericWeights = weights.map(Number);
      if (
        numericWeights.some((weight) => !Number.isFinite(weight) || weight < 0) ||
        Math.abs(numericWeights.reduce((sum, weight) => sum + weight, 0) - 1) > 0.00001
      )
        throw new BadRequestException('Period weights must be non-negative and sum to 1');
    }
  }

  listEnterprises(options: CatalogListQuery) {
    return this.catalogRepository.listEnterprises(options.page, options.limit, options.search);
  }

  getEnterprise(id: string) {
    return this.catalogRepository.findEnterprise(id);
  }

  async createEnterprise(input: Partial<Enterprise>, actorId: string) {
    const saved = await this.saveEnterprise(Object.assign(new Enterprise(), input));
    await this.audit.record({
      actorId,
      action: 'ENTERPRISE_CREATED',
      resource: 'enterprise',
      resourceId: saved.id,
    });
    return saved;
  }

  async updateEnterprise(id: string, input: Partial<Enterprise>, actorId: string) {
    const enterprise = await this.catalogRepository.findEnterprise(id);
    if (!enterprise) throw new NotFoundException('Enterprise not found');
    Object.assign(enterprise, input);
    const saved = await this.saveEnterprise(enterprise);
    await this.audit.record({
      actorId,
      action: 'ENTERPRISE_UPDATED',
      resource: 'enterprise',
      resourceId: id,
    });
    return saved;
  }

  private async saveEnterprise(enterprise: Enterprise) {
    try {
      return await this.catalogRepository.saveEnterprise(enterprise);
    } catch (error) {
      const code = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (code === '23505') throw new ConflictException('Enterprise name already exists');
      throw error;
    }
  }

  async deleteEnterprise(id: string, actorId: string) {
    const enterprise = await this.catalogRepository.findEnterprise(id);
    if (!enterprise) throw new NotFoundException('Enterprise not found');
    if (await this.catalogRepository.countEnterpriseReferences(id))
      throw new BadRequestException(
        'Enterprise is referenced by profiles or representatives and cannot be deleted',
      );
    await this.catalogRepository.removeEnterprise(enterprise);
    await this.audit.record({
      actorId,
      action: 'ENTERPRISE_DELETED',
      resource: 'enterprise',
      resourceId: id,
    });
  }

  listSupervisors(options: CatalogListQuery) {
    return this.catalogRepository.listSupervisors(options.page, options.limit, options.search);
  }
}
