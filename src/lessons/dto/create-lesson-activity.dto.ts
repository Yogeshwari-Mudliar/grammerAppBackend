import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ActivityType } from '../../common/enums/activity-type.enum';

export class CreateLessonActivityDto {
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
