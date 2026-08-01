import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lesson } from '../../lessons/entities/lesson.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'int', default: 70 })
  passingScore: number;

  @Column({ type: 'int', nullable: true })
  timeLimit: number | null;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, {
    cascade: true,
    orphanedRowAction: 'delete',
    eager: false,
  })
  questions: QuizQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
