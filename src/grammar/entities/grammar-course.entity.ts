import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GrammarLesson } from './grammar-lesson.entity';

@Entity('grammar_courses')
export class GrammarCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    default: '',
  })
  bannerImage: string;

  @Column({
    default: 'Beginner',
  })
  level: string;

  @Column({
    type: 'enum',
    enum: ['student', 'teacher', 'both'],
    default: 'both',
  })
  access: 'student' | 'teacher' | 'both';

  @Column({
    default: true,
  })
  isPublished: boolean;

  @Column({
    default: true,
  })
  isActive: boolean;

  @Column({
    default: 1,
  })
  sortOrder: number;

  @OneToMany(
    () => GrammarLesson,
    lesson => lesson.course,
  )
  lessons: GrammarLesson[];

@Column({
  default: 'student',
})
accessTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}