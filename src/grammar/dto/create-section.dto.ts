// import {
//   IsString,
//   IsOptional,
//   IsNumber,
//   IsBoolean,
// } from 'class-validator';

// export class CreateSectionDto {

//   @IsOptional()
//   @IsString()
//   lessonId?: string;

//   @IsString()
//   heading: string;

//   @IsString()
//   content: string;

//   @IsOptional()
//   @IsString()
//   type?: string;

//   @IsOptional()
//   @IsString()
//   imageUrl?: string;

//   @IsOptional()
//   @IsNumber()
//   orderNo?: number;

//   @IsOptional()
//   @IsString()
//   sectionType?: string;

//   @IsOptional()
//   @IsNumber()
//   xpReward?: number;

//   @IsOptional()
//   @IsNumber()
//   coinReward?: number;

//   @IsOptional()
//   @IsBoolean()
//   isQuiz?: boolean;
// }

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateSectionDto {

  @IsOptional()
  @IsString()
  lessonId?: string;

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

  @IsOptional()
  @IsString()
  sectionType?: string;

  @IsOptional()
  @IsNumber()
  xpReward?: number;

  @IsOptional()
  @IsNumber()
  coinReward?: number;

  @IsOptional()
  @IsBoolean()
  isQuiz?: boolean;

  @IsOptional()
  @IsObject()
  quizData?: {
    questions: {
      question: string;
      options: {
        text: string;
        isCorrect: boolean;
      }[];
      explanation?: string;
    }[];
  };
}