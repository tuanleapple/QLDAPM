import { ForbiddenException } from '@nestjs/common';
import { AccountStatus, User, UserRole } from '../../../../src/database/entities.entity';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { UsersRepository } from '../../../../src/modules/users/users.repository';
import { UsersService } from '../../../../src/modules/users/users.service';

describe('UsersService', () => {
  it('cannot lock the current officer account', async () => {
    const repository = { findEntity: jest.fn(), save: jest.fn() } as unknown as UsersRepository;
    const service = new UsersService(repository, {} as AuthService, { record: jest.fn() } as never);

    await expect(service.setLocked('officer-id', true, 'officer-id')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.findEntity).not.toHaveBeenCalled();
  });

  it('locks an account and revokes its refresh token', async () => {
    const user = Object.assign(new User(), {
      id: 'student-id',
      email: 'student@example.test',
      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
      refreshTokenHash: 'hash',
    });
    const repository = {
      findEntity: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockImplementation(async (saved) => saved),
      find: jest.fn().mockResolvedValue({ id: user.id, status: AccountStatus.LOCKED }),
    } as unknown as UsersRepository;
    const audit = { record: jest.fn() };
    const service = new UsersService(repository, {} as AuthService, audit as never);

    await service.setLocked('student-id', true, 'officer-id');

    expect(user.status).toBe(AccountStatus.LOCKED);
    expect(user.refreshTokenHash).toBeNull();
    expect(repository.save).toHaveBeenCalledWith(user);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ACCOUNT_LOCKED' }),
    );
  });
});
