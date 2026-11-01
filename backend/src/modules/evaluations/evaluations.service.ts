import { calculateEvaluationScores } from './evaluation-score';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Criteria,
  CriteriaCategory,
  FormType,
  InternshipProfile,
  ProfileStatus,
  Result,
  ScoreAdjustment,
  SubmissionStatus,
  UserRole,
} from '../../database/entities.entity';
import { AuditLogService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EvaluationsRepository } from './evaluations.repository';

export interface CriteriaInput {
  code: string;
  name: string;
  category: CriteriaCategory;
  weight: number;
  active?: boolean;
}
export interface EvaluationDetailInput {
  criteriaId: string;
  score: number;
  comment?: string;
}

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly repository: EvaluationsRepository,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  listCriteria(periodId: string, formType?: FormType, page = 1, limit = 20) {
    return this.repository.listCriteria(periodId, formType, page, limit);
  }

  async getCriteria(id: string, role: string) {
    const criteria = await this.repository.findCriteria(id);
    if (!criteria || (!criteria.active && role !== UserRole.OFFICER))
      throw new NotFoundException('Criterion not found');
    return criteria;
  }

  async createCriteria(
    periodId: string,
    formType: FormType,
    input: CriteriaInput,
    actorId: string,
  ) {
    this.validateCategory(formType, input.category);
    if (!(await this.repository.periodForCriteria(periodId)))
      throw new NotFoundException('Internship period not found');
    if (await this.repository.periodHasForms(periodId))
      throw new BadRequestException(
        'Criteria cannot change after an evaluation form exists in this period',
      );
    const criteria = Object.assign(new Criteria(), {
      periodId,
      formType,
      ...input,
      weight: String(input.weight),
      active: input.active ?? true,
    });
    try {
      const saved = await this.repository.saveCriteria(criteria);
      await this.audit.record({
        actorId,
        action: 'CRITERION_CREATED',
        resource: 'criteria',
        resourceId: saved.id,
      });
      return saved;
    } catch (error) {
      const code = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (code === '23505')
        throw new ConflictException('Criterion code already exists in this period/form');
      this.mapCriteriaError(error);
    }
  }

  async updateCriteria(id: string, input: Partial<CriteriaInput>, actorId: string) {
    const criteria = await this.repository.findCriteria(id);
    if (!criteria) throw new NotFoundException('Criterion not found');
    if (await this.repository.periodHasForms(criteria.periodId))
      throw new BadRequestException(
        'Criteria cannot change after an evaluation form exists in this period',
      );
    if (input.category) this.validateCategory(criteria.formType as FormType, input.category);
    Object.assign(
      criteria,
      input,
      input.weight !== undefined ? { weight: String(input.weight) } : {},
    );
    let saved: Criteria;
    try {
      saved = await this.repository.saveCriteria(criteria);
    } catch (error) {
      this.mapCriteriaError(error);
    }
    await this.audit.record({
      actorId,
      action: 'CRITERION_UPDATED',
      resource: 'criteria',
      resourceId: id,
    });
    return saved!;
  }

  async deleteCriteria(id: string, actorId: string) {
    const criteria = await this.repository.findCriteria(id);
    if (!criteria) throw new NotFoundException('Criterion not found');
    if (
      (await this.repository.periodHasForms(criteria.periodId)) ||
      (await this.repository.criteriaIsUsed(id))
    )
      throw new BadRequestException(
        'Criteria cannot be deleted after forms or scores exist in the period',
      );
    try {
      await this.repository.removeCriteria(criteria);
    } catch (error) {
      this.mapCriteriaError(error);
    }
    await this.audit.record({
      actorId,
      action: 'CRITERION_DELETED',
      resource: 'criteria',
      resourceId: id,
    });
  }

  private validateCategory(formType: FormType, category: CriteriaCategory) {
    const valid =
      formType === FormType.ENTERPRISE
        ? category === CriteriaCategory.ENTERPRISE
        : [CriteriaCategory.PROCESS, CriteriaCategory.REPORT].includes(category);
    if (!valid) throw new BadRequestException('Criterion category does not match evaluation type');
  }

  private mapCriteriaError(error: unknown): never {
    const marker = error instanceof Error ? error.message : '';
    if (marker === 'CRITERIA_LOCKED')
      throw new BadRequestException(
        'Criteria cannot change after an evaluation form exists in this period',
      );
    if (marker === 'CRITERIA_USED')
      throw new BadRequestException('Criteria cannot be deleted after scores exist');
    if (marker === 'PERIOD_MISSING') throw new NotFoundException('Internship period not found');
    throw error;
  }

  private async profileForActor(
    profileId: string,
    actorId: string,
    role: UserRole,
    formType?: FormType,
  ) {
    const profile = await this.repository.findProfile(profileId);
    if (!profile) throw new NotFoundException('Internship profile not found');
    let allowed = false;
    if (role === UserRole.OFFICER) allowed = true;
    if (role === UserRole.SUPERVISOR && formType === FormType.SUPERVISOR)
      allowed = profile.supervisorId === actorId;
    if (role === UserRole.ENTERPRISE_REP && formType === FormType.ENTERPRISE) {
      const representative = await this.repository.findEnterpriseRep(actorId);
      allowed = !!representative && representative.enterpriseId === profile.enterpriseId;
    }
    if (!allowed) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'evaluation',
        resourceId: profileId,
      });
      throw new ForbiddenException('No access to this evaluation resource');
    }
    if (![ProfileStatus.APPROVED, ProfileStatus.REPORT_SUBMITTED].includes(profile.status))
      throw new BadRequestException('Evaluation requires an approved profile');
    return profile;
  }

  private allowedFormType(role: UserRole, type: FormType) {
    if (role === UserRole.ENTERPRISE_REP && type === FormType.ENTERPRISE) return;
    if (role === UserRole.SUPERVISOR && type === FormType.SUPERVISOR) return;
    if (role === UserRole.OFFICER)
      throw new ForbiddenException(
        'Officers manage criteria and results; they do not submit evaluation forms',
      );
    throw new ForbiddenException('Role cannot submit this evaluation type');
  }

  async listForms(profileId: string, actorId: string, role: UserRole) {
    const visibleType =
      role === UserRole.ENTERPRISE_REP
        ? FormType.ENTERPRISE
        : role === UserRole.SUPERVISOR
          ? FormType.SUPERVISOR
          : undefined;
    await this.profileForActor(profileId, actorId, role, visibleType);
    const forms = await this.repository.listForms(profileId);
    return forms.filter(
      (form) =>
        [FormType.ENTERPRISE, FormType.SUPERVISOR].includes(form.formType as FormType) &&
        (role === UserRole.OFFICER ||
          (form.formType === visibleType && form.evaluatorId === actorId)),
    );
  }

  async getForm(id: string, actorId: string, role: UserRole) {
    const form = await this.repository.findForm(id);
    if (!form || ![FormType.ENTERPRISE, FormType.SUPERVISOR].includes(form.formType as FormType))
      throw new NotFoundException('Evaluation form not found');
    await this.profileForActor(form.profileId, actorId, role, form.formType as FormType);
    if (form.evaluatorId !== actorId && role !== UserRole.OFFICER) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'evaluation_form',
        resourceId: id,
      });
      throw new ForbiddenException('Only the evaluator and officer can read this form');
    }
    return form;
  }

  async createForm(profileId: string, formType: FormType, actorId: string, role: UserRole) {
    this.allowedFormType(role, formType);
    await this.profileForActor(profileId, actorId, role, formType);
    const existing = await this.repository.findFormForActor(profileId, formType, actorId);
    if (existing) return existing;
    try {
      return await this.repository.createForm(profileId, formType, actorId);
    } catch (error) {
      const code = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (code === '23505')
        throw new ConflictException(
          'An evaluation form of this type already exists for the profile',
        );
      const marker = error instanceof Error ? error.message : '';
      if (marker === 'PROFILE_MISSING') throw new NotFoundException('Internship profile not found');
      if (marker === 'PERIOD_MISSING') throw new NotFoundException('Internship period not found');
      throw error;
    }
  }

  async saveDraft(
    formId: string,
    actorId: string,
    role: UserRole,
    details: EvaluationDetailInput[],
    reportId?: string,
  ) {
    const form = await this.repository.findForm(formId);
    if (!form) throw new NotFoundException('Evaluation form not found');
    this.allowedFormType(role, form.formType as FormType);
    const profile = await this.profileForActor(
      form.profileId,
      actorId,
      role,
      form.formType as FormType,
    );
    if (form.evaluatorId !== actorId)
      throw new ForbiddenException('Only the assigned evaluator can edit this form');
    if (form.status !== SubmissionStatus.DRAFT)
      throw new BadRequestException('Submitted evaluation forms are locked');
    const criteria = await this.repository.criteriaForForm(
      profile.periodId,
      form.formType as FormType,
    );
    const byId = new Map(criteria.map((item) => [item.id, item]));
    const seen = new Set<string>();
    for (const detail of details) {
      if (seen.has(detail.criteriaId))
        throw new BadRequestException('A criterion may appear only once');
      seen.add(detail.criteriaId);
      if (!byId.has(detail.criteriaId))
        throw new BadRequestException(
          'Criterion is not valid for this profile period and form type',
        );
      if (!Number.isFinite(detail.score) || detail.score < 0 || detail.score > 10)
        throw new BadRequestException('Scores must be between 0 and 10');
    }
    if (form.formType === FormType.ENTERPRISE && reportId)
      throw new BadRequestException('Enterprise form cannot reference a report');
    if (reportId) {
      const report = await this.repository.getReport(reportId);
      if (!report) throw new NotFoundException('Report version not found');
      if (report.profileId !== form.profileId)
        throw new BadRequestException('Selected report version belongs to another profile');
    }
    try {
      await this.repository.saveDraftDetails(
        formId,
        actorId,
        details.map((detail) => ({ ...detail, score: new Decimal(detail.score).toFixed(2) })),
        reportId,
      );
    } catch (error) {
      this.mapFormError(error);
    }
    return this.repository.findForm(formId);
  }

  async submitForm(
    formId: string,
    actorId: string,
    role: UserRole,
    details: EvaluationDetailInput[],
    reportId?: string,
  ) {
    const form = await this.repository.findForm(formId);
    if (!form) throw new NotFoundException('Evaluation form not found');
    this.allowedFormType(role, form.formType as FormType);
    const profile = await this.profileForActor(
      form.profileId,
      actorId,
      role,
      form.formType as FormType,
    );
    if (form.evaluatorId !== actorId)
      throw new ForbiddenException('Only the assigned evaluator can submit this form');
    if (form.status !== SubmissionStatus.DRAFT)
      throw new BadRequestException('Submitted evaluation forms are locked');
    const criteria = await this.repository.criteriaForForm(
      profile.periodId,
      form.formType as FormType,
    );
    const currentDetails = await this.saveDraft(
      formId,
      actorId,
      role,
      details,
      reportId ?? form.reportId ?? undefined,
    );
    const detailIds = new Set((currentDetails?.details ?? []).map((detail) => detail.criteriaId));
    if (criteria.length === 0 || criteria.some((criterion) => !detailIds.has(criterion.id)))
      throw new BadRequestException('Every active criterion must have a score before submission');
    if (form.formType === FormType.SUPERVISOR) {
      const categories = new Set(
        criteria
          .filter((criterion) => detailIds.has(criterion.id))
          .map((criterion) => criterion.category),
      );
      if (!categories.has(CriteriaCategory.PROCESS) || !categories.has(CriteriaCategory.REPORT))
        throw new BadRequestException('Supervisor form requires PROCESS and REPORT criteria');
      const reportIdToEvaluate = reportId ?? form.reportId;
      if (!reportIdToEvaluate)
        throw new BadRequestException(
          'A report version must be selected for supervisor evaluation',
        );
      const report = await this.repository.getReport(reportIdToEvaluate);
      if (!report || report.profileId !== form.profileId)
        throw new BadRequestException('Selected report version does not belong to this profile');
    }
    try {
      await this.repository.submitForm(formId, actorId, reportId ?? form.reportId ?? undefined);
    } catch (error) {
      this.mapFormError(error);
    }
    await this.notifications.notify(
      profile.studentId,
      'Evaluation submitted',
      `The ${form.formType} evaluation for your internship has been submitted.`,
    );
    await this.calculateResultIfReady(profile);
    return this.repository.findForm(formId);
  }

  private async calculateResultIfReady(profile: InternshipProfile) {
    const enterprise = await this.repository.submittedForm(profile.id, FormType.ENTERPRISE);
    const supervisor = await this.repository.submittedForm(profile.id, FormType.SUPERVISOR);
    if (!enterprise || !supervisor) return;
    const scores = calculateEvaluationScores(enterprise, supervisor, profile.period);
    await this.repository.storeCalculatedResult(profile.id, {
      ...scores,
      adjustedTotalScore: null,
      isFinalized: false,
      publishedAt: null,
      finalizedBy: null,
      finalizedAt: null,
    });
  }

  async adjustResult(profileId: string, actorId: string, score: number, reason: string) {
    if (!Number.isFinite(score) || score < 0 || score > 10)
      throw new BadRequestException('Adjusted score must be between 0 and 10');
    if (!reason.trim()) throw new BadRequestException('Adjustment reason is required');
    try {
      const result = await this.repository.adjustResult(
        profileId,
        actorId,
        new Decimal(score).toFixed(2),
        reason.trim(),
      );
      await this.audit.record({
        actorId,
        action: 'RESULT_SCORE_ADJUSTED',
        resource: 'result',
        resourceId: result.id,
        metadata: { newScore: new Decimal(score).toFixed(2) },
      });
      const adjustments = await this.repository.listAdjustments(result.id);
      return this.safeResult(result, adjustments);
    } catch (error) {
      this.mapResultError(error);
    }
  }

  async finalizeResult(profileId: string, actorId: string) {
    try {
      const result = await this.repository.finalizeResult(profileId, actorId);
      await this.audit.record({
        actorId,
        action: 'RESULT_FINALIZED',
        resource: 'result',
        resourceId: result.id,
      });
      return this.safeResult(result, await this.repository.listAdjustments(result.id));
    } catch (error) {
      this.mapResultError(error);
    }
  }

  async publishResult(profileId: string, actorId: string) {
    const published = await this.repository.publishResult(profileId);
    if (!published) throw new NotFoundException('Finalized result not found');
    if (published.newlyPublished) {
      await this.notifications.notify(
        published.result.profile.studentId,
        'Internship result published',
        'Your internship result is now available.',
      );
      await this.audit.record({
        actorId,
        action: 'RESULT_PUBLISHED',
        resource: 'result',
        resourceId: published.result.id,
      });
    }
    return this.safeResult(
      published.result,
      await this.repository.listAdjustments(published.result.id),
    );
  }

  async getResult(profileId: string, actorId: string, role: UserRole) {
    const result = await this.repository.resultWithProfile(profileId);
    if (!result) throw new NotFoundException('Result not found');
    if (role === UserRole.STUDENT && result.profile.studentId !== actorId) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'result',
        resourceId: result.id,
      });
      throw new ForbiddenException('Result belongs to another student');
    }
    if (role === UserRole.STUDENT && !result.publishedAt)
      throw new NotFoundException('Result has not been published');
    if (![UserRole.STUDENT, UserRole.OFFICER].includes(role))
      throw new ForbiddenException('Role cannot access final result');
    return this.safeResult(
      result,
      role === UserRole.OFFICER ? await this.repository.listAdjustments(result.id) : [],
    );
  }

  private safeResult(result: Result, adjustments: ScoreAdjustment[] = []) {
    return {
      id: result.id,
      profileId: result.profileId,
      enterpriseScore: result.enterpriseScore
        ? new Decimal(result.enterpriseScore).toFixed(2)
        : null,
      supervisorProcessScore: result.supervisorProcessScore
        ? new Decimal(result.supervisorProcessScore).toFixed(2)
        : null,
      supervisorReportScore: result.supervisorReportScore
        ? new Decimal(result.supervisorReportScore).toFixed(2)
        : null,
      calculatedTotalScore: result.calculatedTotalScore
        ? new Decimal(result.calculatedTotalScore).toFixed(2)
        : null,
      adjustedTotalScore: result.adjustedTotalScore
        ? new Decimal(result.adjustedTotalScore).toFixed(2)
        : null,
      totalScore: new Decimal(result.totalScore).toFixed(2),
      isFinalized: result.isFinalized,
      publishedAt: result.publishedAt,
      finalizedAt: result.finalizedAt,
      adjustments: adjustments.map((item) => ({
        id: item.id,
        oldScore: new Decimal(item.oldScore).toFixed(2),
        newScore: new Decimal(item.newScore).toFixed(2),
        reason: item.reason,
        changedBy: item.changedBy,
        createdAt: item.createdAt,
      })),
      profile: result.profile
        ? {
            id: result.profile.id,
            status: result.profile.status,
            period: result.profile.period,
            enterprise: result.profile.enterprise,
            supervisor: result.profile.supervisor,
          }
        : undefined,
    };
  }

  private mapFormError(error: unknown): never {
    const marker = error instanceof Error ? error.message : '';
    if (marker === 'FORM_NOT_FOUND') throw new NotFoundException('Evaluation form not found');
    if (marker === 'FORM_LOCKED')
      throw new BadRequestException('Submitted evaluation forms are locked');
    if (marker === 'REPORT_REQUIRED')
      throw new BadRequestException('Supervisor evaluation requires a submitted report');
    if (marker === 'REPORT_NOT_FOUND')
      throw new BadRequestException('Selected report version does not belong to the profile');
    throw error;
  }
  private mapResultError(error: unknown): never {
    const marker = error instanceof Error ? error.message : '';
    if (marker === 'RESULT_NOT_FOUND') throw new NotFoundException('Calculated result not found');
    if (marker === 'RESULT_FINALIZED')
      throw new BadRequestException('Finalized results cannot be changed');
    if (marker === 'FORMS_INCOMPLETE')
      throw new BadRequestException(
        'Both submitted evaluation forms are required before finalization',
      );
    if (marker === 'PROFILE_NOT_READY')
      throw new BadRequestException('Profile is not in a result-eligible state');
    if (marker === 'RESULT_NOT_CALCULATED')
      throw new BadRequestException('Result has not been calculated');
    throw error;
  }
}
