import { gameEngine } from '../Engine';
import { uiManager } from '../../game/UIManager';
import { createQueryDefinition, type QueryResultEntity } from 'ecspresso';
import type { Components } from '../Engine';

/**
 * UI System
 * Handles updating the user interface elements based on game state
 */

// Create reusable query definitions
const playerQuery = createQueryDefinition({
  with: ['player', 'position']
});

const mathProblemQuery = createQueryDefinition({
  with: ['position', 'mathProblem']
});

// Extract entity types using ECSpresso utilities
type PlayerEntity = QueryResultEntity<Components, typeof playerQuery>;
type MathProblemEntity = QueryResultEntity<Components, typeof mathProblemQuery>;

// Add the UI system to ECSpresso
export function addUISystemToEngine(): void {
  gameEngine.addSystem('uiSystem')
    .setPriority(50) // Lower priority, runs after game logic
    .addQuery('players', playerQuery)
    .addQuery('mathProblems', mathProblemQuery)
    .setProcess((queries) => {
      const gameState = gameEngine.getResource('gameState');
      
      // Only update gameplay UI when in playing state
      if (gameState === 'playing') {
        // Update UI based on player state
        for (const player of queries.players) {
          const playerComp = player.components.player;
          
          // Update the new UI manager's gameplay UI
          const level = playerComp.score < 50 ? 'Easy' : 
                       playerComp.score < 200 ? 'Medium' : 'Hard';
          uiManager.updateGameplayUI(playerComp.score, playerComp.lives, level);
          
          // Check if player is on a consumable math problem
          const canEat = checkIfPlayerCanEat(player, queries.mathProblems);
          updateEatIndicator(canEat);
          
          // Also update legacy elements if they exist (for backwards compatibility)
          updateScoreDisplay(playerComp.score);
          updateLivesDisplay(playerComp.lives);
        }
      }
      
      // Check for game over state transition
      if (gameState === 'gameOver' && uiManager.getCurrentScreen() !== 'gameOver') {
        // Get final score for game over screen
        const scoreResource = gameEngine.getResource('score');
        const finalScore = scoreResource ? scoreResource.value : 0;
        
        // Update final score in game over screen
        setTimeout(() => {
          const finalScoreElement = document.getElementById('final-score');
          if (finalScoreElement) {
            finalScoreElement.textContent = `Final Score: ${finalScore}`;
          }
        }, 100);
        
        uiManager.showScreen('gameOver');
      }
    })
    .build();
}

/**
 * Update the score display in the UI
 */
function updateScoreDisplay(score: number): void {
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = `Score: ${score}`;
  }
}

/**
 * Update the lives display in the UI
 */
function updateLivesDisplay(lives: number): void {
  const livesElement = document.getElementById('lives');
  if (livesElement) {
    livesElement.textContent = `Lives: ${lives}`;
  } else {
    // Create lives display if it doesn't exist
    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
      const livesDiv = document.createElement('div');
      livesDiv.id = 'lives';
      livesDiv.textContent = `Lives: ${lives}`;
      livesDiv.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: #f44336;
        margin-top: 10px;
        padding: 8px;
        background: rgba(244, 67, 54, 0.1);
        border-radius: 6px;
        border: 1px solid #f44336;
        text-align: center;
      `;
      gameUI.appendChild(livesDiv);
    }
  }
}

/**
 * Check if player is positioned on a math problem that can be consumed
 */
function checkIfPlayerCanEat(player: PlayerEntity, mathProblems: MathProblemEntity[]): boolean {
  const playerPos = player.components.position;
  
  for (const problem of mathProblems) {
    const problemPos = problem.components.position;
    const mathProblemComp = problem.components.mathProblem;
    
    // Skip consumed problems
    if (mathProblemComp.consumed) continue;
    
    // Check if player is on the same grid position as a math problem
    const sameX = Math.abs(playerPos.x - problemPos.x) < 10; // Small tolerance
    const sameY = Math.abs(playerPos.y - problemPos.y) < 10;
    
    if (sameX && sameY) {
      return true;
    }
  }
  
  return false;
}

/**
 * Update the eat indicator in the bottom HUD
 */
function updateEatIndicator(canEat: boolean): void {
  const bottomHud = document.getElementById('bottom-hud');
  if (!bottomHud) return;
  
  let eatIndicator = document.getElementById('eat-indicator');
  
  if (canEat) {
    if (!eatIndicator) {
      eatIndicator = document.createElement('div');
      eatIndicator.id = 'eat-indicator';
      eatIndicator.style.cssText = `
        color: #FFD700;
        font-weight: bold;
        font-size: 1.1rem;
        animation: pulse 1s infinite;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
      `;
      bottomHud.appendChild(eatIndicator);
      
      // Add pulse animation if not already added
      if (!document.getElementById('eat-indicator-style')) {
        const style = document.createElement('style');
        style.id = 'eat-indicator-style';
        style.textContent = `
          @keyframes pulse {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
        `;
        document.head.appendChild(style);
      }
    }
    eatIndicator.textContent = '✨ Press SPACE to eat! ✨';
  } else {
    if (eatIndicator) {
      eatIndicator.remove();
    }
  }
} 