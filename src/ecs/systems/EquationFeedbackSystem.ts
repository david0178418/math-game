import { gameEngine } from '../Engine';
import { EQUATION_FEEDBACK_DURATION_MS, SYSTEM_PRIORITIES } from '../systemConfigs';
import type { BaseEquationModeState, EquationFeedback } from '../types';

const nextEquationModeForFeedback = (
  feedback: EquationFeedback,
  currentTime: number,
): BaseEquationModeState | undefined => {
  if (feedback.kind !== 'correct') return undefined;
  if (currentTime - feedback.startedAt < EQUATION_FEEDBACK_DURATION_MS.correct) return undefined;

  return feedback.nextMode;
};

export function addEquationFeedbackSystemToEngine(): void {
  gameEngine.addSystem('equationFeedbackSystem')
    .setPriority(SYSTEM_PRIORITIES.EQUATION_FEEDBACK)
    .inScreens(['playing'])
    .runWhenEmpty()
    .setProcess(({ ecs }) => {
      const equationMode = ecs.getResource('equationMode');
      const feedback = equationMode.feedback;
      if (!feedback) return;

      const nextMode = nextEquationModeForFeedback(feedback, performance.now());
      if (!nextMode) return;

      ecs.setResource('equationMode', nextMode);
    });
}
