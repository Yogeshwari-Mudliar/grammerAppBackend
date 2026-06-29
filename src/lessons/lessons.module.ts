import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Lesson } from './entities/lesson.entity';
import { LessonSection } from './entities/lesson-section.entity';
import { LessonExample } from './entities/lesson-example.entity';
import { LessonActivity } from './entities/lesson-activity.entity';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      LessonSection,
      LessonExample,
      LessonActivity,
    ]),
    AuthModule,
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
