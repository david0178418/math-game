import { gameEngine } from '../Engine';
import { updateGameplayUI } from '../../ui/UIManager';
import { mathProblemQuery, playerQuery, type MathProblemEntity } from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { getPlayerDifficultyLevel } from '../gameUtils';
import { equationSelectionText } from '../../math/equations';
import type { GameMode } from '../types';

/**
 * UI System
 * Updates HUD from player state. Gated to the 'playing' screen.
 */

export function addUISystemToEngine(): void {
  gameEngine.addSystem('uiSystem')
    .setPriority(SYSTEM_PRIORITIES.UI)
    .addSingleton('player', playerQuery)
    .addQuery('mathProblems', mathProblemQuery)
    .setProcess(({ queries }) => {
      const player = queries.player;
      if (!player) return;

      const playerComp = player.components.player;
      const gameMode = gameEngine.getResource('gameMode');
      const currentLevel = gameEngine.getResource('currentLevel');
      const level = gameMode === 'equations'
        ? currentLevel.toString()
        : getPlayerDifficultyLevel(player);

      updateGameplayUI(playerComp.score, playerComp.lives, level, objectiveForMode(gameMode, queries.mathProblems));
    });
}

const objectiveForMode = (
  gameMode: GameMode,
  mathProblems: readonly MathProblemEntity[],
): { full: string; inline: string } => {
  if (gameMode === 'multiples') {
    const currentLevel = gameEngine.getResource('currentLevel');
    return {
      full: `Find multiples of ${currentLevel}!`,
      inline: `Multiples of ${currentLevel}`,
    };
  }

  const equationMode = gameEngine.getResource('equationMode');
  const selectedValues = equationMode.selectedProblemIds.flatMap((id) => {
    const problem = mathProblems.find(candidate => candidate.id === id);
    return problem ? [problem.components.mathProblem.value] : [];
  });
  const text = equationMode.target === 0
    ? 'Preparing equation'
    : equationSelectionText(equationMode, selectedValues);

  return {
    full: text,
    inline: text,
  };
};
