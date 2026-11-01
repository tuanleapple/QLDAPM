import {
  InternshipProfile,
  ProfileStatus,
  StatusHistory,
} from '../../../../src/database/entities.entity';
import { InternshipsRepository } from '../../../../src/modules/internships/internships.repository';

describe('InternshipsRepository profile transitions', () => {
  it('locks the profile and saves the status and history in one transaction', async () => {
    const profile = Object.assign(new InternshipProfile(), {
      id: 'profile-id',
      status: ProfileStatus.SUBMITTED,
      studentId: 'student-id',
    });
    const manager = {
      findOne: jest.fn().mockResolvedValue(profile),
      save: jest.fn(async (_entity, value) => value),
      create: jest.fn((_entity, value) => value),
    };
    const profiles = { manager: { transaction: jest.fn((work) => work(manager)) } };
    const repository = new InternshipsRepository(
      {} as never,
      profiles as never,
      {} as never,
      {} as never,
    );

    await repository.transitionProfile(
      'profile-id',
      ProfileStatus.SUBMITTED,
      'officer-id',
      ProfileStatus.APPROVED,
      undefined,
      'supervisor-id',
    );

    expect(manager.findOne).toHaveBeenCalledWith(InternshipProfile, {
      where: { id: 'profile-id' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenCalledWith(
      InternshipProfile,
      expect.objectContaining({
        status: ProfileStatus.APPROVED,
        supervisorId: 'supervisor-id',
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      StatusHistory,
      expect.objectContaining({
        fromStatus: ProfileStatus.SUBMITTED,
        toStatus: ProfileStatus.APPROVED,
        changedBy: 'officer-id',
      }),
    );
  });

  it('rejects a stale transition after the locked status has changed', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 'profile-id', status: ProfileStatus.APPROVED }),
      save: jest.fn(),
      create: jest.fn(),
    };
    const profiles = { manager: { transaction: jest.fn((work) => work(manager)) } };
    const repository = new InternshipsRepository(
      {} as never,
      profiles as never,
      {} as never,
      {} as never,
    );

    await expect(
      repository.transitionProfile(
        'profile-id',
        ProfileStatus.SUBMITTED,
        'officer-id',
        ProfileStatus.REJECTED,
      ),
    ).rejects.toThrow('PROFILE_CHANGED');
    expect(manager.save).not.toHaveBeenCalled();
  });
});
