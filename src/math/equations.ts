import type {
  EquationModeState,
  EquationOperation,
  EquationPromptKind,
  EquationValueRange,
  GameMode,
} from '../ecs/types';

export interface EquationOperandCandidate {
  id: number;
  value: number;
}

export interface EquationCandidate {
  operandValues: number[];
  target: number;
}

interface EquationOperationDefinition {
  symbol: string;
  operandCount: 2;
  evaluate: (operands: readonly number[]) => number;
  resultRange: (range: EquationValueRange) => EquationValueRange;
  operandCandidates: (operands: readonly EquationOperandCandidate[]) => EquationCandidate[];
  resultCandidates: (
    answers: readonly EquationOperandCandidate[],
    range: EquationValueRange,
  ) => EquationCandidate[];
}

const addCandidates = (operands: readonly EquationOperandCandidate[]): EquationCandidate[] =>
  operands.flatMap((left, leftIndex) =>
    operands.slice(leftIndex + 1).map((right) => ({
      operandValues: [left.value, right.value],
      target: left.value + right.value,
    })),
  );

const addResultCandidates = (
  answers: readonly EquationOperandCandidate[],
  range: EquationValueRange,
): EquationCandidate[] =>
  answers.flatMap(answer =>
    Array.from({ length: range.max - range.min + 1 }, (_, index) => range.min + index)
      .filter(leftValue => answer.value - leftValue >= range.min && answer.value - leftValue <= range.max)
      .map(leftValue => ({
        operandValues: [leftValue, answer.value - leftValue],
        target: answer.value,
      })),
  );

const addResultRange = (range: EquationValueRange): EquationValueRange => ({
  min: range.min * 2,
  max: range.max * 2,
});

const operations: Record<EquationOperation, EquationOperationDefinition> = {
  add: {
    symbol: '+',
    operandCount: 2,
    evaluate: (operands) => operands.reduce((sum, operand) => sum + operand, 0),
    resultRange: addResultRange,
    operandCandidates: addCandidates,
    resultCandidates: addResultCandidates,
  },
} as const;

const randomIndex = (length: number): number => Math.floor(Math.random() * length);

export const equationValueRange = (level: number): EquationValueRange => {
  const min = 1 + (level - 1) * 2;
  return {
    min,
    max: level === 1 ? 5 : min + 5,
  };
};

export const randomEquationValue = (range: EquationValueRange): number =>
  range.min + Math.floor(Math.random() * (range.max - range.min + 1));

export const equationResultRange = (
  operation: EquationOperation,
  range: EquationValueRange,
): EquationValueRange =>
  operations[operation].resultRange(range);

export const equationPromptKindForMode = (gameMode: GameMode): EquationPromptKind =>
  gameMode === 'equationResults' ? 'selectResult' : 'selectOperands';

export const createEquationModeState = (
  level: number,
  promptKind: EquationPromptKind = 'selectOperands',
): EquationModeState => ({
  operation: 'add',
  promptKind,
  operandsRequired: promptKind === 'selectResult' ? 1 : operations.add.operandCount,
  target: 0,
  promptValues: [],
  selectedProblemIds: [],
  clearedThisLevel: 0,
  level,
  valueRange: equationValueRange(level),
});

export const chooseEquationCandidate = (
  state: EquationModeState,
  operands: readonly EquationOperandCandidate[],
): EquationCandidate | undefined => {
  const operation = operations[state.operation];
  const candidates = state.promptKind === 'selectResult'
    ? operation.resultCandidates(operands, state.valueRange)
    : operation.operandCandidates(operands);
  return candidates[randomIndex(candidates.length)];
};

export const equationSelectionText = (
  state: EquationModeState,
  selectedValues: readonly number[],
): string => {
  const operation = operations[state.operation];
  if (state.promptKind === 'selectResult') {
    const result = selectedValues[0]?.toString() ?? '_';
    return `${state.promptValues.join(` ${operation.symbol} `)} = ${result}`;
  }

  const blanks = Array.from({ length: state.operandsRequired }, (_, index) =>
    selectedValues[index]?.toString() ?? '_',
  );
  return `${blanks.join(` ${operation.symbol} `)} = ${state.target}`;
};

export const evaluateEquationSelection = (
  state: EquationModeState,
  selectedValues: readonly number[],
): boolean =>
  selectedValues.length === state.operandsRequired
    && (state.promptKind === 'selectResult'
      ? selectedValues[0] === state.target
      : operations[state.operation].evaluate(selectedValues) === state.target);
