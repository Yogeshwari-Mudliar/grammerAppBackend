import { IsInt, Min } from 'class-validator';

export class AnswerGrammarQuizDto {

  @IsInt()
  @Min(0)
  questionIndex: number;

  @IsInt()
  @Min(0)
  answerIndex: number;
}