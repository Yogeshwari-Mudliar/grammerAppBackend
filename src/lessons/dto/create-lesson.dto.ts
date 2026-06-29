import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Visibility } from '../../common/enums/visibility.enum';
import { CreateLessonSectionDto } from './create-lesson-section.dto';
import { CreateLessonExampleDto } from './create-lesson-example.dto';
import { CreateLessonActivityDto } from './create-lesson-activity.dto';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonSectionDto)
  sections?: CreateLessonSectionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonExampleDto)
  examples?: CreateLessonExampleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonActivityDto)
  activities?: CreateLessonActivityDto[];
}
