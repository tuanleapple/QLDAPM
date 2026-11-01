import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Comment,
  EnterpriseRep,
  InternshipProfile,
  ProgressUpdate,
  Result,
} from '../../database/entities.entity';

@Injectable()
export class ProgressRepository {
  constructor(
    @InjectRepository(ProgressUpdate) private readonly updates: Repository<ProgressUpdate>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(InternshipProfile) private readonly profiles: Repository<InternshipProfile>,
    @InjectRepository(EnterpriseRep) private readonly enterpriseReps: Repository<EnterpriseRep>,
    @InjectRepository(Result) private readonly results: Repository<Result>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findProfile(profileId: string) {
    return this.profiles.findOne({
      where: { id: profileId },
      relations: { period: true, enterprise: true, supervisor: true },
    });
  }
  findUpdate(id: string) {
    return this.updates.findOne({ where: { id }, relations: { profile: true } });
  }
  findComment(id: string) {
    return this.comments.findOne({ where: { id }, relations: { profile: true } });
  }
  isFinalized(profileId: string) {
    return this.results.exist({ where: { profileId, isFinalized: true } });
  }
  findEnterpriseForRep(userId: string) {
    return this.enterpriseReps.findOne({ where: { userId } });
  }

  async listUpdates(profileId: string, page: number, limit: number) {
    const [items, total] = await this.updates.findAndCount({
      where: { profileId },
      relations: { profile: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  saveUpdate(update: ProgressUpdate) {
    return this.dataSource.transaction(async (manager) => {
      await manager.findOne(InternshipProfile, {
        where: { id: update.profileId },
        lock: { mode: 'pessimistic_write' },
      });
      const finalized = await manager.findOne(Result, {
        where: { profileId: update.profileId, isFinalized: true },
      });
      if (finalized) throw new Error('RESULT_FINALIZED');
      return manager.save(ProgressUpdate, update);
    });
  }
  listComments(profileId: string, page: number, limit: number) {
    return this.comments.findAndCount({
      where: { profileId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
  saveComment(comment: Comment) {
    return this.dataSource.transaction(async (manager) => {
      await manager.findOne(InternshipProfile, {
        where: { id: comment.profileId },
        lock: { mode: 'pessimistic_write' },
      });
      const finalized = await manager.findOne(Result, {
        where: { profileId: comment.profileId, isFinalized: true },
      });
      if (finalized) throw new Error('RESULT_FINALIZED');
      return manager.save(Comment, comment);
    });
  }
}
