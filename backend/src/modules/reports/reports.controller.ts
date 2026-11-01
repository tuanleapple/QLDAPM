import { PaginationQueryDto } from '../../common/pagination.dto';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { memoryStorage } from 'multer';
import { UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportsService } from './reports.service';

import { ReportMetadataResponseDto, ReportPageResponseDto } from './reports.dto';

@Controller('reports')
@ApiTags('reports')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('profiles/:profileId/versions')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'List final report versions visible for a profile' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiResponse({
    status: 200,
    description: 'Paginated metadata; private storage name is omitted',
    type: ReportPageResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Profile outside caller scope' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  list(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reports.list(
      profileId,
      req.user.id,
      req.user.role as UserRole,
      query.page,
      query.limit,
    );
  }

  @Post('profiles/:profileId')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiOperation({
    summary: 'Upload a final report version',
    description:
      'PDF or DOCX, maximum 10 MB. Registration support documents are not accepted by this endpoint.',
  })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF or DOCX, maximum 10 MB' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'New report version metadata',
    type: ReportMetadataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file, workflow state, submitted supervisor form or finalized result',
  })
  @ApiResponse({ status: 403, description: 'Only owner student can upload' })
  @ApiResponse({ status: 413, description: 'File larger than 10 MB' })
  upload(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reports.upload(profileId, req.user.id, req.user.role as UserRole, file);
  }

  @Get(':id/download')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: 'Download final report file',
    description: 'Enterprise representatives are explicitly denied this endpoint.',
  })
  @ApiParam({ name: 'id', example: 'report-uuid' })
  @ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
  @ApiResponse({
    status: 200,
    description: 'Binary report file with Content-Disposition attachment',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({ status: 403, description: 'Caller has no resource access' })
  @ApiResponse({ status: 404, description: 'Metadata or file not found' })
  async download(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { report, buffer } = await this.reports.getDownload(
      id,
      req.user.id,
      req.user.role as UserRole,
    );
    const safeName = report.originalName.replace(/["\\\r\n]/g, '_');
    return new StreamableFile(buffer, {
      type: report.mimeType,
      disposition: `attachment; filename="${safeName}"`,
      length: buffer.length,
    });
  }
}
