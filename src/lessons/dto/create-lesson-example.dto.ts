import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonExampleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
