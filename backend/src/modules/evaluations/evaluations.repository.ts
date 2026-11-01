import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Criteria,
  EnterpriseRep,
  EvaluationDetail,
  EvaluationForm,
  FormType,
  InternshipPeriod,
  InternshipProfile,
  ProfileStatus,
  Report,
  Result,
  ScoreAdjustment,
  SubmissionStatus,
} from '../../database/entities.entity';

@Injectable()
export class EvaluationsRepository {
  constructor(
    @InjectRepository(Criteria) private readonly criteria: Repository<Criteria>,
    @InjectRepository(EvaluationForm) private readonly forms: Repository<EvaluationForm>,
    @InjectRepository(InternshipProfile) private readonly profiles: Repository<InternshipProfile>,
    @InjectRepository(EnterpriseRep) private readonly enterpriseReps: Repository<EnterpriseRep>,
    @InjectRepository(Result) private readonly results: Repository<Result>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listCriteria(periodId: string, formType?: FormType, page = 1, limit = 20) {
    const query = this.criteria
      .createQueryBuilder('criterion')
      .leftJoinAndSelect('criterion.period', 'period')
      .where('criterion.period_id = :periodId', { periodId })
      .andWhere('criterion.form_type IN (:...formTypes)', {
        formTypes: [FormType.ENTERPRISE, FormType.SUPERVISOR],
      })
      .andWhere('criterion.active = true')
      .orderBy('criterion.category', 'ASC')
      .addOrderBy('criterion.code', 'ASC');
    if (formType) query.andWhere('criterion.form_type = :formType', { formType });
    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  criteriaForForm(periodId: string, formType: FormType) {
    return this.criteria.find({
      where: { periodId, formType, active: true },
      order: { category: 'ASC', code: 'ASC' },
    });
  }
  findCriteria(id: string) {
    return this.criteria.findOne({ where: { id } });
  }
  saveCriteria(value: Criteria) {
    return this.dataSource.transaction(async (manager) => {
      await this.lockPeriod(manager, value.periodId);
      if (await this.periodHasFormsInTransaction(manager, value.periodId))
        throw new Error('CRITERIA_LOCKED');
      return manager.save(Criteria, value);
    });
  }
  removeCriteria(value: Criteria) {
    return this.dataSource.transaction(async (manager) => {
      await this.lockPeriod(manager, value.periodId);
      if (await this.periodHasFormsInTransaction(manager, value.periodId))
        throw new Error('CRITERIA_LOCKED');
      if (await manager.getRepository(EvaluationDetail).exist({ where: { criteriaId: value.id } }))
        throw new Error('CRITERIA_USED');
      return manager.remove(Criteria, value);
    });
  }
  private async lockPeriod(manager: import('typeorm').EntityManager, periodId: string) {
    const period = await manager.findOne(InternshipPeriod, {
      where: { id: periodId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!period) throw new Error('PERIOD_MISSING');
    return period;
  }
  private async periodHasFormsInTransaction(
    manager: import('typeorm').EntityManager,
    periodId: string,
  ) {
    return (
      (await manager
        .getRepository(EvaluationForm)
        .createQueryBuilder('form')
        .innerJoin('form.profile', 'profile')
        .where('profile.period_id = :periodId', { periodId })
        .getCount()) > 0
    );
  }
  async periodHasForms(periodId: string) {
    return (
      (await this.forms
        .createQueryBuilder('form')
        .innerJoin('form.profile', 'profile')
        .where('profile.period_id = :periodId', { periodId })
        .getCount()) > 0
    );
  }
  async criteriaIsUsed(id: string) {
    return (
      (await this.dataSource.getRepository(EvaluationDetail).count({ where: { criteriaId: id } })) >
      0
    );
  }
  findProfile(id: string) {
    return this.profiles.findOne({
      where: { id },
      relations: { period: true, enterprise: true, supervisor: true },
    });
  }
  findEnterpriseRep(id: string) {
    return this.enterpriseReps.findOne({ where: { userId: id } });
  }
  listForms(profileId: string) {
    return this.forms.find({
      where: { profileId },
      relations: { details: { criteria: true }, report: true },
      order: { createdAt: 'ASC' },
    });
  }
  findForm(id: string) {
    return this.forms.findOne({
      where: { id },
      relations: {
        details: { criteria: true },
        profile: { period: true, enterprise: true, supervisor: true },
        report: true,
      },
    });
  }
  findFormForActor(profileId: string, formType: FormType, evaluatorId: string) {
    return this.forms.findOne({
      where: { profileId, formType, evaluatorId },
      relations: { details: { criteria: true }, profile: true, report: true },
    });
  }
  async createForm(profileId: string, formType: FormType, evaluatorId: string, reportId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(InternshipProfile, {
        where: { id: profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) throw new Error('PROFILE_MISSING');
      await this.lockPeriod(manager, profile.periodId);
      return manager.save(
        EvaluationForm,
        manager.create(EvaluationForm, {
          profileId,
          formType,
          evaluatorId,
          reportId: reportId ?? null,
          status: SubmissionStatus.DRAFT,
          submittedAt: null,
        }),
      );
    });
  }

  saveDraftDetails(
    formId: string,
    evaluatorId: string,
    details: Array<{ criteriaId: string; score: string; comment?: string }>,
    reportId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const form = await manager.findOne(EvaluationForm, {
        where: { id: formId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!form || form.evaluatorId !== evaluatorId) throw new Error('FORM_NOT_FOUND');
      if (form.status !== SubmissionStatus.DRAFT) throw new Error('FORM_LOCKED');
      if (reportId !== undefined) form.reportId = reportId;
      await manager.save(form);
      const detailsRepo = manager.getRepository(EvaluationDetail);
      await detailsRepo.delete({ formId });
      if (details.length)
        await detailsRepo.insert(
          details.map((detail) => ({
            formId,
            criteriaId: detail.criteriaId,
            score: detail.score,
            comment: detail.comment ?? null,
          })),
        );
      return form;
    });
  }

  async submitForm(formId: string, evaluatorId: string, reportId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const currentForm = await manager.findOne(EvaluationForm, { where: { id: formId } });
      if (!currentForm) throw new Error('FORM_NOT_FOUND');
      // All final-report uploads and supervisor submissions serialize on the profile row.
      await manager.findOne(InternshipProfile, {
        where: { id: currentForm.profileId },
        lock: { mode: 'pessimistic_write' },
      });
      const form = await manager.findOne(EvaluationForm, {
        where: { id: formId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!form || form.evaluatorId !== evaluatorId) throw new Error('FORM_NOT_FOUND');
      if (form.status !== SubmissionStatus.DRAFT) throw new Error('FORM_LOCKED');
      if (reportId !== undefined) form.reportId = reportId;
      if (form.formType === FormType.SUPERVISOR) {
        if (!form.reportId) throw new Error('REPORT_REQUIRED');
        const report = await manager.findOne(Report, {
          where: { id: form.reportId, profileId: form.profileId },
        });
        if (!report) throw new Error('REPORT_NOT_FOUND');
      }
      form.status = SubmissionStatus.SUBMITTED;
      form.submittedAt = new Date();
      return manager.save(form);
    });
  }

  async submittedForms(profileId: string) {
    return this.forms.find({
      where: {
        profileId,
        status: SubmissionStatus.SUBMITTED,
        formType: FormType.ENTERPRISE,
      } as never,
      relations: { details: { criteria: true } },
    });
  }
  async submittedForm(profileId: string, formType: FormType) {
    return this.forms.findOne({
      where: { profileId, formType, status: SubmissionStatus.SUBMITTED },
      relations: { details: { criteria: true } },
    });
  }
  getReport(reportId: string) {
    return this.dataSource.getRepository(Report).findOne({ where: { id: reportId } });
  }
  findResult(profileId: string) {
    return this.results.findOne({ where: { profileId } });
  }
  listAdjustments(resultId: string) {
    return this.dataSource
      .getRepository(ScoreAdjustment)
      .find({ where: { resultId }, order: { createdAt: 'ASC' } });
  }
  saveResult(result: Result) {
    return this.results.save(result);
  }
  transaction<T>(work: (manager: import('typeorm').EntityManager) => Promise<T>) {
    return this.dataSource.transaction(work);
  }
  async periodForCriteria(id: string) {
    return this.criteria.manager.getRepository(InternshipPeriod).findOne({ where: { id } });
  }
  async resultWithProfile(profileId: string) {
    return this.results.findOne({
      where: { profileId },
      relations: { profile: { period: true, enterprise: true, supervisor: true } },
    });
  }
  async saveAdjustment(adjustment: ScoreAdjustment) {
    return this.dataSource.getRepository(ScoreAdjustment).save(adjustment);
  }

  storeCalculatedResult(profileId: string, values: Partial<Result>) {
    return this.dataSource.transaction(async (manager) => {
      await manager.findOne(InternshipProfile, {
        where: { id: profileId },
        lock: { mode: 'pessimistic_write' },
      });
      const resultRepo = manager.getRepository(Result);
      const existing = await resultRepo.findOne({
        where: { profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (existing) return existing;
      return resultRepo.save(resultRepo.create({ profileId, ...values }));
    });
  }

  adjustResult(profileId: string, actorId: string, newScore: string, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.findOne(Result, {
        where: { profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!result) throw new Error('RESULT_NOT_FOUND');
      if (result.isFinalized) throw new Error('RESULT_FINALIZED');
      const oldScore = result.adjustedTotalScore ?? result.totalScore;
      result.adjustedTotalScore = newScore;
      result.totalScore = newScore;
      await manager.save(result);
      await manager.save(
        ScoreAdjustment,
        manager.create(ScoreAdjustment, {
          resultId: result.id,
          oldScore,
          newScore,
          reason,
          changedBy: actorId,
        }),
      );
      return result;
    });
  }

  finalizeResult(profileId: string, actorId: string) {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(InternshipProfile, {
        where: { id: profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !profile ||
        ![ProfileStatus.APPROVED, ProfileStatus.REPORT_SUBMITTED].includes(profile.status)
      )
        throw new Error('PROFILE_NOT_READY');
      const forms = await manager.getRepository(EvaluationForm).count({
        where: { profileId, status: SubmissionStatus.SUBMITTED, formType: FormType.ENTERPRISE },
      });
      const supervisorCount = await manager.getRepository(EvaluationForm).count({
        where: { profileId, status: SubmissionStatus.SUBMITTED, formType: FormType.SUPERVISOR },
      });
      if (forms !== 1 || supervisorCount !== 1) throw new Error('FORMS_INCOMPLETE');
      const result = await manager.findOne(Result, {
        where: { profileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!result) throw new Error('RESULT_NOT_FOUND');
      if (result.isFinalized) throw new Error('RESULT_FINALIZED');
      if (result.calculatedTotalScore === null) throw new Error('RESULT_NOT_CALCULATED');
      result.isFinalized = true;
      result.finalizedBy = actorId;
      result.finalizedAt = new Date();
      return manager.save(result);
    });
  }

  async publishResult(profileId: string) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.findOne(Result, {
        where: { profileId, isFinalized: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!result) return null;
      const newlyPublished = !result.publishedAt;
      if (newlyPublished) {
        result.publishedAt = new Date();
        await manager.save(result);
      }
      const complete = await manager.findOne(Result, {
        where: { id: result.id },
        relations: { profile: { period: true, enterprise: true, supervisor: true } },
      });
      return complete ? { result: complete, newlyPublished } : null;
    });
  }
}
