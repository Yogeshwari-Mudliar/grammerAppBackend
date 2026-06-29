import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/user-role.enum';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QueryQuizzesDto } from './dto/query-quizzes.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryQuizzesDto) {
    return this.quizService.findAllForUser(user, query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateQuizDto) {
    return this.quizService.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizService.findOneForUser(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.setPublished(id, true);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/unpublish')
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.setPublished(id, false);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  @Post(':id/attempts')
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizService.submitAttempt(id, user, dto);
  }

  @Get(':id/attempts')
  myAttempts(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizService.findMyAttempts(id, user);
  }

  @Get(':id/attempts/:attemptId')
  attempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizService.findAttempt(attemptId, user);
  }
}
