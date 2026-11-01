import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  EnterpriseRep,
  Officer,
  Student,
  Supervisor,
  User,
  UserRole,
} from '../../database/entities.entity';
import { AuthService } from '../auth/auth.service';
import { AuditLogService } from '../audit/audit.service';
import { UsersRepository } from './users.repository';

export interface CreateAccountInput {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  studentCode?: string;
  phone?: string;
  major?: string;
  department?: string;
  enterpriseId?: string;
}
export interface UpdateAccountInput {
  email?: string;
  fullName?: string;
  phone?: string;
  major?: string;
  department?: string;
  enterpriseId?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly auth: AuthService,
    private readonly audit: AuditLogService,
  ) {}

  list(page: number, limit: number, role?: string, search?: string) {
    return this.repository.list(page, limit, role, search);
  }

  async get(id: string) {
    const account = await this.repository.find(id);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async create(input: CreateAccountInput, actorId: string) {
    if (!input.fullName.trim()) throw new BadRequestException('fullName is required');
    if (input.role === UserRole.STUDENT && !input.studentCode?.trim())
      throw new BadRequestException('studentCode is required for STUDENT');
    if (input.role === UserRole.ENTERPRISE_REP && !input.enterpriseId)
      throw new BadRequestException('enterpriseId is required for ENTERPRISE_REP');
    const normalizedEmail = input.email.trim().toLowerCase();
    const passwordHash = await this.auth.hashPassword(input.password);
    try {
      const account = await this.repository.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const user = await userRepo.save(
          userRepo.create({
            email: normalizedEmail,
            passwordHash,
            role: input.role,
            status: AccountStatus.ACTIVE,
            refreshTokenHash: null,
          }),
        );
        if (input.role === UserRole.STUDENT)
          await manager.save(
            Student,
            manager.create(Student, {
              userId: user.id,
              studentCode: input.studentCode,
              fullName: input.fullName,
              phone: input.phone ?? null,
              major: input.major ?? null,
            }),
          );
        if (input.role === UserRole.OFFICER)
          await manager.save(
            Officer,
            manager.create(Officer, { userId: user.id, fullName: input.fullName }),
          );
        if (input.role === UserRole.SUPERVISOR)
          await manager.save(
            Supervisor,
            manager.create(Supervisor, {
              userId: user.id,
              fullName: input.fullName,
              department: input.department ?? null,
            }),
          );
        if (input.role === UserRole.ENTERPRISE_REP) {
          await manager.save(
            EnterpriseRep,
            manager.create(EnterpriseRep, {
              userId: user.id,
              enterpriseId: input.enterpriseId,
              fullName: input.fullName,
              phone: input.phone ?? null,
            }),
          );
        }
        return { id: user.id, email: user.email, role: user.role, status: user.status };
      });
      await this.audit.record({
        actorId,
        action: 'ACCOUNT_CREATED',
        resource: 'user',
        resourceId: account.id,
        metadata: { role: account.role },
      });
      return this.get(account.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      const code = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (code === '23505')
        throw new ConflictException('Account email or role profile conflicts with existing data');
      if (code === '23503')
        throw new NotFoundException('Enterprise not found for representative account');
      throw error;
    }
  }

  async update(id: string, input: UpdateAccountInput, actorId: string) {
    const user = await this.repository.findEntity(id);
    if (!user) throw new NotFoundException('Account not found');
    if (input.email) user.email = input.email.trim().toLowerCase();
    try {
      await this.repository.transaction(async (manager) => {
        await manager.save(User, user);
        const { role } = user;
        if (role === UserRole.STUDENT)
          await manager.update(
            Student,
            { userId: id },
            {
              ...(input.fullName ? { fullName: input.fullName } : {}),
              ...(input.phone !== undefined ? { phone: input.phone } : {}),
              ...(input.major !== undefined ? { major: input.major } : {}),
            },
          );
        if (role === UserRole.OFFICER && input.fullName)
          await manager.update(Officer, { userId: id }, { fullName: input.fullName });
        if (role === UserRole.SUPERVISOR)
          await manager.update(
            Supervisor,
            { userId: id },
            {
              ...(input.fullName ? { fullName: input.fullName } : {}),
              ...(input.department !== undefined ? { department: input.department } : {}),
            },
          );
        if (role === UserRole.ENTERPRISE_REP)
          await manager.update(
            EnterpriseRep,
            { userId: id },
            {
              ...(input.fullName ? { fullName: input.fullName } : {}),
              ...(input.phone !== undefined ? { phone: input.phone } : {}),
              ...(input.enterpriseId ? { enterpriseId: input.enterpriseId } : {}),
            },
          );
      });
    } catch (error) {
      const code = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (code === '23505')
        throw new ConflictException(
          'Account email or role profile update conflicts with existing data',
        );
      if (code === '23503')
        throw new NotFoundException('Enterprise not found for representative account');
      throw error;
    }
    await this.audit.record({
      actorId,
      action: 'ACCOUNT_UPDATED',
      resource: 'user',
      resourceId: id,
    });
    return this.get(id);
  }

  async setLocked(id: string, locked: boolean, actorId: string) {
    if (id === actorId && locked) throw new ForbiddenException('You cannot lock your own account');
    const user = await this.repository.findEntity(id);
    if (!user) throw new NotFoundException('Account not found');
    user.status = locked ? AccountStatus.LOCKED : AccountStatus.ACTIVE;
    user.refreshTokenHash = null;
    await this.repository.save(user);
    await this.audit.record({
      actorId,
      action: locked ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED',
      resource: 'user',
      resourceId: id,
    });
    return this.get(id);
  }
}
