import { validateProfileSubmission, validateProfileTransition } from './profile.rules';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InternshipProfile, ProfileStatus, UserRole } from '../../database/entities.entity';
import { AuditLogService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InternshipsRepository, ProfileListQuery } from './internships.repository';

interface ProfileDraftInput {
  periodId?: string;
  enterpriseId?: string;
  title?: string;
  position?: string;
  internshipStartAt?: string;
  internshipEndAt?: string;
  description?: string;
}

@Injectable()
export class InternshipsService {
  constructor(
    private readonly internshipsRepository: InternshipsRepository,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  listProfiles(actorId: string, role: UserRole, options: ProfileListQuery) {
    if (
      ![UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP].includes(
        role,
      )
    ) {
      throw new ForbiddenException('Role cannot list internship profiles');
    }
    return this.internshipsRepository.listProfiles(actorId, role, options);
  }

  getStudentDashboard(studentId: string) {
    return this.internshipsRepository.getStudentDashboard(studentId);
  }

  getOfficerDashboard(periodId?: string) {
    return this.internshipsRepository.getOfficerDashboard(periodId);
  }

  async exportProfiles(options: Pick<ProfileListQuery, 'search' | 'status' | 'periodId'>) {
    const rows = await this.internshipsRepository.exportProfiles(options);
    const columns = [
      'profileId',
      'studentName',
      'periodName',
      'enterpriseName',
      'supervisorName',
      'position',
      'status',
      'updatedAt',
    ];
    const cell = (value: unknown) => {
      let text = value == null ? '' : String(value);
      // Spreadsheet cells beginning with formula operators can execute when a CSV is opened.
      if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    return [
      columns.map(cell).join(','),
      ...rows.map((row: Record<string, unknown>) => columns.map((key) => cell(row[key])).join(',')),
    ].join('\r\n');
  }

  async createProfile(actorId: string, input: ProfileDraftInput) {
    if (!input.periodId) throw new BadRequestException('periodId is required');
    const period = await this.internshipsRepository.findActivePeriod(input.periodId);
    if (!period) throw new NotFoundException('Internship period not found');
    if (
      input.enterpriseId &&
      !(await this.internshipsRepository.findEnterprise(input.enterpriseId))
    )
      throw new NotFoundException('Enterprise not found');
    const now = new Date();
    if (now < period.registrationOpenAt || now > period.registrationCloseAt)
      throw new BadRequestException('Registration is closed');
    const profile = new InternshipProfile();
    Object.assign(profile, {
      studentId: actorId,
      periodId: input.periodId,
      enterpriseId: input.enterpriseId ?? null,
      title: input.title ?? input.position ?? '',
      position: input.position ?? null,
      internshipStartAt: input.internshipStartAt ?? null,
      internshipEndAt: input.internshipEndAt ?? null,
      description: input.description ?? null,
      status: ProfileStatus.DRAFT,
    });
    try {
      const saved = await this.internshipsRepository.saveProfile(profile);
      return this.profileWithHistory(saved.id);
    } catch (error) {
      const code = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (code === '23505')
        throw new BadRequestException('A profile already exists for this period');
      throw error;
    }
  }

  async updateDraft(id: string, actorId: string, input: ProfileDraftInput) {
    const profile = await this.internshipsRepository.findProfile(id);
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.studentId !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'internship_profile',
        resourceId: id,
      });
      throw new ForbiddenException('Profile ownership required');
    }
    if (![ProfileStatus.DRAFT, ProfileStatus.NEEDS_REVISION].includes(profile.status)) {
      throw new BadRequestException('Only draft or revision-requested profiles can be edited');
    }
    if (
      input.enterpriseId &&
      !(await this.internshipsRepository.findEnterprise(input.enterpriseId))
    ) {
      throw new NotFoundException('Enterprise not found');
    }
    if (input.enterpriseId !== undefined) profile.enterpriseId = input.enterpriseId;
    if (input.title !== undefined) profile.title = input.title;
    if (input.position !== undefined) {
      profile.position = input.position;
      profile.title = input.title ?? input.position;
    }
    if (input.internshipStartAt !== undefined) profile.internshipStartAt = input.internshipStartAt;
    if (input.internshipEndAt !== undefined) profile.internshipEndAt = input.internshipEndAt;
    if (input.description !== undefined) profile.description = input.description;
    const saved = await this.internshipsRepository.saveProfile(profile);
    return this.profileWithHistory(saved.id);
  }

  async removeDraft(id: string, actorId: string) {
    const profile = await this.internshipsRepository.findProfile(id);
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.studentId !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'internship_profile',
        resourceId: id,
      });
      throw new ForbiddenException('Profile ownership required');
    }
    if (profile.status !== ProfileStatus.DRAFT) {
      throw new BadRequestException('Only draft profiles can be deleted');
    }
    if (await this.internshipsRepository.hasStatusHistory(id)) {
      throw new BadRequestException('Profiles with status history cannot be deleted');
    }
    await this.internshipsRepository.removeProfile(profile);
  }

  async assignSupervisor(id: string, supervisorId: string, actorId: string) {
    let profile: InternshipProfile;
    try {
      profile = await this.internshipsRepository.assignSupervisor(id, supervisorId);
    } catch (error) {
      const marker = error instanceof Error ? error.message : '';
      if (marker === 'PROFILE_MISSING') throw new NotFoundException('Profile not found');
      if (marker === 'PROFILE_NOT_APPROVED')
        throw new BadRequestException('Supervisor can only be assigned after approval');
      if (marker === 'SUPERVISOR_MISSING') throw new NotFoundException('Supervisor not found');
      if (marker === 'SUPERVISOR_ASSIGNMENT_LOCKED')
        throw new BadRequestException(
          'Supervisor cannot be changed after progress, report or evaluation activity',
        );
      throw error;
    }
    await this.audit.record({
      actorId,
      action: 'SUPERVISOR_ASSIGNED',
      resource: 'internship_profile',
      resourceId: id,
      metadata: { supervisorId },
    });
    await this.notifications.notify(
      profile.studentId,
      'Supervisor assigned',
      'A supervisor has been assigned to your internship profile.',
    );
    await this.notifications.notify(
      supervisorId,
      'Internship profile assigned',
      `You were assigned profile ${profile.id}.`,
    );
    return {
      ...profile,
      statusHistory: await this.internshipsRepository.listStatusHistory(profile.id),
    };
  }

  async getProfile(id: string, actorId: string, role: UserRole) {
    const profile = await this.internshipsRepository.findProfile(id);
    if (!profile) throw new NotFoundException('Profile not found');
    if (role === UserRole.STUDENT && profile.studentId !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'internship_profile',
        resourceId: id,
      });
      throw new ForbiddenException('Profile ownership required');
    }
    if (role === UserRole.SUPERVISOR && profile.supervisorId !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'internship_profile',
        resourceId: id,
      });
      throw new ForbiddenException('Assigned supervisor required');
    }
    if (role === UserRole.ENTERPRISE_REP) {
      const representative =
        await this.internshipsRepository.findEnterpriseIdForRepresentative(actorId);
      if (!representative || profile.enterpriseId !== representative.enterpriseId) {
        await this.audit.record({
          actorId,
          action: 'RESOURCE_ACCESS_DENIED',
          resource: 'internship_profile',
          resourceId: id,
        });
        throw new ForbiddenException(
          'Enterprise representative can access only its enterprise profiles',
        );
      }
    }
    return this.profileWithHistory(profile.id);
  }

  // Xác minh chủ sở hữu trước khi chuyển trạng thái và lưu lịch sử.
  async submit(id: string, actorId: string) {
    const existing = await this.internshipsRepository.findProfile(id);
    if (!existing) throw new NotFoundException('Profile not found');
    if (existing.studentId !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'internship_profile',
        resourceId: id,
      });
      throw new ForbiddenException('Profile ownership required');
    }
    return this.transition(id, actorId, ProfileStatus.SUBMITTED);
  }

  async review(
    id: string,
    actorId: string,
    status: ProfileStatus,
    reason?: string,
    supervisorId?: string,
  ) {
    if (
      ![ProfileStatus.APPROVED, ProfileStatus.REJECTED, ProfileStatus.NEEDS_REVISION].includes(
        status,
      )
    )
      throw new BadRequestException('Invalid review status');
    if (status !== ProfileStatus.APPROVED && !reason?.trim())
      throw new BadRequestException('Review reason is required');
    if (status === ProfileStatus.APPROVED && !supervisorId)
      throw new BadRequestException('supervisorId is required to approve a profile');
    return this.transition(id, actorId, status, reason, supervisorId);
  }

  private async transition(
    id: string,
    actorId: string,
    status: ProfileStatus,
    reason?: string,
    supervisorId?: string,
  ) {
    if (supervisorId && !(await this.internshipsRepository.findSupervisor(supervisorId)))
      throw new NotFoundException('Supervisor not found');
    const profile = await this.internshipsRepository.findProfile(id);
    if (!profile) throw new NotFoundException('Profile not found');
    validateProfileTransition(profile.status, status);
    if (status === ProfileStatus.SUBMITTED) {
      const period = await this.internshipsRepository.findPeriod(profile.periodId);
      validateProfileSubmission(profile, period);
    }
    let changed: InternshipProfile;
    try {
      changed = await this.internshipsRepository.transitionProfile(
        id,
        profile.status,
        actorId,
        status,
        reason,
        supervisorId,
      );
    } catch (error) {
      const marker = error instanceof Error ? error.message : '';
      if (marker === 'PROFILE_MISSING') throw new NotFoundException('Profile not found');
      if (marker === 'PROFILE_CHANGED')
        throw new ConflictException('Profile status changed; reload before retrying');
      throw error;
    }
    await this.notifyStatusChange(changed, status, reason);
    return this.profileWithHistory(changed.id);
  }

  private async notifyStatusChange(
    profile: InternshipProfile,
    status: ProfileStatus,
    reason?: string,
  ) {
    if (status === ProfileStatus.SUBMITTED)
      await this.notifications.notifyOfficers(
        'Internship profile submitted',
        `A student submitted profile ${profile.id}.`,
      );
    if (
      [ProfileStatus.APPROVED, ProfileStatus.REJECTED, ProfileStatus.NEEDS_REVISION].includes(
        status,
      )
    )
      await this.notifications.notify(
        profile.studentId,
        'Internship profile reviewed',
        `Your profile status is now ${status}.${reason ? ` Reason: ${reason}` : ''}`,
      );
    if (status === ProfileStatus.APPROVED && profile.supervisorId)
      await this.notifications.notify(
        profile.supervisorId,
        'Internship profile assigned',
        `You were assigned profile ${profile.id}.`,
      );
  }

  private async profileWithHistory(id: string) {
    const profile = await this.internshipsRepository.findProfile(id);
    if (!profile) throw new NotFoundException('Profile not found');
    return { ...profile, statusHistory: await this.internshipsRepository.listStatusHistory(id) };
  }
}
