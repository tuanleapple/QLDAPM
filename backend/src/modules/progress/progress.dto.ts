import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

import { ProgressInput } from './progress.service';

export class ProgressResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) profileId!: string;
  @ApiProperty() reportPeriod!: string;
  @ApiProperty() work!: string;
  @ApiProperty() outcome!: string;
  @ApiProperty() difficulties!: string;
  @ApiProperty({ format: 'uuid' }) createdBy!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) profileId!: string;
  @ApiProperty({ format: 'uuid' }) authorId!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class ProgressPageResponseDto {
  @ApiProperty({ type: [ProgressResponseDto] }) items!: ProgressResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export class CommentPageResponseDto {
  @ApiProperty({ type: [CommentResponseDto] }) items!: CommentResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export class ProgressDto implements ProgressInput {
  @ApiProperty({ example: 'Week 1' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  reportPeriod!: string;
  @ApiProperty({ example: 'Implemented API endpoints', maxLength: 10000 })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  work!: string;
  @ApiProperty({ example: 'Completed authentication flow', maxLength: 10000 })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  outcome!: string;
  @ApiProperty({ example: 'Waiting for staging credentials', maxLength: 10000 })
  @IsString()
  @MaxLength(10000)
  difficulties!: string;
}
export class CommentDto {
  @ApiProperty({ example: 'Please add more detail about the test results.' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}
