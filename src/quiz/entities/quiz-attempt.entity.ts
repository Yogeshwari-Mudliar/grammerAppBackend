import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from '../../users/users.entity';

export interface AttemptAnswer {
  questionId: string;
  selected: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
  pointsEarned: number;
}

@Entity('quiz_attempts')
@Index(['userId', 'quizId'])
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int' })
  maxScore: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  percentage: number;

  @Column({ default: false })
  passed: boolean;

  @Column({ type: 'int', default: 0 })
  timeTaken: number;

  @Column({ type: 'jsonb', default: [] })
  answers: AttemptAnswer[];

  @CreateDateColumn()
  createdAt: Date;
}
