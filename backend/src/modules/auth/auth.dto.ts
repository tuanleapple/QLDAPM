import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../../database/entities.entity';

export class LoginDto {
  @ApiProperty({ example: 'student@example.test', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'not-a-real-password', minLength: 8, format: 'password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
export class RefreshDto {
  @ApiProperty({ example: 'example.refresh.token' })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'current-password-placeholder', minLength: 8, format: 'password' })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({
    example: 'new-password-placeholder',
    minLength: 12,
    maxLength: 128,
    format: 'password',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
}

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'example.access.token' }) accessToken!: string;
  @ApiProperty({ example: 'example.refresh.token' }) refreshToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty({ example: 900 }) expiresIn!: number;
  @ApiProperty({ type: AuthUserResponseDto }) user!: AuthUserResponseDto;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
}
