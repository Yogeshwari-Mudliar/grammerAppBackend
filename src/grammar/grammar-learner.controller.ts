// import {
//   Body,
//   Controller,
//   Get,
//   Param,
//   Post,
//   Query,
//   Req,
//   UseGuards,
// } from '@nestjs/common';

// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';

// import { GrammarLearnerService } from './grammar-learner.service';
// import { SubmitGrammarQuizDto } from './dto/learner/submit-quiz.dto';

// @Controller('grammar/learn')
// @UseGuards(JwtAuthGuard)
// export class GrammarLearnerController {
//   constructor(
//     private readonly service: GrammarLearnerService,
//   ) {}

//   // ============================================================
//   // LIBRARY
//   // ============================================================

//   @Get('library')
//   getLibrary(
//     @CurrentUser() user: any,
//   ) {
//     return this.service.getLibrary(user.id);
//   }

//   // ============================================================
//   // COURSE
//   // ============================================================

//   @Get('course/:courseId')
//   getCourse(
//     @CurrentUser() user: any,
//     @Param('courseId') courseId: string,
//   ) {
//     return this.service.getCourse(
//       user.id,
//       courseId,
//     );
//   }

//   // ============================================================
//   // LESSON
//   // ============================================================

//   @Get('lesson/:lessonId')
//   getLesson(
//     @CurrentUser() user: any,
//     @Param('lessonId') lessonId: string,
//   ) {
//     return this.service.getLesson(
//       user.id,
//       lessonId,
//     );
//   }

//   // ============================================================
//   // COMPLETE SECTION
//   // ============================================================

//   @Post(
//     'lesson/:lessonId/section/:sectionId/complete',
//   )
//   completeSection(
//     @CurrentUser() user: any,
//     @Param('lessonId') lessonId: string,
//     @Param('sectionId') sectionId: string,
//   ) {
//     return this.service.completeSection(
//       user.id,
//       lessonId,
//       sectionId,
//     );
//   }

//   // ============================================================
//   // COMPLETE ENTIRE LESSON
//   // ============================================================

//   @Post(
//     'lesson/:lessonId/complete',
//   )
//   completeLesson(
//     @CurrentUser() user: any,
//     @Param('lessonId') lessonId: string,
//   ) {
//     return this.service.completeLesson(
//       user.id,
//       lessonId,
//     );
//   }

//   // ============================================================
//   // QUIZ
//   // ============================================================

//   @Post(
//     'lesson/:lessonId/quiz/:sectionId/submit',
//   )
//   // submitQuiz(
//   //   @CurrentUser() user: any,
//   //   @Param('lessonId') lessonId: string,
//   //   @Param('sectionId') sectionId: string,
//   //   @Body('score') score: number,
//   // ) {
//   //   return this.service.submitQuiz(
//   //     user.id,
//   //     lessonId,
//   //     sectionId,
//   //     score,
//   //   );
//   // }

//   // ============================================================
//   // DASHBOARD
//   // ============================================================

//   @Get('dashboard')
//   getDashboard(
//     @CurrentUser() user: any,
//   ) {
//     return this.service.getDashboard(
//       user.id,
//     );
//   }

//   @Post(
//   'lessons/:lessonId/sections/:sectionId/quiz',
// )
// submitQuiz(
//   @Param('lessonId') lessonId: string,
//   @Param('sectionId') sectionId: string,
//   @Body() dto: SubmitGrammarQuizDto,
//   @Req() req: any,
// ) {
//   return this.service.submitQuiz(
//     req.user.id,
//     lessonId,
//     sectionId,
//     dto.answers,
//   );
// }

// @Get('quizzes')
// getAllQuizzes(
//   @Req() req: any,
// ) {
//   return this.service.getAllQuizzes(
//     req.user.id,
//   );
// }

// @Get('quizzes/random')
// getRandomQuiz(
//   @Req() req: any,
//   @Query('limit') limit?: number,
// ) {
//   return this.service.getRandomQuiz(
//     req.user.id,
//     Number(limit) || 10,
//   );
// }
// }

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { GrammarLearnerService } from './grammar-learner.service';
import { SubmitGrammarQuizDto } from './dto/learner/submit-quiz.dto';
import { AnswerGrammarQuizDto } from './dto/learner/answer-quiz.dto';


@Controller('grammar/learn')
@UseGuards(JwtAuthGuard)
export class GrammarLearnerController {

  constructor(
    private readonly service: GrammarLearnerService,
  ) {}


  // ============================================================
  // LIBRARY
  // ============================================================

  @Get('library')
  getLibrary(
    @CurrentUser() user: any,
  ) {
    return this.service.getLibrary(user.id);
  }


  // ============================================================
  // COURSE
  // ============================================================

  @Get('course/:courseId')
  getCourse(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
  ) {
    return this.service.getCourse(
      user.id,
      courseId,
    );
  }


  // ============================================================
  // LESSON
  // ============================================================

  @Get('lesson/:lessonId')
  getLesson(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.service.getLesson(
      user.id,
      lessonId,
    );
  }


  // ============================================================
  // COMPLETE SECTION
  // ============================================================

  @Post(
    'lesson/:lessonId/section/:sectionId/complete',
  )
  completeSection(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.service.completeSection(
      user.id,
      lessonId,
      sectionId,
    );
  }


  // ============================================================
  // COMPLETE ENTIRE LESSON
  // ============================================================

  @Post(
    'lesson/:lessonId/complete',
  )
  completeLesson(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.service.completeLesson(
      user.id,
      lessonId,
    );
  }


  // ============================================================
  // QUIZ — CHECK SINGLE ANSWER
  // ============================================================

  @Post(
    'lesson/:lessonId/quiz/:sectionId/answer',
  )
  checkQuizAnswer(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: AnswerGrammarQuizDto,
  ) {
    return this.service.checkQuizAnswer(
      user.id,
      lessonId,
      sectionId,
      dto.questionIndex,
      dto.answerIndex,
    );
  }


  // ============================================================
  // QUIZ — SUBMIT COMPLETE QUIZ
  // ============================================================

  @Post(
    'lesson/:lessonId/quiz/:sectionId/submit',
  )
  submitQuiz(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: SubmitGrammarQuizDto,
  ) {
    return this.service.submitQuiz(
      user.id,
      lessonId,
      sectionId,
      dto.answers,
    );
  }


  // ============================================================
  // DASHBOARD
  // ============================================================

  @Get('dashboard')
  getDashboard(
    @CurrentUser() user: any,
  ) {
    return this.service.getDashboard(
      user.id,
    );
  }


  // ============================================================
  // PRACTICE QUIZZES
  // ============================================================

  @Get('quizzes')
  getAllQuizzes(
    @Req() req: any,
  ) {
    return this.service.getAllQuizzes(
      req.user.id,
    );
  }


  // ============================================================
  // RANDOM QUIZ / RAPID FIRE
  // ============================================================

  @Get('quizzes/random')
  getRandomQuiz(
    @Req() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.service.getRandomQuiz(
      req.user.id,
      Number(limit) || 10,
    );
  }
}