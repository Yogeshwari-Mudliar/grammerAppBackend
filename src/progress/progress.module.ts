import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LessonsModule } from '../lessons/lessons.module';
import { LessonProgress } from './entities/lesson-progress.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LessonProgress]),
    AuthModule,
    LessonsModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
