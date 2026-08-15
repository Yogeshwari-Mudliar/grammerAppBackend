// import { Injectable } from '@nestjs/common';

// import { GrammarLearnerRepository } from './repositories/grammar-learner.repository';

// @Injectable()
// export class GrammarLearnerService {
//   constructor(
//     private readonly repo: GrammarLearnerRepository,
//   ) {}

//   // ============================================================
//   // LIBRARY
//   // ============================================================

//   getLibrary(userId: number) {
//     return this.repo.getLibrary(userId);
//   }

//   // ============================================================
//   // COURSE
//   // ============================================================

//   getCourse(
//     userId: number,
//     courseId: string,
//   ) {
//     return this.repo.getCourse(
//       userId,
//       courseId,
//     );
//   }

//   // ============================================================
//   // LESSON
//   // ============================================================

//   getLesson(
//     userId: number,
//     lessonId: string,
//   ) {
//     return this.repo.getLesson(
//       userId,
//       lessonId,
//     );
//   }

//   // ============================================================
//   // COMPLETE SECTION
//   // ============================================================

//   completeSection(
//     userId: number,
//     lessonId: string,
//     sectionId: string,
//   ) {
//     return this.repo.completeSection(
//       userId,
//       lessonId,
//       sectionId,
//     );
//   }

//   // ============================================================
//   // COMPLETE ENTIRE LESSON
//   // ============================================================

//   completeLesson(
//     userId: number,
//     lessonId: string,
//   ) {
//     return this.repo.completeLesson(
//       userId,
//       lessonId,
//     );
//   }

//   // ============================================================
//   // QUIZ
//   // ============================================================

//   // submitQuiz(
//   //   userId: number,
//   //   lessonId: string,
//   //   sectionId: string,
//   //   score: number,
//   // ) {
//   //   return this.repo.submitQuiz(
//   //     userId,
//   //     lessonId,
//   //     sectionId,
//   //     score,
//   //   );
//   // }

//   // ============================================================
//   // DASHBOARD
//   // ============================================================

//   getDashboard(userId: number) {
//     return this.repo.getDashboard(userId);
//   }

//   async submitQuiz(
//   userId: number,
//   lessonId: string,
//   sectionId: string,
//   answers: number[],
// ) {
//   return this.repo.submitQuiz(
//     userId,
//     lessonId,
//     sectionId,
//     answers,
//   );
// }
// // ============================================================
// // PRACTICE QUIZZES
// // ============================================================

// async getAllQuizzes(userId: number) {
//   return this.repo.getAllQuizzes(userId);
// }

// // ============================================================
// // RANDOM QUIZ / RAPID FIRE
// // ============================================================

// async getRandomQuiz(
//   userId: number,
//   limit = 10,
// ) {
//   return this.repo.getRandomQuiz(userId, limit);
// }
// }

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
  // QUIZ — CHECK SINGLE ANSWER
  // ============================================================

  async checkQuizAnswer(
    userId: number,
    lessonId: string,
    sectionId: string,
    questionIndex: number,
    answerIndex: number,
  ) {
    return this.repo.checkQuizAnswer(
      userId,
      lessonId,
      sectionId,
      questionIndex,
      answerIndex,
    );
  }


  // ============================================================
  // QUIZ — SUBMIT COMPLETE QUIZ
  // ============================================================

  async submitQuiz(
    userId: number,
    lessonId: string,
    sectionId: string,
    answers: number[],
  ) {
    return this.repo.submitQuiz(
      userId,
      lessonId,
      sectionId,
      answers,
    );
  }


  // ============================================================
  // DASHBOARD
  // ============================================================

  getDashboard(userId: number) {
    return this.repo.getDashboard(
      userId,
    );
  }


  // ============================================================
  // PRACTICE QUIZZES
  // ============================================================

  async getAllQuizzes(userId: number) {
    return this.repo.getAllQuizzes(
      userId,
    );
  }


  // ============================================================
  // RANDOM QUIZ / RAPID FIRE
  // ============================================================

  async getRandomQuiz(
    userId: number,
    limit = 10,
  ) {
    return this.repo.getRandomQuiz(
      userId,
      limit,
    );
  }
}