import { gameEngine } from '../Engine';

// While playing, the pause action pushes the paused screen. Resuming from
// pause is handled by the UI navigation system as a "cancel" on the paused
// UI screen so the same key/button drives back/cancel uniformly.
export function addPauseSystemToEngine(): void {
  gameEngine.addSystem('pauseSystem')
    .inScreens(['playing'])
    .withResources(['inputState'])
    .setProcess(({ resources: { inputState } }) => {
      if (!inputState.actions.justActivated('pause')) return;
      void gameEngine.pushScreen('paused', {});
    });
}
