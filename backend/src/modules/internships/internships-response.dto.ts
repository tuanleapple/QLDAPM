import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ProfileStatus } from '../../database/entities.entity';

export class StatusHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true }) fromStatus!: ProfileStatus | null;
  @ApiProperty({ enum: ProfileStatus }) toStatus!: ProfileStatus;
  @ApiProperty({ format: 'uuid' }) changedBy!: string;
  @ApiProperty({ nullable: true }) reason!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
}

export class PeriodSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'date' }) startDate!: string;
  @ApiProperty({ format: 'date' }) endDate!: string;
  @ApiProperty({ format: 'date-time' }) registrationOpenAt!: Date;
  @ApiProperty({ format: 'date-time' }) registrationCloseAt!: Date;
  @ApiProperty({ format: 'date-time', nullable: true }) reportDeadline!: Date | null;
  @ApiProperty() enterpriseWeight!: string;
  @ApiProperty() supervisorProcessWeight!: string;
  @ApiProperty() supervisorReportWeight!: string;
}

export class EnterpriseSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) address!: string | null;
  @ApiProperty({ nullable: true }) phone!: string | null;
  @ApiProperty({ nullable: true }) website!: string | null;
}

export class SupervisorSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty({ nullable: true }) department!: string | null;
}

export class StudentSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() studentCode!: string;
  @ApiProperty({ nullable: true }) major!: string | null;
}

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty({ format: 'uuid' }) periodId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) enterpriseId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) supervisorId!: string | null;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) position!: string | null;
  @ApiProperty({ nullable: true, format: 'date' }) internshipStartAt!: string | null;
  @ApiProperty({ nullable: true, format: 'date' }) internshipEndAt!: string | null;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: ProfileStatus }) status!: ProfileStatus;
  @ApiProperty({ type: PeriodSummaryResponseDto }) period!: PeriodSummaryResponseDto;
  @ApiProperty({ type: EnterpriseSummaryResponseDto, nullable: true })
  enterprise!: EnterpriseSummaryResponseDto | null;
  @ApiProperty({ type: SupervisorSummaryResponseDto, nullable: true })
  supervisor!: SupervisorSummaryResponseDto | null;
  @ApiProperty({ type: StudentSummaryResponseDto }) student!: StudentSummaryResponseDto;
  @ApiPropertyOptional({ type: [StatusHistoryResponseDto] })
  statusHistory?: StatusHistoryResponseDto[];
}

export class ProfilePageResponseDto {
  @ApiProperty({ type: [ProfileResponseDto] }) items!: ProfileResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}
