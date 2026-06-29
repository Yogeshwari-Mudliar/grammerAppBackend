import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateQuizQuestionDto } from './create-quiz-question.dto';

export class CreateQuizDto {
  @IsUUID()
  lessonId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}
