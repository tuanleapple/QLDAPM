import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthenticatedRequest, AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

export class LoginDto {
  @ApiProperty({ example: 'student@example.test', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'not-a-real-password', minLength: 8, format: 'password' })
  @IsString()
  @MinLength(8)
  password!: string;
}
export class RefreshDto {
  @ApiProperty({ example: 'example.refresh.token' })
  @IsString()
  refreshToken!: string;
}

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description: 'Authenticates an active account. Public registration is not available.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Access and refresh tokens issued',
    schema: {
      example: {
        accessToken: 'example.access.token',
        refreshToken: 'example.refresh.token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: { id: 'uuid', email: 'student@example.test', role: 'STUDENT' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid email or password format' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or locked account' })
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token',
    description:
      'Rotates the refresh token and revokes the previous one. Public endpoint; the refresh token is supplied in the body.',
  })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 400, description: 'Missing refreshToken' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or revoked refresh token' })
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out current account',
    description: 'Revokes the current account refresh session. Requires any valid access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  async logout(@Req() request: AuthenticatedRequest) {
    await this.auth.logout(request.user.id);
    return { success: true };
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @Get('me')
  @ApiOperation({
    summary: 'Get current account',
    description: 'Returns the authenticated account identity and role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current account',
    schema: { example: { id: 'uuid', email: 'student@example.test', role: 'STUDENT' } },
  })
  @ApiResponse({ status: 401, description: 'Missing, invalid, expired, or revoked account token' })
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.me(request.user.id);
  }
}
