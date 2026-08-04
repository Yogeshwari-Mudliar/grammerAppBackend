import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean
} from 'class-validator';

export class CreateLessonDto {

  // @IsString()
  // courseId: string;

  @IsString()
  title: string;

  @IsString()
  shortDescription: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}