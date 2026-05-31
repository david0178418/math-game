import { gameEngine } from '../Engine';
import { updateGameplayUI } from '../../ui/UIManager';
import { playerQuery } from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { getPlayerDifficultyLevel } from '../gameUtils';

/**
 * UI System
 * Updates HUD from player state. Gated to the 'playing' screen.
 */

export function addUISystemToEngine(): void {
  gameEngine.addSystem('uiSystem')
    .setPriority(SYSTEM_PRIORITIES.UI)
    .addSingleton('player', playerQuery)
    .setProcess(({ queries }) => {
      const player = queries.player;
      if (!player) return;

      const playerComp = player.components.player;
      const gameMode = gameEngine.getResource('gameMode');
      const currentLevel = gameEngine.getResource('currentLevel');
      const level = gameMode === 'equations'
        ? currentLevel.toString()
        : getPlayerDifficultyLevel(player);

      updateGameplayUI(playerComp.score, playerComp.lives, level);
    });
}
