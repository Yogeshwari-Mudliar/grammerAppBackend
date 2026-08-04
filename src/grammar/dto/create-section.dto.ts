import {
  IsString,
  IsOptional,
  IsNumber
} from 'class-validator';

export class CreateSectionDto {

  @IsString()
  lessonId: string;

  @IsString()
  heading: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  orderNo?: number;

}