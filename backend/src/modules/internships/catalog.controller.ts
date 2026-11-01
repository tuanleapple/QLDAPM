import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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

import { CatalogService } from './catalog.service';
import {
  CreatePeriodDto,
  UpdatePeriodDto,
  CreateEnterpriseDto,
  UpdateEnterpriseDto,
  CatalogListQueryDto,
} from './catalog.dto';

@Controller('internships')
@ApiTags('internships')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('periods')
  @Roles(UserRole.STUDENT, UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_periods',
    summary: 'List internship periods',
    description:
      'Accessible to STUDENT and OFFICER. Returns a paginated catalog; search matches period name.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Maximum 100' })
  @ApiQuery({ name: 'search', required: false, example: 'Summer' })
  @ApiResponse({
    status: 200,
    description:
      'Paginated period rows with id, name, dates, registration window and score weights',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  @ApiResponse({ status: 403, description: 'Role is not STUDENT or OFFICER' })
  periods(@Query() query: CatalogListQueryDto) {
    return this.catalog.listPeriods(query);
  }

  @Post('periods')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_createPeriod',
    summary: 'Create internship period',
  })
  @ApiBody({ type: CreatePeriodDto })
  @ApiResponse({ status: 201, description: 'Period created; weights default to 0.4/0.3/0.3' })
  @ApiResponse({ status: 400, description: 'Invalid date range or weights do not sum to 1' })
  createPeriod(@Req() req: AuthenticatedRequest, @Body() body: CreatePeriodDto) {
    return this.catalog.createPeriod(body, req.user.id);
  }

  @Patch('periods/:id')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_updatePeriod',
    summary: 'Update internship period',
  })
  @ApiParam({ name: 'id', example: 'period-uuid' })
  @ApiBody({ type: UpdatePeriodDto })
  @ApiResponse({ status: 200, description: 'Period updated' })
  @ApiResponse({ status: 400, description: 'Invalid date range or weights do not sum to 1' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  updatePeriod(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePeriodDto,
  ) {
    return this.catalog.updatePeriod(id, body, req.user.id);
  }

  @Delete('periods/:id')
  @Roles(UserRole.OFFICER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'InternshipsController_deletePeriod',
    summary: 'Delete unreferenced period',
  })
  @ApiParam({ name: 'id', example: 'period-uuid' })
  @ApiResponse({ status: 204, description: 'Period deleted' })
  @ApiResponse({ status: 400, description: 'Period is referenced by profiles or criteria' })
  deletePeriod(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deletePeriod(id, req.user.id);
  }

  @Get('periods/:id')
  @Roles(UserRole.STUDENT, UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_period',
    summary: 'Get an internship period',
  })
  @ApiParam({ name: 'id', example: 'period-uuid' })
  @ApiResponse({ status: 200, description: 'Internship period detail' })
  @ApiResponse({ status: 404, description: 'Internship period not found' })
  async period(@Param('id', ParseUUIDPipe) id: string) {
    const period = await this.catalog.getPeriod(id);
    if (!period) throw new NotFoundException('Internship period not found');
    return period;
  }

  @Get('enterprises')
  @Roles(UserRole.STUDENT, UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_enterprises',
    summary: 'List enterprises for selection',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Maximum 100' })
  @ApiQuery({ name: 'search', required: false, example: 'Acme' })
  @ApiResponse({
    status: 200,
    description: 'Paginated enterprise options with id and display fields',
  })
  enterprises(@Query() query: CatalogListQueryDto) {
    return this.catalog.listEnterprises(query);
  }

  @Post('enterprises')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_createEnterprise',
    summary: 'Create enterprise',
  })
  @ApiBody({ type: CreateEnterpriseDto })
  @ApiResponse({ status: 201, description: 'Enterprise created' })
  @ApiResponse({ status: 409, description: 'Enterprise name already exists' })
  createEnterprise(@Req() req: AuthenticatedRequest, @Body() body: CreateEnterpriseDto) {
    return this.catalog.createEnterprise(body, req.user.id);
  }

  @Patch('enterprises/:id')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_updateEnterprise',
    summary: 'Update enterprise',
  })
  @ApiParam({ name: 'id', example: 'enterprise-uuid' })
  @ApiBody({ type: UpdateEnterpriseDto })
  @ApiResponse({ status: 200, description: 'Enterprise updated' })
  @ApiResponse({ status: 409, description: 'Enterprise name already exists' })
  @ApiResponse({ status: 404, description: 'Enterprise not found' })
  updateEnterprise(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEnterpriseDto,
  ) {
    return this.catalog.updateEnterprise(id, body, req.user.id);
  }

  @Delete('enterprises/:id')
  @Roles(UserRole.OFFICER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'InternshipsController_deleteEnterprise',
    summary: 'Delete unreferenced enterprise',
  })
  @ApiParam({ name: 'id', example: 'enterprise-uuid' })
  @ApiResponse({ status: 204, description: 'Enterprise deleted' })
  @ApiResponse({
    status: 400,
    description: 'Enterprise is referenced by profiles or representatives',
  })
  deleteEnterprise(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteEnterprise(id, req.user.id);
  }

  @Get('enterprises/:id')
  @Roles(UserRole.STUDENT, UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_enterprise',
    summary: 'Get an enterprise',
  })
  @ApiParam({ name: 'id', example: 'enterprise-uuid' })
  @ApiResponse({ status: 200, description: 'Enterprise detail' })
  @ApiResponse({ status: 404, description: 'Enterprise not found' })
  async enterprise(@Param('id', ParseUUIDPipe) id: string) {
    const enterprise = await this.catalog.getEnterprise(id);
    if (!enterprise) throw new NotFoundException('Enterprise not found');
    return enterprise;
  }

  @Get('supervisors')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    operationId: 'InternshipsController_supervisors',
    summary: 'List supervisors for assignment',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Maximum 100' })
  @ApiQuery({ name: 'search', required: false, example: 'Nguyen' })
  @ApiResponse({
    status: 200,
    description: 'Paginated supervisor options with user id and display name',
  })
  supervisors(@Query() query: CatalogListQueryDto) {
    return this.catalog.listSupervisors(query);
  }
}
