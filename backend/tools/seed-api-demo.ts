import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import dataSource from '../src/database/data-source';
import {
  AccountStatus,
  CriteriaCategory,
  FormType,
  ProfileStatus,
  SubmissionStatus,
  UserRole,
} from '../src/database/entities.entity';
import { validateSeedTarget } from './seed-target';

const scrypt = promisify(scryptCallback);
const SEED_KEY = 'student-internship-api-demo';
const SEED_VERSION = 1;
export const DEMO_PASSWORD = 'LocalDemo!2026';
const DAY_MS = 24 * 60 * 60 * 1000;

const uuid = (number: number) => `00000000-0000-4000-8000-${number.toString(16).padStart(12, '0')}`;
const instant = (base: Date, days: number, hour = 12) => {
  const value = new Date(base.getTime() + days * DAY_MS);
  value.setUTCHours(hour, 0, 0, 0);
  return value;
};
const dateOnly = (base: Date, days: number) => instant(base, days).toISOString().slice(0, 10);

interface PeriodFixture {
  key: string;
  id: string;
  name: string;
  startOffset: number;
  endOffset: number;
  registrationOpenOffset: number;
  registrationCloseOffset: number;
  deadlineOffset: number;
}

const periods: PeriodFixture[] = [
  {
    key: 'notOpen',
    id: uuid(201),
    name: 'API Demo — registration not open',
    startOffset: 90,
    endOffset: 240,
    registrationOpenOffset: 30,
    registrationCloseOffset: 60,
    deadlineOffset: 280,
  },
  {
    key: 'open',
    id: uuid(202),
    name: 'API Demo — registration open',
    startOffset: 10,
    endOffset: 250,
    registrationOpenOffset: -120,
    registrationCloseOffset: 300,
    deadlineOffset: 280,
  },
  {
    key: 'ongoing',
    id: uuid(203),
    name: 'API Demo — registration closed, internship ongoing',
    startOffset: -20,
    endOffset: 110,
    registrationOpenOffset: -180,
    registrationCloseOffset: -30,
    deadlineOffset: 80,
  },
  {
    key: 'expired',
    id: uuid(204),
    name: 'API Demo — report deadline passed',
    startOffset: -500,
    endOffset: -100,
    registrationOpenOffset: -650,
    registrationCloseOffset: -550,
    deadlineOffset: -75,
  },
];

interface AccountFixture {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  fullName: string;
  studentCode?: string;
  enterpriseNumber?: number;
  department?: string;
}

const accounts: AccountFixture[] = [
  {
    id: uuid(1),
    email: 'officer01@example.test',
    role: UserRole.OFFICER,
    status: AccountStatus.ACTIVE,
    fullName: 'Demo Officer One',
  },
  {
    id: uuid(2),
    email: 'officer02@example.test',
    role: UserRole.OFFICER,
    status: AccountStatus.ACTIVE,
    fullName: 'Demo Officer Two',
  },
  ...[1, 2, 3].map((number) => ({
    id: uuid(10 + number),
    email: `supervisor${String(number).padStart(2, '0')}@example.test`,
    role: UserRole.SUPERVISOR,
    status: AccountStatus.ACTIVE,
    fullName: `Demo Supervisor ${number}`,
    department: `Demo Department ${number}`,
  })),
  ...[1, 2, 3].map((number) => ({
    id: uuid(20 + number),
    email: `representative${String(number).padStart(2, '0')}@example.test`,
    role: UserRole.ENTERPRISE_REP,
    status: AccountStatus.ACTIVE,
    fullName: `Demo Enterprise Representative ${number}`,
    enterpriseNumber: number,
  })),
  ...Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    return {
      id: uuid(30 + number),
      email: `student${String(number).padStart(2, '0')}@example.test`,
      role: UserRole.STUDENT,
      status: number === 12 ? AccountStatus.LOCKED : AccountStatus.ACTIVE,
      fullName: `Demo Student ${String(number).padStart(2, '0')}`,
      studentCode: `DEMO-S-${String(number).padStart(2, '0')}`,
    };
  }),
];

const enterprises = [
  {
    id: uuid(101),
    name: 'API Demo Company North',
    address: 'Local test address 1',
    phone: '+10000000001',
    website: 'https://north.example.test',
  },
  {
    id: uuid(102),
    name: 'API Demo Company South',
    address: 'Local test address 2',
    phone: '+10000000002',
    website: 'https://south.example.test',
  },
  {
    id: uuid(103),
    name: 'API Demo Company Central',
    address: 'Local test address 3',
    phone: '+10000000003',
    website: 'https://central.example.test',
  },
  {
    id: uuid(104),
    name: 'API Demo Company Without Profiles',
    address: 'Local test address 4',
    phone: '+10000000004',
    website: 'https://empty.example.test',
  },
];

type ProfileFixture = {
  id: string;
  studentNumber: number;
  periodKey: string;
  status: ProfileStatus;
  enterpriseNumber: number | null;
  supervisorNumber: number | null;
  createdOffset: number;
  submitOffset?: number;
  reviewOffset?: number;
  reportOffsets?: number[];
  reason?: string;
  title: string;
};

