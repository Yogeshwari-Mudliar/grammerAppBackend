// import {
//   IsString,
//   IsOptional,
//   IsBoolean,
//   IsNumber,
//   IsEnum,
// } from 'class-validator';

// enum CourseAccessTo {
//   TEACHER = 'teacher',
//   STUDENT = 'student',
//   BOTH = 'both',
// }

// export class CreateCourseDto {

//   @IsString()
//   title: string;

//   @IsString()
//   description: string;

//   @IsOptional()
//   @IsString()
//   bannerImage?: string;

//   @IsOptional()
//   @IsString()
//   level?: string;

//   @IsOptional()
//   @IsNumber()
//   sortOrder?: number;

//   @IsOptional()
//   @IsBoolean()
//   isPublished?: boolean;

//   @IsOptional()
//   @IsEnum(CourseAccessTo)
//   accessTo?: CourseAccessTo;
// }
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

enum CourseAccessTo {
  TEACHER = 'teacher',
  STUDENT = 'student',
  BOTH = 'both',
}

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
  @IsEnum(CourseAccessTo)
  accessTo?: CourseAccessTo;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}