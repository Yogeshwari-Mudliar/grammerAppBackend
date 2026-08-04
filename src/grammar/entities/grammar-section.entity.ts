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
@Column({
  default: true,
})
isActive: boolean;

@Column({
  default: false,
})
isQuiz: boolean;

@Column({
  default: 'CONTENT',
})
sectionType: string;
}