import { gameEngine } from '../ecs/Engine';

/**
 * UI Manager
 * Handles all game UI screens and transitions
 */

export type GameScreen = 'menu' | 'modeSelect' | 'playing' | 'settings' | 'gameOver' | 'paused';

export class UIManager {
  private currentScreen: GameScreen = 'menu';
  private screenElements: Map<GameScreen, HTMLElement> = new Map();
  private gameContainer: HTMLElement | null = null;
  
  constructor() {
    this.setupContainer();
    this.setupEventListeners();
  }
  
  /**
   * Initialize the main game container
   */
  private setupContainer(): void {
    this.gameContainer = document.getElementById('game-container');
    if (!this.gameContainer) {
      this.gameContainer = document.createElement('div');
      this.gameContainer.id = 'game-container';
      this.gameContainer.className = 'w-screen h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans app-background';
      document.body.appendChild(this.gameContainer);
    }
  }
  
  /**
   * Set up global event listeners
   */
  private setupEventListeners(): void {
    // Keyboard shortcuts for UI navigation
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'Escape':
          if (this.currentScreen === 'playing') {
            this.showScreen('paused');
          } else if (this.currentScreen === 'paused') {
            this.showScreen('playing');
          }
          break;
        case 'F1':
          event.preventDefault();
          this.showScreen('settings');
          break;
      }
    });
    
    // Responsive design
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }
  
  /**
   * Show a specific screen
   */
  showScreen(screen: GameScreen): void {
    // Hide current screen
    if (this.screenElements.has(this.currentScreen)) {
      const currentElement = this.screenElements.get(this.currentScreen)!;
      currentElement.style.display = 'none';
    }
    
    // Show new screen
    if (!this.screenElements.has(screen)) {
      this.createScreen(screen);
    }
    
    const screenElement = this.screenElements.get(screen)!;
    screenElement.style.display = 'flex';
    this.currentScreen = screen;
    
    // Update game state
    this.updateGameState(screen);
    
    console.log(`UI: Switched to ${screen} screen`);
  }
  
  /**
   * Create a specific screen
   */
  private createScreen(screen: GameScreen): void {
    switch (screen) {
      case 'menu':
        this.createMainMenu();
        break;
      case 'modeSelect':
        this.createModeSelectScreen();
        break;
      case 'playing':
        this.createGameplayUI();
        break;
      case 'settings':
        this.createSettingsScreen();
        break;
      case 'gameOver':
        this.createGameOverScreen();
        break;
      case 'paused':
        this.createPauseScreen();
        break;
    }
  }
  
  /**
   * Create main menu screen
   */
  private createMainMenu(): void {
    const menuScreen = document.createElement('div');
    menuScreen.id = 'main-menu';
    menuScreen.className = 'absolute inset-0 flex flex-col items-center justify-center app-background text-white z-50';
    
    menuScreen.innerHTML = `
      <div class="text-center max-w-sm md:max-w-2xl px-6 md:px-10 py-8 md:py-16">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-gold drop-shadow-lg">
          Math Munchers
        </h1>
        
        <p class="text-base md:text-xl mb-8 md:mb-12 opacity-90 leading-relaxed px-4">
          Navigate the grid and collect correct answers while avoiding enemies!
        </p>
        
        <div class="flex flex-col gap-4 md:gap-6 items-center">
          <button id="start-game-btn" class="btn-success text-white border-none px-8 md:px-12 py-4 md:py-5 text-lg md:text-xl font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full md:w-auto min-w-48 md:min-w-56 btn-mobile">
            🎮 Start Game
          </button>
          
          <button id="settings-btn" class="btn-primary text-white border-none px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full md:w-auto min-w-48 md:min-w-56 btn-mobile">
            ⚙️ Settings
          </button>
          
          <button id="high-scores-btn" class="btn-warning text-white border-none px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full md:w-auto min-w-48 md:min-w-56 btn-mobile">
            🏆 High Scores
          </button>
        </div>
        
        <div class="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/30">
          <div class="text-xs md:text-sm opacity-70 space-y-1">
            <p>🎯 Controls: Use WASD or Arrow Keys to move</p>
            <p>⏸️ ESC to pause • ⚙️ F1 for settings</p>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    const startBtn = menuScreen.querySelector('#start-game-btn') as HTMLButtonElement;
    const settingsBtn = menuScreen.querySelector('#settings-btn') as HTMLButtonElement;
    const highScoresBtn = menuScreen.querySelector('#high-scores-btn') as HTMLButtonElement;
    
    startBtn.addEventListener('click', () => this.showScreen('modeSelect'));
    settingsBtn.addEventListener('click', () => this.showScreen('settings'));
    highScoresBtn.addEventListener('click', () => this.showHighScores());
    
    this.gameContainer!.appendChild(menuScreen);
    this.screenElements.set('menu', menuScreen);
  }
  
  /**
   * Create mode selection screen
   */
  private createModeSelectScreen(): void {
    const modeSelectScreen = document.createElement('div');
    modeSelectScreen.id = 'mode-select-screen';
    modeSelectScreen.className = 'absolute inset-0 flex flex-col items-center justify-center app-background text-white z-50';
    
    modeSelectScreen.innerHTML = `
      <div class="text-center max-w-sm md:max-w-3xl px-4 md:px-8 py-6 md:py-12">
        <h1 class="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gold drop-shadow-lg">
          Select Game Mode
        </h1>
        
        <p class="text-base md:text-xl mb-8 md:mb-12 opacity-90 leading-relaxed px-2">
          Choose a math challenge to begin your adventure!
        </p>
        
        <div class="flex flex-col gap-4 md:gap-6 items-center">
          <div id="multiples-mode" class="mode-card text-white border-none p-4 md:p-6 rounded-xl shadow-lg cursor-pointer w-full max-w-md md:max-w-lg text-left">
            <h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3">🔢 Multiples</h3>
            <p class="text-sm md:text-base opacity-90 mb-2 md:mb-3">
              Find all multiples of the given number! Start with multiples of 2 and work your way up.
            </p>
            <div class="text-xs md:text-sm opacity-70">
              Example: For multiples of 2, eat 2, 4, 6, 8, 10, 12...
            </div>
          </div>
          
          <div id="factors-mode" class="mode-card disabled text-white border-none p-4 md:p-6 rounded-xl shadow-lg w-full max-w-md md:max-w-lg text-left">
            <h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3">🧮 Factors (Coming Soon)</h3>
            <p class="text-sm md:text-base opacity-90 mb-2 md:mb-3">
              Find all factors of the given number! This mode will be available in a future update.
            </p>
            <div class="text-xs md:text-sm opacity-70">
              Example: For factors of 12, eat 1, 2, 3, 4, 6, 12...
            </div>
          </div>
          
          <div id="prime-mode" class="mode-card disabled text-white border-none p-4 md:p-6 rounded-xl shadow-lg w-full max-w-md md:max-w-lg text-left">
            <h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3">🔑 Prime Numbers (Coming Soon)</h3>
            <p class="text-sm md:text-base opacity-90 mb-2 md:mb-3">
              Find all prime numbers! Only eat numbers that have exactly two factors.
            </p>
            <div class="text-xs md:text-sm opacity-70">
              Example: Eat 2, 3, 5, 7, 11, 13...
            </div>
          </div>
        </div>
        
        <button id="back-to-main-btn" class="btn-secondary text-white border-none px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl mt-6 md:mt-8 btn-mobile">
          ← Back to Menu
        </button>
      </div>
    `;
    
    // Add event listeners
    const multiplesMode = modeSelectScreen.querySelector('#multiples-mode') as HTMLElement;
    const backBtn = modeSelectScreen.querySelector('#back-to-main-btn') as HTMLButtonElement;
    
    multiplesMode.addEventListener('click', () => this.startGame('multiples'));
    backBtn.addEventListener('click', () => this.showScreen('menu'));
    
    this.gameContainer!.appendChild(modeSelectScreen);
    this.screenElements.set('modeSelect', modeSelectScreen);
  }
  
  /**
   * Create gameplay UI (HUD)
   */
  private createGameplayUI(): void {
    const gameplayScreen = document.createElement('div');
    gameplayScreen.id = 'gameplay-ui';
    gameplayScreen.className = 'absolute inset-0 flex flex-col pointer-events-none z-10';
    
    gameplayScreen.innerHTML = `
      <!-- Top HUD -->
      <div id="top-hud" class="hud-top absolute top-0 inset-x-0 p-3 md:p-4 lg:p-5 flex flex-wrap justify-between items-center text-white font-bold pointer-events-auto gap-2 md:gap-4">
        <div class="flex flex-wrap gap-2 md:gap-4 lg:gap-6 items-center">
          <div id="score-display" class="text-sm md:text-base lg:text-lg bg-green-600/90 px-3 md:px-4 py-2 rounded-lg shadow-md whitespace-nowrap">
            Score: 0
          </div>
          
          <div id="lives-display" class="text-sm md:text-base lg:text-lg bg-red-600/90 px-3 md:px-4 py-2 rounded-lg shadow-md whitespace-nowrap">
            Lives: 3
          </div>
          
          <div id="level-display" class="text-xs md:text-sm lg:text-base bg-blue-600/90 px-2 md:px-3 py-1 md:py-2 rounded-lg shadow-md whitespace-nowrap">
            Level: Easy
          </div>
        </div>
        
        <div class="flex gap-2 md:gap-3 items-center">
          <button id="pause-btn" class="bg-gray-600/90 text-white border-none px-3 md:px-4 py-2 rounded-md cursor-pointer text-sm md:text-base transition-colors duration-200 hover:bg-gray-600 min-h-10 min-w-10 flex items-center justify-center">
            ⏸️
          </button>
        </div>
      </div>
      
      <!-- Objective Display - Above Game Area -->
      <div id="objective-section" class="absolute top-16 md:top-20 lg:top-24 inset-x-0 flex justify-center items-center px-4 pointer-events-none z-20">
        <div id="objective-display" class="text-sm md:text-base lg:text-lg bg-gradient-to-r from-purple-600/95 to-pink-600/95 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg text-center font-bold border-2 border-white/20 max-w-xs md:max-w-sm lg:max-w-md">
          Find multiples of 2!
        </div>
      </div>
      
      <!-- Game Canvas Container -->
      <div id="canvas-container" class="flex-1 flex items-center justify-center mt-24 md:mt-28 lg:mt-32 mb-16 md:mb-20 px-2 md:px-4">
        <canvas id="game-canvas" class="bg-white rounded-lg shadow-2xl max-w-full max-h-full"></canvas>
      </div>
      
      <!-- Bottom HUD (mobile controls, hints) -->
      <div id="bottom-hud" class="hud-bottom absolute bottom-0 inset-x-0 p-3 md:p-4 lg:p-5 flex justify-center items-center text-white pointer-events-auto">
        <div id="hints-display" class="text-xs md:text-sm lg:text-base text-center opacity-80 max-w-xs md:max-w-md lg:max-w-lg px-2">
          <span class="hidden md:inline">Move with WASD or Arrow Keys • Press SPACE to eat tiles • Avoid red enemies</span>
          <span class="md:hidden">WASD to move • SPACE to eat • Avoid enemies</span>
        </div>
      </div>
    `;
    
    // Add pause button functionality
    const pauseBtn = gameplayScreen.querySelector('#pause-btn') as HTMLButtonElement;
    pauseBtn.addEventListener('click', () => this.showScreen('paused'));
    
    this.gameContainer!.appendChild(gameplayScreen);
    this.screenElements.set('playing', gameplayScreen);
  }
  
  /**
   * Create settings screen
   */
  private createSettingsScreen(): void {
    const settingsScreen = document.createElement('div');
    settingsScreen.id = 'settings-screen';
    settingsScreen.className = 'absolute inset-0 flex flex-col items-center justify-center app-background text-white z-50';
    
    settingsScreen.innerHTML = `
      <div class="text-center max-w-sm md:max-w-lg px-4 md:px-8 py-6 md:py-8">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-gold drop-shadow-lg">⚙️ Settings</h2>
        
        <div class="flex flex-col gap-4 md:gap-6 text-left">
          <div class="bg-white/10 p-4 md:p-6 rounded-xl backdrop-blur-sm">
            <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4">🎯 Game Difficulty</h3>
            <div class="flex flex-col md:flex-row gap-2 md:gap-3">
              <button class="difficulty-btn flex-1 bg-green-600 text-white border-none px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-green-700 btn-mobile" data-difficulty="easy">
                Easy
              </button>
              <button class="difficulty-btn flex-1 bg-orange-600 text-white border-none px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-orange-700 btn-mobile" data-difficulty="medium">
                Medium
              </button>
              <button class="difficulty-btn flex-1 bg-red-600 text-white border-none px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-red-700 btn-mobile" data-difficulty="hard">
                Hard
              </button>
            </div>
          </div>
          
          <div class="bg-white/10 p-4 md:p-6 rounded-xl backdrop-blur-sm">
            <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4">🔊 Audio</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="sound-effects" checked class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                <span class="text-sm md:text-base">Sound Effects</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="background-music" checked class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                <span class="text-sm md:text-base">Background Music</span>
              </label>
            </div>
          </div>
          
          <div class="bg-white/10 p-4 md:p-6 rounded-xl backdrop-blur-sm">
            <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4">🎮 Controls</h3>
            <div class="text-sm md:text-base space-y-1 opacity-90">
              <p>🔤 WASD or Arrow Keys: Move</p>
              <p>⏸️ ESC: Pause/Resume</p>
              <p>⚙️ F1: Settings</p>
              <p>🍽️ SPACE: Eat tiles</p>
            </div>
          </div>
        </div>
        
        <button id="back-to-menu-btn" class="btn-secondary text-white border-none px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl mt-6 md:mt-8 w-full md:w-auto btn-mobile">
          ← Back to Menu
        </button>
      </div>
    `;
    
    // Add event listeners
    const backBtn = settingsScreen.querySelector('#back-to-menu-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', () => this.showScreen('menu'));
    
    this.gameContainer!.appendChild(settingsScreen);
    this.screenElements.set('settings', settingsScreen);
  }
  
  /**
   * Create game over screen
   */
  private createGameOverScreen(): void {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    gameOverScreen.className = 'absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-50';
    
    gameOverScreen.innerHTML = `
      <div class="text-center max-w-sm md:max-w-md px-6 py-8">
        <h1 class="text-red-400 text-4xl md:text-6xl font-bold mb-6 md:mb-8 drop-shadow-lg animate-pulse">
          💀 GAME OVER
        </h1>
        
        <div id="final-score" class="text-2xl md:text-3xl mb-8 text-green-400 font-bold drop-shadow-md">
          Final Score: 0
        </div>
        
        <div class="flex flex-col gap-4 md:gap-5 mt-8">
          <button id="play-again-btn" class="btn-success text-white border-none px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full btn-mobile">
            🔄 Play Again
          </button>
          
          <button id="main-menu-btn" class="btn-secondary text-white border-none px-6 py-3 text-base font-medium rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full btn-mobile">
            🏠 Main Menu
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const playAgainBtn = gameOverScreen.querySelector('#play-again-btn') as HTMLButtonElement;
    const mainMenuBtn = gameOverScreen.querySelector('#main-menu-btn') as HTMLButtonElement;
    
    playAgainBtn.addEventListener('click', () => {
      // Force full page reload to ensure clean state
      window.location.reload();
    });
    mainMenuBtn.addEventListener('click', () => this.showScreen('menu'));
    
    this.gameContainer!.appendChild(gameOverScreen);
    this.screenElements.set('gameOver', gameOverScreen);
  }
  
  /**
   * Create pause screen
   */
  private createPauseScreen(): void {
    const pauseScreen = document.createElement('div');
    pauseScreen.id = 'pause-screen';
    pauseScreen.className = 'absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50';
    
    pauseScreen.innerHTML = `
      <div class="text-center max-w-sm md:max-w-md px-6 py-8">
        <h2 class="text-4xl md:text-5xl font-bold mb-8 md:mb-12 drop-shadow-lg">⏸️ PAUSED</h2>
        
        <div class="flex flex-col gap-4 md:gap-5">
          <button id="resume-btn" class="btn-success text-white border-none px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full btn-mobile">
            ▶️ Resume Game
          </button>
          
          <button id="pause-settings-btn" class="btn-primary text-white border-none px-6 py-3 text-base font-medium rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full btn-mobile">
            ⚙️ Settings
          </button>
          
          <button id="quit-to-menu-btn" class="btn-danger text-white border-none px-6 py-3 text-base font-medium rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-full btn-mobile">
            🏠 Quit to Menu
          </button>
        </div>
        
        <p class="mt-8 opacity-70 text-sm">Press ESC to resume</p>
      </div>
    `;
    
    // Add event listeners
    const resumeBtn = pauseScreen.querySelector('#resume-btn') as HTMLButtonElement;
    const settingsBtn = pauseScreen.querySelector('#pause-settings-btn') as HTMLButtonElement;
    const quitBtn = pauseScreen.querySelector('#quit-to-menu-btn') as HTMLButtonElement;
    
    resumeBtn.addEventListener('click', () => this.showScreen('playing'));
    settingsBtn.addEventListener('click', () => this.showScreen('settings'));
    quitBtn.addEventListener('click', () => this.showScreen('menu'));
    
    this.gameContainer!.appendChild(pauseScreen);
    this.screenElements.set('paused', pauseScreen);
  }

  /**
   * Start a new game
   */
  private startGame(mode: string = 'multiples'): void {
    // Check if this is a subsequent game start (entities already exist)
    // If so, do a full page reload to ensure clean state
    if (document.querySelector('canvas')) {
      console.log('Canvas already exists, reloading for clean state...');
      window.location.reload();
      return;
    }
    
    // Set the game mode in the engine
    gameEngine.addResource('gameMode', mode);
    gameEngine.addResource('currentLevel', 2); // Start with multiples of 2
    
    this.showScreen('playing');
    // Initialize game here
    console.log(`Starting new game in ${mode} mode...`);
  }
  
  /**
   * Show high scores (placeholder)
   */
  private showHighScores(): void {
    alert('High Scores feature coming soon!');
  }
  
  /**
   * Update game state resource
   */
  private updateGameState(screen: GameScreen): void {
    let gameState: 'menu' | 'playing' | 'paused' | 'gameOver';
    
    switch (screen) {
      case 'menu':
      case 'settings':
        gameState = 'menu';
        break;
      case 'playing':
        gameState = 'playing';
        break;
      case 'paused':
        gameState = 'paused';
        break;
      case 'gameOver':
        gameState = 'gameOver';
        break;
      default:
        gameState = 'menu';
    }
    
    gameEngine.addResource('gameState', gameState);
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Responsive adjustments
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
      // Canvas resize logic will be handled by the render system
    }
  }
  
  /**
   * Update UI elements with game data
   */
  updateGameplayUI(score: number, lives: number, level: string): void {
    if (this.currentScreen !== 'playing') return;
    
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display');
    const levelDisplay = document.getElementById('level-display');
    
    if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
    if (livesDisplay) livesDisplay.textContent = `Lives: ${lives}`;
    if (levelDisplay) levelDisplay.textContent = `Level: ${level}`;
  }
  
  /**
   * Get current screen
   */
  getCurrentScreen(): GameScreen {
    return this.currentScreen;
  }
}

// Export singleton instance
export const uiManager = new UIManager(); 