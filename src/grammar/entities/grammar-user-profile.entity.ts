import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/users.entity';

@Entity('grammar_user_profiles')
export class GrammarUserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'userId',
  })
  user: User;

@Column({
  type: 'int',
})
userId: number;

  @Column({
    default: 1,
  })
  level: number;

  @Column({
    default: 0,
  })
  totalXp: number;

  @Column({
    default: 0,
  })
  totalCoins: number;

  @Column({
    default: 0,
  })
  completedCourses: number;

  @Column({
    default: 0,
  })
  completedLessons: number;

  @Column({
    default: 0,
  })
  completedSections: number;

  @Column({
    default: 0,
  })
  completedQuizzes: number;

  @Column({
    default: 0,
  })
  currentStreak: number;

  @Column({
    default: 0,
  })
  longestStreak: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}