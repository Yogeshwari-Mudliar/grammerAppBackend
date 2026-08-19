import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectDataSource,
  InjectRepository,
} from '@nestjs/typeorm';

import {
  DataSource,
  EntityManager,
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
import { UserRole } from 'src/common/enums/user-role.enum';

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
      where: { userId },
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
// STREAK
// ============================================================

private async updateStreak(
  manager: EntityManager,
  profile: GrammarUserProfile,
) {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const lastActivity = profile.lastActivityAt
    ? new Date(profile.lastActivityAt)
    : null;

  if (!lastActivity) {
    profile.currentStreak = 1;
    profile.longestStreak = Math.max(
      profile.longestStreak ?? 0,
      1,
    );
  } else {
    const lastDay = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate(),
    );

    const diffMs =
      today.getTime() -
      lastDay.getTime();

    const diffDays =
      Math.floor(
        diffMs /
          (1000 * 60 * 60 * 24),
      );

    // Same day
    if (diffDays === 0) {
      // Do nothing.
    }

    // Yesterday
    else if (diffDays === 1) {
      profile.currentStreak =
        (profile.currentStreak ?? 0) + 1;

      profile.longestStreak =
        Math.max(
          profile.longestStreak ?? 0,
          profile.currentStreak,
        );
    }

    // More than one day gap
    else {
      profile.currentStreak = 1;

      profile.longestStreak =
        Math.max(
          profile.longestStreak ?? 0,
          1,
        );
    }
  }

  profile.lastActivityAt = now;

  await manager.save(profile);

  return profile;
}
  // ============================================================
  // USER COURSE
  // ============================================================

  private async getUserCourse(
    userId: number,
    courseId: string,
  ) {
    let userCourse = await this.userCourseRepo.findOne({
      where: {
        userId,
        courseId,
      },
    });

    const totalLessons = await this.lessonRepo.count({
      where: {
        courseId,
        isActive: true,
      },
    });

    if (!userCourse) {
      userCourse = this.userCourseRepo.create({
        userId,
        courseId,
        isStarted: true,
        isCompleted: false,
        startedAt: new Date(),
        totalLessons,
        completedLessons: 0,
        progress: 0,
        earnedXp: 0,
        earnedCoins: 0,
      });

      await this.userCourseRepo.save(userCourse);
    } else {
      userCourse.totalLessons = totalLessons;

      await this.userCourseRepo.save(userCourse);
    }

    return userCourse;
  }

  // ============================================================
  // USER LESSON
  // ============================================================

  private async getUserLesson(
    userId: number,
    lessonId: string,
    courseId: string,
  ) {
    let userLesson = await this.userLessonRepo.findOne({
      where: {
        userId,
        lessonId,
      },
    });

    const totalSections = await this.sectionRepo.count({
      where: {
        lessonId,
        isActive: true,
      },
    });

    if (!userLesson) {
      userLesson = this.userLessonRepo.create({
        userId,
        lessonId,
        courseId,

        isUnlocked: true,
        isStarted: true,
        isCompleted: false,

        startedAt: new Date(),

        completedSections: 0,
        totalSections,

        progress: 0,

        earnedXp: 0,
        earnedCoins: 0,
      });

      await this.userLessonRepo.save(userLesson);
    } else {
      userLesson.totalSections = totalSections;

      await this.userLessonRepo.save(userLesson);
    }

    return userLesson;
  }

  // ============================================================
  // LIBRARY
  // ============================================================

  async getLibrary(userId: number) {
    const user = await this.dataSource
      .getRepository(User)
      .findOne({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const access =
      user.role === UserRole.TEACHER
        ? ['teacher', 'both']
        : ['student', 'both'];

    const courses = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.lessons',
        'lesson',
        'lesson.isActive = :lessonActive',
        {
          lessonActive: true,
        },
      )
      .where(
        'course.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .andWhere(
        'course.isPublished = :isPublished',
        {
          isPublished: true,
        },
      )
      .andWhere(
        'course.access IN (:...access)',
        {
          access,
        },
      )
      .orderBy(
        'course.sortOrder',
        'ASC',
      )
      .addOrderBy(
        'course.createdAt',
        'DESC',
      )
      .getMany();

    const userCourses = await this.userCourseRepo.find({
      where: {
        userId,
      },
    });

    const userLessons = await this.userLessonRepo.find({
      where: {
        userId,
      },
    });

    const courseMap = new Map(
      userCourses.map(item => [
        item.courseId,
        item,
      ]),
    );

    const lessonMap = new Map(
      userLessons.map(item => [
        item.lessonId,
        item,
      ]),
    );

    return courses.map(course => {
      const userCourse = courseMap.get(course.id);

      const lessons = course.lessons ?? [];

      let totalProgress = 0;
      let completedLessons = 0;

      for (const lesson of lessons) {
        const userLesson =
          lessonMap.get(lesson.id);

        const progress = Number(
          userLesson?.progress ?? 0,
        );

        totalProgress += progress;

        if (
          userLesson?.isCompleted ||
          progress >= 100
        ) {
          completedLessons++;
        }
      }

      const totalLessons = lessons.length;

      const progress =
        totalLessons > 0
          ? Number(
              (
                totalProgress /
                totalLessons
              ).toFixed(2),
            )
          : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        bannerImage: course.bannerImage,
        level: course.level,

        totalLessons,
        completedLessons,

        progress,

        earnedXp:
          userCourse?.earnedXp ?? 0,

        earnedCoins:
          userCourse?.earnedCoins ?? 0,

        isStarted:
          userCourse?.isStarted ?? false,

        isCompleted:
          progress >= 100,
      };
    });
  }

  // ============================================================
  // COURSE DETAILS
  // ============================================================

  async getCourse(
    userId: number,
    courseId: string,
  ) {
    const course = await this.courseRepo.findOne({
      where: {
        id: courseId,
        isActive: true,
        isPublished: true,
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

    const userCourse =
      await this.getUserCourse(
        userId,
        courseId,
      );

    const userLessons =
      await this.userLessonRepo.find({
        where: {
          userId,
          courseId,
        },
      });

    const lessonMap = new Map(
      userLessons.map(item => [
        item.lessonId,
        item,
      ]),
    );

    const lessons = [...(course.lessons ?? [])]
      .filter(
        lesson =>
          lesson.isActive &&
          lesson.isPublished,
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder,
      )
      .map(lesson => {
        const userLesson =
          lessonMap.get(lesson.id);

        return {
          id: lesson.id,
          title: lesson.title,
          shortDescription:
            lesson.shortDescription,
          duration: lesson.duration,
          thumbnail: lesson.thumbnail,

          progress:
            userLesson?.progress ?? 0,

          completedSections:
            userLesson?.completedSections ?? 0,

          totalSections:
            userLesson?.totalSections ??
            lesson.sections?.filter(
              section =>
                section.isActive,
            ).length ??
            0,

          earnedXp:
            userLesson?.earnedXp ?? 0,

          earnedCoins:
            userLesson?.earnedCoins ?? 0,

          isUnlocked:
            userLesson?.isUnlocked ??
            lesson.sortOrder === 1,

          isStarted:
            userLesson?.isStarted ?? false,

          isCompleted:
            userLesson?.isCompleted ?? false,
        };
      });

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      bannerImage: course.bannerImage,
      level: course.level,

      totalLessons:
        userCourse.totalLessons,

      completedLessons:
        userCourse.completedLessons,

      progress:
        userCourse.progress,

      earnedXp:
        userCourse.earnedXp,

      earnedCoins:
        userCourse.earnedCoins,

      isStarted:
        userCourse.isStarted,

      isCompleted:
        userCourse.isCompleted,

      lessons,
    };
  }

  // ============================================================
  // LESSON DETAILS
  // ============================================================

  async getLesson(
    userId: number,
    lessonId: string,
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: {
        id: lessonId,
        isActive: true,
        isPublished: true,
      },
      relations: [
        'sections',
        'course',
      ],
    });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found',
      );
    }

    const userLesson =
      await this.getUserLesson(
        userId,
        lesson.id,
        lesson.courseId,
      );

    await this.getUserCourse(
      userId,
      lesson.courseId,
    );

    const userSections =
      await this.userSectionRepo.find({
        where: {
          userId,
          lessonId,
        },
      });

    const sectionMap = new Map(
      userSections.map(item => [
        item.sectionId,
        item,
      ]),
    );

   const sections = [
  ...(lesson.sections ?? []),
]
  .filter(section => section.isActive)
  .sort((a, b) => a.orderNo - b.orderNo)
  .map((section, index) => {

    const userSection =
      sectionMap.get(section.id);

    return {
      id: section.id,
      heading: section.heading,
      content: section.content,
      type: section.type,
      imageUrl: section.imageUrl,
      orderNo: section.orderNo,
      sectionType: section.sectionType,

      xpReward: section.xpReward,
      coinReward: section.coinReward,

      isQuiz: section.isQuiz,

      quizData: section.isQuiz
        ? {
            questions: (
              section.quizData?.questions ?? []
            ).map(q => ({
              question: q.question,
              options: q.options.map(o => ({
                text: o.text,
              })),
            })),
          }
        : null,

      isUnlocked:
        userSection?.isUnlocked ?? index === 0,

      isCompleted:
        userSection?.isCompleted ?? false,

      earnedXp:
        userSection?.earnedXp ?? 0,

      earnedCoins:
        userSection?.earnedCoins ?? 0,

      completedAt:
        userSection?.completedAt ?? null,
    };
  });

