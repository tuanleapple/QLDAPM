import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

import {
  AccountResponseDto,
  AccountPageResponseDto,
  AccountListQueryDto,
  CreateAccountDto,
  UpdateAccountDto,
} from './users.dto';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.OFFICER)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List accounts for officer administration' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum 100' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({
    status: 200,
    description: 'Paginated safe account profiles; password and refresh token are never returned',
    type: AccountPageResponseDto,
  })
  list(@Query() query: AccountListQueryDto) {
    return this.users.list(query.page, query.limit, query.role, query.search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account and role profile' })
  @ApiParam({ name: 'id', example: 'user-uuid' })
  @ApiResponse({ status: 200, description: 'Safe account profile', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.get(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create account and its role profile',
    description:
      'Officer only. Role profile is created atomically. No public account registration.',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account created', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Missing role-specific fields or validation error' })
  @ApiResponse({ status: 409, description: 'Email/student code/enterprise profile conflict' })
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateAccountDto) {
    return this.users.create(body, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update account email and role profile fields',
    description: 'Role is immutable after creation; password hashes and tokens are not accepted.',
  })
  @ApiParam({ name: 'id', example: 'user-uuid' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Updated safe account profile',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAccountDto,
  ) {
    return this.users.update(id, body, request.user.id);
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Lock an account and revoke its refresh session' })
  @ApiParam({ name: 'id', example: 'user-uuid' })
  @ApiResponse({ status: 200, description: 'Account locked', type: AccountResponseDto })
  @ApiResponse({ status: 403, description: 'Cannot lock the current officer account' })
  lock(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.setLocked(id, true, request.user.id);
  }

  @Patch(':id/unlock')
  @ApiOperation({ summary: 'Unlock an account' })
  @ApiParam({ name: 'id', example: 'user-uuid' })
  @ApiResponse({ status: 200, description: 'Account unlocked', type: AccountResponseDto })
  unlock(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.setLocked(id, false, request.user.id);
  }
}
