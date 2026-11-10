import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountStatus, User } from '../../database/entities.entity';

/** Persistence boundary for authentication-related user queries and token state. */
@Injectable()
export class AuthUserRepository {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .andWhere('user.status = :status', { status: AccountStatus.ACTIVE })
      .getOne();
  }

  findActiveByIdWithRefreshToken(id: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .andWhere('user.status = :status', { status: AccountStatus.ACTIVE })
      .getOne();
  }

  findActiveById(id: string) {
    return this.users.findOne({ where: { id, status: AccountStatus.ACTIVE } });
  }

  findActiveByIdWithPassword(id: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .andWhere('user.status = :status', { status: AccountStatus.ACTIVE })
      .getOne();
  }

  updatePasswordAndClearSession(id: string, passwordHash: string) {
    return this.users.update(id, { passwordHash, refreshTokenHash: null });
  }

  clearRefreshToken(id: string) {
    return this.users.update(id, { refreshTokenHash: null });
  }

  saveRefreshTokenHash(id: string, refreshTokenHash: string) {
    return this.users.update(id, { refreshTokenHash });
  }

  async findDisplayName(userId: string): Promise<string | null> {
    const rows = await this.users.query(
      `SELECT COALESCE(s.full_name, o.full_name, sp.full_name, er.full_name) AS "displayName"
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN officers o ON o.user_id = u.id
       LEFT JOIN supervisors sp ON sp.user_id = u.id
       LEFT JOIN enterprise_reps er ON er.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    return rows[0]?.displayName ?? null;
  }
}
