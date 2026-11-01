import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  Enterprise,
  EnterpriseRep,
  EvaluationForm,
  InternshipPeriod,
  InternshipProfile,
  ProgressUpdate,
  Report,
  Result,
  ProfileStatus,
  StatusHistory,
  Supervisor,
  User,
  UserRole,
} from '../../database/entities.entity';

export interface ProfileListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ProfileStatus;
  periodId?: string;
}
export interface CatalogListQuery {
  page: number;
  limit: number;
  search?: string;
}

/** Persistence boundary for the internship aggregate and its status history. */
@Injectable()
export class InternshipsRepository {
  constructor(
    @InjectRepository(InternshipPeriod) private readonly periods: Repository<InternshipPeriod>,
    @InjectRepository(InternshipProfile) private readonly profiles: Repository<InternshipProfile>,
    @InjectRepository(Enterprise) private readonly enterprises: Repository<Enterprise>,
    @InjectRepository(Supervisor) private readonly supervisors: Repository<Supervisor>,
  ) {}

  findPeriod(id: string) {
    return this.periods.findOne({ where: { id } });
  }
  findActivePeriod(id: string) {
    return this.periods.findOne({ where: { id, active: true } });
  }
  findEnterprise(id: string) {
    return this.enterprises.findOne({ where: { id } });
  }

  findSupervisor(id: string) {
    return this.supervisors.findOne({ where: { userId: id } });
  }

  findEnterpriseIdForRepresentative(userId: string) {
    return this.profiles.manager
      .getRepository(EnterpriseRep)
      .findOne({ where: { userId }, select: { enterpriseId: true } });
  }

