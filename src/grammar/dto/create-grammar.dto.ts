import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateGrammarDto {

  @IsString()
  title: string;

  @IsString()
  shortDescription: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

}