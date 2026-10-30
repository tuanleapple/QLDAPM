import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check whether the API is running' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return this.healthService.getHealth();
  }
}
