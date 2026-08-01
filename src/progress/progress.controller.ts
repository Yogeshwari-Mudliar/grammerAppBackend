import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { ProgressService } from './progress.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.progressService.findMine(user);
  }

  @Get('lessons/:lessonId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.progressService.findOneForLesson(user, lessonId);
  }

  @Put('lessons/:lessonId')
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.progressService.upsert(user, lessonId, dto);
  }
}
