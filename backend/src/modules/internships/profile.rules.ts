import { BadRequestException } from '@nestjs/common';
import { InternshipPeriod, InternshipProfile, ProfileStatus } from '../../database/entities.entity';

const allowedTransitions: Record<ProfileStatus, ProfileStatus[]> = {
  [ProfileStatus.DRAFT]: [ProfileStatus.SUBMITTED],
  [ProfileStatus.SUBMITTED]: [
    ProfileStatus.NEEDS_REVISION,
    ProfileStatus.APPROVED,
    ProfileStatus.REJECTED,
  ],
  [ProfileStatus.NEEDS_REVISION]: [ProfileStatus.SUBMITTED],
  [ProfileStatus.APPROVED]: [],
  [ProfileStatus.REJECTED]: [],
  [ProfileStatus.REPORT_SUBMITTED]: [],
};

export function validateProfileTransition(current: ProfileStatus, next: ProfileStatus) {
  if (!allowedTransitions[current].includes(next)) {
    throw new BadRequestException(`Cannot change ${current} to ${next}`);
  }
}

/** Kiểm tra nghiệp vụ trước khi repository khóa hồ sơ và lưu lịch sử trong transaction. */
export function validateProfileSubmission(
  profile: InternshipProfile,
  period: InternshipPeriod | null,
  now = new Date(),
) {
  if (
    !period ||
    !period.active ||
    now < period.registrationOpenAt ||
    now > period.registrationCloseAt
  ) {
    throw new BadRequestException('Registration is closed');
  }
  if (
    !profile.enterpriseId ||
    !profile.position?.trim() ||
    !profile.internshipStartAt ||
    !profile.internshipEndAt
  ) {
    throw new BadRequestException(
      'Enterprise, position and internship dates are required before submission',
    );
  }
  if (
    profile.internshipStartAt > profile.internshipEndAt ||
    profile.internshipStartAt < period.startDate ||
    profile.internshipEndAt > period.endDate
  ) {
    throw new BadRequestException('Internship dates must be valid and within the selected period');
  }
}
