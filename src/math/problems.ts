import { MATH_GENERATION } from '../config';

export interface ProblemOption {
  value: number;
  isCorrect: boolean;
}

const shuffle = <T>(array: readonly T[]): T[] => {
  const result = [...array];
  Array.from({ length: result.length - 1 }, (_, k) => result.length - 1 - k)
    .forEach((i) => {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    });
  return result;
};

export const generateMultiplesProblems = (
  multipleOf: number,
  totalProblemsNeeded: number,
): ProblemOption[] => {
  const correct: ProblemOption[] = Array.from(
    { length: MATH_GENERATION.MAX_MULTIPLICATION_FACTOR },
    (_, i) => ({ value: multipleOf * (i + 1), isCorrect: true }),
  );

  const correctValues = new Set(correct.map((p) => p.value));
  const incorrectNeeded = totalProblemsNeeded - correct.length;
  const incorrectValues = new Set<number>();

  while (incorrectValues.size < incorrectNeeded) {
    const range = MATH_GENERATION.MAX_RANDOM_VALUE - MATH_GENERATION.MIN_RANDOM_VALUE + 1;
    const candidate = Math.floor(Math.random() * range) + MATH_GENERATION.MIN_RANDOM_VALUE;
    if (!correctValues.has(candidate) && candidate % multipleOf !== 0) {
      incorrectValues.add(candidate);
    }
  }

  const incorrect: ProblemOption[] = [...incorrectValues].map((value) => ({
    value,
    isCorrect: false,
  }));

  return shuffle([...correct, ...incorrect]);
};
