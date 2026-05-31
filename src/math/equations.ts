import type { EquationModeState, EquationOperation, EquationValueRange } from '../ecs/types';

export interface EquationOperandCandidate {
  id: number;
  value: number;
}

export interface EquationCandidate {
  operandIds: number[];
  operandValues: number[];
  target: number;
}

interface EquationOperationDefinition {
  symbol: string;
  operandCount: 2;
  evaluate: (operands: readonly number[]) => number;
  candidates: (operands: readonly EquationOperandCandidate[]) => EquationCandidate[];
}

const addCandidates = (operands: readonly EquationOperandCandidate[]): EquationCandidate[] =>
  operands.flatMap((left, leftIndex) =>
    operands.slice(leftIndex + 1).map((right) => ({
      operandIds: [left.id, right.id],
      operandValues: [left.value, right.value],
      target: left.value + right.value,
    })),
  );

const operations: Record<EquationOperation, EquationOperationDefinition> = {
  add: {
    symbol: '+',
    operandCount: 2,
    evaluate: (operands) => operands.reduce((sum, operand) => sum + operand, 0),
    candidates: addCandidates,
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

export const createEquationModeState = (level: number): EquationModeState => ({
  operation: 'add',
  operandsRequired: operations.add.operandCount,
  target: 0,
  selectedProblemIds: [],
  clearedThisLevel: 0,
  level,
  valueRange: equationValueRange(level),
});

export const chooseEquationCandidate = (
  operation: EquationOperation,
  operands: readonly EquationOperandCandidate[],
): EquationCandidate | undefined => {
  const candidates = operations[operation].candidates(operands);
  return candidates[randomIndex(candidates.length)];
};

export const equationSelectionText = (
  state: EquationModeState,
  selectedValues: readonly number[],
): string => {
  const operation = operations[state.operation];
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
    && operations[state.operation].evaluate(selectedValues) === state.target;
