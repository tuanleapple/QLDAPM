import { PaginationQueryDto } from '../../common/pagination.dto';
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
import { ProgressService } from './progress.service';

import {
  ProgressResponseDto,
  CommentResponseDto,
  ProgressPageResponseDto,
  CommentPageResponseDto,
  ProgressDto,
  CommentDto,
} from './progress.dto';

@Controller('progress')
@ApiTags('progress')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('profiles/:profileId/updates')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'List progress updates visible to the caller' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Paginated progress updates',
    type: ProgressPageResponseDto,
  })
  list(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.progress.list(
      profileId,
      req.user.id,
      req.user.role as UserRole,
      query.page,
      query.limit,
    );
  }

  @Get('updates/:id')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Get a progress update with resource authorization' })
  @ApiParam({ name: 'id', example: 'progress-uuid' })
  @ApiResponse({ status: 200, description: 'Progress update', type: ProgressResponseDto })
  @ApiResponse({ status: 403, description: 'Profile is outside caller scope' })
  @ApiResponse({ status: 404, description: 'Progress update not found' })
  get(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.progress.get(id, req.user.id, req.user.role as UserRole);
  }

  @Post('profiles/:profileId/updates')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Create progress update for own approved internship' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiBody({ type: ProgressDto })
  @ApiResponse({ status: 201, description: 'Progress update created', type: ProgressResponseDto })
  @ApiResponse({ status: 400, description: 'Wrong workflow status or finalized result' })
  @ApiResponse({ status: 403, description: 'Not profile owner' })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: ProgressDto,
  ) {
    return this.progress.create(profileId, req.user.id, req.user.role as UserRole, body);
  }

  @Patch('updates/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Edit own progress update before result finalization' })
  @ApiParam({ name: 'id', example: 'progress-uuid' })
  @ApiBody({ type: ProgressDto })
  @ApiResponse({ status: 200, description: 'Progress update changed', type: ProgressResponseDto })
  @ApiResponse({ status: 403, description: 'Only authoring student may edit' })
  @ApiResponse({ status: 400, description: 'Progress is locked' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ProgressDto,
  ) {
    return this.progress.update(id, req.user.id, req.user.role as UserRole, body);
  }

  @Get('profiles/:profileId/comments')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'List profile comments visible to the caller' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiResponse({ status: 200, description: 'Paginated comments', type: CommentPageResponseDto })
  comments(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.progress.comments(
      profileId,
      req.user.id,
      req.user.role as UserRole,
      query.page,
      query.limit,
    );
  }

  @Post('profiles/:profileId/comments')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Add review comment to a permitted profile' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiBody({ type: CommentDto })
  @ApiResponse({ status: 201, description: 'Comment created', type: CommentResponseDto })
  @ApiResponse({ status: 403, description: 'Caller has no review permission for profile' })
  createComment(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: CommentDto,
  ) {
    return this.progress.createComment(
      profileId,
      req.user.id,
      req.user.role as UserRole,
      body.content,
    );
  }

  @Patch('comments/:id')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Edit own review comment' })
  @ApiParam({ name: 'id', example: 'comment-uuid' })
  @ApiBody({ type: CommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated', type: CommentResponseDto })
  @ApiResponse({ status: 403, description: 'Only author may edit' })
  updateComment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CommentDto,
  ) {
    return this.progress.updateComment(id, req.user.id, req.user.role as UserRole, body.content);
  }
}