const profiles: ProfileFixture[] = [
  {
    id: uuid(301),
    studentNumber: 1,
    periodKey: 'open',
    status: ProfileStatus.DRAFT,
    enterpriseNumber: null,
    supervisorNumber: null,
    createdOffset: -1,
    title: '',
  },
  {
    id: uuid(302),
    studentNumber: 2,
    periodKey: 'open',
    status: ProfileStatus.SUBMITTED,
    enterpriseNumber: 1,
    supervisorNumber: null,
    createdOffset: -5,
    submitOffset: -4,
    title: 'Demo API profile awaiting review',
  },
  {
    id: uuid(303),
    studentNumber: 3,
    periodKey: 'open',
    status: ProfileStatus.NEEDS_REVISION,
    enterpriseNumber: 2,
    supervisorNumber: null,
    createdOffset: -70,
    submitOffset: -65,
    reviewOffset: -60,
    reason: 'Please add the internship end date.',
    title: 'Demo API profile needs revision',
  },
  {
    id: uuid(304),
    studentNumber: 4,
    periodKey: 'open',
    status: ProfileStatus.REJECTED,
    enterpriseNumber: 3,
    supervisorNumber: null,
    createdOffset: -90,
    submitOffset: -85,
    reviewOffset: -80,
    reason: 'The placement details do not meet the internship requirements.',
    title: 'Demo API rejected profile',
  },
  {
    id: uuid(305),
    studentNumber: 5,
    periodKey: 'ongoing',
    status: ProfileStatus.APPROVED,
    enterpriseNumber: 1,
    supervisorNumber: 1,
    createdOffset: -70,
    submitOffset: -65,
    reviewOffset: -60,
    title: 'Demo API approved profile without report',
  },
  {
    id: uuid(306),
    studentNumber: 6,
    periodKey: 'ongoing',
    status: ProfileStatus.REPORT_SUBMITTED,
    enterpriseNumber: 1,
    supervisorNumber: 1,
    createdOffset: -70,
    submitOffset: -65,
    reviewOffset: -60,
    reportOffsets: [-10, -8],
    title: 'Demo API profile with pending result',
  },
  {
    id: uuid(307),
    studentNumber: 7,
    periodKey: 'ongoing',
    status: ProfileStatus.REPORT_SUBMITTED,
    enterpriseNumber: 2,
    supervisorNumber: 2,
    createdOffset: -70,
    submitOffset: -65,
    reviewOffset: -60,
    reportOffsets: [-20, -15],
    title: 'Demo API profile with adjusted result',
  },
  {
    id: uuid(308),
    studentNumber: 8,
    periodKey: 'ongoing',
    status: ProfileStatus.REPORT_SUBMITTED,
    enterpriseNumber: 3,
    supervisorNumber: 3,
    createdOffset: -70,
    submitOffset: -65,
    reviewOffset: -60,
    reportOffsets: [-30],
    title: 'Demo API profile finalized but unpublished',
  },
  {
    id: uuid(309),
    studentNumber: 9,
    periodKey: 'expired',
    status: ProfileStatus.REPORT_SUBMITTED,
    enterpriseNumber: 1,
    supervisorNumber: 1,
    createdOffset: -600,
    submitOffset: -590,
    reviewOffset: -580,
    reportOffsets: [-60, -55],
    title: 'Demo API profile with late published result',
  },
  {
    id: uuid(310),
    studentNumber: 10,
    periodKey: 'ongoing',
    status: ProfileStatus.APPROVED,
    enterpriseNumber: 3,
    supervisorNumber: 3,
    createdOffset: -70,
    submitOffset: -65,
    reviewOffset: -60,
    title: 'Demo API profile with draft evaluation',
  },
];

type CriterionFixture = {
  id: string;
  periodId: string;
  formType: FormType;
  category: CriteriaCategory;
  code: string;
  name: string;
  weight: string;
  active: boolean;
};
const criteria: CriterionFixture[] = periods.flatMap((period, periodIndex) => {
  const base = 701 + periodIndex * 10;
  return [
    ...[1, 2, 3].map((n) => ({
      id: uuid(base + n),
      periodId: period.id,
      formType: FormType.ENTERPRISE,
      category: CriteriaCategory.ENTERPRISE,
      code: `ENT-${n}`,
      name: `Enterprise criterion ${n}`,
      weight: '0.33333',
      active: true,
    })),
    ...[1, 2].map((n) => ({
      id: uuid(base + 3 + n),
      periodId: period.id,
      formType: FormType.SUPERVISOR,
      category: CriteriaCategory.PROCESS,
      code: `PROC-${n}`,
      name: `Process criterion ${n}`,
      weight: '0.50000',
      active: true,
    })),
    ...[1, 2].map((n) => ({
      id: uuid(base + 5 + n),
      periodId: period.id,
      formType: FormType.SUPERVISOR,
      category: CriteriaCategory.REPORT,
      code: `REPORT-${n}`,
      name: `Report criterion ${n}`,
      weight: '0.50000',
      active: true,
    })),
    {
      id: uuid(base + 8),
      periodId: period.id,
      formType: FormType.ENTERPRISE,
      category: CriteriaCategory.ENTERPRISE,
      code: 'ENT-INACTIVE',
      name: 'Inactive demo criterion',
      weight: '0.00000',
      active: false,
    },
  ];
});

