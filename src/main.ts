import './style.css';
import { GameInitializer } from './game/GameInitializer';

/**
 * Main entry point for the Math Game
 */
async function main(): Promise<void> {
  try {
    // Show loading state with Tailwind classes
    const appElement = document.querySelector<HTMLDivElement>('#app')!;
    appElement.className = 'w-screen h-screen flex items-center justify-center app-background';
    appElement.innerHTML = `
      <div class="flex items-center justify-center w-full h-full text-white text-center">
        <div class="flex flex-col items-center space-y-4 p-8">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <div class="text-xl md:text-2xl font-bold text-blue-200">Loading Math Game...</div>
        </div>
      </div>
    `;

    // Note: GameStyles.apply() removed - UIManager handles all styling now

    // Initialize and start the game
    const gameInitializer = new GameInitializer();
    await gameInitializer.initialize();

    // Remove loading screen after successful initialization
    appElement.remove();

  } catch (error) {
    console.error('Failed to start Math Game:', error);
    
    // Show error state with mobile-friendly styling
    const appElement = document.querySelector<HTMLDivElement>('#app')!;
    appElement.className = 'w-screen h-screen flex items-center justify-center app-background';
    appElement.innerHTML = `
      <div class="flex items-center justify-center w-full h-full p-4">
        <div class="bg-red-600 text-white p-6 md:p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
          <div class="text-6xl mb-4">⚠️</div>
          <h2 class="text-xl md:text-2xl font-bold mb-4">Failed to Load Game</h2>
          <p class="mb-2 text-sm md:text-base">An error occurred while loading the Math Game.</p>
          <p class="text-sm md:text-base mb-6">Please refresh the page to try again.</p>
          <button 
            onclick="window.location.reload()" 
            class="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 w-full md:w-auto"
          >
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}

// Start the game when the page loads
main();
