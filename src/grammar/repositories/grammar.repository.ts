import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
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

    const courses = await this.courseRepo.find({
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

    courses.forEach(course => {

      course.lessons = (course.lessons || [])
        .filter(lesson => lesson.isActive);

      course.lessons.forEach(lesson => {

        lesson.sections = (lesson.sections || [])
          .filter(section => section.isActive)
          .sort(
            (a, b) =>
              (a.orderNo ?? 0) -
              (b.orderNo ?? 0),
          );

      });

      course.lessons.sort(
        (a, b) =>
          (a.sortOrder ?? 0) -
          (b.sortOrder ?? 0),
      );

    });

    return courses;
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

    // Remove inactive lessons
    course.lessons = (course.lessons || [])
      .filter(lesson => lesson.isActive);

    // Remove inactive sections
    course.lessons.forEach(lesson => {

      lesson.sections = (lesson.sections || [])
        .filter(section => section.isActive)
        .sort(
          (a, b) =>
            (a.orderNo ?? 0) -
            (b.orderNo ?? 0),
        );

    });

    // Make lesson order explicit
    course.lessons.sort(
      (a, b) =>
        (a.sortOrder ?? 0) -
        (b.sortOrder ?? 0),
    );

    return course;
  }

async createCourse(dto: CreateCourseDto) {
  const course = this.courseRepo.create({
    ...dto,

    access:
      (dto.accessTo ?? 'student') as
        'student' | 'teacher' | 'both',

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

  await this.courseRepo.update(id, {
    ...dto,
    ...(dto.accessTo
      ? { access: dto.accessTo as 'student' | 'teacher' | 'both' }
      : {}),
  });

  return this.getCourse(id);
}
  async deleteCourse(id: string) {

    await this.getCourse(id);

    await this.courseRepo.update(
      id,
      {
        isActive: false,
      },
    );

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

  if (!text) {
    throw new NotFoundException(
      'Lesson document/text not found',
    );
  }

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

  // =====================================================
  // PARSE DOCUMENT
  // =====================================================

  const sections = buildSections(text);

  // =====================================================
  // CREATE SECTIONS
  // =====================================================

  for (const section of sections) {
    const sectionData: any = {
      heading: section.heading,
      content: section.content ?? '',

      isQuiz: section.isQuiz ?? false,

      sectionType:
        section.sectionType ??
        (section.isQuiz ? 'QUIZ' : 'TEXT'),

      type: 'TEXT',

      imageUrl: '',

      orderNo: section.orderNo,

      xpReward: section.isQuiz ? 25 : 10,

      coinReward: section.isQuiz ? 15 : 5,

      lesson,
      lessonId: lesson.id,

      isActive: true,
    };

    // IMPORTANT:
    // quizData sirf quiz section ke liye set karo.
    // Non-quiz ke liye null mat bhejo.
    if (
      section.isQuiz &&
      section.quizData &&
      Array.isArray(section.quizData.questions)
    ) {
      sectionData.quizData = {
        questions: section.quizData.questions.map(
          (question: any) => ({
            question: question.question,

            options: (
              question.options ?? []
            ).map((option: any) => ({
              text: option.text,
              isCorrect:
                option.isCorrect ?? false,
            })),

            ...(question.explanation
              ? {
                  explanation:
                    question.explanation,
                }
              : {}),
          }),
        ),
      };
    }

    const newSection =
      this.sectionRepo.create(sectionData);

    await this.sectionRepo.save(newSection);
  }

  return this.getLesson(lesson.id);
}
  async updateLesson(
    id: string,
    dto: UpdateLessonDto,
    text?: string,
  ) {

    const lesson =
      await this.lessonRepo.findOne({
        where: {
          id,
        },
      });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found',
      );
    }

    await this.lessonRepo.update(
      id,
      dto,
    );

    return this.getLesson(id);
  }

  async deleteLesson(id: string) {

    const lesson =
      await this.lessonRepo.findOne({
        where: {
          id,
        },
      });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found',
      );
    }

    await this.lessonRepo.update(
      id,
      {
        isActive: false,
      },
    );

    return {
      message: 'Lesson deleted',
    };
  }

  async getLesson(id: string) {

    const lesson =
      await this.lessonRepo.findOne({

        where: {
          id,
          isActive: true,
        },

        relations: [
          'sections',
        ],

        order: {
          sections: {
            orderNo: 'ASC',
          },
        },
      });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found',
      );
    }

    // Remove inactive sections
    lesson.sections =
      (lesson.sections || [])
        .filter(
          section =>
            section.isActive,
        )
        .sort(
          (a, b) =>
            (a.orderNo ?? 0) -
            (b.orderNo ?? 0),
        );

    return lesson;
  }

  // =====================================================
  // SECTION
  // =====================================================

  async addSection(
    courseId: string,
    lessonId: string,
    dto: CreateSectionDto,
  ) {

    await this.getCourse(
      courseId,
    );

    const lesson =
      await this.lessonRepo.findOne({
        where: {
          id: lessonId,
          isActive: true,
        },
      });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found',
      );
    }

    const section =
      this.sectionRepo.create({

        ...dto,

        lesson,

        lessonId,

        orderNo:
          dto.orderNo ?? 1,

        isActive: true,
      });

    return this.sectionRepo.save(
      section,
    );
  }

  async updateSection(
    id: string,
    dto: UpdateSectionDto,
  ) {

    const section =
      await this.sectionRepo.findOne({
        where: {
          id,
        },
      });

    if (!section) {
      throw new NotFoundException(
        'Section not found',
      );
    }

    await this.sectionRepo.update(
      id,
      dto,
    );

    return this.sectionRepo.findOne({
      where: {
        id,
      },
    });
  }

  async deleteSection(id: string) {

    const section =
      await this.sectionRepo.findOne({
        where: {
          id,
        },
      });

    if (!section) {
      throw new NotFoundException(
        'Section not found',
      );
    }

    await this.sectionRepo.update(
      id,
      {
        isActive: false,
      },
    );

    return {
      message: 'Section deleted',
    };
  }

  async getSection(id: string) {

    const section =
      await this.sectionRepo.findOne({
        where: {
          id,
        },
      });

    if (!section) {
      throw new NotFoundException(
        'Section not found',
      );
    }

    return section;
  }
}