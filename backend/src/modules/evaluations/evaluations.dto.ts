import { PaginationQueryDto } from '../../common/pagination.dto';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CriteriaCategory, FormType } from '../../database/entities.entity';

import { CriteriaInput, EvaluationDetailInput } from './evaluations.service';

export class CriterionDto implements CriteriaInput {
  @ApiProperty({ example: 'ATTENDANCE', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;
  @ApiProperty({ example: 'Attendance and punctuality' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
  @ApiProperty({ enum: CriteriaCategory }) @IsEnum(CriteriaCategory) category!: CriteriaCategory;
  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 5 })
  @Min(0)
  weight!: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;
}
export class UpdateCriterionDto extends PartialType(CriterionDto) {}
export class EvaluationDetailDto implements EvaluationDetailInput {
  @ApiProperty({ example: 'criterion-uuid' }) @IsUUID() criteriaId!: string;
  @ApiProperty({ example: 8.5, minimum: 0, maximum: 10 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  score!: number;
  @ApiPropertyOptional({ example: 'Strong performance' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
export class SaveEvaluationDto {
  @ApiProperty({ type: [EvaluationDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationDetailDto)
  details!: EvaluationDetailDto[];
  @ApiPropertyOptional({
    example: 'report-uuid',
    description: 'Required on supervisor form submission',
  })
  @IsOptional()
  @IsUUID()
  reportId?: string;
}
export class AdjustResultDto {
  @ApiProperty({ example: 8.25, minimum: 0, maximum: 10 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  score!: number;
  @ApiProperty({ example: 'Approved correction after committee review' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  reason!: string;
}
export class CriteriaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FormType }) @IsOptional() @IsEnum(FormType) formType?: FormType;
}
