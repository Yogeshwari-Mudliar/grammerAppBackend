import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';
import { GrammarRepository } from './repositories/grammar.repository';

import { GrammarCourse } from './entities/grammar-course.entity';
import { GrammarLesson } from './entities/grammar-lesson.entity';
import { GrammarSection } from './entities/grammar-section.entity';
import { DocumentParserService } from './services/document-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GrammarCourse,
      GrammarLesson,
      GrammarSection,DocumentParserService,
    ]),
  ],
  controllers: [GrammarController],
  providers: [
    GrammarService,
    GrammarRepository,DocumentParserService,
  ],
  exports: [
    GrammarService,
    GrammarRepository,
  ],
})
export class GrammarModule {}