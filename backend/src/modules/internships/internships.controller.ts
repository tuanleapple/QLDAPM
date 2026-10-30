import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ProfileStatus, UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InternshipsService } from './internships.service';

class CreateProfileDto {
  @ApiProperty({ example: 'period-uuid' })
  @IsUUID()
  periodId!: string;

  @ApiProperty({ example: 'Backend internship project', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Build an internship management API.' })
  @IsOptional()
  @IsString()
  description?: string;
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
  reason?: string;
}

@Controller('internships')
@ApiTags('internships')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
export class InternshipsController {
  constructor(private readonly internships: InternshipsService) {}
  @Get('periods')
  @Roles(UserRole.STUDENT, UserRole.OFFICER)
  @ApiOperation({
    summary: 'List internship periods',
    description:
      'Accessible to STUDENT and OFFICER. Current implementation returns all periods ordered by start date; pagination, search, and filters are not implemented.',
  })
  @ApiResponse({
    status: 200,
    description: 'Internship periods',
    schema: {
      example: [
        {
          id: 'uuid',
          name: '2026 Summer',
          startDate: '2026-06-01',
          endDate: '2026-08-31',
          active: true,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Role is not STUDENT or OFFICER' })
  periods() {
    return this.internships.listPeriods();
  }
  @Post('profiles')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Create a draft internship profile',
    description:
      'Creates one DRAFT profile for the authenticated student and period. Registration must be open, and (student, period) must be unique.',
  })
  @ApiBody({ type: CreateProfileDto })
  @ApiResponse({ status: 201, description: 'Draft profile created' })
  @ApiResponse({
    status: 400,
    description: 'Invalid body, registration closed, or profile already exists',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Only STUDENT can create profiles' })
  @ApiResponse({ status: 404, description: 'Internship period not found' })
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateProfileDto) {
    return this.internships.createProfile(req.user.id, body.periodId, body.title, body.description);
  }
  @Get('profiles/:id')
  @ApiOperation({
    summary: 'Get an internship profile',
    description:
      'STUDENT can access only their own profile; SUPERVISOR can access only an assigned profile; other authenticated roles can currently read by id according to the service policy.',
  })
  @ApiParam({ name: 'id', description: 'Internship profile UUID', example: 'profile-uuid' })
  @ApiResponse({ status: 200, description: 'Internship profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Ownership or assignment check failed' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  profile(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.internships.getProfile(id, req.user.id, req.user.role as UserRole);
  }
  @Post('profiles/:id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Submit an internship profile',
    description:
      'Moves a profile from DRAFT to SUBMITTED. Only the student role is allowed by the controller.',
  })
  @ApiParam({ name: 'id', description: 'Internship profile UUID', example: 'profile-uuid' })
  @ApiResponse({ status: 201, description: 'Profile submitted' })
  @ApiResponse({ status: 400, description: 'Invalid current workflow state' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Only STUDENT can submit profiles' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  submit(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
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
  @ApiResponse({ status: 200, description: 'Profile reviewed' })
  @ApiResponse({ status: 400, description: 'Invalid transition or missing review reason' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Only OFFICER can review profiles' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  review(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReviewProfileDto,
  ) {
    return this.internships.review(id, req.user.id, body.status, body.reason);
  }
}
