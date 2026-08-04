import { Injectable } from '@nestjs/common';

import { GrammarRepository } from './repositories/grammar.repository';

import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateSectionDto } from './dto/create-section.dto';

import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

import { DocumentParserService } from './services/document-parser.service';

@Injectable()
export class GrammarService {
  constructor(
    private readonly grammarRepository: GrammarRepository,
    private readonly parser: DocumentParserService,
  ) {}

  // =====================================================
  // Learner
  // =====================================================

  async getCourses() {
    return this.grammarRepository.getCourses();
  }

  async getCourse(id: string) {
    return this.grammarRepository.getCourse(id);
  }

  // =====================================================
  // Course
  // =====================================================

  async createCourse(dto: CreateCourseDto) {
    return this.grammarRepository.createCourse(dto);
  }

  async updateCourse(
    id: string,
    dto: UpdateCourseDto,
  ) {
    return this.grammarRepository.updateCourse(id, dto);
  }

  async deleteCourse(id: string) {
    return this.grammarRepository.deleteCourse(id);
  }

  // =====================================================
  // Lesson
  // =====================================================

  async addLesson(
    courseId: string,
    dto: CreateLessonDto,
    file: any,
  ) {
    const text = await this.parser.parse(file);

    return this.grammarRepository.addLesson(
      courseId,
      dto,
      text,
    );
  }

  async updateLesson(
    id: string,
    dto: UpdateLessonDto,
    file?: any,
  ) {
    return this.grammarRepository.updateLesson(
      id,
      dto,
      file,
    );
  }

  async deleteLesson(id: string) {
    return this.grammarRepository.deleteLesson(id);
  }

  async getLesson(id: string) {
    return this.grammarRepository.getLesson(id);
  }

  // =====================================================
  // Section
  // =====================================================

  async addSection(
    courseId: string,
    lessonId: string,
    dto: CreateSectionDto,
  ) {
    return this.grammarRepository.addSection(
      courseId,
      lessonId,
      dto,
    );
  }

  async updateSection(
    id: string,
    dto: UpdateSectionDto,
  ) {
    return this.grammarRepository.updateSection(id, dto);
  }

  async deleteSection(id: string) {
    return this.grammarRepository.deleteSection(id);
  }

  async getSection(id: string) {
    return this.grammarRepository.getSection(id);
  }
}