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
import { GrammarLesson } from './grammar-lesson.entity';
import { GrammarSection } from './grammar-section.entity';

@Entity('grammar_user_sections')
export class GrammarUserSection {
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

  @ManyToOne(
    () => GrammarSection,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'sectionId',
  })
  section: GrammarSection;

  @Column()
  sectionId: string;

  @Column({
    default: false,
  })
  isUnlocked: boolean;

  @Column({
    default: false,
  })
  isCompleted: boolean;

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
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}