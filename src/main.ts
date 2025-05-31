import './style.css';
import { GameInitializer } from './game/GameInitializer';

/**
 * Main entry point for the Math Game
 */
async function main(): Promise<void> {
  try {
    // Show loading state with Tailwind classes
    const appElement = document.querySelector<HTMLDivElement>('#app')!;
    appElement.innerHTML = `
      <div class="game-loading text-blue-400 font-bold">Loading Math Game...</div>
    `;

    // Note: GameStyles.apply() removed - UIManager handles all styling now

    // Initialize and start the game
    const gameInitializer = new GameInitializer();
    await gameInitializer.initialize();

    // Remove loading screen after successful initialization
    appElement.remove();

  } catch (error) {
    console.error('Failed to start Math Game:', error);
    
    // Show error state
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="game-error">
        <div class="bg-red-600 text-white p-8 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4">Failed to Load Game</h2>
          <p class="mb-2">An error occurred while loading the Math Game.</p>
          <p>Please refresh the page to try again.</p>
        </div>
      </div>
    `;
  }
}

// Start the game when the page loads
main();
