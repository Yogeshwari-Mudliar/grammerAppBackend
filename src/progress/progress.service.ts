import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressStatus } from '../common/enums/progress-status.enum';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { LessonsService } from '../lessons/lessons.service';
import { LessonProgress } from './entities/lesson-progress.entity';
import { UpsertProgressDto } from './dto/upsert-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
    private readonly lessonsService: LessonsService,
  ) {}

  async upsert(
    user: AuthUser,
    lessonId: string,
    dto: UpsertProgressDto,
  ): Promise<LessonProgress> {
    // Validates the lesson exists and the user is allowed to access it.
    await this.lessonsService.findOneForUser(lessonId, user);

    let progress = await this.progressRepo.findOne({
      where: { userId: user.id, lessonId },
    });

    if (!progress) {
      progress = this.progressRepo.create({
        userId: user.id,
        lessonId,
        status: ProgressStatus.NOT_STARTED,
        progressPercent: 0,
      });
    }

    if (dto.progressPercent !== undefined) {
      progress.progressPercent = dto.progressPercent;
    }
    if (dto.status !== undefined) {
      progress.status = dto.status;
    } else if (
      dto.progressPercent !== undefined &&
      progress.status === ProgressStatus.NOT_STARTED &&
      dto.progressPercent > 0
    ) {
      progress.status = ProgressStatus.IN_PROGRESS;
    }

    if (progress.status === ProgressStatus.COMPLETED) {
      progress.progressPercent = 100;
      progress.completedAt = progress.completedAt ?? new Date();
    } else {
      progress.completedAt = null;
    }

    return this.progressRepo.save(progress);
  }

  findMine(user: AuthUser): Promise<LessonProgress[]> {
    return this.progressRepo.find({
      where: { userId: user.id },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneForLesson(
    user: AuthUser,
    lessonId: string,
  ): Promise<LessonProgress> {
    let progress = await this.progressRepo.findOne({
      where: { userId: user.id, lessonId },
    });
    if (!progress) {
      progress = this.progressRepo.create({
        userId: user.id,
        lessonId,
        status: ProgressStatus.NOT_STARTED,
        progressPercent: 0,
        completedAt: null,
      });
    }
    return progress;
  }
}
