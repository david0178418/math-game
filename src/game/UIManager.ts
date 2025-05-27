import { gameEngine } from '../ecs/Engine';

/**
 * UI Manager
 * Handles all game UI screens and transitions
 */

export type GameScreen = 'menu' | 'playing' | 'settings' | 'gameOver' | 'paused';

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
      this.gameContainer.style.cssText = `
        width: 100vw;
        height: 100vh;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      `;
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
    menuScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      z-index: 1000;
    `;
    
    menuScreen.innerHTML = `
      <div style="text-align: center; max-width: 600px; padding: 40px;">
        <h1 style="
          font-size: 4rem;
          margin: 0 0 20px 0;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
          background: linear-gradient(45deg, #FFD700, #FFA500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Math Munchers</h1>
        
        <p style="
          font-size: 1.2rem;
          margin: 0 0 40px 0;
          opacity: 0.9;
          line-height: 1.6;
        ">Navigate the grid and collect correct answers while avoiding enemies!</p>
        
        <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
          <button id="start-game-btn" style="
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.3rem;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            min-width: 200px;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(0, 0, 0, 0.4)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 12px rgba(0, 0, 0, 0.3)'">
            Start Game
          </button>
          
          <button id="settings-btn" style="
            background: linear-gradient(45deg, #2196F3, #1976D2);
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 1.1rem;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            min-width: 200px;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(0, 0, 0, 0.4)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(0, 0, 0, 0.3)'">
            Settings
          </button>
          
          <button id="high-scores-btn" style="
            background: linear-gradient(45deg, #FF9800, #F57C00);
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 1.1rem;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            min-width: 200px;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(0, 0, 0, 0.4)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(0, 0, 0, 0.3)'">
            High Scores
          </button>
        </div>
        
        <div style="
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 0.9rem;
          opacity: 0.7;
        ">
          <p>Controls: Use WASD or Arrow Keys to move</p>
          <p>ESC to pause • F1 for settings</p>
        </div>
      </div>
    `;
    
    // Add event listeners
    const startBtn = menuScreen.querySelector('#start-game-btn') as HTMLButtonElement;
    const settingsBtn = menuScreen.querySelector('#settings-btn') as HTMLButtonElement;
    const highScoresBtn = menuScreen.querySelector('#high-scores-btn') as HTMLButtonElement;
    
    startBtn.addEventListener('click', () => this.startGame());
    settingsBtn.addEventListener('click', () => this.showScreen('settings'));
    highScoresBtn.addEventListener('click', () => this.showHighScores());
    
    this.gameContainer!.appendChild(menuScreen);
    this.screenElements.set('menu', menuScreen);
  }
  
  /**
   * Create gameplay UI (HUD)
   */
  private createGameplayUI(): void {
    const gameplayScreen = document.createElement('div');
    gameplayScreen.id = 'gameplay-ui';
    gameplayScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      pointer-events: none;
      z-index: 100;
    `;
    
    gameplayScreen.innerHTML = `
      <!-- Top HUD -->
      <div id="top-hud" style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        font-weight: bold;
        pointer-events: auto;
      ">
        <div style="display: flex; gap: 30px; align-items: center;">
          <div id="score-display" style="
            font-size: 1.4rem;
            background: rgba(76, 175, 80, 0.9);
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">Score: 0</div>
          
          <div id="lives-display" style="
            font-size: 1.4rem;
            background: rgba(244, 67, 54, 0.9);
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">Lives: 3</div>
          
          <div id="level-display" style="
            font-size: 1.2rem;
            background: rgba(33, 150, 243, 0.9);
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">Level: Easy</div>
        </div>
        
        <div style="display: flex; gap: 15px; align-items: center;">
          <div id="objective-display" style="
            font-size: 1.1rem;
            background: rgba(156, 39, 176, 0.9);
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            max-width: 300px;
            text-align: center;
          ">Collect correct answers!</div>
          
          <button id="pause-btn" style="
            background: rgba(96, 125, 139, 0.9);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.2s ease;
          " onmouseover="this.style.background='rgba(96, 125, 139, 1)'"
             onmouseout="this.style.background='rgba(96, 125, 139, 0.9)'">⏸️</button>
        </div>
      </div>
      
      <!-- Game Canvas Container -->
      <div id="canvas-container" style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 80px;
      ">
        <canvas id="game-canvas"></canvas>
      </div>
      
      <!-- Bottom HUD (mobile controls, hints) -->
      <div id="bottom-hud" style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
        padding: 15px 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        pointer-events: auto;
      ">
        <div id="hints-display" style="
          font-size: 1rem;
          text-align: center;
          opacity: 0.8;
        ">Move with WASD or Arrow Keys • Collect green squares • Avoid red enemies</div>
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
    settingsScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      z-index: 1000;
    `;
    
    settingsScreen.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px;">
        <h2 style="font-size: 2.5rem; margin: 0 0 30px 0; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">Settings</h2>
        
        <div style="display: flex; flex-direction: column; gap: 20px; text-align: left;">
          <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px;">
            <h3 style="margin: 0 0 15px 0;">Game Difficulty</h3>
            <div style="display: flex; gap: 10px;">
              <button class="difficulty-btn" data-difficulty="easy" style="
                background: #4CAF50; color: white; border: none; padding: 10px 20px;
                border-radius: 6px; cursor: pointer; flex: 1;
              ">Easy</button>
              <button class="difficulty-btn" data-difficulty="medium" style="
                background: #FF9800; color: white; border: none; padding: 10px 20px;
                border-radius: 6px; cursor: pointer; flex: 1;
              ">Medium</button>
              <button class="difficulty-btn" data-difficulty="hard" style="
                background: #f44336; color: white; border: none; padding: 10px 20px;
                border-radius: 6px; cursor: pointer; flex: 1;
              ">Hard</button>
            </div>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px;">
            <h3 style="margin: 0 0 15px 0;">Audio</h3>
            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <input type="checkbox" id="sound-effects" checked>
              Sound Effects
            </label>
            <label style="display: flex; align-items: center; gap: 10px;">
              <input type="checkbox" id="background-music" checked>
              Background Music
            </label>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px;">
            <h3 style="margin: 0 0 15px 0;">Controls</h3>
            <p style="margin: 5px 0;">WASD or Arrow Keys: Move</p>
            <p style="margin: 5px 0;">ESC: Pause/Resume</p>
            <p style="margin: 5px 0;">F1: Settings</p>
          </div>
        </div>
        
        <button id="back-to-menu-btn" style="
          background: linear-gradient(45deg, #607D8B, #455A64);
          color: white; border: none; padding: 15px 30px; font-size: 1.2rem;
          border-radius: 12px; cursor: pointer; margin-top: 30px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        ">Back to Menu</button>
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
    gameOverScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      z-index: 1000;
    `;
    
    gameOverScreen.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px;">
        <h1 style="
          color: #f44336; font-size: 4rem; margin: 0 0 20px 0;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
        ">GAME OVER</h1>
        
        <div id="final-score" style="
          font-size: 2rem; margin: 20px 0; color: #4CAF50;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        ">Final Score: 0</div>
        
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 30px;">
          <button id="play-again-btn" style="
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white; border: none; padding: 15px 30px; font-size: 1.3rem;
            border-radius: 12px; cursor: pointer;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
          ">Play Again</button>
          
          <button id="main-menu-btn" style="
            background: linear-gradient(45deg, #607D8B, #455A64);
            color: white; border: none; padding: 12px 25px; font-size: 1.1rem;
            border-radius: 12px; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          ">Main Menu</button>
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
    pauseScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      z-index: 1000;
    `;
    
    pauseScreen.innerHTML = `
      <div style="text-align: center; max-width: 400px; padding: 40px;">
        <h2 style="font-size: 3rem; margin: 0 0 30px 0; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);">PAUSED</h2>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <button id="resume-btn" style="
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white; border: none; padding: 15px 30px; font-size: 1.3rem;
            border-radius: 12px; cursor: pointer;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
          ">Resume Game</button>
          
          <button id="pause-settings-btn" style="
            background: linear-gradient(45deg, #2196F3, #1976D2);
            color: white; border: none; padding: 12px 25px; font-size: 1.1rem;
            border-radius: 12px; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          ">Settings</button>
          
          <button id="quit-to-menu-btn" style="
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white; border: none; padding: 12px 25px; font-size: 1.1rem;
            border-radius: 12px; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          ">Quit to Menu</button>
        </div>
        
        <p style="margin-top: 30px; opacity: 0.7; font-size: 0.9rem;">Press ESC to resume</p>
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
  private startGame(): void {
    // Check if this is a subsequent game start (entities already exist)
    // If so, do a full page reload to ensure clean state
    if (document.querySelector('canvas')) {
      console.log('Canvas already exists, reloading for clean state...');
      window.location.reload();
      return;
    }
    
    this.showScreen('playing');
    // Initialize game here
    console.log('Starting new game...');
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