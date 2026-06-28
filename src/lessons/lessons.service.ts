import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Visibility } from '../common/enums/visibility.enum';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { Lesson } from './entities/lesson.entity';
import { LessonSection } from './entities/lesson-section.entity';
import { LessonExample } from './entities/lesson-example.entity';
import { LessonActivity } from './entities/lesson-activity.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

const RELATIONS = ['sections', 'examples', 'activities'];

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
  ) {}

  private visibilitiesForRole(role: UserRole): Visibility[] {
    if (role === UserRole.TEACHER) {
      return [Visibility.TEACHER, Visibility.BOTH];
    }
    return [Visibility.STUDENT, Visibility.BOTH];
  }

  private sortChildren(lesson: Lesson): Lesson {
    const byOrder = (a: { order: number }, b: { order: number }) =>
      a.order - b.order;
    lesson.sections?.sort(byOrder);
    lesson.examples?.sort(byOrder);
    lesson.activities?.sort(byOrder);
    return lesson;
  }

  async create(dto: CreateLessonDto): Promise<Lesson> {
    const lesson = this.lessonRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      visibility: dto.visibility ?? Visibility.BOTH,
      isPublished: dto.isPublished ?? false,
      order: dto.order ?? 0,
      sections: (dto.sections ?? []).map((s, i) =>
        Object.assign(new LessonSection(), {
          type: s.type,
          title: s.title ?? null,
          body: s.body ?? null,
          order: s.order ?? i,
        }),
      ),
      examples: (dto.examples ?? []).map((e, i) =>
        Object.assign(new LessonExample(), {
          title: e.title ?? null,
          content: e.content,
          order: e.order ?? i,
        }),
      ),
      activities: (dto.activities ?? []).map((a, i) =>
        Object.assign(new LessonActivity(), {
          type: a.type,
          title: a.title ?? null,
          data: a.data ?? {},
          order: a.order ?? i,
        }),
      ),
    });

    const saved = await this.lessonRepo.save(lesson);
    return this.findOneForUser(saved.id, {
      id: 0,
      email: '',
      role: UserRole.ADMIN,
    });
  }

  async findAllForUser(user: AuthUser): Promise<Lesson[]> {
    if (user.role === UserRole.ADMIN) {
      return this.lessonRepo.find({
        order: { order: 'ASC', createdAt: 'ASC' },
      });
    }
    return this.lessonRepo.find({
      where: {
        isPublished: true,
        visibility: In(this.visibilitiesForRole(user.role)),
      },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneForUser(id: string, user: AuthUser): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: RELATIONS,
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (user.role !== UserRole.ADMIN) {
      const allowed =
        lesson.isPublished &&
        this.visibilitiesForRole(user.role).includes(lesson.visibility);
      if (!allowed) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    return this.sortChildren(lesson);
  }

  async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (dto.title !== undefined) lesson.title = dto.title;
    if (dto.description !== undefined) lesson.description = dto.description;
    if (dto.visibility !== undefined) lesson.visibility = dto.visibility;
    if (dto.isPublished !== undefined) lesson.isPublished = dto.isPublished;
    if (dto.order !== undefined) lesson.order = dto.order;

    if (dto.sections !== undefined) {
      lesson.sections = dto.sections.map((s, i) =>
        Object.assign(new LessonSection(), {
          type: s.type,
          title: s.title ?? null,
          body: s.body ?? null,
          order: s.order ?? i,
        }),
      );
    }
    if (dto.examples !== undefined) {
      lesson.examples = dto.examples.map((e, i) =>
        Object.assign(new LessonExample(), {
          title: e.title ?? null,
          content: e.content,
          order: e.order ?? i,
        }),
      );
    }
    if (dto.activities !== undefined) {
      lesson.activities = dto.activities.map((a, i) =>
        Object.assign(new LessonActivity(), {
          type: a.type,
          title: a.title ?? null,
          data: a.data ?? {},
          order: a.order ?? i,
        }),
      );
    }

    await this.lessonRepo.save(lesson);
    return this.findOneForUser(id, {
      id: 0,
      email: '',
      role: UserRole.ADMIN,
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.lessonRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Lesson not found');
    }
  }

  async setPublished(id: string, isPublished: boolean): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    lesson.isPublished = isPublished;
    await this.lessonRepo.save(lesson);
    return this.findOneForUser(id, {
      id: 0,
      email: '',
      role: UserRole.ADMIN,
    });
  }
}
