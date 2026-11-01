import { ForbiddenException } from '@nestjs/common';
import {
  CriteriaCategory,
  FormType,
  ProfileStatus,
  SubmissionStatus,
  UserRole,
} from '../../../../src/database/entities.entity';
import { EvaluationsRepository } from '../../../../src/modules/evaluations/evaluations.repository';
import { EvaluationsService } from '../../../../src/modules/evaluations/evaluations.service';

describe('EvaluationsService', () => {
  it('uses enterprise/process/report averages and period weights without rounding intermediate values', async () => {
    const period = {
      enterpriseWeight: '0.4',
      supervisorProcessWeight: '0.3',
      supervisorReportWeight: '0.3',
    };
    const profile = {
      id: 'profile-id',
      studentId: 'student-id',
      enterpriseId: 'enterprise-id',
      supervisorId: 'supervisor-id',
      periodId: 'period-id',
      status: ProfileStatus.APPROVED,
      period,
    };
    const criteria = [
      { id: 'e1', category: CriteriaCategory.ENTERPRISE },
      { id: 'e2', category: CriteriaCategory.ENTERPRISE },
    ];
    const enterpriseDetails = [
      { criteriaId: 'e1', criteria: criteria[0], score: '8.00' },
      { criteriaId: 'e2', criteria: criteria[1], score: '9.00' },
    ];
    const process1 = { id: 'p1', category: CriteriaCategory.PROCESS };
    const process2 = { id: 'p2', category: CriteriaCategory.PROCESS };
    const report1 = { id: 'r1', category: CriteriaCategory.REPORT };
    const report2 = { id: 'r2', category: CriteriaCategory.REPORT };
    const supervisorForm = {
      details: [
        { criteria: process1, score: '7.00' },
        { criteria: process2, score: '8.00' },
        { criteria: report1, score: '8.00' },
        { criteria: report2, score: '9.00' },
      ],
    };
    const currentForm = {
      id: 'form-id',
      profileId: profile.id,
      evaluatorId: 'rep-id',
      formType: FormType.ENTERPRISE,
      status: SubmissionStatus.DRAFT,
      reportId: null,
      details: enterpriseDetails,
    };
    const repository = {
      findForm: jest.fn().mockResolvedValue(currentForm),
      findProfile: jest.fn().mockResolvedValue(profile),
      findEnterpriseRep: jest.fn().mockResolvedValue({ enterpriseId: profile.enterpriseId }),
      criteriaForForm: jest.fn().mockResolvedValue(criteria),
      saveDraftDetails: jest.fn().mockResolvedValue(undefined),
      submitForm: jest.fn().mockResolvedValue(undefined),
      submittedForm: jest
        .fn()
        .mockImplementation((_profileId, type) =>
          Promise.resolve(
            type === FormType.ENTERPRISE ? { details: enterpriseDetails } : supervisorForm,
          ),
        ),
      storeCalculatedResult: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<EvaluationsRepository>;
    const notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    const service = new EvaluationsService(
      repository,
      { record: jest.fn() } as never,
      notifications as never,
    );

    await service.submitForm('form-id', 'rep-id', UserRole.ENTERPRISE_REP, [
      { criteriaId: 'e1', score: 8 },
      { criteriaId: 'e2', score: 9 },
    ]);

    expect(repository.storeCalculatedResult).toHaveBeenCalledWith(
      'profile-id',
      expect.objectContaining({
        enterpriseScore: '8.50000000',
        supervisorProcessScore: '7.50000000',
        supervisorReportScore: '8.50000000',
        calculatedTotalScore: '8.20000000',
        totalScore: '8.20',
      }),
    );
  });

  it('denies a student access to another profile result and audits the denial', async () => {
    const repository = {
      resultWithProfile: jest.fn().mockResolvedValue({
        id: 'result-id',
        publishedAt: new Date(),
        profile: { studentId: 'owner-id' },
      }),
    } as unknown as EvaluationsRepository;
    const audit = { record: jest.fn() };
    const service = new EvaluationsService(
      repository,
      audit as never,
      { notify: jest.fn() } as never,
    );

    await expect(
      service.getResult('profile-id', 'other-student', UserRole.STUDENT),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RESOURCE_ACCESS_DENIED', resourceId: 'result-id' }),
    );
  });

  it('limits each evaluator to their own evaluation form in the profile form list', async () => {
    const profile = {
      id: 'profile-id',
      studentId: 'student-id',
      enterpriseId: 'enterprise-id',
      supervisorId: 'supervisor-id',
      status: ProfileStatus.APPROVED,
    };
    const repository = {
      findProfile: jest.fn().mockResolvedValue(profile),
      findEnterpriseRep: jest.fn().mockResolvedValue({ enterpriseId: profile.enterpriseId }),
      listForms: jest.fn().mockResolvedValue([
        { id: 'enterprise-form', formType: FormType.ENTERPRISE, evaluatorId: 'rep-id' },
        { id: 'supervisor-form', formType: FormType.SUPERVISOR, evaluatorId: 'supervisor-id' },
      ]),
    } as unknown as jest.Mocked<EvaluationsRepository>;
    const service = new EvaluationsService(
      repository,
      { record: jest.fn() } as never,
      { notify: jest.fn() } as never,
    );

    await expect(
      service.listForms('profile-id', 'rep-id', UserRole.ENTERPRISE_REP),
    ).resolves.toEqual([
      { id: 'enterprise-form', formType: FormType.ENTERPRISE, evaluatorId: 'rep-id' },
    ]);
  });

  it('hides inactive criteria from non-officers but permits officer detail review', async () => {
    const repository = {
      findCriteria: jest.fn().mockResolvedValue({ id: 'criterion-id', active: false }),
    } as unknown as jest.Mocked<EvaluationsRepository>;
    const service = new EvaluationsService(
      repository,
      { record: jest.fn() } as never,
      { notify: jest.fn() } as never,
    );

    await expect(service.getCriteria('criterion-id', UserRole.STUDENT)).rejects.toThrow(
      'Criterion not found',
    );
    await expect(service.getCriteria('criterion-id', UserRole.OFFICER)).resolves.toEqual({
      id: 'criterion-id',
      active: false,
    });
  });
});
