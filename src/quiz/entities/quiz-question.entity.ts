import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionType } from '../../common/enums/question-type.enum';
import { Quiz } from './quiz.entity';
import { QuizOption } from './quiz-option.entity';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  // Expected answer for non-option question types
  // (FILL_BLANK, MATCH, SENTENCE_BUILDER, FIND_THE_MISTAKE).
  @Column({ type: 'jsonb', nullable: true })
  correctAnswer: unknown;

  // Extra per-type config shown to the player (tokens to arrange,
  // left/right items to match, the sentence containing a mistake, etc.).
  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  quiz: Quiz;

  @OneToMany(() => QuizOption, (option) => option.question, {
    cascade: true,
    orphanedRowAction: 'delete',
    eager: true,
  })
  options: QuizOption[];
}
