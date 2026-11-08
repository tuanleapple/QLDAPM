// frontend/types/api.ts

export type UserRole = 'STUDENT' | 'OFFICER' | 'SUPERVISOR' | 'ENTERPRISE_REP';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  status?: 'ACTIVE' | 'LOCKED';
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface InternshipPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  reportDeadlineAt: string;
  enterpriseWeight?: number;
  supervisorProcessWeight?: number;
  supervisorReportWeight?: number;
  isActive?: boolean;
}

export interface Enterprise {
  id: string;
  name: string;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  taxCode?: string | null;
  website?: string | null;
}

export interface Supervisor {
  id: string;
  email: string;
  fullName?: string | null;
  department?: string | null;
}

export type ProfileStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_REVISION'
  | 'REPORT_SUBMITTED';

export interface ProfileStatusHistory {
  id: string;
  profileId: string;
  fromStatus?: ProfileStatus | null;
  toStatus: ProfileStatus;
  changedById: string;
  reason?: string | null;
  createdAt: string;
}

export interface InternshipProfile {
  id: string;
  studentId: string;
  periodId: string;
  enterpriseId?: string | null;
  supervisorId?: string | null;
  title: string;
  position?: string | null;
  internshipStartAt?: string | null;
  internshipEndAt?: string | null;
  description?: string | null;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
  student?: User;
  period?: InternshipPeriod;
  enterprise?: Enterprise | null;
  supervisor?: Supervisor | null;
  statusHistory?: ProfileStatusHistory[];
}

export interface ProgressUpdate {
  id: string;
  profileId: string;
  studentId: string;
  reportPeriod: string;
  work: string;
  outcome: string;
  difficulties?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressComment {
  id: string;
  profileId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OfficerDashboardData {
  accountCount: number;
  profileCountsByStatus: Record<string, number>;
  recentProfiles: InternshipProfile[];
}

export interface StudentDashboardData {
  profileCount: number;
  activePeriod?: InternshipPeriod | null;
  latestProfile?: InternshipProfile | null;
  progressCount: number;
  latestReport?: {
    id: string;
    version: number;
    originalName: string;
    submittedAt: string;
    isLate: boolean;
  } | null;
}
