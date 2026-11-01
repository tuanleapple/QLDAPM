import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
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

import { ProfileStatus, UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InternshipsService } from './internships.service';
import { Response } from 'express';

import {
  CreateProfileDto,
  UpdateProfileDto,
  AssignSupervisorDto,
  ProfileListQueryDto,
  OfficerDashboardQueryDto,
  ReviewProfileDto,
} from './internships.dto';
import { ProfileResponseDto, ProfilePageResponseDto } from './internships-response.dto';
@Controller('internships')
@ApiTags('internships')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
export class InternshipsController {
  constructor(private readonly internships: InternshipsService) {}
  @Get('dashboard/student')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get the current student dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Database-backed student profile counts and latest profile',
  })
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.internships.getStudentDashboard(req.user.id);
  }

  @Get('dashboard/officer')
  @Roles(UserRole.OFFICER)
  @ApiOperation({ summary: 'Get database-backed officer dashboard' })
  @ApiQuery({ name: 'periodId', required: false, example: 'period-uuid' })
  @ApiResponse({
    status: 200,
    description: 'Account total, profile status counts, and recent profiles',
  })
  officerDashboard(@Query() query: OfficerDashboardQueryDto) {
    return this.internships.getOfficerDashboard(query.periodId);
  }

  @Get('profiles/export.csv')
  @Roles(UserRole.OFFICER)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({
    summary: 'Export filtered internship profile list as CSV',
    description:
      'Officer only. Formula-leading characters are neutralized; maximum 10,000 records.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ProfileStatus })
  @ApiQuery({ name: 'periodId', required: false })
  @ApiResponse({ status: 200, description: 'CSV file attachment' })
  async exportCsv(
    @Query() query: ProfileListQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Content-Disposition', 'attachment; filename="internship-profiles.csv"');
    return this.internships.exportProfiles(query);
  }

  @Get('profiles')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'List profiles in the current user scope' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '1-based page number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page, maximum 100',
  })
  @ApiQuery({ name: 'search', required: false, example: 'backend' })
  @ApiQuery({ name: 'status', required: false, enum: ProfileStatus })
  @ApiQuery({ name: 'periodId', required: false, example: 'period-uuid' })
  @ApiResponse({
    status: 200,
    description: 'Paginated profiles with period, enterprise and supervisor display data',
    type: ProfilePageResponseDto,
  })
  profiles(@Req() req: AuthenticatedRequest, @Query() query: ProfileListQueryDto) {
    return this.internships.listProfiles(req.user.id, req.user.role as UserRole, query);
  }
  @Post('profiles')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Create a draft internship profile',
    description:
      'Creates one DRAFT profile for the authenticated student and period. Registration must be open, and (student, period) must be unique.',
  })
  @ApiBody({ type: CreateProfileDto })
  @ApiResponse({ status: 201, description: 'Draft profile created', type: ProfileResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid body, registration closed, or profile already exists',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Only STUDENT can create profiles' })
  @ApiResponse({ status: 404, description: 'Internship period not found' })
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateProfileDto) {
    return this.internships.createProfile(req.user.id, body);
  }

  @Patch('profiles/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Edit a draft or revision-requested profile' })
  @ApiParam({ name: 'id', example: 'profile-uuid' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated', type: ProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Profile is not editable' })
  @ApiResponse({ status: 403, description: 'Profile belongs to another student' })
  @ApiResponse({ status: 404, description: 'Profile or enterprise not found' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProfileDto,
  ) {
    return this.internships.updateDraft(id, req.user.id, body);
  }
  @Get('profiles/:id')
  @ApiOperation({
    summary: 'Get an internship profile',
    description:
      'OFFICER can read all profiles; STUDENT can read only their own; SUPERVISOR only assigned profiles; ENTERPRISE_REP only profiles belonging to its enterprise.',
  })
  @ApiParam({ name: 'id', description: 'Internship profile UUID', example: 'profile-uuid' })
  @ApiResponse({ status: 200, description: 'Internship profile', type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Ownership or assignment check failed' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  profile(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.internships.getProfile(id, req.user.id, req.user.role as UserRole);
  }

  @Delete('profiles/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Delete a draft internship profile',
    description:
      'A student can delete only their own DRAFT profile. Submitted, approved, rejected, revision-requested, or historical profiles are not deleted.',
  })
  @ApiParam({ name: 'id', description: 'Internship profile UUID', example: 'profile-uuid' })
  @ApiResponse({ status: 204, description: 'Draft profile deleted' })
  @ApiResponse({ status: 400, description: 'Profile is not an eligible draft' })
  @ApiResponse({ status: 403, description: 'Profile belongs to another student' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.internships.removeDraft(id, req.user.id);
  }
  // Nhận HTTP request; nghiệp vụ gửi hồ sơ do service kiểm tra.
  @Post('profiles/:id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Submit an internship profile',
    description:
      'Moves a profile from DRAFT to SUBMITTED. Only the student role is allowed by the controller.',
  })
  @ApiParam({ name: 'id', description: 'Internship profile UUID', example: 'profile-uuid' })
  @ApiResponse({ status: 201, description: 'Profile submitted', type: ProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid current workflow state' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Only STUDENT can submit profiles' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  submit(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.internships.submit(id, req.user.id);
  }
  @Patch('profiles/:id/review')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    summary: 'Review an internship profile',
    description:
      'OFFICER can approve, reject, or request revision. A reason is required for REJECTED and NEEDS_REVISION.',
  })
  @ApiParam({ name: 'id', description: 'Internship profile UUID', example: 'profile-uuid' })
  @ApiBody({ type: ReviewProfileDto })
  @ApiResponse({ status: 200, description: 'Profile reviewed', type: ProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid transition or missing review reason' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Only OFFICER can review profiles' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  review(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewProfileDto,
  ) {
    return this.internships.review(id, req.user.id, body.status, body.reason, body.supervisorId);
  }

  @Patch('profiles/:id/assign-supervisor')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    summary: 'Assign a supervisor after profile approval',
    description:
      'Assignment cannot be changed after progress, report or evaluation activity begins.',
  })
  @ApiParam({ name: 'id', example: 'profile-uuid' })
  @ApiBody({ type: AssignSupervisorDto })
  @ApiResponse({ status: 200, description: 'Supervisor assigned', type: ProfileResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Profile is not approved or supervisor assignment is locked by activity',
  })
  @ApiResponse({ status: 403, description: 'Only OFFICER can assign supervisors' })
  @ApiResponse({ status: 404, description: 'Profile or supervisor not found' })
  assignSupervisor(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignSupervisorDto,
  ) {
    return this.internships.assignSupervisor(id, body.supervisorId, req.user.id);
  }
}
