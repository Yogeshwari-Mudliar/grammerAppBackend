import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Visibility } from '../common/enums/visibility.enum';
import { ProgressStatus } from '../common/enums/progress-status.enum';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { User } from '../users/users.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { LessonProgress } from '../progress/entities/lesson-progress.entity';
import { QuizAttempt } from '../quiz/entities/quiz-attempt.entity';
import {
  ContinueLearning,
  DashboardResponse,
  RecentLesson,
  RecentQuiz,
  StudentOverview,
  StudentQuizPerformance,
  UserStatistics,
  WelcomeSection,
} from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
  ) {}

  private num(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private visibilitiesForRole(role: UserRole): Visibility[] {
    if (role === UserRole.TEACHER) {
      return [Visibility.TEACHER, Visibility.BOTH];
    }
    return [Visibility.STUDENT, Visibility.BOTH];
  }

  private welcome(user: AuthUser): WelcomeSection {
    return { userId: user.id, email: user.email, role: user.role };
  }

  async getDashboard(user: AuthUser): Promise<DashboardResponse> {
    if (user.role === UserRole.ADMIN) {
      return this.adminDashboard(user);
    }
    if (user.role === UserRole.TEACHER) {
      return this.teacherDashboard(user);
    }
    return this.studentDashboard(user);
  }

  // ---- Shared per-user aggregates -----------------------------------------

  private async accessibleLessonCount(role: UserRole): Promise<number> {
    if (role === UserRole.ADMIN) {
      return this.lessonRepo.count({ where: { isPublished: true } });
    }
    return this.lessonRepo.count({
      where: {
        isPublished: true,
        visibility: In(this.visibilitiesForRole(role)),
      },
    });
  }

  async getUserStatistics(user: AuthUser): Promise<UserStatistics> {
    const [
      lessonsStarted,
      lessonsCompleted,
      quizAttempts,
      accessibleLessons,
      scoreRow,
      timeRow,
      lastAccessed,
    ] = await Promise.all([
      this.progressRepo.count({
        where: {
          userId: user.id,
          status: In([ProgressStatus.IN_PROGRESS, ProgressStatus.COMPLETED]),
        },
      }),
      this.progressRepo.count({
        where: { userId: user.id, status: ProgressStatus.COMPLETED },
      }),
      this.attemptRepo.count({ where: { userId: user.id } }),
      this.accessibleLessonCount(user.role),
      this.attemptRepo
        .createQueryBuilder('a')
        .select('AVG(a.percentage)', 'avg')
        .where('a.userId = :id', { id: user.id })
        .getRawOne<{ avg: string }>(),
      this.attemptRepo
        .createQueryBuilder('a')
        .select('SUM(a.timeTaken)', 'sum')
        .where('a.userId = :id', { id: user.id })
        .getRawOne<{ sum: string }>(),
      this.progressRepo.findOne({
        where: { userId: user.id },
        relations: ['lesson'],
        order: { updatedAt: 'DESC' },
      }),
    ]);

    const completionPercentage =
      accessibleLessons > 0
        ? this.round((lessonsCompleted / accessibleLessons) * 100)
        : 0;

    return {
      lessonsStarted,
      lessonsCompleted,
      quizAttempts,
      averageScore: this.round(this.num(scoreRow?.avg)),
      completionPercentage,
      timeSpent: this.num(timeRow?.sum),
      lastAccessedLesson: lastAccessed ? this.toContinue(lastAccessed) : null,
    };
  }

  async getContinueLearning(user: AuthUser): Promise<ContinueLearning | null> {
    // The most recently touched lesson that is not yet completed.
    const progress = await this.progressRepo.findOne({
      where: {
        userId: user.id,
        status: In([ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED]),
      },
      relations: ['lesson'],
      order: { updatedAt: 'DESC' },
    });
    return progress ? this.toContinue(progress) : null;
  }

  async getRecentActivity(user: AuthUser): Promise<{
    recentLessons: RecentLesson[];
    recentQuizzes: RecentQuiz[];
  }> {
    const [lessons, attempts] = await Promise.all([
      this.progressRepo.find({
        where: { userId: user.id },
        relations: ['lesson'],
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
      this.attemptRepo.find({
        where: { userId: user.id },
        relations: ['quiz'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      recentLessons: lessons.map((p) => ({
        lessonId: p.lessonId,
        title: p.lesson?.title ?? 'Lesson',
        status: p.status,
        progressPercent: p.progressPercent,
        updatedAt: p.updatedAt,
      })),
      recentQuizzes: attempts.map((a) => ({
        quizId: a.quizId,
        attemptId: a.id,
        title: a.quiz?.title ?? 'Quiz',
        percentage: this.num(a.percentage),
        passed: a.passed,
        createdAt: a.createdAt,
      })),
    };
  }

  private toContinue(p: LessonProgress): ContinueLearning {
    return {
      lessonId: p.lessonId,
      title: p.lesson?.title ?? 'Lesson',
      status: p.status,
      progressPercent: p.progressPercent,
    };
  }

  // ---- Role dashboards -----------------------------------------------------

  private async studentDashboard(user: AuthUser): Promise<DashboardResponse> {
    const [statistics, continueLearning, recent] = await Promise.all([
      this.getUserStatistics(user),
      this.getContinueLearning(user),
      this.getRecentActivity(user),
    ]);

    return {
      role: UserRole.STUDENT,
      welcome: this.welcome(user),
      continueLearning,
      statistics,
      overallCompletion: statistics.completionPercentage,
      averageQuizScore: statistics.averageScore,
      recentLessons: recent.recentLessons,
      recentQuizzes: recent.recentQuizzes,
      announcements: [],
    };
  }

  private async teacherDashboard(user: AuthUser): Promise<DashboardResponse> {
    const [
      personalProgress,
      continueLearning,
      studentOverview,
      studentQuizPerformance,
    ] = await Promise.all([
      this.getUserStatistics(user),
      this.getContinueLearning(user),
      this.studentOverview(),
      this.studentQuizPerformance(),
    ]);

    return {
      role: UserRole.TEACHER,
      welcome: this.welcome(user),
      continueLearning,
      personalProgress,
      studentOverview,
      studentQuizPerformance,
      announcements: [],
    };
  }

  private async studentOverview(): Promise<StudentOverview> {
    const [totalStudents, activeRow, completedByStudents, accessibleLessons] =
      await Promise.all([
        this.userRepo.count({ where: { role: UserRole.STUDENT } }),
        this.progressRepo
          .createQueryBuilder('p')
          .innerJoin(User, 'u', 'u.id = p.userId')
          .where('u.role = :role', { role: UserRole.STUDENT })
          .select('COUNT(DISTINCT p.userId)', 'count')
          .getRawOne<{ count: string }>(),
        this.progressRepo
          .createQueryBuilder('p')
          .innerJoin(User, 'u', 'u.id = p.userId')
          .where('u.role = :role', { role: UserRole.STUDENT })
          .andWhere('p.status = :status', {
            status: ProgressStatus.COMPLETED,
          })
          .getCount(),
        this.accessibleLessonCount(UserRole.STUDENT),
      ]);

    const denom = totalStudents * accessibleLessons;
    const averageCompletion =
      denom > 0 ? this.round((completedByStudents / denom) * 100) : 0;

    return {
      totalStudents,
      activeStudents: this.num(activeRow?.count),
      averageCompletion,
    };
  }

  private async studentQuizPerformance(): Promise<StudentQuizPerformance> {
    const aggregate = await this.attemptRepo
      .createQueryBuilder('a')
      .innerJoin(User, 'u', 'u.id = a.userId')
      .where('u.role = :role', { role: UserRole.STUDENT })
      .select('COUNT(a.id)', 'count')
      .addSelect('AVG(a.percentage)', 'avg')
      .getRawOne<{ count: string; avg: string }>();

    const topQuizzes = await this.attemptRepo
      .createQueryBuilder('a')
      .innerJoin(User, 'u', 'u.id = a.userId')
      .innerJoin(Quiz, 'q', 'q.id = a.quizId')
      .where('u.role = :role', { role: UserRole.STUDENT })
      .select('a.quizId', 'quizId')
      .addSelect('q.title', 'title')
      .addSelect('COUNT(a.id)', 'attempts')
      .addSelect('AVG(a.percentage)', 'avg')
      .groupBy('a.quizId')
      .addGroupBy('q.title')
      .orderBy('attempts', 'DESC')
      .limit(5)
      .getRawMany<{
        quizId: string;
        title: string;
        attempts: string;
        avg: string;
      }>();

    return {
      totalAttempts: this.num(aggregate?.count),
      averageScore: this.round(this.num(aggregate?.avg)),
      topQuizzes: topQuizzes.map((r) => ({
        quizId: r.quizId,
        title: r.title,
        attempts: this.num(r.attempts),
        averageScore: this.round(this.num(r.avg)),
      })),
    };
  }

  private async adminDashboard(user: AuthUser): Promise<DashboardResponse> {
    const [
      totalUsers,
      students,
      teachers,
      admins,
      publishedLessons,
      publishedQuizzes,
      activeUsers,
      totalLessonProgress,
      completedLessons,
      totalQuizAttempts,
      avgRow,
      recentRegistrations,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { role: UserRole.STUDENT } }),
      this.userRepo.count({ where: { role: UserRole.TEACHER } }),
      this.userRepo.count({ where: { role: UserRole.ADMIN } }),
      this.lessonRepo.count({ where: { isPublished: true } }),
      this.quizRepo.count({ where: { isPublished: true } }),
      this.countActiveUsers(),
      this.progressRepo.count(),
      this.progressRepo.count({
        where: { status: ProgressStatus.COMPLETED },
      }),
      this.attemptRepo.count(),
      this.attemptRepo
        .createQueryBuilder('a')
        .select('AVG(a.percentage)', 'avg')
        .getRawOne<{ avg: string }>(),
      this.userRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'email', 'role', 'createdAt'],
      }),
    ]);

    return {
      role: UserRole.ADMIN,
      welcome: this.welcome(user),
      totalUsers,
      students,
      teachers,
      admins,
      publishedLessons,
      publishedQuizzes,
      activeUsers,
      reportsSummary: {
        totalLessonProgress,
        completedLessons,
        totalQuizAttempts,
        averageQuizScore: this.round(this.num(avgRow?.avg)),
      },
      recentRegistrations: recentRegistrations.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    };
  }

  // Distinct users that have any lesson progress or any quiz attempt.
  private async countActiveUsers(): Promise<number> {
    const row = await this.progressRepo
      .createQueryBuilder('p')
      .select('p.userId', 'userId')
      .distinct(true)
      .getRawMany<{ userId: number }>();
    const attemptRow = await this.attemptRepo
      .createQueryBuilder('a')
      .select('a.userId', 'userId')
      .distinct(true)
      .getRawMany<{ userId: number }>();

    const ids = new Set<number>();
    row.forEach((r) => ids.add(Number(r.userId)));
    attemptRow.forEach((r) => ids.add(Number(r.userId)));
    return ids.size;
  }
}
