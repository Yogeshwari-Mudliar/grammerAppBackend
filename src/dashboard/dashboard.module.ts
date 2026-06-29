import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/users.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { LessonProgress } from '../progress/entities/lesson-progress.entity';
import { QuizAttempt } from '../quiz/entities/quiz-attempt.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Lesson, Quiz, LessonProgress, QuizAttempt]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