return {
  id: lesson.id,
  title: lesson.title,
  shortDescription: lesson.shortDescription,
  thumbnail: lesson.thumbnail,
  duration: lesson.duration,

  courseId: lesson.courseId,

  course: lesson.course
    ? {
        id: lesson.course.id,
        title: lesson.course.title,
      }
    : null,

  progress: userLesson.progress,
  completedSections: userLesson.completedSections,
  totalSections: userLesson.totalSections,
  earnedXp: userLesson.earnedXp,
  earnedCoins: userLesson.earnedCoins,

  isUnlocked: userLesson.isUnlocked,
  isStarted: userLesson.isStarted,
  isCompleted: userLesson.isCompleted,

  sections,
};
  }

  // ============================================================
  // COMPLETE SECTION
  // ============================================================

  async completeSection(
    userId: number,
    lessonId: string,
    sectionId: string,
  ) {
    return this.dataSource.transaction(
      async manager => {

        const lesson =
          await manager.findOne(
            GrammarLesson,
            {
              where: {
                id: lessonId,
                isActive: true,
              },
            },
          );

        if (!lesson) {
          throw new NotFoundException(
            'Lesson not found',
          );
        }

        const section =
          await manager.findOne(
            GrammarSection,
            {
              where: {
                id: sectionId,
                lessonId,
                isActive: true,
              },
            },
          );

        if (!section) {
          throw new NotFoundException(
            'Section not found',
          );
        }

        // ------------------------------------------------
        // USER SECTION
        // ------------------------------------------------

        let userSection =
          await manager.findOne(
            GrammarUserSection,
            {
              where: {
                userId,
                lessonId,
                sectionId,
              },
            },
          );

        if (
          userSection?.isCompleted
        ) {
          return {
            success: true,
            alreadyCompleted: true,
            earnedXp: 0,
            earnedCoins: 0,
            lessonProgress: 0,
            courseProgress: 0,
            lessonCompleted: false,
            courseCompleted: false,
          };
        }

        if (!userSection) {
          userSection =
            manager.create(
              GrammarUserSection,
              {
                userId,
                lessonId,
                sectionId,
                isUnlocked: true,
                isCompleted: false,
                earnedXp: 0,
                earnedCoins: 0,
              },
            );
        }

        // ------------------------------------------------
        // PROFILE
        // ------------------------------------------------

        let profile =
          await manager.findOne(
            GrammarUserProfile,
            {
              where: {
                userId,
              },
            },
          );

        if (!profile) {
          profile =
            manager.create(
              GrammarUserProfile,
              {
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
                lastActivityAt:
                  new Date(),
              },
            );

          await manager.save(profile);
        }

        // ------------------------------------------------
        // USER LESSON
        // ------------------------------------------------

        let userLesson =
          await manager.findOne(
            GrammarUserLesson,
            {
              where: {
                userId,
                lessonId,
              },
            },
          );

        const totalSections =
          await manager.count(
            GrammarSection,
            {
              where: {
                lessonId,
                isActive: true,
              },
            },
          );

        if (!userLesson) {
          userLesson =
            manager.create(
              GrammarUserLesson,
              {
                userId,
                lessonId,
                courseId:
                  lesson.courseId,

                isUnlocked: true,
                isStarted: true,
                isCompleted: false,

                startedAt:
                  new Date(),

                completedSections: 0,
                totalSections,

                progress: 0,

                earnedXp: 0,
                earnedCoins: 0,
              },
            );
        } else {
          userLesson.totalSections =
            totalSections;

          userLesson.isStarted = true;
          userLesson.isUnlocked = true;
        }

        // ------------------------------------------------
        // REWARD
        // ------------------------------------------------

        const earnedXp =
          section.isQuiz ? 25 : 10;

        const earnedCoins =
          section.isQuiz ? 10 : 5;

        userSection.isUnlocked = true;
        userSection.isCompleted = true;
        userSection.completedAt =
          new Date();
        userSection.earnedXp =
          earnedXp;
        userSection.earnedCoins =
          earnedCoins;

        await manager.save(
          userSection,
        );

        // ------------------------------------------------
        // LESSON PROGRESS
        // ------------------------------------------------

        const completedSections =
          await manager.count(
            GrammarUserSection,
            {
              where: {
                userId,
                lessonId,
                isCompleted: true,
              },
            },
          );

        userLesson.completedSections =
          completedSections;

        userLesson.progress =
          totalSections > 0
            ? Number(
                (
                  completedSections /
                  totalSections *
                  100
                ).toFixed(2),
              )
            : 100;

        userLesson.earnedXp +=
          earnedXp;

        userLesson.earnedCoins +=
          earnedCoins;

        // Important:
        // check completion BEFORE setting completedAt
        const wasLessonCompleted =
          userLesson.isCompleted;

        if (
          completedSections >=
          totalSections
        ) {
          userLesson.progress = 100;
          userLesson.isCompleted = true;

          if (!userLesson.completedAt) {
            userLesson.completedAt =
              new Date();
          }
        }

        await manager.save(
          userLesson,
        );

        // ------------------------------------------------
        // PROFILE REWARD
        // ------------------------------------------------

       profile.totalXp += earnedXp;

profile.totalCoins += earnedCoins;

profile.completedSections += 1;

await this.updateStreak(
  manager,
  profile,
);
        if (
          userLesson.isCompleted &&
          !wasLessonCompleted
        ) {
          profile.completedLessons +=
            1;
        }

        while (
          profile.totalXp >=
          profile.level * 100
        ) {
          profile.level++;
        }

        await manager.save(
          profile,
        );

        // ------------------------------------------------
        // UNLOCK NEXT SECTION
        // ------------------------------------------------

        const nextSection =
          await manager.findOne(
            GrammarSection,
            {
              where: {
                lessonId,
                isActive: true,
                orderNo:
                  section.orderNo + 1,
              },
            },
          );

        if (nextSection) {
          let nextUserSection =
            await manager.findOne(
              GrammarUserSection,
              {
                where: {
                  userId,
                  lessonId,
                  sectionId:
                    nextSection.id,
                },
              },
            );

          if (!nextUserSection) {
            nextUserSection =
              manager.create(
                GrammarUserSection,
                {
                  userId,
                  lessonId,
                  sectionId:
                    nextSection.id,
                  isUnlocked: true,
                  isCompleted: false,
                  earnedXp: 0,
                  earnedCoins: 0,
                },
              );
          } else {
            nextUserSection.isUnlocked =
              true;
          }

          await manager.save(
            nextUserSection,
          );
        }

        // ------------------------------------------------
        // USER COURSE
        // ------------------------------------------------

        let userCourse =
          await manager.findOne(
            GrammarUserCourse,
            {
              where: {
                userId,
                courseId:
                  lesson.courseId,
              },
            },
          );

        if (!userCourse) {
          userCourse =
            manager.create(
              GrammarUserCourse,
              {
                userId,
                courseId:
                  lesson.courseId,
                isStarted: true,
                isCompleted: false,
                startedAt:
                  new Date(),
                totalLessons: 0,
                completedLessons: 0,
                progress: 0,
                earnedXp: 0,
                earnedCoins: 0,
              },
            );
        }

        const allLessons =
          await manager.find(
            GrammarLesson,
            {
              where: {
                courseId:
                  lesson.courseId,
                isActive: true,
              },
              order: {
                sortOrder: 'ASC',
              },
            },
          );

        const allUserLessons =
          await manager.find(
            GrammarUserLesson,
            {
              where: {
                userId,
                courseId:
                  lesson.courseId,
              },
            },
          );

        const lessonMap =
          new Map(
            allUserLessons.map(
              item => [
                item.lessonId,
                item,
              ],
            ),
          );

        let totalProgress = 0;
        let completedLessons = 0;

        for (
          const currentLesson
          of allLessons
        ) {
          const current =
            lessonMap.get(
              currentLesson.id,
            );

          const progress =
            Number(
              current?.progress ?? 0,
            );

          totalProgress +=
            progress;

          if (
            current?.isCompleted ||
            progress >= 100
          ) {
            completedLessons++;
          }
        }

        userCourse.totalLessons =
          allLessons.length;

        userCourse.completedLessons =
          completedLessons;

        userCourse.progress =
          allLessons.length > 0
            ? Number(
                (
                  totalProgress /
                  allLessons.length
                ).toFixed(2),
              )
            : 0;

        userCourse.earnedXp =
          allUserLessons.reduce(
            (sum, item) =>
              sum +
              Number(
                item.earnedXp ?? 0,
              ),
            0,
          );

        userCourse.earnedCoins =
          allUserLessons.reduce(
            (sum, item) =>
              sum +
              Number(
                item.earnedCoins ?? 0,
              ),
            0,
          );

        const wasCourseCompleted =
          userCourse.isCompleted;

        if (
          allLessons.length > 0 &&
          completedLessons >=
            allLessons.length
        ) {
          userCourse.isCompleted = true;

          if (!userCourse.completedAt) {
            userCourse.completedAt =
              new Date();
          }
        }

        if (
          userCourse.isCompleted &&
          !wasCourseCompleted
        ) {
          profile.completedCourses +=
            1;

          await manager.save(profile);
        }

        await manager.save(
          userCourse,
        );

        // ------------------------------------------------
        // UNLOCK NEXT LESSON
        // ------------------------------------------------

        if (userLesson.isCompleted) {
          const nextLesson =
            allLessons.find(
              item =>
                item.sortOrder >
                lesson.sortOrder,
            );

          if (nextLesson) {
            let nextUserLesson =
              await manager.findOne(
                GrammarUserLesson,
                {
                  where: {
                    userId,
                    lessonId:
                      nextLesson.id,
                  },
                },
              );

            const nextTotalSections =
              await manager.count(
                GrammarSection,
                {
                  where: {
                    lessonId:
                      nextLesson.id,
                    isActive: true,
                  },
                },
              );

            if (!nextUserLesson) {
              nextUserLesson =
                manager.create(
                  GrammarUserLesson,
                  {
                    userId,
                    lessonId:
                      nextLesson.id,
                    courseId:
                      nextLesson.courseId,

                    isUnlocked: true,
                    isStarted: false,
                    isCompleted: false,

                    totalSections:
                      nextTotalSections,

                    completedSections: 0,
                    progress: 0,

                    earnedXp: 0,
                    earnedCoins: 0,
                  },
                );
            } else {
              nextUserLesson.isUnlocked =
                true;
            }

            await manager.save(
              nextUserLesson,
            );
          }
        }

        return {
          success: true,
          alreadyCompleted: false,

          earnedXp,
          earnedCoins,

          lessonProgress:
            userLesson.progress,

          courseProgress:
            userCourse.progress,

          lessonCompleted:
            userLesson.isCompleted,

          courseCompleted:
            userCourse.isCompleted,
        };
      },
    );
  }

  // ============================================================
  // COMPLETE ENTIRE LESSON
  // ============================================================

  async completeLesson(
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

    const sections = [
      ...(lesson.sections ?? []),
    ]
      .filter(
        section =>
          section.isActive,
      )
      .sort(
        (a, b) =>
          a.orderNo -
          b.orderNo,
      );

    for (const section of sections) {
      const userSection =
        await this.userSectionRepo.findOne({
          where: {
            userId,
            lessonId,
            sectionId:
              section.id,
          },
        });

      if (
        !userSection?.isCompleted
      ) {
        await this.completeSection(
          userId,
          lessonId,
          section.id,
        );
      }
    }

    const userLesson =
      await this.userLessonRepo.findOne({
        where: {
          userId,
          lessonId,
        },
      });

    const userCourse =
      await this.updateCourseProgress(
        userId,
        lesson.courseId,
      );

    return {
      success: true,
      alreadyCompleted:
        userLesson?.isCompleted ?? false,
      lessonProgress:
        userLesson?.progress ?? 100,
      courseProgress:
        userCourse.progress,
      lessonCompleted:
        userLesson?.isCompleted ?? true,
      courseCompleted:
        userCourse.isCompleted,
    };
  }

  // ============================================================
  // UPDATE COURSE PROGRESS
  // ============================================================

  private async updateCourseProgress(
    userId: number,
    courseId: string,
  ) {
    let userCourse =
      await this.userCourseRepo.findOne({
        where: {
          userId,
          courseId,
        },
      });

    if (!userCourse) {
      userCourse =
        await this.getUserCourse(
          userId,
          courseId,
        );
    }

    const lessons =
      await this.lessonRepo.find({
        where: {
          courseId,
          isActive: true,
        },
      });

    const userLessons =
      await this.userLessonRepo.find({
        where: {
          userId,
          courseId,
        },
      });

    const lessonMap =
      new Map(
        userLessons.map(item => [
          item.lessonId,
          item,
        ]),
      );

    let totalProgress = 0;
    let completedLessons = 0;

    for (const lesson of lessons) {
      const item =
        lessonMap.get(lesson.id);

      const progress =
        Number(item?.progress ?? 0);

      totalProgress += progress;

      if (
        item?.isCompleted ||
        progress >= 100
      ) {
        completedLessons++;
      }
    }

    userCourse.totalLessons =
      lessons.length;

    userCourse.completedLessons =
      completedLessons;

    userCourse.progress =
      lessons.length > 0
        ? Number(
            (
              totalProgress /
              lessons.length
            ).toFixed(2),
          )
        : 0;

    const wasCompleted =
      userCourse.isCompleted;

    if (
      lessons.length > 0 &&
      completedLessons >=
        lessons.length
    ) {
      userCourse.isCompleted = true;

      if (!userCourse.completedAt) {
        userCourse.completedAt =
          new Date();
      }
    }

    if (
      !wasCompleted &&
      userCourse.isCompleted
    ) {
      const profile =
        await this.getProfile(
          userId,
        );

      profile.completedCourses +=
        1;

      await this.profileRepo.save(
        profile,
      );
    }

    userCourse.earnedXp =
      userLessons.reduce(
        (sum, item) =>
          sum +
          Number(
            item.earnedXp ?? 0,
          ),
        0,
      );

    userCourse.earnedCoins =
      userLessons.reduce(
        (sum, item) =>
          sum +
          Number(
            item.earnedCoins ?? 0,
          ),
        0,
      );

    await this.userCourseRepo.save(
      userCourse,
    );

    return userCourse;
  }

  // ============================================================
  // QUIZ
  // ============================================================

