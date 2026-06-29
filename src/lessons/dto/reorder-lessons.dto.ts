import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReorderLessonItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderLessonsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderLessonItemDto)
  items: ReorderLessonItemDto[];
}
