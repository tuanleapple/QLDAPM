import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, User, UserRole } from '../../../../src/database/entities.entity';
import { AuthUserRepository } from '../../../../src/modules/auth/auth.repository';
import { AuthService } from '../../../../src/modules/auth/auth.service';

describe('AuthService', () => {
  const build = () => {
    const users = {
      findByEmailWithPassword: jest.fn(),
      findActiveById: jest.fn(),
      findActiveByIdWithPassword: jest.fn(),
      updatePasswordAndClearSession: jest.fn(),
      saveRefreshTokenHash: jest.fn(),
      clearRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<AuthUserRepository>;
    const config = new ConfigService({
      auth: {
        accessSecret: 'test-access-secret-which-is-long-enough',
        refreshSecret: 'test-refresh-secret-which-is-long-enough',
        accessTtlSeconds: 900,
        refreshTtlSeconds: 3600,
      },
    });
    return { users, service: new AuthService(users, config) };
  };

  it('changes password only after validating the current password and clears refresh session', async () => {
    const { users, service } = build();
    const passwordHash = await service.hashPassword('current-password-123');
    users.findActiveByIdWithPassword = jest.fn().mockResolvedValue({
      id: 'student-id',
      passwordHash,
      status: AccountStatus.ACTIVE,
    } as User);

    await expect(
      service.changePassword('student-id', 'current-password-123', 'new-password-1234'),
    ).resolves.toEqual({ success: true });

    const [savedId, savedHash] = (users.updatePasswordAndClearSession as jest.Mock).mock.calls[0];
    expect(savedId).toBe('student-id');
    expect(await service.verifyPassword('new-password-1234', savedHash)).toBe(true);
  });

  it('rejects a wrong current password without changing the account', async () => {
    const { users, service } = build();
    const passwordHash = await service.hashPassword('current-password-123');
    users.findActiveByIdWithPassword = jest
      .fn()
      .mockResolvedValue({ id: 'student-id', passwordHash } as User);

    await expect(
      service.changePassword('student-id', 'wrong-password', 'new-password-1234'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.updatePasswordAndClearSession).not.toHaveBeenCalled();
  });

  it('denies an access token when its account is no longer active', async () => {
    const { users, service } = build();
    const token = (
      service as unknown as { sign: (user: object, type: 'access', ttl: number) => string }
    ).sign(
      { id: 'student-id', email: 'student@example.test', role: UserRole.STUDENT },
      'access',
      900,
    );
    users.findActiveById = jest.fn().mockResolvedValue(null);

    await expect(service.authenticateAccessToken(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
