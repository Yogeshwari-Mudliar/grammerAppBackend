import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Lesson } from './lesson.entity';

@Entity('lesson_examples')
export class LessonExample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => Lesson, (lesson) => lesson.examples, { onDelete: 'CASCADE' })
  lesson: Lesson;
}
