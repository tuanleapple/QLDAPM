import { PaginationQueryDto } from '../../common/pagination.dto';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@ApiTags('notifications')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get()
  @ApiOperation({ summary: 'List notifications for current account' })
  @ApiResponse({ status: 200, description: 'Paginated recipient-scoped notifications' })
  list(@Req() req: AuthenticatedRequest, @Query() query: PaginationQueryDto) {
    return this.notifications.list(req.user.id, query.page, query.limit);
  }
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark own notification as read' })
  @ApiParam({ name: 'id', example: 'notification-uuid' })
  @ApiResponse({ status: 200, description: 'Read timestamp set' })
  @ApiResponse({ status: 404, description: 'Notification not found in current account scope' })
  read(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(id, req.user.id);
  }
}
