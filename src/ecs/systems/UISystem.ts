import { gameEngine } from '../Engine';
import { uiManager } from '../../game/UIManager';

/**
 * UI System
 * Handles updating the user interface elements based on game state
 */

// Add the UI system to ECSpresso
export function addUISystemToEngine(): void {
  gameEngine.addSystem('uiSystem')
    .setPriority(50) // Lower priority, runs after game logic
    .addQuery('players', {
      with: ['player']
    })
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
 * Show game over screen
 */
function showGameOverScreen(): void {
  // Check if game over screen already exists to prevent duplicates
  if (document.getElementById('game-over')) {
    return;
  }

  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over';
    gameOverDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    const scoreResource = gameEngine.getResource('score');
    const finalScore = scoreResource ? scoreResource.value : 0;
    
    gameOverDiv.innerHTML = `
      <div style="
        background: rgba(0, 0, 0, 0.9);
        padding: 40px;
        border-radius: 20px;
        border: 3px solid #f44336;
        text-align: center;
        color: white;
        box-shadow: 0 0 30px rgba(244, 67, 54, 0.5);
      ">
        <h1 style="
          color: #f44336;
          font-size: 48px;
          margin: 0 0 20px 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        ">GAME OVER</h1>
        <p style="
          font-size: 24px;
          margin: 20px 0;
          color: #ddd;
        ">Final Score: <strong style="color: #4CAF50;">${finalScore}</strong></p>
        <button onclick="location.reload()" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          transition: background-color 0.2s ease;
        " onmouseover="this.style.backgroundColor='#45a049'" onmouseout="this.style.backgroundColor='#4CAF50'">Play Again</button>
      </div>
    `;
    
    gameContainer.appendChild(gameOverDiv);
    console.log('Game over screen created');
  }
} 