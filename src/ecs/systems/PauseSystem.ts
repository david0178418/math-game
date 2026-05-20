import { gameEngine } from '../Engine';

const pauseActions = {
  playing: () => { void gameEngine.pushScreen('paused', {}); },
  paused:  () => { void gameEngine.popScreen(); },
} as const;

const pauseScreens = Object.keys(pauseActions) as Array<keyof typeof pauseActions>;

const isPauseable = (screen: string | null): screen is keyof typeof pauseActions =>
  screen !== null && screen in pauseActions;

export function addPauseSystemToEngine(): void {
  gameEngine.addSystem('pauseSystem')
    .inScreens(pauseScreens)
    .withResources(['inputState', '$screen'])
    .setProcess(({ resources: { inputState, $screen } }) => {
      if (!inputState.actions.justActivated('pause')) return;
      if (isPauseable($screen.current)) pauseActions[$screen.current]();
    });
}
