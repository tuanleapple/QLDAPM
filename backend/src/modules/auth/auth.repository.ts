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

  clearRefreshToken(id: string) {
    return this.users.update(id, { refreshTokenHash: null });
  }

  saveRefreshTokenHash(id: string, refreshTokenHash: string) {
    return this.users.update(id, { refreshTokenHash });
  }
}
