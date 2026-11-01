import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment, ProfileStatus, ProgressUpdate, UserRole } from '../../database/entities.entity';
import { AuditLogService } from '../audit/audit.service';
import { ProgressRepository } from './progress.repository';

export interface ProgressInput {
  reportPeriod: string;
  work: string;
  outcome: string;
  difficulties: string;
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly repository: ProgressRepository,
    private readonly audit: AuditLogService,
  ) {}

  private async profileForActor(profileId: string, actorId: string, role: UserRole) {
    const profile = await this.repository.findProfile(profileId);
    if (!profile) throw new NotFoundException('Internship profile not found');
    let allowed = role === UserRole.OFFICER;
    if (role === UserRole.STUDENT) allowed = profile.studentId === actorId;
    if (role === UserRole.SUPERVISOR) allowed = profile.supervisorId === actorId;
    if (role === UserRole.ENTERPRISE_REP) {
      const rep = await this.repository.findEnterpriseForRep(actorId);
      allowed = !!rep && rep.enterpriseId === profile.enterpriseId;
    }
    if (!allowed) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'progress',
        resourceId: profileId,
      });
      throw new ForbiddenException('No access to this internship profile');
    }
    return profile;
  }

  async list(profileId: string, actorId: string, role: UserRole, page: number, limit: number) {
    await this.profileForActor(profileId, actorId, role);
    const result = await this.repository.listUpdates(profileId, page, limit);
    return { ...result, items: result.items.map((item) => this.safeUpdate(item)) };
  }

  async get(id: string, actorId: string, role: UserRole) {
    const update = await this.repository.findUpdate(id);
    if (!update) throw new NotFoundException('Progress update not found');
    await this.profileForActor(update.profileId, actorId, role);
    return this.safeUpdate(update);
  }

  async create(profileId: string, actorId: string, role: UserRole, input: ProgressInput) {
    if (role !== UserRole.STUDENT)
      throw new ForbiddenException('Only the student can update progress');
    const profile = await this.profileForActor(profileId, actorId, role);
    if (![ProfileStatus.APPROVED, ProfileStatus.REPORT_SUBMITTED].includes(profile.status))
      throw new BadRequestException('Progress can be updated only after profile approval');
    if (await this.repository.isFinalized(profileId))
      throw new BadRequestException('Progress is locked after result finalization');
    return this.safeUpdate(
      await this.saveUpdate(
        Object.assign(new ProgressUpdate(), { profileId, createdBy: actorId, ...input }),
      ),
    );
  }

  async update(id: string, actorId: string, role: UserRole, input: ProgressInput) {
    const update = await this.repository.findUpdate(id);
    if (!update) throw new NotFoundException('Progress update not found');
    if (role !== UserRole.STUDENT || update.createdBy !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'progress_update',
        resourceId: id,
      });
      throw new ForbiddenException('Only the owning student can edit progress');
    }
    const profile = await this.profileForActor(update.profileId, actorId, role);
    if (
      ![ProfileStatus.APPROVED, ProfileStatus.REPORT_SUBMITTED].includes(profile.status) ||
      (await this.repository.isFinalized(profile.id))
    )
      throw new BadRequestException('Progress is locked in the current workflow state');
    Object.assign(update, input);
    return this.safeUpdate(await this.saveUpdate(update));
  }

  async comments(profileId: string, actorId: string, role: UserRole, page: number, limit: number) {
    await this.profileForActor(profileId, actorId, role);
    const [items, total] = await this.repository.listComments(profileId, page, limit);
    return {
      items: items.map((item) => this.safeComment(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createComment(profileId: string, actorId: string, role: UserRole, content: string) {
    if (role === UserRole.STUDENT)
      throw new ForbiddenException('Students cannot create review comments');
    const profile = await this.profileForActor(profileId, actorId, role);
    if (await this.repository.isFinalized(profileId))
      throw new BadRequestException('Comments are locked after result finalization');
    if (![ProfileStatus.APPROVED, ProfileStatus.REPORT_SUBMITTED].includes(profile.status))
      throw new BadRequestException('Comments require an approved profile');
    return this.safeComment(
      await this.saveComment(
        Object.assign(new Comment(), { profileId, authorId: actorId, content }),
      ),
    );
  }

  async updateComment(id: string, actorId: string, role: UserRole, content: string) {
    const comment = await this.repository.findComment(id);
    if (!comment) throw new NotFoundException('Comment not found');
    if (
      comment.authorId !== actorId ||
      ![UserRole.SUPERVISOR, UserRole.OFFICER, UserRole.ENTERPRISE_REP].includes(role)
    ) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'progress_comment',
        resourceId: id,
      });
      throw new ForbiddenException('Only the comment author can edit it');
    }
    await this.profileForActor(comment.profileId, actorId, role);
    if (await this.repository.isFinalized(comment.profileId))
      throw new BadRequestException('Comments are locked after result finalization');
    comment.content = content;
    return this.safeComment(await this.saveComment(comment));
  }

  private async saveUpdate(update: ProgressUpdate) {
    try {
      return await this.repository.saveUpdate(update);
    } catch (error) {
      if (error instanceof Error && error.message === 'RESULT_FINALIZED')
        throw new BadRequestException('Progress is locked after result finalization');
      throw error;
    }
  }

  private async saveComment(comment: Comment) {
    try {
      return await this.repository.saveComment(comment);
    } catch (error) {
      if (error instanceof Error && error.message === 'RESULT_FINALIZED')
        throw new BadRequestException('Comments are locked after result finalization');
      throw error;
    }
  }

  private safeUpdate(update: ProgressUpdate) {
    return {
      id: update.id,
      profileId: update.profileId,
      reportPeriod: update.reportPeriod,
      work: update.work,
      outcome: update.outcome,
      difficulties: update.difficulties,
      createdBy: update.createdBy,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
    };
  }

  private safeComment(comment: Comment) {
    return {
      id: comment.id,
      profileId: comment.profileId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
