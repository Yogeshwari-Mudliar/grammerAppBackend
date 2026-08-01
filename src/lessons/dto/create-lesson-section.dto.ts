import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LessonSectionType } from '../../common/enums/lesson-section-type.enum';

export class CreateLessonSectionDto {
  @IsEnum(LessonSectionType)
  type: LessonSectionType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