async submitQuiz(
  userId: number,
  lessonId: string,
  sectionId: string,
  answers: number[],
) {
  return this.dataSource.transaction(
    async manager => {

      const lesson =
        await manager.findOne(
          GrammarLesson,
          {
            where: {
              id: lessonId,
              isActive: true,
            },
          },
        );

      if (!lesson) {
        throw new NotFoundException(
          'Lesson not found',
        );
      }

      const section =
        await manager.findOne(
          GrammarSection,
          {
            where: {
              id: sectionId,
              lessonId,
              isActive: true,
            },
          },
        );

      if (!section) {
        throw new NotFoundException(
          'Quiz section not found',
        );
      }

      if (!section.isQuiz) {
        throw new NotFoundException(
          'This section is not a quiz',
        );
      }

      const questions =
        section.quizData?.questions ?? [];

      if (!questions.length) {
        throw new NotFoundException(
          'No quiz questions found',
        );
      }

      let correctAnswers = 0;

      const results = questions.map(
        (question, index) => {

          const selectedIndex =
            answers[index];

          const correctIndex =
            question.options.findIndex(
              option => option.isCorrect,
            );

          const isCorrect =
            selectedIndex === correctIndex;

          if (isCorrect) {
            correctAnswers++;
          }

          return {
            question: question.question,
            selectedAnswer:
              question.options[selectedIndex]?.text ?? null,
            correctAnswer:
              question.options[correctIndex]?.text ?? null,
            isCorrect,
            explanation:
              question.explanation ?? '',
          };
        },
      );

      const totalQuestions =
        questions.length;

      const numericScore =
        Math.round(
          (correctAnswers /
            totalQuestions) *
            100,
        );

      const passed =
        numericScore >= 70;

      const previousQuiz =
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
        previousQuiz
          ? previousQuiz.attemptNo + 1
          : 1;

      const quiz =
        manager.create(
          GrammarUserQuiz,
          {
            userId,
            lessonId,
            sectionId,
            attemptNo,

            score: numericScore,

            totalQuestions,
            correctAnswers,

            isPassed: passed,

            earnedXp:
              passed ? 25 : 0,

            earnedCoins:
              passed ? 10 : 0,

            submittedAt:
              new Date(),
          },
        );

      await manager.save(quiz);

      // Failed quiz
      if (!passed) {
        return {
          success: true,
          passed: false,
          score: numericScore,

          totalQuestions,
          correctAnswers,

          earnedXp: 0,
          earnedCoins: 0,

          sectionCompleted: false,

          results,
        };
      }

      // Already completed
      const existingSection =
        await manager.findOne(
          GrammarUserSection,
          {
            where: {
              userId,
              lessonId,
              sectionId,
            },
          },
        );

      if (
        existingSection?.isCompleted
      ) {
        return {
          success: true,
          passed: true,
          score: numericScore,

          totalQuestions,
          correctAnswers,

          earnedXp: 0,
          earnedCoins: 0,

          sectionCompleted: true,
          alreadyCompleted: true,

          results,
        };
      }

      // Complete section
      let userSection =
        existingSection;

      if (!userSection) {
        userSection =
          manager.create(
            GrammarUserSection,
            {
              userId,
              lessonId,
              sectionId,

              isUnlocked: true,
              isCompleted: false,

              earnedXp: 0,
              earnedCoins: 0,
            },
          );
      }

      userSection.isUnlocked = true;
      userSection.isCompleted = true;
      userSection.completedAt =
        new Date();

      userSection.earnedXp = 25;
      userSection.earnedCoins = 10;

      await manager.save(
        userSection,
      );

      // USER LESSON
      let userLesson =
        await manager.findOne(
          GrammarUserLesson,
          {
            where: {
              userId,
              lessonId,
            },
          },
        );

      const totalSections =
        await manager.count(
          GrammarSection,
          {
            where: {
              lessonId,
              isActive: true,
            },
          },
        );

      if (!userLesson) {
        userLesson =
          manager.create(
            GrammarUserLesson,
            {
              userId,
              lessonId,
              courseId:
                lesson.courseId,

              isUnlocked: true,
              isStarted: true,
              isCompleted: false,

              startedAt:
                new Date(),

              totalSections,

              completedSections: 0,
              progress: 0,

              earnedXp: 0,
              earnedCoins: 0,
            },
          );
      }

      const completedSections =
        await manager.count(
          GrammarUserSection,
          {
            where: {
              userId,
              lessonId,
              isCompleted: true,
            },
          },
        );

      userLesson.totalSections =
        totalSections;

      userLesson.completedSections =
        completedSections;

      userLesson.progress =
        totalSections > 0
          ? Number(
              (
                completedSections /
                totalSections *
                100
              ).toFixed(2),
            )
          : 100;

      userLesson.earnedXp += 25;
      userLesson.earnedCoins += 10;

      const wasLessonCompleted =
        userLesson.isCompleted;

      if (
        completedSections >=
        totalSections
      ) {
        userLesson.progress = 100;
        userLesson.isCompleted = true;

        if (!userLesson.completedAt) {
          userLesson.completedAt =
            new Date();
        }
      }

      await manager.save(
        userLesson,
      );

      // PROFILE
      let profile =
        await manager.findOne(
          GrammarUserProfile,
          {
            where: {
              userId,
            },
          },
        );

      if (!profile) {
        profile =
          manager.create(
            GrammarUserProfile,
            {
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

              lastActivityAt:
                new Date(),
            },
          );
      }

      profile.totalXp += 25;
      profile.totalCoins += 10;
      profile.completedSections += 1;
      profile.completedQuizzes += 1;

      if (
        userLesson.isCompleted &&
        !wasLessonCompleted
      ) {
        profile.completedLessons += 1;
      }

   await this.updateStreak(
  manager,
  profile,
);

      while (
        profile.totalXp >=
        profile.level * 100
      ) {
        profile.level++;
      }

      await manager.save(profile);

      // NEXT SECTION
      const nextSection =
        await manager.findOne(
          GrammarSection,
          {
            where: {
              lessonId,
              isActive: true,
              orderNo:
                section.orderNo + 1,
            },
          },
        );

      if (nextSection) {

        let nextUserSection =
          await manager.findOne(
            GrammarUserSection,
            {
              where: {
                userId,
                lessonId,
                sectionId:
                  nextSection.id,
              },
            },
          );

        if (!nextUserSection) {
          nextUserSection =
            manager.create(
              GrammarUserSection,
              {
                userId,
                lessonId,
                sectionId:
                  nextSection.id,

                isUnlocked: true,
                isCompleted: false,

                earnedXp: 0,
                earnedCoins: 0,
              },
            );
        } else {
          nextUserSection.isUnlocked =
            true;
        }

        await manager.save(
          nextUserSection,
        );
      }

      return {
        success: true,
        passed: true,

        score: numericScore,

        totalQuestions,
        correctAnswers,

        earnedXp: 25,
        earnedCoins: 10,

        sectionCompleted: true,
        alreadyCompleted: false,

        lessonProgress:
          userLesson.progress,

        lessonCompleted:
          userLesson.isCompleted,

        results,
      };
    },
  );
}

  // ============================================================
  // DASHBOARD
  // ============================================================
