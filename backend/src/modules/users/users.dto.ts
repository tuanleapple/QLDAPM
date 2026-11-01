import { PaginationQueryDto } from '../../common/pagination.dto';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccountStatus, UserRole } from '../../database/entities.entity';

import { CreateAccountInput, UpdateAccountInput } from './users.service';

export class AccountProfileResponseDto {
  @ApiProperty({ nullable: true }) fullName!: string | null;
  @ApiProperty({ nullable: true }) studentCode!: string | null;
  @ApiProperty({ nullable: true }) phone!: string | null;
  @ApiProperty({ nullable: true }) major!: string | null;
  @ApiProperty({ nullable: true }) department!: string | null;
  @ApiProperty({ nullable: true, format: 'uuid' }) enterpriseId!: string | null;
  @ApiProperty({ nullable: true }) enterpriseName!: string | null;
}

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
  @ApiProperty({ enum: AccountStatus }) status!: AccountStatus;
  @ApiProperty({ type: AccountProfileResponseDto }) profile!: AccountProfileResponseDto;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class AccountPageResponseDto {
  @ApiProperty({ type: [AccountResponseDto] }) items!: AccountResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export class AccountListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreateAccountDto implements CreateAccountInput {
  @ApiProperty({ example: 'user@example.test' }) @IsEmail() email!: string;
  @ApiProperty({ example: 'non-real-password-123', minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
  @ApiProperty({ enum: UserRole }) @IsEnum(UserRole) role!: UserRole;
  @ApiProperty({ example: 'Nguyen Van A', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;
  @ApiPropertyOptional({ example: 'SV001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  studentCode?: string;
  @ApiPropertyOptional({ example: '0900000000' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  major?: string;
  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
  @ApiPropertyOptional({ example: 'enterprise-uuid' })
  @IsOptional()
  @IsUUID()
  enterpriseId?: string;
}

export class UpdateAccountDto implements UpdateAccountInput {
  @ApiPropertyOptional({ example: 'new-email@example.test' })
  @IsOptional()
  @IsEmail()
  email?: string;
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) major?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) department?: string;
  @ApiPropertyOptional({ example: 'enterprise-uuid' })
  @IsOptional()
  @IsUUID()
  enterpriseId?: string;
}
