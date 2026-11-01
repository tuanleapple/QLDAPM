import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly repository: AuditRepository) {}

  async record(values: {
    actorId: string | null;
    action: string;
    resource?: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.repository.save({
        actorId: values.actorId,
        action: values.action,
        resource: values.resource ?? null,
        resourceId: values.resourceId ?? null,
        metadata: values.metadata ?? null,
      });
    } catch {
      // Audit storage failure must never leak request credentials or hide the original denial.
      this.logger.error(`Failed to persist audit event ${values.action}`);
    }
  }
}
