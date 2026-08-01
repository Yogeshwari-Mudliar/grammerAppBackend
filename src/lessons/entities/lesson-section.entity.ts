import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LessonSectionType } from '../../common/enums/lesson-section-type.enum';
import { Lesson } from './lesson.entity';

@Entity('lesson_sections')
export class LessonSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LessonSectionType })
  type: LessonSectionType;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => Lesson, (lesson) => lesson.sections, { onDelete: 'CASCADE' })
  lesson: Lesson;
}
