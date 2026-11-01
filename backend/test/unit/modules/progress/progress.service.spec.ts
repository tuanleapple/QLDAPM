import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProfileStatus, UserRole } from '../../../../src/database/entities.entity';
import { ProgressRepository } from '../../../../src/modules/progress/progress.repository';
import { ProgressService } from '../../../../src/modules/progress/progress.service';

describe('ProgressService', () => {
  const build = () => {
    const repository = {
      findProfile: jest.fn(),
      findUpdate: jest.fn(),
      listUpdates: jest.fn(),
      saveUpdate: jest.fn(),
      isFinalized: jest.fn(),
      findComment: jest.fn(),
      saveComment: jest.fn(),
    } as unknown as jest.Mocked<ProgressRepository>;
    const audit = { record: jest.fn() };
    return { service: new ProgressService(repository, audit as never), repository, audit };
  };

  it('denies a student access to another student profile and records the denial', async () => {
    const { service, repository, audit } = build();
    repository.findProfile = jest
      .fn()
      .mockResolvedValue({ id: 'profile-id', studentId: 'owner-id' } as never);

    await expect(
      service.list('profile-id', 'other-id', UserRole.STUDENT, 1, 20),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RESOURCE_ACCESS_DENIED' }),
    );
    expect(repository.listUpdates).not.toHaveBeenCalled();
  });

  it('allows the owning student to write progress while the result is not finalized', async () => {
    const { service, repository } = build();
    repository.findProfile = jest.fn().mockResolvedValue({
      id: 'profile-id',
      studentId: 'student-id',
      status: ProfileStatus.APPROVED,
    } as never);
    repository.isFinalized = jest.fn().mockResolvedValue(false);
    repository.saveUpdate = jest.fn(async (update) => update as never);

    const update = await service.create('profile-id', 'student-id', UserRole.STUDENT, {
      reportPeriod: 'Week 1',
      work: 'Built an API',
      outcome: 'Endpoint available',
      difficulties: 'None',
    });

    expect(update).toMatchObject({
      profileId: 'profile-id',
      createdBy: 'student-id',
      work: 'Built an API',
    });
  });

  it('locks progress after the result is finalized', async () => {
    const { service, repository } = build();
    repository.findProfile = jest.fn().mockResolvedValue({
      id: 'profile-id',
      studentId: 'student-id',
      status: ProfileStatus.REPORT_SUBMITTED,
    } as never);
    repository.isFinalized = jest.fn().mockResolvedValue(true);

    await expect(
      service.create('profile-id', 'student-id', UserRole.STUDENT, {
        reportPeriod: 'Week 1',
        work: 'Built an API',
        outcome: 'Endpoint available',
        difficulties: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.saveUpdate).not.toHaveBeenCalled();
  });
});
