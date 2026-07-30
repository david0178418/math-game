import type { GameSystemRegistrar } from '../Engine';
import { gameplayLevelLabel, updateGameplayUI } from '../../ui/UIManager';
import { playerQuery } from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { tutorialHudLabel } from '../../onboarding/gameplayOnboarding';

/**
 * UI System
 * Updates HUD from player state. Gated to the 'playing' screen.
 */

export function addUISystemToEngine(systems: GameSystemRegistrar): void {
  systems.addSystem('uiSystem')
    .setPriority(SYSTEM_PRIORITIES.UI)
    .addSingleton('player', playerQuery)
    .withResources([
      'gameMode',
      'mathDifficulty',
      'currentLevel',
      'gameplayTimeSeconds',
      'gameplayOnboardingSession',
    ])
    .setProcess(({ queries, resources }) => {
      const player = queries.player;
      if (!player) return;

      const {
        gameMode,
        mathDifficulty,
        currentLevel,
        gameplayTimeSeconds,
        gameplayOnboardingSession,
      } = resources;
      const playerComp = player.components.player;
      const level = tutorialHudLabel(gameplayOnboardingSession)
        ?? gameplayLevelLabel(gameMode, mathDifficulty, currentLevel);

      updateGameplayUI(gameplayTimeSeconds, playerComp.lives, level);
    });
}
