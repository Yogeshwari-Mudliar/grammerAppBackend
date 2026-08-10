import { Type, Transform } from 'class-transformer';

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean
} from 'class-validator';


export class CreateLessonDto {

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
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return value;
  })
  @IsBoolean()
  isPublished?: boolean;

}