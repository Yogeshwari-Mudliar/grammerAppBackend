import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProgressModule } from '../progress/progress.module';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizService } from './quiz.service';
import { QuizScoringService } from './quiz-scoring.service';
import { QuizController } from './quiz.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      QuizQuestion,
      QuizOption,
      QuizAttempt,
      Lesson,
    ]),
    AuthModule,
    ProgressModule,
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizScoringService],
  exports: [QuizService],
})
export class QuizModule {}
