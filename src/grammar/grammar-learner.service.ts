import { Injectable } from '@nestjs/common';

import { GrammarLearnerRepository } from './repositories/grammar-learner.repository';

@Injectable()
export class GrammarLearnerService {
  constructor(
    private readonly repo: GrammarLearnerRepository,
  ) {}

  // ============================================================
  // LIBRARY
  // ============================================================

  getLibrary(userId: number) {
    return this.repo.getLibrary(userId);
  }

  // ============================================================
  // COURSE
  // ============================================================

  getCourse(
    userId: number,
    courseId: string,
  ) {
    return this.repo.getCourse(
      userId,
      courseId,
    );
  }

  // ============================================================
  // LESSON
  // ============================================================

  getLesson(
    userId: number,
    lessonId: string,
  ) {
    return this.repo.getLesson(
      userId,
      lessonId,
    );
  }

  // ============================================================
  // COMPLETE SECTION
  // ============================================================

  completeSection(
    userId: number,
    lessonId: string,
    sectionId: string,
  ) {
    return this.repo.completeSection(
      userId,
      lessonId,
      sectionId,
    );
  }

  // ============================================================
  // COMPLETE ENTIRE LESSON
  // ============================================================

  completeLesson(
    userId: number,
    lessonId: string,
  ) {
    return this.repo.completeLesson(
      userId,
      lessonId,
    );
  }

  // ============================================================
  // QUIZ
  // ============================================================

  submitQuiz(
    userId: number,
    lessonId: string,
    sectionId: string,
    score: number,
  ) {
    return this.repo.submitQuiz(
      userId,
      lessonId,
      sectionId,
      score,
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  getDashboard(userId: number) {
    return this.repo.getDashboard(userId);
  }
}