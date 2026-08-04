import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { GrammarService } from './grammar.service';

import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateSectionDto } from './dto/create-section.dto';

import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Controller('grammar')
export class GrammarController {
  constructor(
    private readonly grammarService: GrammarService,
  ) {}

  // =====================================================
  // Learner APIs
  // =====================================================

  @Get()
  getCourses() {
    return this.grammarService.getCourses();
  }

  @Get(':id')
  getCourse(
    @Param('id') id: string,
  ) {
    return this.grammarService.getCourse(id);
  }

  // =====================================================
  // Course APIs
  // =====================================================

  @Post()
  createCourse(
    @Body() dto: CreateCourseDto,
  ) {
    return this.grammarService.createCourse(dto);
  }

  @Patch(':id')
  updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.grammarService.updateCourse(id, dto);
  }

  @Delete(':id')
  deleteCourse(
    @Param('id') id: string,
  ) {
    return this.grammarService.deleteCourse(id);
  }

  // =====================================================
  // Lesson APIs
  // =====================================================

  @Post(':courseId/lessons')
  @UseInterceptors(FileInterceptor('file'))
  addLesson(
    @Param('courseId') courseId: string,

    @UploadedFile()
    file: any,

    @Body()
    dto: CreateLessonDto,
  ) {
    return this.grammarService.addLesson(
      courseId,
      dto,
      file,
    );
  }

  @Patch('lessons/:id')
  @UseInterceptors(FileInterceptor('file'))
  updateLesson(
    @Param('id') id: string,

    @UploadedFile()
    file: any,

    @Body()
    dto: UpdateLessonDto,
  ) {
    return this.grammarService.updateLesson(
      id,
      dto,
      file,
    );
  }

  @Delete('lessons/:id')
  deleteLesson(
    @Param('id') id: string,
  ) {
    return this.grammarService.deleteLesson(id);
  }

  @Get('lessons/:id')
  getLesson(
    @Param('id') id: string,
  ) {
    return this.grammarService.getLesson(id);
  }

  // =====================================================
  // Section APIs
  // =====================================================

  @Post(':courseId/lessons/:lessonId/sections')
  addSection(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.grammarService.addSection(
      courseId,
      lessonId,
      dto,
    );
  }

  @Patch('sections/:id')
  updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.grammarService.updateSection(
      id,
      dto,
    );
  }

  @Delete('sections/:id')
  deleteSection(
    @Param('id') id: string,
  ) {
    return this.grammarService.deleteSection(id);
  }

  @Get('sections/:id')
  getSection(
    @Param('id') id: string,
  ) {
    return this.grammarService.getSection(id);
  }
}