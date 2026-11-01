import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { BadRequestException as HttpBadRequest } from '@nestjs/common';
import { InternshipProfile, Report, UserRole } from '../../database/entities.entity';
import { AuditLogService } from '../audit/audit.service';
import { ReportsRepository } from './reports.repository';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_REPORT_BYTES = 10 * 1024 * 1024;

export interface UploadedReport {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly storageDirectory: string;

  constructor(
    private readonly repository: ReportsRepository,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {
    this.storageDirectory = resolve(
      config.get<string>('storage.reportsDirectory', 'var/private-reports'),
    );
  }

  private async assertCanView(profile: InternshipProfile, actorId: string, role: UserRole) {
    let allowed = role === UserRole.OFFICER;
    if (role === UserRole.STUDENT) allowed = profile.studentId === actorId;
    if (role === UserRole.SUPERVISOR) allowed = profile.supervisorId === actorId;
    if (role === UserRole.ENTERPRISE_REP) {
      const representative = await this.repository.findEnterpriseRep(actorId);
      allowed = !!representative && representative.enterpriseId === profile.enterpriseId;
    }
    if (!allowed) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'report',
        resourceId: profile.id,
      });
      throw new ForbiddenException('Report is outside the current account scope');
    }
  }

  async list(profileId: string, actorId: string, role: UserRole, page: number, limit: number) {
    const profile = await this.repository.findProfile(profileId);
    if (!profile) throw new NotFoundException('Internship profile not found');
    await this.assertCanView(profile, actorId, role);
    const [items, total] = await this.repository.list(profileId, page, limit);
    return {
      items: items.map((item) => this.publicMetadata(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async upload(profileId: string, actorId: string, role: UserRole, file: UploadedReport) {
    if (role !== UserRole.STUDENT)
      throw new ForbiddenException('Only the student can submit the final report');
    const profile = await this.repository.findProfile(profileId);
    if (!profile) throw new NotFoundException('Internship profile not found');
    await this.assertCanView(profile, actorId, role);
    if (profile.studentId !== actorId) throw new ForbiddenException('Profile ownership required');
    const type = this.validateFile(file);
    const storageName = `${randomUUID()}.${type.extension}`;
    await mkdir(this.storageDirectory, { recursive: true, mode: 0o700 });
    const storedPath = join(this.storageDirectory, storageName);
    await writeFile(storedPath, file.buffer, { flag: 'wx', mode: 0o600 });
    let saved: Report;
    try {
      saved = await this.repository.saveVersion(profileId, {
        storageName,
        originalName: basename(file.originalname)
          .replace(/[\u0000-\u001f\u007f]/g, '')
          .slice(0, 255),
        mimeType: type.mimeType,
        sizeBytes: String(file.size),
      });
    } catch (error) {
      await unlink(storedPath).catch(() => undefined);
      this.throwUploadError(error);
    }
    await this.audit.record({
      actorId,
      action: 'FINAL_REPORT_UPLOADED',
      resource: 'report',
      resourceId: saved.id,
      metadata: { version: saved.version, sizeBytes: file.size },
    });
    if (profile.supervisorId)
      await this.notifications.notify(
        profile.supervisorId,
        'Final report submitted',
        `A new report version (${saved.version}) is ready for evaluation.`,
      );
    return this.publicMetadata(saved);
  }

  async getDownload(id: string, actorId: string, role: UserRole) {
    const report = await this.repository.findReport(id);
    if (!report) throw new NotFoundException('Report not found');
    if (role === UserRole.ENTERPRISE_REP) {
      await this.audit.record({
        actorId,
        action: 'RESOURCE_ACCESS_DENIED',
        resource: 'report_download',
        resourceId: id,
      });
      throw new ForbiddenException('Enterprise representatives cannot download final reports');
    }
    await this.assertCanView(report.profile, actorId, role);
    const path = join(this.storageDirectory, report.storageName);
    const canonicalPath = resolve(path);
    if (
      !canonicalPath.startsWith(
        `${this.storageDirectory}${process.platform === 'win32' ? '\\' : '/'}`,
      )
    )
      throw new NotFoundException('Report file not found');
    try {
      return { report, buffer: await readFile(canonicalPath) };
    } catch {
      throw new NotFoundException('Report file is unavailable');
    }
  }

  private publicMetadata(report: Report) {
    return Object.fromEntries(
      Object.entries(report).filter(([field]) => field !== 'storageName'),
    ) as Omit<Report, 'storageName'>;
  }

  private validateFile(file: UploadedReport): { extension: 'pdf' | 'docx'; mimeType: string } {
    if (
      !file?.buffer?.length ||
      file.size !== file.buffer.length ||
      file.buffer.length > MAX_REPORT_BYTES
    )
      throw new HttpBadRequest('Report file must be non-empty and no larger than 10 MB');
    const extension = extname(file.originalname).toLowerCase();
    const pdfHeader = file.buffer.subarray(0, 8).toString('ascii');
    const pdfTail = file.buffer.subarray(Math.max(0, file.buffer.length - 2048)).toString('latin1');
    if (extension === '.pdf' && /^%PDF-[12]\.\d$/.test(pdfHeader) && pdfTail.includes('%%EOF')) {
      return { extension: 'pdf', mimeType: 'application/pdf' };
    }
    if (extension === '.docx' && this.isDocxContainer(file.buffer)) {
      return {
        extension: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    }
    throw new BadRequestException('Only valid PDF or DOCX files are accepted');
  }

  /** Check ZIP central-directory entries, so a renamed ZIP is not accepted as a DOCX. */
  private isDocxContainer(buffer: Buffer): boolean {
    if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) return false;
    const minEocd = Math.max(0, buffer.length - 22 - 65535);
    let eocd = -1;
    for (let offset = buffer.length - 22; offset >= minEocd; offset -= 1) {
      if (buffer.readUInt32LE(offset) === 0x06054b50) {
        eocd = offset;
        break;
      }
    }
    if (eocd < 0) return false;
    const entries = buffer.readUInt16LE(eocd + 10);
    let offset = buffer.readUInt32LE(eocd + 16);
    const names = new Set<string>();
    for (let index = 0; index < entries; index += 1) {
      if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) return false;
      const nameLength = buffer.readUInt16LE(offset + 28);
      const extraLength = buffer.readUInt16LE(offset + 30);
      const commentLength = buffer.readUInt16LE(offset + 32);
      if (offset + 46 + nameLength + extraLength + commentLength > buffer.length) return false;
      names.add(buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8'));
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return names.has('[Content_Types].xml') && names.has('word/document.xml');
  }

  private throwUploadError(error: unknown): never {
    const marker = error instanceof Error ? error.message : '';
    if (marker === 'PROFILE_MISSING' || marker === 'PERIOD_MISSING')
      throw new NotFoundException('Profile or internship period not found');
    if (marker === 'RESULT_FINALIZED')
      throw new BadRequestException('No report can be submitted after result finalization');
    if (marker === 'SUPERVISOR_FORM_SUBMITTED')
      throw new BadRequestException(
        'No report can be submitted after supervisor evaluation is submitted',
      );
    if (marker === 'PROFILE_NOT_APPROVED')
      throw new BadRequestException('Profile must be approved before report submission');
    this.logger.error('Failed to store report metadata');
    throw new BadRequestException('Report upload could not be completed');
  }
}
