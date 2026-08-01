import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quiz_options')
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => QuizQuestion, (question) => question.options, {
    onDelete: 'CASCADE',
  })
  question: QuizQuestion;
}
