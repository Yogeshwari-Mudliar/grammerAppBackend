import { Injectable } from '@nestjs/common';
import { QuestionType } from '../common/enums/question-type.enum';
import { QuizQuestion } from './entities/quiz-question.entity';
import { AttemptAnswer } from './entities/quiz-attempt.entity';

export interface ScoringResult {
  score: number;
  maxScore: number;
  percentage: number;
  answers: AttemptAnswer[];
}

@Injectable()
export class QuizScoringService {
  score(
    questions: QuizQuestion[],
    submitted: Map<string, unknown>,
  ): ScoringResult {
    let score = 0;
    let maxScore = 0;
    const answers: AttemptAnswer[] = [];

    for (const question of questions) {
      const points = question.points ?? 1;
      maxScore += points;
      const selected = submitted.get(question.id);
      const isCorrect = this.isAnswerCorrect(question, selected);
      const pointsEarned = isCorrect ? points : 0;
      score += pointsEarned;
      answers.push({
        questionId: question.id,
        selected: selected ?? null,
        correctAnswer: this.expectedAnswer(question),
        isCorrect,
        pointsEarned,
      });
    }

    const percentage =
      maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;

    return { score, maxScore, percentage, answers };
  }

  private isAnswerCorrect(question: QuizQuestion, selected: unknown): boolean {
    if (selected === undefined || selected === null) {
      return false;
    }
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.checkMultipleChoice(question, selected);
      case QuestionType.TRUE_FALSE:
        return this.checkTrueFalse(question, selected);
      case QuestionType.FILL_BLANK:
        return this.checkFillBlank(question, selected);
      case QuestionType.MATCH:
        return this.checkMatch(question, selected);
      case QuestionType.SENTENCE_BUILDER:
        return this.checkSentenceBuilder(question, selected);
      case QuestionType.FIND_THE_MISTAKE:
        return this.checkFindTheMistake(question, selected);
      default:
        return false;
    }
  }

  private expectedAnswer(question: QuizQuestion): unknown {
    if (
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.TRUE_FALSE
    ) {
      const correct = (question.options ?? [])
        .filter((o) => o.isCorrect)
        .map((o) => o.id);
      return correct.length === 1 ? correct[0] : correct;
    }
    return question.correctAnswer ?? null;
  }

  private checkMultipleChoice(
    question: QuizQuestion,
    selected: unknown,
  ): boolean {
    const correctIds = (question.options ?? [])
      .filter((o) => o.isCorrect)
      .map((o) => o.id);
    const selectedIds = (Array.isArray(selected) ? selected : [selected]).map(
      (s) => String(s),
    );
    return this.setsEqual(correctIds, selectedIds);
  }

  private checkTrueFalse(question: QuizQuestion, selected: unknown): boolean {
    const correct = (question.options ?? []).filter((o) => o.isCorrect);
    if (correct.length > 0) {
      return String(selected) === String(correct[0].id);
    }
    // Fallback to a boolean stored on correctAnswer.
    return this.normalize(selected) === this.normalize(question.correctAnswer);
  }

  private checkFillBlank(question: QuizQuestion, selected: unknown): boolean {
    const expected = question.correctAnswer;
    if (Array.isArray(expected)) {
      const given = Array.isArray(selected) ? selected : [selected];
      if (given.length !== expected.length) {
        return false;
      }
      return expected.every(
        (e, i) => this.normalize(e) === this.normalize(given[i]),
      );
    }
    return this.normalize(selected) === this.normalize(expected);
  }

  private checkMatch(question: QuizQuestion, selected: unknown): boolean {
    // correctAnswer: [{ left, right }] ; selected: same shape or { left: right }.
    const expectedPairs = this.toPairs(question.correctAnswer);
    const givenPairs = this.toPairs(selected);
    if (expectedPairs.size === 0) {
      return false;
    }
    if (expectedPairs.size !== givenPairs.size) {
      return false;
    }
    for (const [left, right] of expectedPairs) {
      if (givenPairs.get(left) !== right) {
        return false;
      }
    }
    return true;
  }

  private checkSentenceBuilder(
    question: QuizQuestion,
    selected: unknown,
  ): boolean {
    const expected = this.toTokens(question.correctAnswer);
    const given = this.toTokens(selected);
    if (expected.length !== given.length || expected.length === 0) {
      return false;
    }
    return expected.every((t, i) => t === given[i]);
  }

  private checkFindTheMistake(
    question: QuizQuestion,
    selected: unknown,
  ): boolean {
    return this.normalize(selected) === this.normalize(question.correctAnswer);
  }

  private toPairs(value: unknown): Map<string, string> {
    const pairs = new Map<string, string>();
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          pairs.set(this.normalize(rec.left), this.normalize(rec.right));
        }
      }
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        pairs.set(this.normalize(k), this.normalize(v));
      }
    }
    return pairs;
  }

  private toTokens(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((v) => this.normalize(v));
    }
    if (typeof value === 'string') {
      return value
        .trim()
        .split(/\s+/)
        .map((v) => this.normalize(v));
    }
    return [];
  }

  private setsEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length || a.length === 0) {
      return false;
    }
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  }

  private normalize(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }
}
