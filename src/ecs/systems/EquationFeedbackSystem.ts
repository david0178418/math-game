import { gameEngine } from '../Engine';
import { EQUATION_FEEDBACK_DURATION_MS, SYSTEM_PRIORITIES } from '../systemConfigs';
import type { EquationFeedback } from '../types';

const shouldAdvanceEquation = (
  feedback: EquationFeedback,
  currentTime: number,
): boolean =>
  feedback.kind === 'correct'
  && feedback.nextMode !== undefined
  && currentTime - feedback.startedAt >= EQUATION_FEEDBACK_DURATION_MS.correct;

export function addEquationFeedbackSystemToEngine(): void {
  gameEngine.addSystem('equationFeedbackSystem')
    .setPriority(SYSTEM_PRIORITIES.EQUATION_FEEDBACK)
    .inScreens(['playing'])
    .runWhenEmpty()
    .setProcess(({ ecs }) => {
      const equationMode = ecs.getResource('equationMode');
      const feedback = equationMode.feedback;
      if (!feedback) return;
      if (!shouldAdvanceEquation(feedback, performance.now())) return;
      if (!feedback.nextMode) return;

      ecs.setResource('equationMode', feedback.nextMode);
    });
}
