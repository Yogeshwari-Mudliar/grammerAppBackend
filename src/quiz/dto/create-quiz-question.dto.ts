import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../../common/enums/question-type.enum';
import { CreateQuizOptionDto } from './create-quiz-option.dto';

export class CreateQuizQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  prompt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  // Free-form expected answer for non-option question types.
  @IsOptional()
  correctAnswer?: unknown;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options?: CreateQuizOptionDto[];
}
