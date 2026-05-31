import { gameEngine } from '../../Engine';
import { equationSelectionText } from '../../../math/equations';
import type { GameMode } from '../../types';
import type { MathProblemEntity } from '../../queries';

const textColor = '#fff7c6';
const shadowColor = 'rgba(9, 41, 44, 0.9)';

const objectiveTextForMode = (
  _gameMode: GameMode,
  mathProblems: readonly MathProblemEntity[],
): string => {
  const equationMode = gameEngine.getResource('equationMode');
  const selectedValues = equationMode.selectedProblemIds.flatMap((id) => {
    const problem = mathProblems.find(candidate => candidate.id === id);
    return problem ? [problem.components.mathProblem.value] : [];
  });

  return equationMode.target === 0
    ? 'Preparing equation'
    : equationSelectionText(equationMode, selectedValues);
};

export const drawBoardObjective = (
  ctx: CanvasRenderingContext2D,
  gameMode: GameMode,
  mathProblems: readonly MathProblemEntity[],
  margin: number,
): void => {
  const text = objectiveTextForMode(gameMode, mathProblems);
  const normalizedText = text.trim();
  if (normalizedText.length === 0) return;

  const fontSize = Math.max(20, Math.min(30, margin * 0.42));

  ctx.save();
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = shadowColor;
  ctx.fillStyle = textColor;
  ctx.strokeText(normalizedText, ctx.canvas.width / 2, margin * 0.48);
  ctx.fillText(normalizedText, ctx.canvas.width / 2, margin * 0.48);
  ctx.restore();
};
