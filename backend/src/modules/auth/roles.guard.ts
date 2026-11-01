import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest } from './auth.guard';
import { ROLES_KEY } from './roles.decorator';
import { AuditLogService } from '../audit/audit.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!required.includes(request.user?.role as UserRole)) {
      await this.audit.record({
        actorId: request.user?.id ?? null,
        action: 'ACCESS_DENIED',
        resource: request.route?.path ?? request.path,
        metadata: { method: request.method, role: request.user?.role },
      });
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
