import { PaginationQueryDto } from '../../common/pagination.dto';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePeriodDto {
  @ApiProperty({ example: 'Summer 2027', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
  @ApiProperty({ example: '2027-06-01', format: 'date' }) @IsDateString() startDate!: string;
  @ApiProperty({ example: '2027-08-31', format: 'date' }) @IsDateString() endDate!: string;
  @ApiProperty({ example: '2027-03-01T00:00:00.000Z' }) @IsDateString() registrationOpenAt!: string;
  @ApiProperty({ example: '2027-04-30T23:59:59.000Z' })
  @IsDateString()
  registrationCloseAt!: string;
  @ApiPropertyOptional({ example: '2027-09-15T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  reportDeadline?: string | null;
  @ApiPropertyOptional({ default: 0.4, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 5 })
  @Min(0)
  enterpriseWeight?: number;
  @ApiPropertyOptional({ default: 0.3, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 5 })
  @Min(0)
  supervisorProcessWeight?: number;
  @ApiPropertyOptional({ default: 0.3, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 5 })
  @Min(0)
  supervisorReportWeight?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdatePeriodDto extends PartialType(CreatePeriodDto) {}

export class CreateEnterpriseDto {
  @ApiProperty({ example: 'Acme Ltd.', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @ApiPropertyOptional({ example: 'https://example.test' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;
}

export class UpdateEnterpriseDto extends PartialType(CreateEnterpriseDto) {}

export class CatalogListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Summer', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
