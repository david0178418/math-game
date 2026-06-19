import { equationSelectionText } from '../../../math/equations';
import {
  ANSWER_CONSUMPTION_DURATION_MS,
  CORRECT_ANSWER_HOLD_DURATION_MS,
  EQUATION_FEEDBACK_DURATION_MS,
} from '../../systemConfigs';
import type { MathProblemEntity } from '../../queries';
import type { EquationFeedbackKind, EquationFeedback, EquationModeState } from '../../types';

const textColor = '#fff7c6';
const shadowColor = 'rgba(9, 41, 44, 0.9)';

export type EquationValueTarget = {
  x: number;
  y: number;
};

type LocatedEquationValue = {
  id: number;
  start: number;
  end: number;
  target: EquationValueTarget;
};

type SelectedEquationLayout = {
  text: string;
  values: LocatedEquationValue[];
};
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

function objectiveFontSize(margin: number): number {
  return Math.max(20, Math.min(30, margin * 0.42));
}

function selectedEquationLayout(
  ctx: CanvasRenderingContext2D,
  equationMode: EquationModeState,
  mathProblems: readonly MathProblemEntity[],
  margin: number,
): SelectedEquationLayout {
  const selectedProblems = equationMode.selectedProblemIds.flatMap(id => {
    const problem = mathProblems.find(candidate => candidate.id === id);
    return problem ? [problem] : [];
  });
  const selectedValues = selectedProblems.map(problem => problem.components.mathProblem.value);
  const text = equationSelectionText(equationMode, selectedValues);
  const resultSearchStart = text.lastIndexOf('=') + 1;

  ctx.save();
  ctx.font = `bold ${objectiveFontSize(margin)}px Arial`;
  const textLeft = ctx.canvas.width / 2 - ctx.measureText(text).width / 2;
  const initialCursor = equationMode.promptKind === 'selectResult' ? resultSearchStart : 0;
  const located = selectedProblems.reduce<{
    cursor: number;
    values: LocatedEquationValue[];
  }>((state, problem) => {
    const valueText = problem.components.mathProblem.value.toString();
    const valueStart = text.indexOf(valueText, state.cursor);
    if (valueStart < 0) return state;

    const valueEnd = valueStart + valueText.length;
    const x = textLeft
      + ctx.measureText(text.slice(0, valueStart)).width
      + ctx.measureText(valueText).width / 2;
    return {
      cursor: valueEnd,
      values: [
        ...state.values,
        {
          id: problem.id,
          start: valueStart,
          end: valueEnd,
          target: { x, y: margin * 0.48 },
        },
      ],
    };
  }, { cursor: initialCursor, values: [] });
  ctx.restore();

  return { text, values: located.values };
}

const activeFeedback = (
  feedback: EquationFeedback | undefined,
  currentTime: number,
): { feedback: EquationFeedback; elapsed: number; progress: number } | undefined => {
  if (!feedback) return undefined;

  const elapsed = currentTime - feedback.startedAt;
  const feedbackDurationMs = EQUATION_FEEDBACK_DURATION_MS[feedback.kind];
  if (elapsed >= feedbackDurationMs) return undefined;

  return {
    feedback,
    elapsed,
    progress: Math.max(0, elapsed / feedbackDurationMs),
  };
};

function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
): void {
  ctx.strokeText(text, x, 0);
  ctx.fillText(text, x, 0);
}

function drawEquationAwaitingValues(
  ctx: CanvasRenderingContext2D,
  layout: SelectedEquationLayout,
): void {
  const textLeft = -ctx.measureText(layout.text).width / 2;
  const segments = layout.values.reduce<{
    cursor: number;
    items: Array<{ text: string; x: number }>;
  }>((state, value) => ({
    cursor: value.end,
    items: [
      ...state.items,
      {
        text: layout.text.slice(state.cursor, value.start),
        x: textLeft + ctx.measureText(layout.text.slice(0, state.cursor)).width,
      },
      {
        text: '_',
        x: value.target.x - ctx.canvas.width / 2 - ctx.measureText('_').width / 2,
      },
    ],
  }), { cursor: 0, items: [] });
  const trailingText = layout.text.slice(segments.cursor);
  const trailingX = textLeft + ctx.measureText(layout.text.slice(0, segments.cursor)).width;

  ctx.textAlign = 'left';
  [...segments.items, { text: trailingText, x: trailingX }]
    .filter(item => item.text.length > 0)
    .forEach(item => drawOutlinedText(ctx, item.text, item.x));
}

export const drawBoardObjective = (
  ctx: CanvasRenderingContext2D,
  equationMode: EquationModeState,
  mathProblems: readonly MathProblemEntity[],
  margin: number,
  currentTime = performance.now(),
): ReadonlyMap<number, EquationValueTarget> => {
  const feedbackState = activeFeedback(equationMode.feedback, currentTime);
  const awaitingAnimatedValues = feedbackState?.feedback.kind === 'correct'
    && feedbackState.elapsed < ANSWER_CONSUMPTION_DURATION_MS;
  const selectedLayout = awaitingAnimatedValues
    ? selectedEquationLayout(ctx, equationMode, mathProblems, margin)
    : undefined;
  const answerTargets = new Map(
    selectedLayout?.values.map(value => [value.id, value.target] as const) ?? [],
  );
  const text = feedbackState?.feedback.displayText ?? objectiveTextForMode(equationMode, mathProblems);
  const normalizedText = text.trim();
  if (normalizedText.length === 0) return answerTargets;

  const fontSize = objectiveFontSize(margin);
  const progress = feedbackState?.progress ?? 1;
  const feedbackStyle = feedbackState ? feedbackStyles[feedbackState.feedback.kind] : undefined;
  const fade = 1 - progress;
  const holdProgress = feedbackState?.feedback.kind === 'correct'
    ? Math.max(0, (feedbackState.elapsed - ANSWER_CONSUMPTION_DURATION_MS) / CORRECT_ANSWER_HOLD_DURATION_MS)
    : progress;
  const pulse = Math.sin(holdProgress * Math.PI);
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
  if (awaitingAnimatedValues && selectedLayout) {
    drawEquationAwaitingValues(ctx, selectedLayout);
  } else {
    drawOutlinedText(ctx, normalizedText, 0);
  }
  ctx.restore();
  return answerTargets;
};