  async listProfiles(actorId: string, role: UserRole, options: ProfileListQuery) {
    const query = this.profiles
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.period', 'period')
      .leftJoinAndSelect('profile.enterprise', 'enterprise')
      .leftJoinAndSelect('profile.supervisor', 'supervisor')
      .leftJoinAndSelect('profile.student', 'student')
      .where('1=1')
      .orderBy('profile.updatedAt', 'DESC');

    if (role === UserRole.STUDENT) query.where('profile.studentId = :actorId', { actorId });
    if (role === UserRole.SUPERVISOR) query.where('profile.supervisorId = :actorId', { actorId });
    if (role === UserRole.ENTERPRISE_REP)
      query
        .innerJoin(
          'enterprise_reps',
          'actor_rep',
          'actor_rep.enterprise_id = profile.enterprise_id',
        )
        .andWhere('actor_rep.user_id = :actorId', { actorId });
    if (options.status) query.andWhere('profile.status = :status', { status: options.status });
    if (options.periodId)
      query.andWhere('profile.periodId = :periodId', { periodId: options.periodId });
    if (options.search?.trim()) {
      query.andWhere(
        new Brackets((where) =>
          where
            .where('profile.title ILIKE :search', { search: `%${options.search?.trim()}%` })
            .orWhere('enterprise.name ILIKE :search', { search: `%${options.search?.trim()}%` })
            .orWhere('supervisor.fullName ILIKE :search', {
              search: `%${options.search?.trim()}%`,
            }),
        ),
      );
    }
    const [items, total] = await query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getManyAndCount();
    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getStudentDashboard(studentId: string) {
    const counts = await this.profiles
      .createQueryBuilder('profile')
      .select('profile.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('profile.studentId = :studentId', { studentId })
      .groupBy('profile.status')
      .getRawMany<{ status: ProfileStatus; count: string }>();
    const latestProfile = await this.profiles
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.period', 'period')
      .leftJoinAndSelect('profile.enterprise', 'enterprise')
      .leftJoinAndSelect('profile.supervisor', 'supervisor')
      .where('profile.studentId = :studentId', { studentId })
      .orderBy('profile.updatedAt', 'DESC')
      .getOne();
    const progressCount = latestProfile
      ? await this.profiles.manager
          .getRepository(ProgressUpdate)
          .count({ where: { profileId: latestProfile.id } })
      : 0;
    const latestReport = latestProfile
      ? await this.profiles.manager.getRepository(Report).findOne({
          where: { profileId: latestProfile.id },
          select: {
            id: true,
            version: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            submittedAt: true,
            isLate: true,
          },
          order: { version: 'DESC' },
        })
      : null;
    return {
      profileCount: counts.reduce((sum, item) => sum + Number(item.count), 0),
      countsByStatus: Object.fromEntries(counts.map((item) => [item.status, Number(item.count)])),
      latestProfile,
      currentProfile: latestProfile,
      period: latestProfile?.period ?? null,
      enterprise: latestProfile?.enterprise ?? null,
      supervisor: latestProfile?.supervisor ?? null,
      status: latestProfile?.status ?? null,
      reportDeadline: latestProfile?.period.reportDeadline ?? null,
      progressCount,
      latestReport,
    };
  }

  async getOfficerDashboard(periodId?: string) {
    const userCount = await this.profiles.manager.getRepository(User).count();
    const counts = await this.profiles
      .createQueryBuilder('profile')
      .select('profile.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(periodId ? 'profile.periodId = :periodId' : '1=1', periodId ? { periodId } : {})
      .groupBy('profile.status')
      .getRawMany<{ status: ProfileStatus; count: string }>();
    const recentQuery = this.profiles
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.period', 'period')
      .leftJoinAndSelect('profile.enterprise', 'enterprise')
      .leftJoinAndSelect('profile.supervisor', 'supervisor')
      .leftJoinAndSelect('profile.student', 'student')
      .orderBy('profile.updatedAt', 'DESC')
      .take(10);
    if (periodId) recentQuery.where('profile.periodId = :periodId', { periodId });
    return {
      accountCount: userCount,
      profileCountsByStatus: Object.fromEntries(
        counts.map((item) => [item.status, Number(item.count)]),
      ),
      recentProfiles: await recentQuery.getMany(),
    };
  }

  exportProfiles(options: Pick<ProfileListQuery, 'search' | 'status' | 'periodId'>) {
    const query = this.profiles
      .createQueryBuilder('profile')
      .leftJoin('internship_periods', 'period', 'period.id = profile.period_id')
      .leftJoin('enterprises', 'enterprise', 'enterprise.id = profile.enterprise_id')
      .leftJoin('supervisors', 'supervisor', 'supervisor.user_id = profile.supervisor_id')
      .leftJoin('students', 'student', 'student.user_id = profile.student_id')
      .select('profile.id', 'profileId')
      .addSelect('profile.status', 'status')
      .addSelect('profile.title', 'title')
      .addSelect('profile.position', 'position')
      .addSelect('profile.updated_at', 'updatedAt')
      .addSelect('period.name', 'periodName')
      .addSelect('enterprise.name', 'enterpriseName')
      .addSelect('supervisor.full_name', 'supervisorName')
      .addSelect('student.full_name', 'studentName')
      .orderBy('profile.updatedAt', 'DESC')
      .where('1=1');
    if (options.status) query.andWhere('profile.status = :status', { status: options.status });
    if (options.periodId)
      query.andWhere('profile.periodId = :periodId', { periodId: options.periodId });
    if (options.search?.trim())
      query.andWhere(
        '(profile.title ILIKE :search OR enterprise.name ILIKE :search OR supervisor.full_name ILIKE :search OR student.full_name ILIKE :search)',
        { search: `%${options.search.trim()}%` },
      );
    return query.take(10000).getRawMany();
  }

  saveProfile(profile: InternshipProfile) {
    return this.profiles.save(profile);
  }

  removeProfile(profile: InternshipProfile) {
    return this.profiles.remove(profile);
  }

  hasStatusHistory(profileId: string) {
    return this.profiles.manager.getRepository(StatusHistory).exist({ where: { profileId } });
  }

  findProfile(id: string) {
    return this.profiles.findOne({
      where: { id },
      relations: { period: true, enterprise: true, supervisor: true, student: true },
    });
  }

  listStatusHistory(profileId: string) {
    return this.profiles.manager
      .getRepository(StatusHistory)
      .find({ where: { profileId }, order: { createdAt: 'ASC' } });
  }

  // Khóa bản ghi, đổi trạng thái và lưu lịch sử cùng một transaction.
  transitionProfile(
    id: string,
    expectedStatus: ProfileStatus,
    actorId: string,
    status: ProfileStatus,
    reason?: string,
    supervisorId?: string,
  ) {
    return this.profiles.manager.transaction(async (manager) => {
      const profile = await manager.findOne(InternshipProfile, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) throw new Error('PROFILE_MISSING');
      if (profile.status !== expectedStatus) throw new Error('PROFILE_CHANGED');
      const previousStatus = profile.status;
      profile.status = status;
      profile.lastStatusReason = reason ?? null;
      if (supervisorId) profile.supervisorId = supervisorId;
      await manager.save(InternshipProfile, profile);
      await manager.save(
        StatusHistory,
        manager.create(StatusHistory, {
          profileId: id,
          fromStatus: previousStatus,
          toStatus: status,
          changedBy: actorId,
          reason: reason ?? null,
        }),
      );
      return profile;
    });
  }

  assignSupervisor(profileId: string, supervisorId: string) {
    return this.profiles.manager.transaction(async (manager) => {
      const profile = await manager.findOne(InternshipProfile, {
        where: { id: profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) throw new Error('PROFILE_MISSING');
      if (profile.status !== ProfileStatus.APPROVED) throw new Error('PROFILE_NOT_APPROVED');
      const supervisor = await manager.findOne(Supervisor, { where: { userId: supervisorId } });
      if (!supervisor) throw new Error('SUPERVISOR_MISSING');
      const [progressCount, reportCount, formCount, resultCount] = await Promise.all([
        manager.getRepository(ProgressUpdate).count({ where: { profileId } }),
        manager.getRepository(Report).count({ where: { profileId } }),
        manager.getRepository(EvaluationForm).count({ where: { profileId } }),
        manager.getRepository(Result).count({ where: { profileId } }),
      ]);
      if (progressCount + reportCount + formCount + resultCount > 0)
        throw new Error('SUPERVISOR_ASSIGNMENT_LOCKED');
      profile.supervisorId = supervisorId;
      return manager.save(InternshipProfile, profile);
    });
  }
}