// ============================================================
// DASHBOARD
// ============================================================

async getDashboard(
  userId: number,
) {
  const profile =
    await this.getProfile(userId);

  // ============================================================
  // CURRENT COURSE
  // ============================================================

  const currentCourse =
    await this.userCourseRepo.findOne({
      where: {
        userId,
        isStarted: true,
        isCompleted: false,
      },
      order: {
        updatedAt: 'DESC',
      },
    });

  // ============================================================
  // XP
  // ============================================================

  const currentLevel =
    Number(profile.level ?? 1);

  const currentXp =
    Number(profile.totalXp ?? 0);

  const xpForCurrentLevel =
    (currentLevel - 1) * 100;

  const xpForNextLevel =
    currentLevel * 100;

  const xpProgress =
    Math.min(
      Math.max(
        currentXp -
          xpForCurrentLevel,
        0,
      ),
      100,
    );

  // ============================================================
  // BASE RESPONSE
  // ============================================================

  const baseResponse: {
  profile: {
    level: number;
    xp: number;
    coins: number;
    currentStreak: number;
    longestStreak: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    xpProgress: number;
  };

  stats: {
    completedCourses: number;
    completedLessons: number;
    completedSections: number;
    completedQuizzes: number;
  };

  currentCourse: {
    id: string;
    title: string;
    description: string;
    bannerImage: string;
    level: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    earnedXp: number;
    earnedCoins: number;
  } | null;

  continueLesson: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    duration: number;
    progress: number;
    completedSections: number;
    totalSections: number;
    earnedXp: number;
    earnedCoins: number;
  } | null;

  recentActivity: {
    sectionId: string;
    sectionTitle: string;
    lessonId: string;
    lessonTitle: string;
    courseId: string | null;
    courseTitle: string;
    earnedXp: number;
    earnedCoins: number;
    completedAt: Date | null;
  }[];
} = {
  profile: {
    level: currentLevel,

    xp: currentXp,

    coins:
      Number(profile.totalCoins ?? 0),

    currentStreak:
      Number(profile.currentStreak ?? 0),

    longestStreak:
      Number(profile.longestStreak ?? 0),

    xpForCurrentLevel,

    xpForNextLevel,

    xpProgress,
  },

  stats: {
    completedCourses:
      Number(profile.completedCourses ?? 0),

    completedLessons:
      Number(profile.completedLessons ?? 0),

    completedSections:
      Number(profile.completedSections ?? 0),

    completedQuizzes:
      Number(profile.completedQuizzes ?? 0),
  },

  currentCourse: null,

  continueLesson: null,

  recentActivity: [],
};
  // ============================================================
  // RECENT ACTIVITY
  // ============================================================

  const recentSections =
    await this.userSectionRepo.find({
      where: {
        userId,
        isCompleted: true,
      },
      order: {
        completedAt: 'DESC',
      },
      take: 5,
    });

  const recentActivity =
    await Promise.all(
      recentSections.map(
        async item => {
          const section =
            await this.sectionRepo.findOne({
              where: {
                id: item.sectionId,
              },
              relations: [
                'lesson',
                'lesson.course',
              ],
            });

          return {
            sectionId:
              item.sectionId,

            sectionTitle:
              section?.heading ?? '',

            lessonId:
              item.lessonId,

            lessonTitle:
              section?.lesson?.title ?? '',

            courseId:
              section?.lesson?.courseId ??
              null,

            courseTitle:
              section?.lesson?.course
                ?.title ?? '',

            earnedXp:
              Number(
                item.earnedXp ?? 0,
              ),

            earnedCoins:
              Number(
                item.earnedCoins ?? 0,
              ),

            completedAt:
              item.completedAt ?? null,
          };
        },
      ),
    );

  baseResponse.recentActivity =
    recentActivity;

  // ============================================================
  // NO CURRENT COURSE
  // ============================================================

  if (!currentCourse) {
    return baseResponse;
  }

  // ============================================================
  // COURSE
  // ============================================================

  const course =
    await this.courseRepo.findOne({
      where: {
        id: currentCourse.courseId,
      },
    });

  // ============================================================
  // CONTINUE LESSON
  // ============================================================

  const userLesson =
    await this.userLessonRepo.findOne({
      where: {
        userId,
        courseId:
          currentCourse.courseId,
        isCompleted: false,
      },
      order: {
        updatedAt: 'ASC',
      },
    });

  let continueLesson: any = null;

  if (userLesson) {
    const lesson =
      await this.lessonRepo.findOne({
        where: {
          id: userLesson.lessonId,
        },
      });

    if (lesson) {
      continueLesson = {
        id: lesson.id,

        title:
          lesson.title,

        description:
          lesson.shortDescription,

        thumbnail:
          lesson.thumbnail,

        duration:
          lesson.duration,

        progress:
          Number(
            userLesson.progress ?? 0,
          ),

        completedSections:
          Number(
            userLesson.completedSections ??
              0,
          ),

        totalSections:
          Number(
            userLesson.totalSections ??
              0,
          ),

        earnedXp:
          Number(
            userLesson.earnedXp ?? 0,
          ),

        earnedCoins:
          Number(
            userLesson.earnedCoins ?? 0,
          ),
      };
    }
  }

  // ============================================================
  // CURRENT COURSE RESPONSE
  // ============================================================

  baseResponse.currentCourse =
    course
      ? {
          id: course.id,

          title:
            course.title,

          description:
            course.description,

          bannerImage:
            course.bannerImage,

          level:
            course.level,

          progress:
            Number(
              currentCourse.progress ?? 0,
            ),

          completedLessons:
            Number(
              currentCourse.completedLessons ??
                0,
            ),

          totalLessons:
            Number(
              currentCourse.totalLessons ??
                0,
            ),

          earnedXp:
            Number(
              currentCourse.earnedXp ?? 0,
            ),

          earnedCoins:
            Number(
              currentCourse.earnedCoins ?? 0,
            ),
        }
      : null;

  baseResponse.continueLesson =
    continueLesson;

  return baseResponse;
}
  async getAllQuizzes(userId: number) {

  const sections =
    await this.sectionRepo
      .createQueryBuilder('section')
      .innerJoinAndSelect(
        'section.lesson',
        'lesson',
      )
      .innerJoinAndSelect(
        'lesson.course',
        'course',
      )
      .where(
        'section.isQuiz = :isQuiz',
        {
          isQuiz: true,
        },
      )
      .andWhere(
        'section.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .andWhere(
        'lesson.isActive = :lessonActive',
        {
          lessonActive: true,
        },
      )
      .andWhere(
        'lesson.isPublished = :lessonPublished',
        {
          lessonPublished: true,
        },
      )
      .andWhere(
        'course.isActive = :courseActive',
        {
          courseActive: true,
        },
      )
      .andWhere(
        'course.isPublished = :coursePublished',
        {
          coursePublished: true,
        },
      )
      .orderBy(
        'course.sortOrder',
        'ASC',
      )
      .addOrderBy(
        'lesson.sortOrder',
        'ASC',
      )
      .addOrderBy(
        'section.orderNo',
        'ASC',
      )
      .getMany();

  return sections.map(section => ({

    id: section.id,

    lessonId:
      section.lessonId,

    lessonTitle:
      section.lesson?.title,

    courseId:
      section.lesson?.courseId,

    courseTitle:
      section.lesson?.course?.title,

    title:
      section.heading,

    totalQuestions:
      section.quizData?.questions
        ?.length ?? 0,

    questions:
      (
        section.quizData?.questions ?? []
      ).map(question => ({

        question:
          question.question,

        options:
          question.options.map(
            option => ({
              text: option.text,
            }),
          ),

      })),

  }));
}
async getRandomQuiz(
  userId: number,
  limit = 10,
) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 10, 1),
    50,
  );

  const sections = await this.sectionRepo
    .createQueryBuilder('section')
    .innerJoinAndSelect(
      'section.lesson',
      'lesson',
    )
    .innerJoinAndSelect(
      'lesson.course',
      'course',
    )
    .where(
      'section.isQuiz = :isQuiz',
      {
        isQuiz: true,
      },
    )
    .andWhere(
      'section.isActive = :isActive',
      {
        isActive: true,
      },
    )
    .andWhere(
      'lesson.isActive = :lessonActive',
      {
        lessonActive: true,
      },
    )
    .andWhere(
      'lesson.isPublished = :lessonPublished',
      {
        lessonPublished: true,
      },
    )
    .andWhere(
      'course.isActive = :courseActive',
      {
        courseActive: true,
      },
    )
    .andWhere(
      'course.isPublished = :coursePublished',
      {
        coursePublished: true,
      },
    )
    .orderBy('RANDOM()')
    .limit(safeLimit)
    .getMany();

  return sections.map(section => ({
    id: section.id,

    lessonId: section.lessonId,
    lessonTitle: section.lesson?.title ?? '',

    courseId: section.lesson?.courseId ?? null,
    courseTitle:
      section.lesson?.course?.title ?? '',

    title: section.heading,

    totalQuestions:
      section.quizData?.questions?.length ?? 0,

    questions: (
      section.quizData?.questions ?? []
    ).map(question => ({
      question: question.question,

      options: question.options.map(option => ({
        text: option.text,
      })),
    })),
  }));
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

  const lesson =
    await this.lessonRepo.findOne({
      where: {
        id: lessonId,
        isActive: true,
        isPublished: true,
      },
    });

  if (!lesson) {
    throw new NotFoundException(
      'Lesson not found',
    );
  }


  const section =
    await this.sectionRepo.findOne({
      where: {
        id: sectionId,
        lessonId,
        isActive: true,
      },
    });

  if (!section) {
    throw new NotFoundException(
      'Quiz section not found',
    );
  }


  if (!section.isQuiz) {
    throw new NotFoundException(
      'This section is not a quiz',
    );
  }


  const questions =
    section.quizData?.questions ?? [];


  if (!questions.length) {
    throw new NotFoundException(
      'No quiz questions found',
    );
  }


  if (
    questionIndex < 0 ||
    questionIndex >= questions.length
  ) {
    throw new NotFoundException(
      'Invalid question index',
    );
  }


  const question =
    questions[questionIndex];


  const options =
    question.options ?? [];


  if (
    answerIndex < 0 ||
    answerIndex >= options.length
  ) {
    throw new NotFoundException(
      'Invalid answer index',
    );
  }


  const correctIndex =
    options.findIndex(
      option => option.isCorrect,
    );


  const isCorrect =
    answerIndex === correctIndex;


  return {

    success: true,

    questionIndex,

    selectedIndex: answerIndex,

    selectedAnswer:
      options[answerIndex]?.text ?? null,

    correctIndex,

    correctAnswer:
      options[correctIndex]?.text ?? null,

    isCorrect,

    explanation:
      question.explanation ?? '',

  };
}
}