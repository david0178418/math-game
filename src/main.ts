import './style.css';
import { GameInitializer } from './game/GameInitializer';
import { GameStyles } from './game/GameStyles';

/**
 * Main entry point for the Math Game
 */
async function main(): Promise<void> {
  try {
    // Show loading state
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="game-loading">Loading Math Game...</div>
    `;

    // Apply game styles
    GameStyles.apply();

    // Initialize and start the game
    const gameInitializer = new GameInitializer();
    await gameInitializer.initialize();

  } catch (error) {
    console.error('Failed to start Math Game:', error);
    
    // Show error state
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="game-error">
        <div>
          <h2>Failed to Load Game</h2>
          <p>An error occurred while loading the Math Game.</p>
          <p>Please refresh the page to try again.</p>
        </div>
      </div>
    `;
  }
}

// Start the game when the page loads
main();
