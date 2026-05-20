import { gameEngine } from '../Engine';
import { uiManager } from '../../game/UIManager';
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
    .setProcessEach(playerQuery, ({ entity }) => {
      const playerComp = entity.components.player;
      const level = getPlayerDifficultyLevel(entity);
      uiManager.updateGameplayUI(playerComp.score, playerComp.lives, level);
    });
}
