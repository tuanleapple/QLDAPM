import { PaginationQueryDto } from '../../common/pagination.dto';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ProfileStatus } from '../../database/entities.entity';

export class CreateProfileDto {
  @ApiProperty({ example: 'period-uuid' })
  @IsUUID()
  periodId!: string;

  @ApiPropertyOptional({ example: 'enterprise-uuid' })
  @IsOptional()
  @IsUUID()
  enterpriseId?: string;

  @ApiPropertyOptional({ example: 'Backend internship project', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Backend developer intern', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;

  @ApiPropertyOptional({ example: '2027-06-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  internshipStartAt?: string;

  @ApiPropertyOptional({ example: '2027-08-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  internshipEndAt?: string;

  @ApiPropertyOptional({ example: 'Build an internship management API.' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'enterprise-uuid' })
  @IsOptional()
  @IsUUID()
  enterpriseId?: string;

  @ApiPropertyOptional({ example: 'Backend internship project', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Backend developer intern', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;
  @ApiPropertyOptional({ example: '2027-06-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  internshipStartAt?: string;
  @ApiPropertyOptional({ example: '2027-08-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  internshipEndAt?: string;

  @ApiPropertyOptional({ example: 'Updated internship scope.' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
}

export class AssignSupervisorDto {
  @ApiProperty({ example: 'supervisor-user-uuid' })
  @IsUUID()
  supervisorId!: string;
}

export class ProfileListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'backend' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: ProfileStatus })
  @IsOptional()
  @IsEnum(ProfileStatus)
  status?: ProfileStatus;

  @ApiPropertyOptional({ example: 'period-uuid' })
  @IsOptional()
  @IsUUID()
  periodId?: string;
}

export class OfficerDashboardQueryDto {
  @ApiPropertyOptional({ example: 'period-uuid' }) @IsOptional() @IsUUID() periodId?: string;
}

export class ReviewProfileDto {
  @ApiProperty({
    enum: [ProfileStatus.APPROVED, ProfileStatus.REJECTED, ProfileStatus.NEEDS_REVISION],
    example: ProfileStatus.APPROVED,
  })
  @IsEnum(ProfileStatus)
  status!: ProfileStatus;

  @ApiPropertyOptional({ example: 'Please attach the missing approval document.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reason?: string;
  @ApiPropertyOptional({
    example: 'supervisor-user-uuid',
    description: 'Required when status is APPROVED',
  })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;
}
