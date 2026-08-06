import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GrammarCourse } from './grammar-course.entity';
import { GrammarSection } from './grammar-section.entity';

@Entity('grammar_lessons')
export class GrammarLesson {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column()
  duration: number;

  @Column({
    default: '',
  })
  thumbnail: string;

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

  @ManyToOne(
    () => GrammarCourse,
    course => course.lessons,
  )
  @JoinColumn({
    name: 'courseId',
  })
  course: GrammarCourse;

  @Column()
  courseId: string;

  @OneToMany(
    () => GrammarSection,
    section => section.lesson,
  )
  sections: GrammarSection[];

  @CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
}