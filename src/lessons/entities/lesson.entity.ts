import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Visibility } from '../../common/enums/visibility.enum';
import { LessonSection } from './lesson-section.entity';
import { LessonExample } from './lesson-example.entity';
import { LessonActivity } from './lesson-activity.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: Visibility, default: Visibility.BOTH })
  visibility: Visibility;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => LessonSection, (section) => section.lesson, {
    cascade: true,
    orphanedRowAction: 'delete',
    eager: false,
  })
  sections: LessonSection[];

  @OneToMany(() => LessonExample, (example) => example.lesson, {
    cascade: true,
    orphanedRowAction: 'delete',
    eager: false,
  })
  examples: LessonExample[];

  @OneToMany(() => LessonActivity, (activity) => activity.lesson, {
    cascade: true,
    orphanedRowAction: 'delete',
    eager: false,
  })
  activities: LessonActivity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
