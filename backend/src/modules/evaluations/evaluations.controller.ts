import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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

import { FormType, UserRole } from '../../database/entities.entity';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EvaluationsService } from './evaluations.service';

import {
  CriterionDto,
  UpdateCriterionDto,
  SaveEvaluationDto,
  AdjustResultDto,
  CriteriaQueryDto,
} from './evaluations.dto';

@Controller('evaluations')
@ApiTags('evaluations')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluations: EvaluationsService) {}

  @Get('periods/:periodId/criteria')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'List active criteria for an internship period' })
  @ApiParam({ name: 'periodId', example: 'period-uuid' })
  @ApiQuery({ name: 'formType', required: false, enum: FormType })
  @ApiResponse({ status: 200, description: 'Paginated criteria options with category and weight' })
  criteria(@Param('periodId', ParseUUIDPipe) periodId: string, @Query() query: CriteriaQueryDto) {
    return this.evaluations.listCriteria(periodId, query.formType, query.page, query.limit);
  }

  @Get('criteria/:id')
  @Roles(UserRole.STUDENT, UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Get one evaluation criterion by ID' })
  @ApiParam({ name: 'id', example: 'criterion-uuid' })
  @ApiResponse({ status: 200, description: 'Criterion detail including category and weight' })
  @ApiResponse({ status: 404, description: 'Criterion not found or inactive for non-officers' })
  criterion(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.getCriteria(id, req.user.role);
  }

  @Post('periods/:periodId/criteria/:formType')
  @Roles(UserRole.OFFICER)
  @ApiOperation({ summary: 'Create evaluation criterion' })
  @ApiParam({ name: 'periodId', example: 'period-uuid' })
  @ApiParam({ name: 'formType', enum: FormType })
  @ApiBody({ type: CriterionDto })
  @ApiResponse({ status: 201, description: 'Criterion created' })
  @ApiResponse({ status: 400, description: 'Category does not match form type or criteria locked' })
  createCriterion(
    @Req() req: AuthenticatedRequest,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('formType', new ParseEnumPipe(FormType)) formType: FormType,
    @Body() body: CriterionDto,
  ) {
    return this.evaluations.createCriteria(periodId, formType, body, req.user.id);
  }

  @Patch('criteria/:id')
  @Roles(UserRole.OFFICER)
  @ApiOperation({ summary: 'Update criterion before any evaluation form exists for period' })
  @ApiParam({ name: 'id', example: 'criterion-uuid' })
  @ApiBody({ type: UpdateCriterionDto })
  @ApiResponse({ status: 200, description: 'Criterion updated' })
  @ApiResponse({ status: 400, description: 'Period criteria already in use' })
  updateCriterion(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCriterionDto,
  ) {
    return this.evaluations.updateCriteria(id, body, req.user.id);
  }

  @Delete('criteria/:id')
  @Roles(UserRole.OFFICER)
  @ApiOperation({ summary: 'Delete unused criterion' })
  @ApiParam({ name: 'id', example: 'criterion-uuid' })
  @ApiResponse({ status: 204, description: 'Criterion deleted' })
  @ApiResponse({ status: 400, description: 'Period has evaluation forms or criterion scores' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCriterion(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.deleteCriteria(id, req.user.id);
  }

  @Get('profiles/:profileId/forms')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'List the two evaluation forms for a profile' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiResponse({
    status: 200,
    description: 'Enterprise and supervisor forms, with criteria labels and report version link',
  })
  forms(@Req() req: AuthenticatedRequest, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.evaluations.listForms(profileId, req.user.id, req.user.role as UserRole);
  }

  @Post('profiles/:profileId/forms/:formType')
  @Roles(UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Create or get current evaluator draft' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiParam({ name: 'formType', enum: FormType })
  @ApiResponse({
    status: 201,
    description: 'Draft form; evaluator is derived from Bearer identity',
  })
  @ApiResponse({ status: 403, description: 'Caller is not assigned evaluator' })
  createForm(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('formType', new ParseEnumPipe(FormType)) formType: FormType,
  ) {
    return this.evaluations.createForm(profileId, formType, req.user.id, req.user.role as UserRole);
  }

  @Get('forms/:id')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Get evaluation form and scored criteria' })
  @ApiParam({ name: 'id', example: 'form-uuid' })
  @ApiResponse({ status: 200, description: 'Evaluation form detail' })
  @ApiResponse({ status: 403, description: 'Not assigned evaluator' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  getForm(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.getForm(id, req.user.id, req.user.role as UserRole);
  }

  @Patch('forms/:id')
  @Roles(UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Save evaluation draft; replaces draft detail set' })
  @ApiParam({ name: 'id', example: 'form-uuid' })
  @ApiBody({ type: SaveEvaluationDto })
  @ApiResponse({ status: 200, description: 'Saved draft details' })
  @ApiResponse({ status: 400, description: 'Invalid criterion, score or submitted form locked' })
  saveForm(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SaveEvaluationDto,
  ) {
    return this.evaluations.saveDraft(
      id,
      req.user.id,
      req.user.role as UserRole,
      body.details,
      body.reportId,
    );
  }

  @Post('forms/:id/submit')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPERVISOR, UserRole.ENTERPRISE_REP)
  @ApiOperation({ summary: 'Submit complete evaluation and lock it' })
  @ApiParam({ name: 'id', example: 'form-uuid' })
  @ApiBody({ type: SaveEvaluationDto })
  @ApiResponse({ status: 200, description: 'Submitted immutable form' })
  @ApiResponse({ status: 400, description: 'Missing criteria, report version or category group' })
  submitForm(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SaveEvaluationDto,
  ) {
    return this.evaluations.submitForm(
      id,
      req.user.id,
      req.user.role as UserRole,
      body.details,
      body.reportId,
    );
  }

  @Patch('results/:profileId/adjustment')
  @Roles(UserRole.OFFICER)
  @ApiOperation({
    summary:
      'Adjust computed total before finalization; retains calculated score and adjustment history',
  })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiBody({ type: AdjustResultDto })
  @ApiResponse({ status: 200, description: 'Adjusted result' })
  @ApiResponse({ status: 400, description: 'Finalized or calculated result missing' })
  adjust(
    @Req() req: AuthenticatedRequest,
    @Param('profileId', ParseUUIDPipe) id: string,
    @Body() body: AdjustResultDto,
  ) {
    return this.evaluations.adjustResult(id, req.user.id, body.score, body.reason);
  }

  @Post('results/:profileId/finalize')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OFFICER)
  @ApiOperation({ summary: 'Finalize calculated/adjusted result' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiResponse({ status: 200, description: 'Result finalized' })
  @ApiResponse({
    status: 400,
    description: 'Both forms are not submitted or result already finalized',
  })
  finalize(@Req() req: AuthenticatedRequest, @Param('profileId', ParseUUIDPipe) id: string) {
    return this.evaluations.finalizeResult(id, req.user.id);
  }

  @Post('results/:profileId/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OFFICER)
  @ApiOperation({ summary: 'Publish finalized result to student' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiResponse({ status: 200, description: 'Published result; notification sent to student' })
  @ApiResponse({ status: 404, description: 'Finalized result not found' })
  publish(@Req() req: AuthenticatedRequest, @Param('profileId', ParseUUIDPipe) id: string) {
    return this.evaluations.publishResult(id, req.user.id);
  }

  @Get('results/:profileId')
  @Roles(UserRole.STUDENT, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get published result for owner student or officer' })
  @ApiParam({ name: 'profileId', example: 'profile-uuid' })
  @ApiResponse({ status: 200, description: 'Result with component and effective scores' })
  @ApiResponse({ status: 404, description: 'Result not found or not yet published' })
  result(@Req() req: AuthenticatedRequest, @Param('profileId', ParseUUIDPipe) id: string) {
    return this.evaluations.getResult(id, req.user.id, req.user.role as UserRole);
  }
}
