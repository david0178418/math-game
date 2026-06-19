import { gameEngine } from '../Engine';
import { LEVEL_COMPLETE_DURATION_MS, SYSTEM_PRIORITIES } from '../systemConfigs';

export function addLevelCompleteSystemToEngine(): void {
  gameEngine.addSystem('levelCompleteSystem')
    .setPriority(SYSTEM_PRIORITIES.LEVEL_COMPLETE)
    .inScreens(['levelComplete'])
    .runWhenEmpty()
    .setProcess(({ ecs }) => {
      const state = ecs.getScreenState('levelComplete');
      const elapsed = performance.now() - state.startedAt;
      if (elapsed < LEVEL_COMPLETE_DURATION_MS || state.transitionStarted) return;

      ecs.updateScreenState('levelComplete', { transitionStarted: true });
      void ecs.setScreen('playing', {
        level: state.nextLevel,
        isFreshGame: false,
      });
    });
}
