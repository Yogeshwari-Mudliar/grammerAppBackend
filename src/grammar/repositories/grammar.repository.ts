import {
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
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
export class GrammarAdminRepository {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

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
  // ADMIN DASHBOARD
  // ============================================================

  async getDashboard() {

    // ============================================================
    // USERS
    // ============================================================

    const totalUsers =
      await this.userRepo.count();

    const totalStudents =
      await this.userRepo.count({
        where: {
          role: UserRole.STUDENT,
        },
      });

    const totalTeachers =
      await this.userRepo.count({
        where: {
          role: UserRole.TEACHER,
        },
      });

    // ============================================================
    // COURSES
    // ============================================================

    const totalCourses =
      await this.courseRepo.count({
        where: {
          isActive: true,
        },
      });

    const publishedCourses =
      await this.courseRepo.count({
        where: {
          isActive: true,
          isPublished: true,
        },
      });

    const draftCourses =
      await this.courseRepo.count({
        where: {
          isActive: true,
          isPublished: false,
        },
      });

    // ============================================================
    // LESSONS
    // ============================================================

    const totalLessons =
      await this.lessonRepo.count({
        where: {
          isActive: true,
        },
      });

    const publishedLessons =
      await this.lessonRepo.count({
        where: {
          isActive: true,
          isPublished: true,
        },
      });

    // ============================================================
    // SECTIONS
    // ============================================================

    const totalSections =
      await this.sectionRepo.count({
        where: {
          isActive: true,
        },
      });

    const totalQuizzes =
      await this.sectionRepo.count({
        where: {
          isActive: true,
          isQuiz: true,
        },
      });

    const totalContentSections =
      await this.sectionRepo.count({
        where: {
          isActive: true,
          isQuiz: false,
        },
      });

    // ============================================================
    // LEARNING STATISTICS
    // ============================================================

    const totalEnrollments =
      await this.userCourseRepo.count();

    const completedCourses =
      await this.userCourseRepo.count({
        where: {
          isCompleted: true,
        },
      });

    const startedCourses =
      await this.userCourseRepo.count({
        where: {
          isStarted: true,
        },
      });

    const completedLessons =
      await this.userLessonRepo.count({
        where: {
          isCompleted: true,
        },
      });

    const completedSections =
      await this.userSectionRepo.count({
        where: {
          isCompleted: true,
        },
      });

    const totalQuizAttempts =
      await this.userQuizRepo.count();

    const passedQuizAttempts =
      await this.userQuizRepo.count({
        where: {
          isPassed: true,
        },
      });

    // ============================================================
    // XP / COINS
    // ============================================================

    const profiles =
      await this.profileRepo.find();

    const totalXpEarned =
      profiles.reduce(
        (sum, profile) =>
          sum +
          Number(profile.totalXp ?? 0),
        0,
      );

    const totalCoinsEarned =
      profiles.reduce(
        (sum, profile) =>
          sum +
          Number(profile.totalCoins ?? 0),
        0,
      );

    // ============================================================
    // ACTIVE LEARNERS
    //
    // Learners who have activity in the last 7 days.
    // ============================================================

    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7,
    );

    const activeLearners =
      profiles.filter(profile => {

        if (!profile.lastActivityAt) {
          return false;
        }

        return (
          new Date(
            profile.lastActivityAt,
          ) >= sevenDaysAgo
        );
      }).length;

    // ============================================================
    // AVERAGE QUIZ SCORE
    // ============================================================

    const quizAttempts =
      await this.userQuizRepo.find();

    const averageQuizScore =
      quizAttempts.length > 0
        ? Number(
            (
              quizAttempts.reduce(
                (sum, quiz) =>
                  sum +
                  Number(
                    quiz.score ?? 0,
                  ),
                0,
              ) /
              quizAttempts.length
            ).toFixed(2),
          )
        : 0;

    // ============================================================
    // COURSE PERFORMANCE
    // ============================================================

    const courses =
      await this.courseRepo.find({
        where: {
          isActive: true,
        },
        order: {
          sortOrder: 'ASC',
        },
      });

    const courseProgress =
      await Promise.all(
        courses.map(
          async course => {

            const userCourses =
              await this.userCourseRepo.find({
                where: {
                  courseId: course.id,
                },
              });

            const enrollments =
              userCourses.length;

            const completed =
              userCourses.filter(
                item =>
                  item.isCompleted,
              ).length;

            const progress =
              enrollments > 0
                ? Number(
                    (
                      userCourses.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.progress ??
                              0,
                          ),
                        0,
                      ) /
                      enrollments
                    ).toFixed(2),
                  )
                : 0;

            const xp =
              userCourses.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.earnedXp ?? 0,
                  ),
                0,
              );

            const coins =
              userCourses.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.earnedCoins ??
                      0,
                  ),
                0,
              );

            return {
              id: course.id,

              title:
                course.title,

              description:
                course.description,

              bannerImage:
                course.bannerImage,

              level:
                course.level,

              isPublished:
                course.isPublished,

              enrollments,

              completed,

              completionRate:
                enrollments > 0
                  ? Number(
                      (
                        completed /
                        enrollments *
                        100
                      ).toFixed(2),
                    )
                  : 0,

              averageProgress:
                progress,

              earnedXp:
                xp,

              earnedCoins:
                coins,
            };
          },
        ),
      );

    // ============================================================
    // TOP COURSES
    // ============================================================

    const topCourses =
      [...courseProgress]
        .sort(
          (a, b) =>
            b.enrollments -
            a.enrollments,
        )
        .slice(0, 5);

    // ============================================================
    // RECENT COURSES
    // ============================================================

    const recentCourses =
      await this.courseRepo.find({
        where: {
          isActive: true,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      });

    // ============================================================
    // RECENT ACTIVITY
    // ============================================================

    const recentSections =
      await this.userSectionRepo.find({
        where: {
          isCompleted: true,
        },
        order: {
          completedAt: 'DESC',
        },
        take: 10,
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

            const user =
              await this.userRepo.findOne({
                where: {
                  id: item.userId,
                },
              });

            return {
              userId:
                item.userId,
userName:
  user
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : 'User',

              sectionId:
                item.sectionId,

              sectionTitle:
                section?.heading ??
                '',

              lessonId:
                item.lessonId,

              lessonTitle:
                section?.lesson?.title ??
                '',

              courseId:
                section?.lesson?.courseId ??
                null,

              courseTitle:
                section?.lesson?.course
                  ?.title ??
                '',

              earnedXp:
                Number(
                  item.earnedXp ?? 0,
                ),

              earnedCoins:
                Number(
                  item.earnedCoins ?? 0,
                ),

              completedAt:
                item.completedAt ??
                null,
            };
          },
        ),
      );

    // ============================================================
    // RETURN DASHBOARD
    // ============================================================

    return {

      overview: {

        totalUsers,

        totalStudents,

        totalTeachers,

        totalCourses,

        publishedCourses,

        draftCourses,

        totalLessons,

        publishedLessons,

        totalSections,

        totalContentSections,

        totalQuizzes,

      },

      learning: {

        totalEnrollments,

        startedCourses,

        completedCourses,

        completedLessons,

        completedSections,

        totalQuizAttempts,

        passedQuizAttempts,

        quizPassRate:
          totalQuizAttempts > 0
            ? Number(
                (
                  passedQuizAttempts /
                  totalQuizAttempts *
                  100
                ).toFixed(2),
              )
            : 0,

        averageQuizScore,

      },

      engagement: {

        activeLearners,

        totalXpEarned,

        totalCoinsEarned,

      },

      topCourses,

      courseProgress,

      recentCourses:
        recentCourses.map(
          course => ({
            id: course.id,

            title:
              course.title,

            description:
              course.description,

            bannerImage:
              course.bannerImage,

            level:
              course.level,

            isPublished:
              course.isPublished,

            createdAt:
              course.createdAt,
          }),
        ),

      recentActivity,

    };
  }
}