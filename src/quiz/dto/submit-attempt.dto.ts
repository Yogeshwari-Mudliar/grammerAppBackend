import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class AttemptAnswerInputDto {
  @IsUUID()
  questionId: string;

  // The learner's answer; shape depends on the question type.
  @IsOptional()
  answer?: unknown;
}

export class SubmitAttemptDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  timeTaken?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttemptAnswerInputDto)
  answers: AttemptAnswerInputDto[];
}