type ReportFixture = {
  id: string;
  profileNumber: number;
  version: number;
  file: 'pdf' | 'docx';
  offset: number;
};
const reports: ReportFixture[] = [
  { id: uuid(601), profileNumber: 306, version: 1, file: 'pdf', offset: -10 },
  { id: uuid(602), profileNumber: 306, version: 2, file: 'docx', offset: -8 },
  { id: uuid(603), profileNumber: 307, version: 1, file: 'pdf', offset: -20 },
  { id: uuid(604), profileNumber: 307, version: 2, file: 'docx', offset: -15 },
  { id: uuid(605), profileNumber: 308, version: 1, file: 'pdf', offset: -30 },
  { id: uuid(606), profileNumber: 309, version: 1, file: 'pdf', offset: -60 },
  { id: uuid(607), profileNumber: 309, version: 2, file: 'docx', offset: -55 },
];

const manifestShape = () => ({
  version: SEED_VERSION,
  seedKey: SEED_KEY,
  accounts: Object.fromEntries(
    accounts.map((account) => [
      account.email,
      {
        id: account.id,
        role: account.role,
        status: account.status,
        fullName: account.fullName,
        ...(account.studentCode ? { studentCode: account.studentCode } : {}),
        ...(account.enterpriseNumber ? { enterpriseId: uuid(100 + account.enterpriseNumber) } : {}),
      },
    ]),
  ),
  enterprises: Object.fromEntries(
    enterprises.map((enterprise, index) => [
      `company${index + 1}`,
      { id: enterprise.id, name: enterprise.name },
    ]),
  ),
  periods: Object.fromEntries(
    periods.map((period) => [period.key, { id: period.id, name: period.name }]),
  ),
  profiles: Object.fromEntries(
    profiles.map((profile) => [
      `student${String(profile.studentNumber).padStart(2, '0')}`,
      {
        id: profile.id,
        status: profile.status,
        periodId: periods.find((item) => item.key === profile.periodKey)!.id,
        studentId: uuid(30 + profile.studentNumber),
        enterpriseId: profile.enterpriseNumber ? uuid(100 + profile.enterpriseNumber) : null,
        supervisorId: profile.supervisorNumber ? uuid(10 + profile.supervisorNumber) : null,
      },
    ]),
  ),
  criteria: Object.fromEntries(
    criteria.map((criterion) => [
      criterion.code + '-' + criterion.periodId.slice(-2),
      {
        id: criterion.id,
        periodId: criterion.periodId,
        formType: criterion.formType,
        category: criterion.category,
        active: criterion.active,
      },
    ]),
  ),
  reports: Object.fromEntries(
    reports.map((report) => [
      `profile${report.profileNumber}-v${report.version}`,
      {
        id: report.id,
        profileId: uuid(report.profileNumber),
        version: report.version,
        file: report.file,
        offsetDays: report.offset,
        expectedLate:
          report.offset >
          periods.find(
            (period) =>
              period.key ===
              profiles.find((profile) => profile.id === uuid(report.profileNumber))!.periodKey,
          )!.deadlineOffset,
      },
    ]),
  ),
  forms: Object.fromEntries(
    forms.map((form) => {
      const latestReport =
        form.formType === FormType.SUPERVISOR ? reportForProfile(form.profileNumber) : undefined;
      return [
        `profile${form.profileNumber}-${form.formType.toLowerCase()}`,
        {
          id: form.id,
          profileId: uuid(form.profileNumber),
          formType: form.formType,
          status: form.status,
          evaluatorId: form.evaluatorId,
          reportId: latestReport?.id ?? null,
        },
      ];
    }),
  ),
  results: {
    pending: {
      id: uuid(1001),
      profileId: uuid(306),
      calculatedTotalScore: '8.40',
      finalized: false,
      published: false,
    },
    adjusted: {
      id: uuid(1002),
      profileId: uuid(307),
      calculatedTotalScore: '8.40',
      effectiveScore: '8.75',
      finalized: false,
      published: false,
      adjustmentId: uuid(1101),
    },
    finalizedUnpublished: {
      id: uuid(1003),
      profileId: uuid(308),
      calculatedTotalScore: '8.40',
      finalized: true,
      published: false,
    },
    published: {
      id: uuid(1004),
      profileId: uuid(309),
      calculatedTotalScore: '8.40',
      finalized: true,
      published: true,
    },
  },
  progress: Object.fromEntries(
    [
      { id: uuid(501), profileId: uuid(306), createdBy: uuid(36) },
      { id: uuid(502), profileId: uuid(306), createdBy: uuid(36) },
      { id: uuid(503), profileId: uuid(307), createdBy: uuid(37) },
      { id: uuid(504), profileId: uuid(309), createdBy: uuid(39) },
    ].map((item, index) => [`update${index + 1}`, item]),
  ),
  comments: {
    supervisor: { id: uuid(551), profileId: uuid(306), authorId: uuid(11) },
    enterprise: { id: uuid(552), profileId: uuid(306), authorId: uuid(21) },
    officer: { id: uuid(553), profileId: uuid(307), authorId: uuid(1) },
  },
  notifications: {
    read: { id: uuid(901), userId: uuid(31) },
    unread: { id: uuid(902), userId: uuid(36) },
    officerUnread: { id: uuid(903), userId: uuid(1) },
  },
  audit: {
    deniedAccess: { id: uuid(951), actorId: uuid(1), resourceId: uuid(302) },
    submittedProfile: { id: uuid(952), actorId: uuid(32), resourceId: uuid(302) },
    resultPublished: { id: uuid(953), actorId: uuid(1), resourceId: uuid(1004) },
  },
});

