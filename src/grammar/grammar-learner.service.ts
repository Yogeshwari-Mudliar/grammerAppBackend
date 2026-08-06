import { Injectable } from '@nestjs/common';

import { GrammarLearnerRepository } from './repositories/grammar-learner.repository';

@Injectable()
export class GrammarLearnerService {
  constructor(
    private readonly repo: GrammarLearnerRepository,
  ) {}

  getCourse(
    userId: number,
    courseId: string,
  ) {
    return this.repo.getCourse(
      userId,
      courseId,
    );
  }

  getLesson(
    userId: number,
    lessonId: string,
  ) {
    return this.repo.getLesson(
      userId,
      lessonId,
    );
  }

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
  getDashboard(
  userId: number,
) {
  return this.repo.getDashboard(
    userId,
  );
}
}