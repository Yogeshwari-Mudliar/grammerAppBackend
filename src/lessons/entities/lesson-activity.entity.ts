import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ActivityType } from '../../common/enums/activity-type.enum';
import { Lesson } from './lesson.entity';

@Entity('lesson_activities')
export class LessonActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => Lesson, (lesson) => lesson.activities, {
    onDelete: 'CASCADE',
  })
  lesson: Lesson;
}
