import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InternshipProfile, ProfileStatus, UserRole } from '../../database/entities.entity';
import { InternshipsRepository } from './internships.repository';

@Injectable()
export class InternshipsService {
  constructor(
    private readonly internshipsRepository: InternshipsRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  listPeriods() {
    return this.internshipsRepository.listPeriods();
  }

  async createProfile(actorId: string, periodId: string, title: string, description?: string) {
    const period = await this.internshipsRepository.findActivePeriod(periodId);
    if (!period) throw new NotFoundException('Internship period not found');
    const now = new Date();
    if (now < period.registrationOpenAt || now > period.registrationCloseAt)
      throw new BadRequestException('Registration is closed');
    const profile = new InternshipProfile();
    Object.assign(profile, {
      studentId: actorId,
      periodId,
      title,
      description: description ?? null,
      status: ProfileStatus.DRAFT,
    });
    try {
      return await this.internshipsRepository.saveProfile(profile);
    } catch {
      throw new BadRequestException('A profile already exists for this period');
    }
  }

  async getProfile(id: string, actorId: string, role: UserRole) {
    const profile = await this.internshipsRepository.findProfile(id);
    if (!profile) throw new NotFoundException('Profile not found');
    if (role === UserRole.STUDENT && profile.studentId !== actorId)
      throw new ForbiddenException('Profile ownership required');
    if (role === UserRole.SUPERVISOR && profile.supervisorId !== actorId)
      throw new ForbiddenException('Assigned supervisor required');
    return profile;
  }

  async submit(id: string, actorId: string) {
    return this.transition(id, actorId, ProfileStatus.SUBMITTED);
  }

  async review(id: string, actorId: string, status: ProfileStatus, reason?: string) {
    if (
      ![ProfileStatus.APPROVED, ProfileStatus.REJECTED, ProfileStatus.NEEDS_REVISION].includes(
        status,
      )
    )
      throw new BadRequestException('Invalid review status');
    if (status !== ProfileStatus.APPROVED && !reason?.trim())
      throw new BadRequestException('Review reason is required');
    return this.transition(id, actorId, status, reason);
  }

  private async transition(id: string, actorId: string, status: ProfileStatus, reason?: string) {
    return this.dataSource.transaction(async (manager) => {
      const profile = await this.internshipsRepository.findProfileForTransition(id, manager);
      if (!profile) throw new NotFoundException('Profile not found');
      // The transition map is the workflow invariant; rejecting every unlisted edge prevents bypassing review states.
      const allowed: Record<ProfileStatus, ProfileStatus[]> = {
        [ProfileStatus.DRAFT]: [ProfileStatus.SUBMITTED],
        [ProfileStatus.SUBMITTED]: [
          ProfileStatus.NEEDS_REVISION,
          ProfileStatus.APPROVED,
          ProfileStatus.REJECTED,
        ],
        [ProfileStatus.NEEDS_REVISION]: [ProfileStatus.SUBMITTED],
        [ProfileStatus.APPROVED]: [],
        [ProfileStatus.REJECTED]: [],
      };
      if (!allowed[profile.status].includes(status))
        throw new BadRequestException(`Cannot change ${profile.status} to ${status}`);
      const previous = profile.status;
      profile.status = status;
      profile.lastStatusReason = reason ?? null;
      await this.internshipsRepository.saveProfile(profile, manager);
      await this.internshipsRepository.saveStatusHistory(
        this.internshipsRepository.createStatusHistory(
          {
            profileId: id,
            fromStatus: previous,
            toStatus: status,
            changedBy: actorId,
            reason: reason ?? null,
          },
          manager,
        ),
        manager,
      );
      return profile;
    });
  }
}
