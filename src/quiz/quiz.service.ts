import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Visibility } from '../common/enums/visibility.enum';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { Lesson } from '../lessons/entities/lesson.entity';
import { ProgressService } from '../progress/progress.service';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QueryQuizzesDto } from './dto/query-quizzes.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { QuizScoringService } from './quiz-scoring.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    private readonly scoringService: QuizScoringService,
    private readonly progressService: ProgressService,
  ) {}

  private visibilitiesForRole(role: UserRole): Visibility[] {
    if (role === UserRole.TEACHER) {
      return [Visibility.TEACHER, Visibility.BOTH];
    }
    return [Visibility.STUDENT, Visibility.BOTH];
  }

  private buildQuestions(dtos: CreateQuizQuestionDto[] = []): QuizQuestion[] {
    return dtos.map((q, qi) =>
      Object.assign(new QuizQuestion(), {
        type: q.type,
        prompt: q.prompt,
        points: q.points ?? 1,
        order: q.order ?? qi,
        correctAnswer: q.correctAnswer ?? null,
        data: q.data ?? {},
        options: (q.options ?? []).map((o, oi) =>
          Object.assign(new QuizOption(), {
            text: o.text,
            isCorrect: o.isCorrect ?? false,
            order: o.order ?? oi,
          }),
        ),
      }),
    );
  }

  async create(dto: CreateQuizDto): Promise<Quiz> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: dto.lessonId },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const quiz = this.quizRepo.create({
      lessonId: dto.lessonId,
      title: dto.title,
      description: dto.description ?? null,
      isPublished: dto.isPublished ?? false,
      passingScore: dto.passingScore ?? 70,
      timeLimit: dto.timeLimit ?? null,
      order: dto.order ?? 0,
      questions: this.buildQuestions(dto.questions),
    });

    const saved = await this.quizRepo.save(quiz);
    return this.loadFull(saved.id);
  }

  async update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.loadFull(id);

    if (dto.title !== undefined) quiz.title = dto.title;
    if (dto.description !== undefined) quiz.description = dto.description;
    if (dto.isPublished !== undefined) quiz.isPublished = dto.isPublished;
    if (dto.passingScore !== undefined) quiz.passingScore = dto.passingScore;
    if (dto.timeLimit !== undefined) quiz.timeLimit = dto.timeLimit;
    if (dto.order !== undefined) quiz.order = dto.order;
    if (dto.lessonId !== undefined) {
      const lesson = await this.lessonRepo.findOne({
        where: { id: dto.lessonId },
      });
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
      quiz.lessonId = dto.lessonId;
    }
    if (dto.questions !== undefined) {
      // Replace the question set; orphanedRowAction deletes the old rows.
      quiz.questions = this.buildQuestions(dto.questions);
    }

    await this.quizRepo.save(quiz);
    return this.loadFull(id);
  }

  async setPublished(id: string, isPublished: boolean): Promise<Quiz> {
    const quiz = await this.loadFull(id);
    quiz.isPublished = isPublished;
    await this.quizRepo.save(quiz);
    return this.loadFull(id);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.quizRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Quiz not found');
    }
    return { deleted: true };
  }

  async findAllForUser(
    user: AuthUser,
    query: QueryQuizzesDto = {},
  ): Promise<PaginatedResult<Quiz>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.quizRepo
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.lesson', 'lesson')
      .orderBy('quiz.order', 'ASC')
      .addOrderBy('quiz.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (user.role !== UserRole.ADMIN) {
      qb.andWhere('quiz.isPublished = true')
        .andWhere('lesson.isPublished = true')
        .andWhere('lesson.visibility IN (:...vis)', {
          vis: this.visibilitiesForRole(user.role),
        });
    }

    if (query.lessonId) {
      qb.andWhere('quiz.lessonId = :lessonId', { lessonId: query.lessonId });
    }

    if (query.search) {
      qb.andWhere(
        '(quiz.title ILIKE :search OR quiz.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  // Returns a quiz the user is allowed to take/preview; answers are stripped
  // for non-admin users so the player never receives the solution.
  async findOneForUser(id: string, user: AuthUser): Promise<Quiz> {
    const quiz = await this.loadAccessible(id, user);
    if (user.role === UserRole.ADMIN) {
      return this.sorted(quiz);
    }
    return this.stripAnswers(this.sorted(quiz));
  }

  async submitAttempt(
    id: string,
    user: AuthUser,
    dto: SubmitAttemptDto,
  ): Promise<QuizAttempt> {
    const quiz = await this.loadAccessible(id, user);

    const submitted = new Map<string, unknown>(
      dto.answers.map((a) => [a.questionId, a.answer]),
    );
    const result = this.scoringService.score(quiz.questions, submitted);
    const passed = result.percentage >= quiz.passingScore;

    const attempt = this.attemptRepo.create({
      userId: user.id,
      quizId: quiz.id,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed,
      timeTaken: dto.timeTaken ?? 0,
      answers: result.answers,
    });
    const saved = await this.attemptRepo.save(attempt);

    // A completed quiz advances the parent lesson's progress.
    await this.progressService.recordQuizCompletion(
      user.id,
      quiz.lessonId,
      result.percentage,
      passed,
    );

    return saved;
  }

  findMyAttempts(id: string, user: AuthUser): Promise<QuizAttempt[]> {
    return this.attemptRepo.find({
      where: { quizId: id, userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findAttempt(attemptId: string, user: AuthUser): Promise<QuizAttempt> {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    if (attempt.userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot view this attempt');
    }
    return attempt;
  }

  private async loadFull(id: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['lesson', 'questions', 'questions.options'],
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  private async loadAccessible(id: string, user: AuthUser): Promise<Quiz> {
    const quiz = await this.loadFull(id);
    if (user.role !== UserRole.ADMIN) {
      const visible =
        quiz.isPublished &&
        quiz.lesson?.isPublished &&
        this.visibilitiesForRole(user.role).includes(quiz.lesson.visibility);
      if (!visible) {
        throw new ForbiddenException('You do not have access to this quiz');
      }
    }
    return quiz;
  }

  private sorted(quiz: Quiz): Quiz {
    quiz.questions?.sort((a, b) => a.order - b.order);
    quiz.questions?.forEach((q) =>
      q.options?.sort((a, b) => a.order - b.order),
    );
    return quiz;
  }

  private stripAnswers(quiz: Quiz): Quiz {
    quiz.questions = (quiz.questions ?? []).map((q) => {
      const stripped = { ...q, correctAnswer: null } as QuizQuestion;
      stripped.options = (q.options ?? []).map(
        (o) => ({ ...o, isCorrect: false }) as QuizOption,
      );
      return stripped;
    });
    return quiz;
  }
}
