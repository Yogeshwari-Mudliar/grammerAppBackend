import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/users.entity';
import { GrammarCourse } from './grammar-course.entity';

@Entity('grammar_user_courses')
export class GrammarUserCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => User,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'userId',
  })
  user: User;

@Column({
  type: 'int',
})
userId: number;

  @ManyToOne(
    () => GrammarCourse,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'courseId',
  })
  course: GrammarCourse;

  @Column()
  courseId: string;

  @Column({
    default: false,
  })
  isStarted: boolean;

  @Column({
    default: false,
  })
  isCompleted: boolean;

  @Column({
    default: 0,
  })
  completedLessons: number;

  @Column({
    default: 0,
  })
  totalLessons: number;

  @Column({
    type: 'float',
    default: 0,
  })
  progress: number;

  @Column({
    default: 0,
  })
  earnedXp: number;

  @Column({
    default: 0,
  })
  earnedCoins: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  startedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}