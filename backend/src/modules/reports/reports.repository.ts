import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  EvaluationForm,
  EnterpriseRep,
  FormType,
  InternshipPeriod,
  InternshipProfile,
  ProfileStatus,
  Report,
  Result,
  StatusHistory,
  SubmissionStatus,
} from '../../database/entities.entity';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    @InjectRepository(InternshipProfile) private readonly profiles: Repository<InternshipProfile>,
    @InjectRepository(EnterpriseRep) private readonly enterpriseReps: Repository<EnterpriseRep>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findProfile(id: string) {
    return this.profiles.findOne({
      where: { id },
      relations: { period: true, enterprise: true, supervisor: true },
    });
  }
  findEnterpriseRep(id: string) {
    return this.enterpriseReps.findOne({ where: { userId: id } });
  }
  findReport(id: string) {
    return this.reports.findOne({
      where: { id },
      relations: { profile: { period: true, enterprise: true, supervisor: true } },
    });
  }
  list(profileId: string, page: number, limit: number) {
    return this.reports.findAndCount({
      where: { profileId },
      order: { version: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  saveVersion(
    profileId: string,
    metadata: Pick<Report, 'storageName' | 'originalName' | 'mimeType' | 'sizeBytes'>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(InternshipProfile, {
        where: { id: profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) throw new Error('PROFILE_MISSING');
      const period = await manager.findOne(InternshipPeriod, { where: { id: profile.periodId } });
      if (!period) throw new Error('PERIOD_MISSING');
      const result = await manager.findOne(Result, { where: { profileId, isFinalized: true } });
      if (result) throw new Error('RESULT_FINALIZED');
      const submittedForm = await manager.getRepository(EvaluationForm).count({
        where: { profileId, formType: FormType.SUPERVISOR, status: SubmissionStatus.SUBMITTED },
      });
      if (submittedForm) throw new Error('SUPERVISOR_FORM_SUBMITTED');
      if (![ProfileStatus.APPROVED, ProfileStatus.REPORT_SUBMITTED].includes(profile.status))
        throw new Error('PROFILE_NOT_APPROVED');
      const latest = await manager
        .createQueryBuilder(Report, 'report')
        .where('report.profile_id = :profileId', { profileId })
        .orderBy('report.version', 'DESC')
        .setLock('pessimistic_write')
        .getOne();
      const now = new Date();
      const report = manager.create(Report, {
        profileId,
        version: (latest?.version ?? 0) + 1,
        ...metadata,
        submittedAt: now,
        isLate: !!period.reportDeadline && now > period.reportDeadline,
      });
      await manager.save(report);
      if (profile.status === ProfileStatus.APPROVED) {
        profile.status = ProfileStatus.REPORT_SUBMITTED;
        await manager.save(profile);
        await manager.save(
          StatusHistory,
          manager.create(StatusHistory, {
            profileId,
            fromStatus: ProfileStatus.APPROVED,
            toStatus: ProfileStatus.REPORT_SUBMITTED,
            changedBy: profile.studentId,
            reason: `Report version ${report.version} submitted`,
          }),
        );
      }
      return report;
    });
  }
}
