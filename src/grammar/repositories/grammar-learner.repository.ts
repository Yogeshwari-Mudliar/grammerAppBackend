import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  Repository,
} from 'typeorm';

import { GrammarCourse } from '../entities/grammar-course.entity';
import { GrammarLesson } from '../entities/grammar-lesson.entity';
import { GrammarSection } from '../entities/grammar-section.entity';

import { GrammarUserCourse } from '../entities/grammar-user-course.entity';
import { GrammarUserLesson } from '../entities/grammar-user-lesson.entity';
import { GrammarUserSection } from '../entities/grammar-user-section.entity';
import { GrammarUserQuiz } from '../entities/grammar-user-quiz.entity';
import { GrammarUserProfile } from '../entities/grammar-user-profile.entity';
import { User } from '../../users/users.entity';

@Injectable()
export class GrammarLearnerRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(GrammarCourse)
    private readonly courseRepo: Repository<GrammarCourse>,

    @InjectRepository(GrammarLesson)
    private readonly lessonRepo: Repository<GrammarLesson>,

    @InjectRepository(GrammarSection)
    private readonly sectionRepo: Repository<GrammarSection>,

    @InjectRepository(GrammarUserCourse)
    private readonly userCourseRepo: Repository<GrammarUserCourse>,

    @InjectRepository(GrammarUserLesson)
    private readonly userLessonRepo: Repository<GrammarUserLesson>,

    @InjectRepository(GrammarUserSection)
    private readonly userSectionRepo: Repository<GrammarUserSection>,

    @InjectRepository(GrammarUserQuiz)
    private readonly userQuizRepo: Repository<GrammarUserQuiz>,

    @InjectRepository(GrammarUserProfile)
    private readonly profileRepo: Repository<GrammarUserProfile>,
  ) {}

  // ============================================================
  // PROFILE
  // ============================================================

  private async getProfile(userId: number) {
    let profile = await this.profileRepo.findOne({
      where: {
        userId,
      },
    });

    if (!profile) {
   profile = this.profileRepo.create({
  userId,

  level: 1,

  totalXp: 0,
  totalCoins: 0,

  completedCourses: 0,
  completedLessons: 0,
  completedSections: 0,
  completedQuizzes: 0,

  currentStreak: 0,
  longestStreak: 0,

  lastActivityAt: new Date(),
});

      await this.profileRepo.save(profile);
    }

    return profile;
  }

  // ============================================================
  // COURSE
  // ============================================================

  private async getUserCourse(
    userId: number,
    courseId: string,
  ) {
    let course = await this.userCourseRepo.findOne({
      where: {
        userId,
        courseId,
      },
    });

    if (!course) {
      const lessonCount =
        await this.lessonRepo.count({
          where: {
            courseId,
            isActive: true,
          },
        });

      course = this.userCourseRepo.create({
        userId,
        courseId,
        isStarted: true,
        startedAt: new Date(),
        totalLessons: lessonCount,
        completedLessons: 0,
        progress: 0,
        earnedXp: 0,
        earnedCoins: 0,
      });

      await this.userCourseRepo.save(course);
    }

    return course;
  }

  // ============================================================
  // LESSON
  // ============================================================

  private async getUserLesson(
    userId: number,
    lessonId: string,
    courseId: string,
  ) {
    let lesson =
      await this.userLessonRepo.findOne({
        where: {
          userId,
          lessonId,
        },
      });

    if (!lesson) {
      const totalSections =
        await this.sectionRepo.count({
          where: {
            lessonId,
            isActive: true,
          },
        });

      lesson =
        this.userLessonRepo.create({
          userId,
          lessonId,
          courseId,

          isUnlocked: true,
          isStarted: true,

          startedAt: new Date(),

          completedSections: 0,
          totalSections,

          progress: 0,

          earnedXp: 0,
          earnedCoins: 0,
        });

      await this.userLessonRepo.save(
        lesson,
      );
    }

    return lesson;
  }

  // ============================================================
  // SECTION
  // ============================================================

  private async getUserSection(
    userId: number,
    lessonId: string,
    sectionId: string,
  ) {
    let section =
      await this.userSectionRepo.findOne({
        where: {
          userId,
          lessonId,
          sectionId,
        },
      });

    if (!section) {
      section =
        this.userSectionRepo.create({
          userId,
          lessonId,
          sectionId,

          isUnlocked: true,
          isCompleted: false,

          earnedXp: 0,
          earnedCoins: 0,
        });

      await this.userSectionRepo.save(
        section,
      );
    }

    return section;
  }

  // ============================================================
  // COURSE API
  // ============================================================

  async getCourse(
    userId: number,
    courseId: string,
  ) {
    await this.getProfile(userId);

    await this.getUserCourse(
      userId,
      courseId,
    );

    const course =
      await this.courseRepo.findOne({
        where: {
          id: courseId,
          isActive: true,
        },
        relations: [
          'lessons',
          'lessons.sections',
        ],
      });

    if (!course) {
      throw new NotFoundException(
        'Course not found',
      );
    }

    return course;
  }

  // ============================================================
  // LESSON API
  // ============================================================

  async getLesson(
    userId: number,
    lessonId: string,
  ) {
    const lesson =
      await this.lessonRepo.findOne({
        where: {
          id: lessonId,
          isActive: true,
        },
        relations: [
          'sections',
        ],
      });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found',
      );
    }

    await this.getUserCourse(
      userId,
      lesson.courseId,
    );

    await this.getUserLesson(
      userId,
      lesson.id,
      lesson.courseId,
    );

    return lesson;
  }

  // ============================================================
  // PART-2
  // ============================================================

