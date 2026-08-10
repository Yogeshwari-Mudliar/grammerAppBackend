import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { GrammarLesson } from './grammar-lesson.entity';

@Entity('grammar_sections')
export class GrammarSection {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  heading: string;

  @Column({
    type: 'text',
  })
  content: string;

  @Column({
    default: 'TEXT',
  })
  type: string;

  @Column({
    default: '',
  })
  imageUrl: string;

  @Column({
    default: 1,
  })
  orderNo: number;

  @Column({
    default: 'CONTENT',
  })
  sectionType: string;

  @Column({
    default: 10,
  })
  xpReward: number;

  @Column({
    default: 5,
  })
  coinReward: number;

  @Column({
    default: true,
  })
  isActive: boolean;

  @Column({
    default: false,
  })
  isQuiz: boolean;

  @ManyToOne(
    () => GrammarLesson,
    lesson => lesson.sections,
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
}