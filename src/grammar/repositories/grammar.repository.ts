import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  IsNull,
} from 'typeorm';

import { GrammarCourse } from '../entities/grammar-course.entity';
import { GrammarLesson } from '../entities/grammar-lesson.entity';
import { GrammarSection } from '../entities/grammar-section.entity';

import { CreateCourseDto } from '../dto/create-course.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { CreateSectionDto } from '../dto/create-section.dto';

import { UpdateCourseDto } from '../dto/update-course.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { buildSections } from '../utils/section-parser';

@Injectable()
export class GrammarRepository {
  constructor(
    @InjectRepository(GrammarCourse)
    private readonly courseRepo: Repository<GrammarCourse>,

    @InjectRepository(GrammarLesson)
    private readonly lessonRepo: Repository<GrammarLesson>,

    @InjectRepository(GrammarSection)
    private readonly sectionRepo: Repository<GrammarSection>,
  ) {}

  // =====================================================
  // COURSE
  // =====================================================

  async getCourses() {
    return this.courseRepo.find({
      where: {
        isActive: true,
      },
      relations: [
        'lessons',
        'lessons.sections',
      ],
      order: {
        sortOrder: 'ASC',
        lessons: {
          sortOrder: 'ASC',
          sections: {
            orderNo: 'ASC',
          },
        },
      },
    });
  }

  async getCourse(id: string) {
    const course = await this.courseRepo.findOne({
      where: {
        id,
        isActive: true,
      },
      relations: [
        'lessons',
        'lessons.sections',
      ],
      order: {
        lessons: {
          sortOrder: 'ASC',
          sections: {
            orderNo: 'ASC',
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async createCourse(dto: CreateCourseDto) {
    const course = this.courseRepo.create({
      ...dto,
      isActive: true,
      isPublished: dto.isPublished ?? true,
      sortOrder: dto.sortOrder ?? 1,
    });

    return this.courseRepo.save(course);
  }

  async updateCourse(
    id: string,
    dto: UpdateCourseDto,
  ) {
    await this.getCourse(id);

    await this.courseRepo.update(id, dto);

    return this.getCourse(id);
  }

  async deleteCourse(id: string) {
    await this.getCourse(id);

    await this.courseRepo.update(id, {
      isActive: false,
    });

    return {
      message: 'Course deleted',
    };
  }

  // =====================================================
  // LESSON
  // =====================================================

async addLesson(
  courseId: string,
  dto: CreateLessonDto,
  text: string,
) {
  const course = await this.getCourse(courseId);

  const lesson = this.lessonRepo.create({
    title: dto.title,
    shortDescription: dto.shortDescription,
    duration: dto.duration ?? 0,
    thumbnail: dto.thumbnail ?? '',
    isPublished: dto.isPublished ?? true,
    isActive: true,
    sortOrder: dto.sortOrder ?? 1,
    course,
    courseId,
  });

  await this.lessonRepo.save(lesson);

  const sections = buildSections(text);

  // let order = 1;
for (const section of sections) {
  const newSection = this.sectionRepo.create({
    heading: section.heading,
    content: section.content,

    isQuiz: section.isQuiz,
    sectionType: section.sectionType,

    type: 'TEXT',

    imageUrl: '',

    orderNo: section.orderNo,

    xpReward: section.isQuiz ? 25 : 10,

    coinReward: section.isQuiz ? 15 : 5,

    lesson,
    lessonId: lesson.id,

    isActive: true,
  });

  await this.sectionRepo.save(newSection);
}
  return this.getLesson(lesson.id);
}
  async updateLesson(
  id: string,
  dto: UpdateLessonDto,
  text?: string,
) {
    const lesson = await this.lessonRepo.findOne({
      where: {
        id,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.lessonRepo.update(id, dto);

    return this.lessonRepo.findOne({
      where: { id },
      relations: ['sections'],
    });
  }

  async deleteLesson(id: string) {
    const lesson = await this.lessonRepo.findOne({
      where: {
        id,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.lessonRepo.update(id, {
      isActive: false,
    });

    return {
      message: 'Lesson deleted',
    };
  }

  // =====================================================
  // SECTION
  // =====================================================

  async addSection(
    courseId: string,
    lessonId: string,
    dto: CreateSectionDto,
  ) {
    await this.getCourse(courseId);

    const lesson = await this.lessonRepo.findOne({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const section = this.sectionRepo.create({
      ...dto,
      lesson,
      lessonId,
      orderNo: dto.orderNo ?? 1,
    });

    return this.sectionRepo.save(section);
  }

  async updateSection(
    id: string,
    dto: UpdateSectionDto,
  ) {
    const section = await this.sectionRepo.findOne({
      where: {
        id,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.sectionRepo.update(id, dto);

    return this.sectionRepo.findOne({
      where: { id },
    });
  }

  async deleteSection(id: string) {
    const section = await this.sectionRepo.findOne({
      where: {
        id,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.sectionRepo.delete(id);

    return {
      message: 'Section deleted',
    };
  }
async getLesson(id: string) {
  const lesson = await this.lessonRepo.findOne({
    where: {
      id,
      isActive: true,
    },
    relations: ['sections'],
  });

  if (!lesson) {
    throw new NotFoundException('Lesson not found');
  }

  return lesson;
}

async getSection(id: string) {
  const section = await this.sectionRepo.findOne({
    where: {
      id,
    },
  });

  if (!section) {
    throw new NotFoundException('Section not found');
  }

  return section;
}

}