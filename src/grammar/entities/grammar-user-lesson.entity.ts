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
import { GrammarLesson } from './grammar-lesson.entity';

@Entity('grammar_user_lessons')
export class GrammarUserLesson {
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

  @ManyToOne(
    () => GrammarLesson,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'lessonId',
  })
  lesson: GrammarLesson;

  @Column()
  lessonId: string;

  @Column({
    default: false,
  })
  isUnlocked: boolean;

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
  completedSections: number;

  @Column({
    default: 0,
  })
  totalSections: number;

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