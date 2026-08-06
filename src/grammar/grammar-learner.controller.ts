import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { GrammarLearnerService } from './grammar-learner.service';

@Controller('grammar/learn')
@UseGuards(JwtAuthGuard)
export class GrammarLearnerController {
  constructor(
    private readonly service: GrammarLearnerService,
  ) {}

  @Get('course/:courseId')
  getCourse(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
  ) {
    return this.service.getCourse(
      user.id,
      courseId,
    );
  }

  @Get('lesson/:lessonId')
  getLesson(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.service.getLesson(
      user.id,
      lessonId,
    );
  }

  @Post('lesson/:lessonId/section/:sectionId/complete')
  completeSection(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.service.completeSection(
      user.id,
      lessonId,
      sectionId,
    );
  }

  @Post('lesson/:lessonId/quiz/:sectionId/submit')
  submitQuiz(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Param('sectionId') sectionId: string,
    @Body('score') score: number,
  ) {
    return this.service.submitQuiz(
      user.id,
      lessonId,
      sectionId,
      score,
    );
  }
@Get('dashboard')
getDashboard(
  @CurrentUser() user: any,
) {
  return this.service.getDashboard(
    user.id,
  );
}
}