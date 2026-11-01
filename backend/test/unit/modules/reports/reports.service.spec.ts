import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { UserRole } from '../../../../src/database/entities.entity';
import { ReportsRepository } from '../../../../src/modules/reports/reports.repository';
import { ReportsService } from '../../../../src/modules/reports/reports.service';

function makeDocx(names: string[]): Buffer {
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  const centralParts = names.map((name) => {
    const nameBuffer = Buffer.from(name);
    const entry = Buffer.alloc(46 + nameBuffer.length);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(nameBuffer.length, 28);
    nameBuffer.copy(entry, 46);
    return entry;
  });
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(localHeader.length, 16);
  return Buffer.concat([localHeader, central, end]);
}

describe('ReportsService', () => {
  const build = () => {
    const repository = {
      findProfile: jest.fn(),
      findEnterpriseRep: jest.fn(),
    } as unknown as ReportsRepository;
    const service = new ReportsService(
      repository,
      new ConfigService({ storage: { reportsDirectory: '/tmp/reports-test' } }),
      { record: jest.fn() } as never,
      { notify: jest.fn() } as never,
    );
    return { service, repository };
  };

  it('accepts a PDF up to exactly 10 MiB and rejects a larger file', () => {
    const { service } = build();
    const validate = (
      service as unknown as { validateFile: (file: object) => unknown }
    ).validateFile.bind(service);
    const atLimit = Buffer.alloc(10 * 1024 * 1024);
    Buffer.from('%PDF-1.7').copy(atLimit);
    Buffer.from('%%EOF').copy(atLimit, atLimit.length - 5);
    expect(validate({ buffer: atLimit, size: atLimit.length, originalname: 'final.pdf' })).toEqual({
      extension: 'pdf',
      mimeType: 'application/pdf',
    });

    const tooLarge = Buffer.alloc(atLimit.length + 1);
    Buffer.from('%PDF-1.7').copy(tooLarge);
    Buffer.from('%%EOF').copy(tooLarge, tooLarge.length - 5);
    expect(() =>
      validate({ buffer: tooLarge, size: tooLarge.length, originalname: 'final.pdf' }),
    ).toThrow(BadRequestException);
  });

  it('checks DOCX package entries instead of trusting a .docx extension', () => {
    const { service } = build();
    const check = (
      service as unknown as { isDocxContainer: (buffer: Buffer) => boolean }
    ).isDocxContainer.bind(service);
    expect(check(makeDocx(['[Content_Types].xml', 'word/document.xml']))).toBe(true);
    expect(check(makeDocx(['readme.txt']))).toBe(false);
  });

  it('accepts the committed synthetic PDF and DOCX upload fixtures', async () => {
    const { service } = build();
    const validate = (
      service as unknown as { validateFile: (file: object) => unknown }
    ).validateFile.bind(service);
    const fixtureDirectory = resolve(__dirname, '../../../../tools/fixtures');
    const pdf = await readFile(resolve(fixtureDirectory, 'api-demo-report.pdf'));
    const docx = await readFile(resolve(fixtureDirectory, 'api-demo-report.docx'));

    expect(
      validate({ buffer: pdf, size: pdf.length, originalname: 'api-demo-report.pdf' }),
    ).toEqual({ extension: 'pdf', mimeType: 'application/pdf' });
    expect(
      validate({ buffer: docx, size: docx.length, originalname: 'api-demo-report.docx' }),
    ).toEqual({
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  });

  it('denies enterprise representatives before resolving report profile or file', async () => {
    const { service, repository } = build();

    await expect(
      service.upload('profile-id', 'rep-id', UserRole.ENTERPRISE_REP, {
        buffer: Buffer.from(''),
        originalname: 'report.pdf',
        mimetype: 'application/pdf',
        size: 0,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findProfile).not.toHaveBeenCalled();
  });
});
