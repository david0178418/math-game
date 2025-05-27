/**
 * Game State Manager
 * Centralized state management for the math game
 */

export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'loading';

export interface GameData {
  score: number;
  lives: number;
  level: string;
  startTime: number;
  playTime: number;
  correctAnswers: number;
  wrongAnswers: number;
  highScore: number;
}

export class GameStateManager {
  private static instance: GameStateManager;
  private currentState: GameState = 'menu';
  private gameData: GameData = this.getInitialGameData();
  private stateChangeCallbacks: Array<(oldState: GameState, newState: GameState) => void> = [];
  
  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }
  
  /**
   * Get the current game state
   */
  getCurrentState(): GameState {
    return this.currentState;
  }
  
  /**
   * Change the game state
   */
  setState(newState: GameState): void {
    if (newState === this.currentState) return;
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    // Handle state-specific logic
    this.handleStateChange(oldState, newState);
    
    // Notify callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(oldState, newState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
    
    console.log(`Game state changed: ${oldState} → ${newState}`);
  }
  
  /**
   * Register a callback for state changes
   */
  onStateChange(callback: (oldState: GameState, newState: GameState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }
  
  /**
   * Get current game data
   */
  getGameData(): Readonly<GameData> {
    return { ...this.gameData };
  }
  
  /**
   * Update game data
   */
  updateGameData(updates: Partial<GameData>): void {
    this.gameData = { ...this.gameData, ...updates };
    
    // Update play time if game is active
    if (this.currentState === 'playing') {
      this.gameData.playTime = Date.now() - this.gameData.startTime;
    }
    
    // Update high score
    if (this.gameData.score > this.gameData.highScore) {
      this.gameData.highScore = this.gameData.score;
      this.saveHighScore(this.gameData.highScore);
    }
  }
  
  /**
   * Reset game data for a new game
   */
  resetGameData(): void {
    const highScore = this.gameData.highScore;
    this.gameData = this.getInitialGameData();
    this.gameData.highScore = highScore;
    this.gameData.startTime = Date.now();
  }
  
  /**
   * Get difficulty level based on score
   */
  getDifficultyLevel(): 'Easy' | 'Medium' | 'Hard' {
    if (this.gameData.score < 50) return 'Easy';
    if (this.gameData.score < 200) return 'Medium';
    return 'Hard';
  }
  
  /**
   * Check if game should end
   */
  shouldEndGame(): boolean {
    return this.gameData.lives <= 0;
  }
  
  /**
   * Handle correct answer
   */
  handleCorrectAnswer(points: number = 10): void {
    this.updateGameData({
      score: this.gameData.score + points,
      correctAnswers: this.gameData.correctAnswers + 1,
    });
  }
  
  /**
   * Handle wrong answer
   */
  handleWrongAnswer(): void {
    this.updateGameData({
      lives: Math.max(0, this.gameData.lives - 1),
      wrongAnswers: this.gameData.wrongAnswers + 1,
    });
    
    if (this.shouldEndGame()) {
      this.setState('gameOver');
    }
  }
  
  /**
   * Get accuracy percentage
   */
  getAccuracy(): number {
    const total = this.gameData.correctAnswers + this.gameData.wrongAnswers;
    if (total === 0) return 100;
    return Math.round((this.gameData.correctAnswers / total) * 100);
  }
  
  /**
   * Get game statistics
   */
  getGameStats(): {
    score: number;
    lives: number;
    level: string;
    accuracy: number;
    playTime: number;
    correctAnswers: number;
    wrongAnswers: number;
  } {
    return {
      score: this.gameData.score,
      lives: this.gameData.lives,
      level: this.getDifficultyLevel(),
      accuracy: this.getAccuracy(),
      playTime: this.gameData.playTime,
      correctAnswers: this.gameData.correctAnswers,
      wrongAnswers: this.gameData.wrongAnswers,
    };
  }
  
  /**
   * Handle state-specific logic
   */
  private handleStateChange(oldState: GameState, newState: GameState): void {
    switch (newState) {
      case 'playing':
        if (oldState === 'menu') {
          this.resetGameData();
        }
        break;
        
      case 'gameOver':
        // Calculate final play time
        this.gameData.playTime = Date.now() - this.gameData.startTime;
        break;
        
      case 'paused':
        // Could pause timers here if needed
        break;
        
      case 'menu':
        // Could clean up resources here
        break;
    }
  }
  
  /**
   * Get initial game data
   */
  private getInitialGameData(): GameData {
    return {
      score: 0,
      lives: 3,
      level: 'Easy',
      startTime: Date.now(),
      playTime: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      highScore: this.loadHighScore(),
    };
  }
  
  /**
   * Load high score from localStorage
   */
  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem('mathGameHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.warn('Failed to load high score:', error);
      return 0;
    }
  }
  
  /**
   * Save high score to localStorage
   */
  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('mathGameHighScore', score.toString());
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }
} 