import { equationSelectionText } from '../../../math/equations';
import { EQUATION_FEEDBACK_DURATION_MS } from '../../systemConfigs';
import type { MathProblemEntity } from '../../queries';
import type { EquationFeedbackKind, EquationFeedback, EquationModeState } from '../../types';

const textColor = '#fff7c6';
const shadowColor = 'rgba(9, 41, 44, 0.9)';
const feedbackStyles: Record<EquationFeedbackKind, {
  color: string;
  shadowColor: string;
  glowColor: string;
  shakeStrength: number;
}> = {
  correct: {
    color: '#b7ff88',
    shadowColor: 'rgba(25, 84, 26, 0.95)',
    glowColor: 'rgba(140, 255, 92, 0.32)',
    shakeStrength: 0,
  },
  incorrect: {
    color: '#ff9c8f',
    shadowColor: 'rgba(100, 25, 18, 0.95)',
    glowColor: 'rgba(255, 82, 82, 0.26)',
    shakeStrength: 14,
  },
} as const;

const objectiveTextForMode = (
  equationMode: EquationModeState,
  mathProblems: readonly MathProblemEntity[],
): string => {
  const selectedValues = equationMode.selectedProblemIds.flatMap((id) => {
    const problem = mathProblems.find(candidate => candidate.id === id);
    return problem ? [problem.components.mathProblem.value] : [];
  });

  return equationMode.target === 0
    ? 'Preparing equation'
    : equationSelectionText(equationMode, selectedValues);
};

const activeFeedback = (
  feedback: EquationFeedback | undefined,
  currentTime: number,
): { feedback: EquationFeedback; progress: number } | undefined => {
  if (!feedback) return undefined;

  const elapsed = currentTime - feedback.startedAt;
  const feedbackDurationMs = EQUATION_FEEDBACK_DURATION_MS[feedback.kind];
  if (elapsed >= feedbackDurationMs) return undefined;

  return {
    feedback,
    progress: Math.max(0, elapsed / feedbackDurationMs),
  };
};

export const drawBoardObjective = (
  ctx: CanvasRenderingContext2D,
  equationMode: EquationModeState,
  mathProblems: readonly MathProblemEntity[],
  margin: number,
  currentTime = performance.now(),
): void => {
  const feedbackState = activeFeedback(equationMode.feedback, currentTime);
  const text = feedbackState?.feedback.displayText ?? objectiveTextForMode(equationMode, mathProblems);
  const normalizedText = text.trim();
  if (normalizedText.length === 0) return;

  const fontSize = Math.max(20, Math.min(30, margin * 0.42));
  const progress = feedbackState?.progress ?? 1;
  const feedbackStyle = feedbackState ? feedbackStyles[feedbackState.feedback.kind] : undefined;
  const fade = 1 - progress;
  const pulse = Math.sin(progress * Math.PI);
  const xOffset = feedbackStyle ? Math.sin(progress * Math.PI * 12) * feedbackStyle.shakeStrength * fade : 0;
  const scale = feedbackStyle ? 1 + pulse * 0.13 : 1;
  const x = ctx.canvas.width / 2 + xOffset;
  const y = margin * 0.48;

  ctx.save();
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (feedbackStyle) {
    ctx.shadowColor = feedbackStyle.glowColor;
    ctx.shadowBlur = 32 * fade;
  }

  ctx.strokeStyle = feedbackStyle?.shadowColor ?? shadowColor;
  ctx.fillStyle = feedbackStyle?.color ?? textColor;
  ctx.strokeText(normalizedText, 0, 0);
  ctx.fillText(normalizedText, 0, 0);
  ctx.restore();
};
