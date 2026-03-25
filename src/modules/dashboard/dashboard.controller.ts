import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue trend data' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to include (default 12, max 36)',
  })
  getRevenueTrend(@Query('months') months?: string) {
    return this.dashboardService.getRevenueTrend(months);
  }
}