export const buildManifest = (seededAt: Date) => ({
  seededAt: seededAt.toISOString(),
  ...manifestShape(),
  periods: Object.fromEntries(
    periods.map((period) => [
      period.key,
      {
        id: period.id,
        name: period.name,
        startDate: dateOnly(seededAt, period.startOffset),
        endDate: dateOnly(seededAt, period.endOffset),
        registrationOpenAt: instant(seededAt, period.registrationOpenOffset).toISOString(),
        registrationCloseAt: instant(seededAt, period.registrationCloseOffset).toISOString(),
        reportDeadline: instant(seededAt, period.deadlineOffset, 23).toISOString(),
      },
    ]),
  ),
});

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function insertOnly(
  manager: import('typeorm').EntityManager,
  table: string,
  columns: string[],
  values: unknown[],
) {
  const columnSql = columns.map((column) => `"${column}"`).join(', ');
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  await manager.query(
    `INSERT INTO "${table}" (${columnSql}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
    values,
  );
}

async function ensureReportFile(path: string, contents: Buffer, createdFiles: string[]) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try {
    const file = await open(path, 'wx', 0o600);
    try {
      await file.writeFile(contents);
    } finally {
      await file.close();
    }
    createdFiles.push(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existing = await readFile(path);
    if (!existing.equals(contents)) {
      throw new Error(`Refusing to replace a file that is not owned by this demo seed: ${path}`);
    }
  }
}

async function reserveSeedTime(manager: import('typeorm').EntityManager) {
  // Serialize concurrent seed commands. The fixed advisory-lock key is not a database password.
  await manager.query('SELECT pg_advisory_xact_lock($1)', [734982761]);
  const existing = (await manager.query(
    'SELECT seed_version, seeded_at FROM api_demo_seed_runs WHERE seed_key = $1 FOR UPDATE',
    [SEED_KEY],
  )) as Array<{ seed_version: number; seeded_at: Date | string }>;
  if (existing.length) {
    if (Number(existing[0].seed_version) !== SEED_VERSION) {
      throw new Error(`Unsupported demo seed version ${existing[0].seed_version}`);
    }
    return new Date(existing[0].seeded_at);
  }
  const seededAt = new Date();
  await insertOnly(
    manager,
    'api_demo_seed_runs',
    ['seed_key', 'seed_version', 'seeded_at', 'manifest'],
    [SEED_KEY, SEED_VERSION, seededAt, JSON.stringify(manifestShape())],
  );
  return seededAt;
}

async function seedAccounts(manager: import('typeorm').EntityManager) {
  for (const account of accounts) {
    await insertOnly(
      manager,
      'users',
      ['id', 'email', 'password_hash', 'role', 'status', 'refresh_token_hash'],
      [
        account.id,
        account.email,
        await hashPassword(DEMO_PASSWORD),
        account.role,
        account.status,
        null,
      ],
    );
    if (account.role === UserRole.STUDENT) {
      await insertOnly(
        manager,
        'students',
        ['user_id', 'student_code', 'full_name', 'phone', 'major'],
        [account.id, account.studentCode, account.fullName, null, 'Demo Computer Science'],
      );
    } else if (account.role === UserRole.OFFICER) {
      await insertOnly(
        manager,
        'officers',
        ['user_id', 'full_name'],
        [account.id, account.fullName],
      );
    } else if (account.role === UserRole.SUPERVISOR) {
      await insertOnly(
        manager,
        'supervisors',
        ['user_id', 'full_name', 'department'],
        [account.id, account.fullName, account.department],
      );
    } else {
      await insertOnly(
        manager,
        'enterprise_reps',
        ['user_id', 'enterprise_id', 'full_name', 'phone'],
        [account.id, uuid(100 + account.enterpriseNumber!), account.fullName, null],
      );
    }
  }
}

async function seedPeriodsAndCatalogs(manager: import('typeorm').EntityManager, base: Date) {
  for (const enterprise of enterprises) {
    await insertOnly(
      manager,
      'enterprises',
      ['id', 'name', 'address', 'phone', 'website'],
      [enterprise.id, enterprise.name, enterprise.address, enterprise.phone, enterprise.website],
    );
  }
  for (const period of periods) {
    await insertOnly(
      manager,
      'internship_periods',
      [
        'id',
        'name',
        'start_date',
        'end_date',
        'registration_open_at',
        'registration_close_at',
        'report_deadline',
        'enterprise_weight',
        'supervisor_process_weight',
        'supervisor_report_weight',
        'active',
      ],
      [
        period.id,
        period.name,
        dateOnly(base, period.startOffset),
        dateOnly(base, period.endOffset),
        instant(base, period.registrationOpenOffset),
        instant(base, period.registrationCloseOffset),
        instant(base, period.deadlineOffset, 23),
        '0.40000',
        '0.30000',
        '0.30000',
        true,
      ],
    );
  }
  for (const criterion of criteria) {
    await insertOnly(
      manager,
      'criteria',
      ['id', 'period_id', 'form_type', 'category', 'code', 'name', 'weight', 'active'],
      [
        criterion.id,
        criterion.periodId,
        criterion.formType,
        criterion.category,
        criterion.code,
        criterion.name,
        criterion.weight,
        criterion.active,
      ],
    );
  }
}

async function seedProfiles(manager: import('typeorm').EntityManager, base: Date) {
  let historyNumber = 401;
  for (const profile of profiles) {
    const period = periods.find((item) => item.key === profile.periodKey)!;
    const reportOffsets = profile.reportOffsets ?? [];
    const lastOffset =
      reportOffsets.at(-1) ?? profile.reviewOffset ?? profile.submitOffset ?? profile.createdOffset;
    await insertOnly(
      manager,
      'internship_profiles',
      [
        'id',
        'student_id',
        'period_id',
        'enterprise_id',
        'supervisor_id',
        'title',
        'position',
        'internship_start_at',
        'internship_end_at',
        'description',
        'status',
        'last_status_reason',
        'created_at',
        'updated_at',
      ],
      [
        profile.id,
        uuid(30 + profile.studentNumber),
        period.id,
        profile.enterpriseNumber ? uuid(100 + profile.enterpriseNumber) : null,
        profile.supervisorNumber ? uuid(10 + profile.supervisorNumber) : null,
        profile.title,
        profile.status === ProfileStatus.DRAFT ? null : 'Software engineering intern',
        dateOnly(base, period.startOffset + 1),
        dateOnly(base, period.endOffset - 1),
        profile.status === ProfileStatus.DRAFT ? null : 'Synthetic local API test profile.',
        profile.status,
        profile.reason ?? null,
        instant(base, profile.createdOffset),
        instant(base, lastOffset),
      ],
    );

    if (!profile.submitOffset) continue;
    let historyId = historyNumber++;
    await insertOnly(
      manager,
      'status_histories',
      ['id', 'profile_id', 'from_status', 'to_status', 'changed_by', 'reason', 'created_at'],
      [
        uuid(historyId),
        profile.id,
        ProfileStatus.DRAFT,
        ProfileStatus.SUBMITTED,
        uuid(30 + profile.studentNumber),
        null,
        instant(base, profile.submitOffset),
      ],
    );
    if (!profile.reviewOffset) continue;
    const reviewedStatus =
      profile.status === ProfileStatus.NEEDS_REVISION || profile.status === ProfileStatus.REJECTED
        ? profile.status
        : ProfileStatus.APPROVED;
    historyId = historyNumber++;
    await insertOnly(
      manager,
      'status_histories',
      ['id', 'profile_id', 'from_status', 'to_status', 'changed_by', 'reason', 'created_at'],
      [
        uuid(historyId),
        profile.id,
        ProfileStatus.SUBMITTED,
        reviewedStatus,
        uuid(1),
        profile.reason ?? 'Placement reviewed and approved for the internship period.',
        instant(base, profile.reviewOffset),
      ],
    );
    if (reportOffsets.length) {
      historyId = historyNumber++;
      await insertOnly(
        manager,
        'status_histories',
        ['id', 'profile_id', 'from_status', 'to_status', 'changed_by', 'reason', 'created_at'],
        [
          uuid(historyId),
          profile.id,
          ProfileStatus.APPROVED,
          ProfileStatus.REPORT_SUBMITTED,
          uuid(30 + profile.studentNumber),
          null,
          instant(base, lastOffset),
        ],
      );
    }
  }
}

async function seedReports(
  manager: import('typeorm').EntityManager,
  base: Date,
  reportBytes: Record<'pdf' | 'docx', Buffer>,
  storageDirectory: string,
  createdFiles: string[],
) {
  for (const report of reports) {
    const storageName = `api-demo-${report.id}.${report.file}`;
    const path = join(storageDirectory, storageName);
    await ensureReportFile(path, reportBytes[report.file], createdFiles);
    const profile = profiles.find((item) => item.id === uuid(report.profileNumber))!;
    const period = periods.find((item) => item.key === profile.periodKey)!;
    const submittedAt = instant(base, report.offset);
    await insertOnly(
      manager,
      'reports',
      [
        'id',
        'profile_id',
        'version',
        'storage_name',
        'original_name',
        'mime_type',
        'size_bytes',
        'submitted_at',
        'is_late',
      ],
      [
        report.id,
        profile.id,
        report.version,
        storageName,
        `api-demo-profile-${report.profileNumber}-v${report.version}.${report.file}`,
        report.file === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        String(reportBytes[report.file].length),
        submittedAt,
        submittedAt > instant(base, period.deadlineOffset, 23),
      ],
    );
  }
}

function reportForProfile(profileNumber: number) {
  return reports
    .filter((report) => report.profileNumber === profileNumber)
    .sort((a, b) => b.version - a.version)[0];
}

async function seedProgressAndComments(manager: import('typeorm').EntityManager, base: Date) {
  const updates = [
    {
      id: uuid(501),
      profile: 306,
      student: 6,
      offset: -7,
      period: 'Week 1',
      work: 'Implemented a demo API endpoint.',
      outcome: 'Endpoint returns the expected JSON response.',
      difficulties: 'No blocking issues.',
    },
    {
      id: uuid(502),
      profile: 306,
      student: 6,
      offset: -6,
      period: 'Week 2',
      work: 'Added request validation.',
      outcome: 'Invalid input returns a validation error.',
      difficulties: 'Learning the validation rules.',
    },
    {
      id: uuid(503),
      profile: 307,
      student: 7,
      offset: -14,
      period: 'Week 1',
      work: 'Reviewed the demo project structure.',
      outcome: 'Prepared a short implementation plan.',
      difficulties: 'No blocking issues.',
    },
    {
      id: uuid(504),
      profile: 309,
      student: 9,
      offset: -57,
      period: 'Final week',
      work: 'Completed synthetic final report work.',
      outcome: 'Prepared the sample report version.',
      difficulties: 'No blocking issues.',
    },
  ];
  for (const update of updates) {
    await insertOnly(
      manager,
      'progress_updates',
      [
        'id',
        'profile_id',
        'report_period',
        'work',
        'outcome',
        'difficulties',
        'created_by',
        'created_at',
        'updated_at',
      ],
      [
        update.id,
        uuid(update.profile),
        update.period,
        update.work,
        update.outcome,
        update.difficulties,
        uuid(30 + update.student),
        instant(base, update.offset),
        instant(base, update.offset),
      ],
    );
  }
  const comments = [
    {
      id: uuid(551),
      profile: 306,
      author: uuid(11),
      content: 'Supervisor demo note: progress is on schedule.',
      offset: -5,
    },
    {
      id: uuid(552),
      profile: 306,
      author: uuid(21),
      content: 'Enterprise demo note: the submitted work was reviewed.',
      offset: -4,
    },
    {
      id: uuid(553),
      profile: 307,
      author: uuid(1),
      content: 'Officer demo note: remember the final report deadline.',
      offset: -12,
    },
  ];
  for (const comment of comments) {
    await insertOnly(
      manager,
      'comments',
      ['id', 'profile_id', 'author_id', 'content', 'created_at', 'updated_at'],
      [
        comment.id,
        uuid(comment.profile),
        comment.author,
        comment.content,
        instant(base, comment.offset),
        instant(base, comment.offset),
      ],
    );
  }
}

type FormFixture = {
  id: string;
  profileNumber: number;
  formType: FormType;
  status: SubmissionStatus;
  evaluatorId: string;
  createdOffset: number;
  submittedOffset?: number;
};

const forms: FormFixture[] = [
  {
    id: uuid(801),
    profileNumber: 305,
    formType: FormType.ENTERPRISE,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(21),
    createdOffset: -59,
    submittedOffset: -58,
  },
  {
    id: uuid(802),
    profileNumber: 306,
    formType: FormType.ENTERPRISE,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(21),
    createdOffset: -7,
    submittedOffset: -6,
  },
  {
    id: uuid(803),
    profileNumber: 306,
    formType: FormType.SUPERVISOR,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(11),
    createdOffset: -7,
    submittedOffset: -6,
  },
  {
    id: uuid(804),
    profileNumber: 307,
    formType: FormType.ENTERPRISE,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(22),
    createdOffset: -14,
    submittedOffset: -13,
  },
  {
    id: uuid(805),
    profileNumber: 307,
    formType: FormType.SUPERVISOR,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(12),
    createdOffset: -14,
    submittedOffset: -13,
  },
  {
    id: uuid(806),
    profileNumber: 308,
    formType: FormType.ENTERPRISE,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(23),
    createdOffset: -23,
    submittedOffset: -22,
  },
  {
    id: uuid(807),
    profileNumber: 308,
    formType: FormType.SUPERVISOR,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(13),
    createdOffset: -23,
    submittedOffset: -22,
  },
  {
    id: uuid(808),
    profileNumber: 309,
    formType: FormType.ENTERPRISE,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(21),
    createdOffset: -51,
    submittedOffset: -50,
  },
  {
    id: uuid(809),
    profileNumber: 309,
    formType: FormType.SUPERVISOR,
    status: SubmissionStatus.SUBMITTED,
    evaluatorId: uuid(11),
    createdOffset: -51,
    submittedOffset: -50,
  },
  {
    id: uuid(810),
    profileNumber: 310,
    formType: FormType.ENTERPRISE,
    status: SubmissionStatus.DRAFT,
    evaluatorId: uuid(23),
    createdOffset: -9,
  },
];

const criteriaFor = (profileNumber: number, type: FormType) => {
  const profile = profiles.find((item) => item.id === uuid(profileNumber))!;
  const periodId = periods.find((item) => item.key === profile.periodKey)!.id;
  return criteria.filter(
    (item) => item.periodId === periodId && item.formType === type && item.active,
  );
};

async function seedEvaluations(manager: import('typeorm').EntityManager, base: Date) {
  for (const form of forms) {
    const report =
      form.formType === FormType.SUPERVISOR ? reportForProfile(form.profileNumber) : undefined;
    await insertOnly(
      manager,
      'evaluation_forms',
      [
        'id',
        'profile_id',
        'form_type',
        'evaluator_id',
        'status',
        'submitted_at',
        'report_id',
        'created_at',
        'updated_at',
      ],
      [
        form.id,
        uuid(form.profileNumber),
        form.formType,
        form.evaluatorId,
        form.status,
        form.submittedOffset === undefined ? null : instant(base, form.submittedOffset),
        report?.id ?? null,
        instant(base, form.createdOffset),
        instant(base, form.submittedOffset ?? form.createdOffset),
      ],
    );
    const formCriteria = criteriaFor(form.profileNumber, form.formType);
    const detailRows =
      form.formType === FormType.ENTERPRISE
        ? formCriteria.map((criterion, index) => ({
            criterion,
            score: ['9.00', '8.00', '10.00'][index] ?? '8.00',
          }))
        : formCriteria.map((criterion) => ({
            criterion,
            score:
              criterion.category === CriteriaCategory.PROCESS
                ? criterion.code === 'PROC-1'
                  ? '8.00'
                  : '7.00'
                : criterion.code === 'REPORT-1'
                  ? '9.00'
                  : '8.00',
          }));
    const rowsToInsert =
      form.status === SubmissionStatus.DRAFT ? detailRows.slice(0, 1) : detailRows;
    for (const detail of rowsToInsert) {
      await insertOnly(
        manager,
        'evaluation_details',
        ['form_id', 'criteria_id', 'score', 'comment'],
        [form.id, detail.criterion.id, detail.score, null],
      );
    }
  }
}

async function seedResults(manager: import('typeorm').EntityManager, base: Date) {
  const resultFixtures = [
    {
      id: uuid(1001),
      profile: 306,
      offset: -5,
      adjusted: null,
      finalized: false,
      finalizedOffset: null,
      publishedOffset: null,
      officer: null,
    },
    {
      id: uuid(1002),
      profile: 307,
      offset: -12,
      adjusted: '8.75',
      finalized: false,
      finalizedOffset: null,
      publishedOffset: null,
      officer: null,
    },
    {
      id: uuid(1003),
      profile: 308,
      offset: -21,
      adjusted: null,
      finalized: true,
      finalizedOffset: -20,
      publishedOffset: null,
      officer: uuid(2),
    },
    {
      id: uuid(1004),
      profile: 309,
      offset: -49,
      adjusted: null,
      finalized: true,
      finalizedOffset: -40,
      publishedOffset: -39,
      officer: uuid(1),
    },
  ];
  for (const result of resultFixtures) {
    const totalScore = result.adjusted ?? '8.40';
    await insertOnly(
      manager,
      'results',
      [
        'id',
        'profile_id',
        'enterprise_score',
        'supervisor_process_score',
        'supervisor_report_score',
        'calculated_total_score',
        'adjusted_total_score',
        'total_score',
        'is_finalized',
        'published_at',
        'finalized_by',
        'created_at',
        'finalized_at',
      ],
      [
        result.id,
        uuid(result.profile),
        '9.00000000',
        '7.50000000',
        '8.50000000',
        '8.40000000',
        result.adjusted,
        totalScore,
        result.finalized,
        result.publishedOffset === null ? null : instant(base, result.publishedOffset),
        result.officer,
        instant(base, result.offset),
        result.finalizedOffset === null ? null : instant(base, result.finalizedOffset),
      ],
    );
  }
  await insertOnly(
    manager,
    'score_adjustments',
    ['id', 'result_id', 'old_score', 'new_score', 'reason', 'changed_by', 'created_at'],
    [
      uuid(1101),
      uuid(1002),
      '8.40',
      '8.75',
      'Synthetic committee review adjustment for API testing.',
      uuid(2),
      instant(base, -11),
    ],
  );
}

async function seedNotificationsAndAudit(manager: import('typeorm').EntityManager, base: Date) {
  const notifications = [
    {
      id: uuid(901),
      user: uuid(31),
      title: 'Demo application received',
      content: 'Your sample application was submitted for review.',
      readOffset: -3,
    },
    {
      id: uuid(902),
      user: uuid(36),
      title: 'Demo report submitted',
      content: 'A new synthetic report version is ready for review.',
      readOffset: null,
    },
    {
      id: uuid(903),
      user: uuid(1),
      title: 'Demo result ready',
      content: 'A sample result is waiting for officer review.',
      readOffset: null,
    },
  ];
  for (const item of notifications) {
    await insertOnly(
      manager,
      'notifications',
      ['id', 'user_id', 'title', 'content', 'read_at', 'created_at'],
      [
        item.id,
        item.user,
        item.title,
        item.content,
        item.readOffset === null ? null : instant(base, item.readOffset),
        instant(base, -2),
      ],
    );
  }
  const logs = [
    {
      id: uuid(951),
      actor: uuid(1),
      action: 'RESOURCE_ACCESS_DENIED',
      resource: 'internship_profile',
      resourceId: uuid(302),
      metadata: { scenario: 'synthetic_cross_account_denial' },
      offset: -1,
    },
    {
      id: uuid(952),
      actor: uuid(32),
      action: 'PROFILE_SUBMITTED',
      resource: 'internship_profile',
      resourceId: uuid(302),
      metadata: { scenario: 'synthetic_demo_workflow' },
      offset: -4,
    },
    {
      id: uuid(953),
      actor: uuid(1),
      action: 'RESULT_PUBLISHED',
      resource: 'result',
      resourceId: uuid(1004),
      metadata: { scenario: 'synthetic_published_result' },
      offset: -39,
    },
  ];
  for (const log of logs) {
    await insertOnly(
      manager,
      'system_logs',
      ['id', 'actor_id', 'action', 'resource', 'resource_id', 'metadata', 'created_at'],
      [
        log.id,
        log.actor,
        log.action,
        log.resource,
        log.resourceId,
        JSON.stringify(log.metadata),
        instant(base, log.offset),
      ],
    );
  }
}

async function assertSeedIdsExist(
  manager: import('typeorm').EntityManager,
  table: string,
  ids: string[],
) {
  const rows = (await manager.query(`SELECT id FROM "${table}" WHERE id = ANY($1::uuid[])`, [
    ids,
  ])) as Array<{ id: string }>;
  const found = new Set(rows.map((row) => row.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    throw new Error(
      `Demo seed stopped without replacing existing data: conflicting natural key or missing ${table} rows (${missing.length}). Use an empty local/test database or inspect the listed seed fixture IDs in the manifest.`,
    );
  }
}

async function verifySeed(manager: import('typeorm').EntityManager) {
  await assertSeedIdsExist(
    manager,
    'users',
    accounts.map((account) => account.id),
  );
  await assertSeedIdsExist(
    manager,
    'enterprises',
    enterprises.map((enterprise) => enterprise.id),
  );
  await assertSeedIdsExist(
    manager,
    'internship_periods',
    periods.map((period) => period.id),
  );
  await assertSeedIdsExist(
    manager,
    'internship_profiles',
    profiles.map((profile) => profile.id),
  );
  await assertSeedIdsExist(
    manager,
    'criteria',
    criteria.map((criterion) => criterion.id),
  );
  await assertSeedIdsExist(
    manager,
    'reports',
    reports.map((report) => report.id),
  );
  await assertSeedIdsExist(
    manager,
    'evaluation_forms',
    forms.map((form) => form.id),
  );
  await assertSeedIdsExist(manager, 'results', [uuid(1001), uuid(1002), uuid(1003), uuid(1004)]);
}

async function writeManifestFile(manifest: ReturnType<typeof buildManifest>) {
  const manifestPath = resolve(process.cwd(), 'var', 'api-demo-manifest.json');
  await mkdir(dirname(manifestPath), { recursive: true, mode: 0o700 });
  const contents = `${JSON.stringify(manifest, null, 2)}\n`;
  try {
    const existing = await readFile(manifestPath, 'utf8');
    if (existing !== contents) {
      throw new Error(
        `Refusing to replace a manifest that does not match this seed run: ${manifestPath}`,
      );
    }
    return manifestPath;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, contents, {
    flag: 'wx',
    mode: 0o600,
  });
  await rename(temporaryPath, manifestPath);
  return manifestPath;
}

export async function seedApiDemo() {
  const target = validateSeedTarget(process.env);
  const fixtureDirectory = resolve(__dirname, 'fixtures');
  const reportBytes = {
    pdf: await readFile(join(fixtureDirectory, 'api-demo-report.pdf')),
    docx: await readFile(join(fixtureDirectory, 'api-demo-report.docx')),
  };
  const storageDirectory = resolve(
    process.cwd(),
    process.env.REPORT_STORAGE_DIR ?? 'var/private-reports',
  );
  const createdFiles: string[] = [];
  let committed = false;

  await dataSource.initialize();
  try {
    const manifest = await dataSource.transaction(async (manager) => {
      const databaseRows = (await manager.query('SELECT current_database() AS database')) as Array<{
        database: string;
      }>;
      if (databaseRows[0]?.database !== target.database) {
        throw new Error('Connected database does not match the guarded DATABASE_NAME');
      }
      const seededAt = await reserveSeedTime(manager);
      await seedPeriodsAndCatalogs(manager, seededAt);
      // Enterprise representatives reference enterprises, so seed those parent rows first.
      await seedAccounts(manager);
      await seedProfiles(manager, seededAt);
      await seedReports(manager, seededAt, reportBytes, storageDirectory, createdFiles);
      await seedProgressAndComments(manager, seededAt);
      await seedEvaluations(manager, seededAt);
      await seedResults(manager, seededAt);
      await seedNotificationsAndAudit(manager, seededAt);
      await verifySeed(manager);
      return buildManifest(seededAt);
    });
    committed = true;
    const manifestPath = await writeManifestFile(manifest);
    process.stdout.write(
      `API demo seed ready for ${target.database} (${target.host}). Manifest: ${manifestPath}\n`,
    );
  } catch (error) {
    if (!committed) {
      await Promise.all(createdFiles.map((path) => unlink(path).catch(() => undefined)));
    }
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  seedApiDemo().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'API demo seed failed'}\n`);
    process.exitCode = 1;
  });
}
