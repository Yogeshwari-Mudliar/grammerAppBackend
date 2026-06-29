import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuizOptionDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
