import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  InternshipProfile,
  ProfileStatus,
  UserRole,
} from '../../../../src/database/entities.entity';
import { InternshipsRepository } from '../../../../src/modules/internships/internships.repository';
import { InternshipsService } from '../../../../src/modules/internships/internships.service';

describe('InternshipsService', () => {
  const makeService = () => {
    const repository = {
      findProfile: jest.fn(),
      transitionProfile: jest.fn(),
      findActivePeriod: jest.fn(),
      findEnterprise: jest.fn(),
      listStatusHistory: jest.fn().mockResolvedValue([]),
      saveProfile: jest.fn(),
      listProfiles: jest.fn(),
      exportProfiles: jest.fn(),
      getStudentDashboard: jest.fn(),
      hasStatusHistory: jest.fn(),
      removeProfile: jest.fn(),
    } as unknown as InternshipsRepository;
    return {
      service: new InternshipsService(
        repository,
        { record: jest.fn() } as never,
        { notify: jest.fn(), notifyOfficers: jest.fn() } as never,
      ),
      repository,
    };
  };

  it('rejects profile reads for another student', async () => {
    const { service, repository } = makeService();
    repository.findProfile = jest.fn().mockResolvedValue({ studentId: 'owner-id' });

    await expect(
      service.getProfile('profile-id', 'other-id', UserRole.STUDENT),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates enterprise representative profile listing to a repository scope filter', () => {
    const { service, repository } = makeService();

    service.listProfiles('rep-id', UserRole.ENTERPRISE_REP, {
      page: 1,
      limit: 20,
    });

    expect(repository.listProfiles).toHaveBeenCalledWith(
      'rep-id',
      UserRole.ENTERPRISE_REP,
      expect.objectContaining({ page: 1 }),
    );
  });

  it('records a status history entry when submitting a draft', async () => {
    const { service, repository } = makeService();
    const profile = Object.assign(new InternshipProfile(), {
      id: 'profile-id',
      studentId: 'student-id',
      periodId: 'period-id',
      enterpriseId: 'enterprise-id',
      position: 'Backend intern',
      internshipStartAt: '2026-06-01',
      internshipEndAt: '2026-08-31',
      status: ProfileStatus.DRAFT,
    });
    repository.findProfile = jest.fn().mockResolvedValue(profile);
    repository.listStatusHistory = jest.fn().mockResolvedValue([]);
    repository.findProfile = jest.fn().mockResolvedValue(profile);
    repository.findPeriod = jest.fn().mockResolvedValue({
      active: true,
      registrationOpenAt: new Date(Date.now() - 60_000),
      registrationCloseAt: new Date(Date.now() + 60_000),
      startDate: '2026-01-01',
      endDate: '2027-12-31',
    });
    repository.transitionProfile = jest.fn(async (_id, _expected, _actor, status) => {
      profile.status = status;
      return profile;
    });

    await service.submit('profile-id', 'student-id');

    expect(profile.status).toBe(ProfileStatus.SUBMITTED);
    expect(repository.transitionProfile).toHaveBeenCalledWith(
      'profile-id',
      ProfileStatus.DRAFT,
      'student-id',
      ProfileStatus.SUBMITTED,
      undefined,
      undefined,
    );
  });

  it('requires a reason when an officer requests revision', async () => {
    const { service } = makeService();

    await expect(
      service.review('profile-id', 'officer-id', ProfileStatus.NEEDS_REVISION),
    ).rejects.toThrow('Review reason is required');
  });

  it('allows the owner to delete a draft without history', async () => {
    const { service, repository } = makeService();
    const profile = Object.assign(new InternshipProfile(), {
      id: 'profile-id',
      studentId: 'student-id',
      status: ProfileStatus.DRAFT,
    });
    repository.findProfile = jest.fn().mockResolvedValue(profile);
    repository.hasStatusHistory = jest.fn().mockResolvedValue(false);

    await service.removeDraft('profile-id', 'student-id');

    expect(repository.removeProfile).toHaveBeenCalledWith(profile);
  });

  it('neutralizes spreadsheet formulas in profile CSV output', async () => {
    const { service, repository } = makeService();
    repository.exportProfiles = jest.fn().mockResolvedValue([
      {
        profileId: '=HYPERLINK("https://example.test")',
        studentName: 'Student',
        status: 'APPROVED',
      },
    ]);

    const csv = await service.exportProfiles({});

    expect(csv).toContain("'=HYPERLINK(");
  });

  it('creates a draft without writing status history so the owner may delete it', async () => {
    const { service, repository } = makeService();
    repository.findActivePeriod = jest.fn().mockResolvedValue({
      id: 'period-id',
      registrationOpenAt: new Date(Date.now() - 60_000),
      registrationCloseAt: new Date(Date.now() + 60_000),
    });
    repository.findEnterprise = jest.fn().mockResolvedValue({ id: 'enterprise-id' });
    const savedProfile = Object.assign(new InternshipProfile(), {
      id: 'profile-id',
      status: ProfileStatus.DRAFT,
    });
    repository.saveProfile = jest.fn(async () => savedProfile);
    repository.findProfile = jest.fn().mockResolvedValue(savedProfile);

    const profile = await service.createProfile('student-id', {
      periodId: 'period-id',
      enterpriseId: 'enterprise-id',
      position: 'Internship topic',
    });

    expect(profile.status).toBe(ProfileStatus.DRAFT);
    expect(repository.transitionProfile).not.toHaveBeenCalled();
  });

  it('does not delete a submitted profile', async () => {
    const { service, repository } = makeService();
    repository.findProfile = jest.fn().mockResolvedValue({
      studentId: 'student-id',
      status: ProfileStatus.SUBMITTED,
    });

    await expect(service.removeDraft('profile-id', 'student-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.removeProfile).not.toHaveBeenCalled();
  });
});
