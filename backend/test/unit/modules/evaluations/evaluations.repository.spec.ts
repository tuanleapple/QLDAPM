import { ProfileStatus, Result, ScoreAdjustment } from '../../../../src/database/entities.entity';
import { EvaluationsRepository } from '../../../../src/modules/evaluations/evaluations.repository';

function repositoryWithTransaction(manager: Record<string, unknown>) {
  const dataSource = { transaction: jest.fn((work) => work(manager)) };
  return new EvaluationsRepository(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    dataSource as never,
  );
}

describe('EvaluationsRepository result transactions', () => {
  it('refuses finalization unless exactly one submitted form of each type exists', async () => {
    const count = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'profile-id', status: ProfileStatus.APPROVED })
        .mockResolvedValueOnce({
          id: 'result-id',
          profileId: 'profile-id',
          calculatedTotalScore: '8.20000000',
          isFinalized: false,
        }),
      getRepository: jest.fn(() => ({ count })),
      save: jest.fn(),
    };
    const repository = repositoryWithTransaction(manager);

    await expect(repository.finalizeResult('profile-id', 'officer-id')).rejects.toThrow(
      'FORMS_INCOMPLETE',
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('finalizes only after both forms and an eligible profile are rechecked inside the transaction', async () => {
    const result = Object.assign(new Result(), {
      id: 'result-id',
      profileId: 'profile-id',
      calculatedTotalScore: '8.20000000',
      isFinalized: false,
    });
    const count = jest.fn().mockResolvedValue(1);
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'profile-id', status: ProfileStatus.REPORT_SUBMITTED })
        .mockResolvedValueOnce(result),
      getRepository: jest.fn(() => ({ count })),
      save: jest.fn(async (entity, value) => value ?? entity),
    };
    const repository = repositoryWithTransaction(manager);

    const finalized = await repository.finalizeResult('profile-id', 'officer-id');

    expect(finalized).toMatchObject({ isFinalized: true, finalizedBy: 'officer-id' });
    expect(count).toHaveBeenCalledTimes(2);
  });

  it('stores adjustment history with the previous effective score and actor', async () => {
    const result = Object.assign(new Result(), {
      id: 'result-id',
      profileId: 'profile-id',
      totalScore: '8.20',
      adjustedTotalScore: null,
      isFinalized: false,
    });
    const manager = {
      findOne: jest.fn().mockResolvedValue(result),
      create: jest.fn((_entity, values) => values),
      save: jest.fn(async (entity, value) => value ?? entity),
    };
    const repository = repositoryWithTransaction(manager);

    await repository.adjustResult('profile-id', 'officer-id', '8.75', 'Correction reason');

    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ totalScore: '8.75', adjustedTotalScore: '8.75' }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      ScoreAdjustment,
      expect.objectContaining({
        oldScore: '8.20',
        newScore: '8.75',
        reason: 'Correction reason',
        changedBy: 'officer-id',
      }),
    );
  });
});
