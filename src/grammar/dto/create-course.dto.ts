import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber
} from 'class-validator';

export class CreateCourseDto {

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

}