async completeSection(
  userId: number,
  lessonId: string,
  sectionId: string,
) {
  return await this.dataSource.transaction(async manager => {

    const lesson = await manager.findOne(GrammarLesson, {
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const section = await manager.findOne(GrammarSection, {
      where: {
        id: sectionId,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    let profile = await this.getProfile(userId);

    let userCourse = await this.getUserCourse(
      userId,
      lesson.courseId,
    );

    let userLesson = await this.getUserLesson(
      userId,
      lesson.id,
      lesson.courseId,
    );

    let userSection = await this.getUserSection(
      userId,
      lesson.id,
      section.id,
    );

    if (userSection.isCompleted) {
      return {
        success: true,
        alreadyCompleted: true,
      };
    }

    const earnedXp = section.isQuiz ? 25 : 10;
    const earnedCoins = section.isQuiz ? 10 : 5;

    userSection.isCompleted = true;
    userSection.completedAt = new Date();
    userSection.earnedXp = earnedXp;
    userSection.earnedCoins = earnedCoins;

    await manager.save(userSection);

    profile.totalXp += earnedXp;
    profile.totalCoins += earnedCoins;
    profile.completedSections += 1;
    profile.lastActivityAt = new Date();

    while (profile.totalXp >= profile.level * 100) {
      profile.level++;
    }

    await manager.save(profile);

    userLesson.completedSections += 1;
    userLesson.earnedXp += earnedXp;
    userLesson.earnedCoins += earnedCoins;

    userLesson.progress =
      Number(
        (
          (userLesson.completedSections /
            userLesson.totalSections) *
          100
        ).toFixed(2),
      );

  await manager.save(userLesson);

// ======================================================
// Unlock Next Section
// ======================================================

const nextSection = await manager.findOne(GrammarSection, {
  where: {
    lessonId: lesson.id,
    orderNo: section.orderNo + 1,
    isActive: true,
  },
});

if (nextSection) {
  let unlocked = await manager.findOne(GrammarUserSection, {
    where: {
      userId,
      lessonId: lesson.id,
      sectionId: nextSection.id,
    },
  });

  if (!unlocked) {
    unlocked = this.userSectionRepo.create({
      userId,
      lessonId: lesson.id,
      sectionId: nextSection.id,

      isUnlocked: true,
      isCompleted: false,

      earnedXp: 0,
      earnedCoins: 0,
    });

    await manager.save(unlocked);
  } else if (!unlocked.isUnlocked) {
    unlocked.isUnlocked = true;
    await manager.save(unlocked);
  }
}

// ======================================================
// Lesson Completed
// ======================================================

if (
  userLesson.completedSections >=
  userLesson.totalSections
) {
  userLesson.isCompleted = true;
  userLesson.completedAt = new Date();

  await manager.save(userLesson);

  profile.completedLessons++;

  await manager.save(profile);

  userCourse.completedLessons++;

  userCourse.earnedXp += userLesson.earnedXp;
  userCourse.earnedCoins += userLesson.earnedCoins;

  userCourse.progress = Number(
    (
      (userCourse.completedLessons /
        userCourse.totalLessons) *
      100
    ).toFixed(2),
  );

  if (
    userCourse.completedLessons >=
    userCourse.totalLessons
  ) {
    userCourse.isCompleted = true;
    userCourse.completedAt = new Date();

    profile.completedCourses++;

    await manager.save(profile);
  }

  await manager.save(userCourse);

  // ==========================================
  // Unlock Next Lesson
  // ==========================================

  const nextLesson = await manager.findOne(
    GrammarLesson,
    {
      where: {
        courseId: lesson.courseId,
        sortOrder: lesson.sortOrder + 1,
        isActive: true,
      },
    },
  );

  if (nextLesson) {
    let nextUserLesson =
      await manager.findOne(
        GrammarUserLesson,
        {
          where: {
            userId,
            lessonId: nextLesson.id,
          },
        },
      );

    if (!nextUserLesson) {
      const totalSections =
        await manager.count(
          GrammarSection,
          {
            where: {
              lessonId: nextLesson.id,
              isActive: true,
            },
          },
        );

      nextUserLesson =
        this.userLessonRepo.create({
          userId,

          courseId: nextLesson.courseId,
          lessonId: nextLesson.id,

          isUnlocked: true,
          isStarted: false,
          isCompleted: false,

          totalSections,
          completedSections: 0,

          progress: 0,

          earnedXp: 0,
          earnedCoins: 0,
        });

      await manager.save(nextUserLesson);
    } else if (!nextUserLesson.isUnlocked) {
      nextUserLesson.isUnlocked = true;
      await manager.save(nextUserLesson);
    }
  }
}

return {
  success: true,

  earnedXp,
  earnedCoins,

  profile,

  lessonProgress: userLesson.progress,
  courseProgress: userCourse.progress,

  lessonCompleted: userLesson.isCompleted,
  courseCompleted: userCourse.isCompleted,
};
  });
}

async submitQuiz(
  userId: number,
  lessonId: string,
  sectionId: string,
  score: number,
) {
  return await this.dataSource.transaction(async manager => {

    const lesson = await manager.findOne(GrammarLesson, {
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const section = await manager.findOne(GrammarSection, {
      where: {
        id: sectionId,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    let quiz =
      await manager.findOne(
        GrammarUserQuiz,
        {
          where: {
            userId,
            lessonId,
            sectionId,
          },
          order: {
            attemptNo: 'DESC',
          },
        },
      );

    const attemptNo =
      quiz
        ? quiz.attemptNo + 1
        : 1;

    const passed = score >= 70;

    const earnedXp =
      passed ? 25 : 0;

    const earnedCoins =
      passed ? 10 : 0;

    quiz =
      this.userQuizRepo.create({
        userId,
        lessonId,
        sectionId,

        attemptNo,

        score,

        totalQuestions: 0,
        correctAnswers: 0,

        isPassed: passed,

        earnedXp,
        earnedCoins,

        submittedAt: new Date(),
      });

    await manager.save(quiz);

    if (!passed) {
      return {
        success: true,
        passed: false,
        score,
      };
    }

    const completed =
      await this.userSectionRepo.findOne({
        where: {
          userId,
          lessonId,
          sectionId,
          isCompleted: true,
        },
      });

    if (!completed) {
      return await this.completeSection(
        userId,
        lessonId,
        sectionId,
      );
    }

    return {
      success: true,
      passed: true,
      score,
      earnedXp,
      earnedCoins,
    };

  });
}

async getDashboard(userId: number) {
  const profile = await this.getProfile(userId);

  const currentCourse = await this.userCourseRepo.findOne({
    where: {
      userId,
      isStarted: true,
      isCompleted: false,
    },
    order: {
      updatedAt: 'DESC',
    },
  });

  if (!currentCourse) {
    return {
      profile: {
        level: profile.level,
        xp: profile.totalXp,
        coins: profile.totalCoins,
        streak: profile.currentStreak,
        longestStreak: profile.longestStreak,
      },

      stats: {
        completedCourses: profile.completedCourses,
        completedLessons: profile.completedLessons,
        completedSections: profile.completedSections,
        completedQuizzes: profile.completedQuizzes,
      },

      currentCourse: null,
      continueLesson: null,
    };
  }

  const course = await this.courseRepo.findOne({
    where: {
      id: currentCourse.courseId,
    },
  });

  const userLesson = await this.userLessonRepo.findOne({
    where: {
      userId,
      courseId: currentCourse.courseId,
      isCompleted: false,
    },
    order: {
      updatedAt: 'ASC',
    },
  });

  let continueLesson: any = null;

  if (userLesson) {
    const lesson = await this.lessonRepo.findOne({
      where: {
        id: userLesson.lessonId,
      },
    });

    if (lesson) {
      continueLesson = {
        id: lesson.id,
        title: lesson.title,
        description: lesson.shortDescription,
        thumbnail: lesson.thumbnail,
        duration: lesson.duration,

        progress: userLesson.progress,
        completedSections: userLesson.completedSections,
        totalSections: userLesson.totalSections,

        earnedXp: userLesson.earnedXp,
        earnedCoins: userLesson.earnedCoins,
      };
    }
  }

  return {
    profile: {
      level: profile.level,
      xp: profile.totalXp,
      coins: profile.totalCoins,
      streak: profile.currentStreak,
      longestStreak: profile.longestStreak,
    },

    stats: {
      completedCourses: profile.completedCourses,
      completedLessons: profile.completedLessons,
      completedSections: profile.completedSections,
      completedQuizzes: profile.completedQuizzes,
    },

    currentCourse: course
      ? {
          id: course.id,
          title: course.title,
          description: course.description,
          bannerImage: course.bannerImage,
          level: course.level,

          progress: currentCourse.progress,
          completedLessons: currentCourse.completedLessons,
          totalLessons: currentCourse.totalLessons,

          earnedXp: currentCourse.earnedXp,
          earnedCoins: currentCourse.earnedCoins,
        }
      : null,

    continueLesson,
  };
}
}