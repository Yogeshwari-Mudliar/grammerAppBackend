import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';

import { GrammarCourse } from './entities/grammar-course.entity';
import { GrammarLesson } from './entities/grammar-lesson.entity';
import { GrammarSection } from './entities/grammar-section.entity';

import { GrammarUserCourse } from './entities/grammar-user-course.entity';
import { GrammarUserLesson } from './entities/grammar-user-lesson.entity';
import { GrammarUserSection } from './entities/grammar-user-section.entity';
import { GrammarUserQuiz } from './entities/grammar-user-quiz.entity';
import { GrammarUserProfile } from './entities/grammar-user-profile.entity';

import { GrammarRepository } from './repositories/grammar.repository';
import { GrammarLearnerRepository } from './repositories/grammar-learner.repository';

import { DocumentParserService } from './services/document-parser.service';

import { GrammarLearnerController } from './grammar-learner.controller';
import { GrammarLearnerService } from './grammar-learner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GrammarCourse,
      GrammarLesson,
      GrammarSection,

      GrammarUserCourse,
      GrammarUserLesson,
      GrammarUserSection,
      GrammarUserQuiz,
      GrammarUserProfile,
    ]),
  ],

  controllers: [
    GrammarController,
    GrammarLearnerController,
  ],

  providers: [
    GrammarService,
    GrammarRepository,
    DocumentParserService,

    GrammarLearnerRepository,
    GrammarLearnerService,
  ],

  exports: [
    GrammarService,
    GrammarRepository,

    GrammarLearnerRepository,
    GrammarLearnerService,
  ],
})
export class GrammarModule {}