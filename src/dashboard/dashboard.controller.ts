import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getDashboard(user);
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getUserStatistics(user);
  }

  @Get('continue-learning')
  getContinueLearning(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getContinueLearning(user);
  }

  @Get('recent-activity')
  getRecentActivity(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getRecentActivity(user);
  }
}
