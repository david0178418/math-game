/**
 * Game Styling Module
 * Handles all CSS styling for the game interface
 */

export class GameStyles {
  private static styleElement: HTMLStyleElement | null = null;

  /**
   * Apply all game styles to the document
   */
  static apply(): void {
    if (GameStyles.styleElement) {
      // Remove existing styles to avoid duplicates
      GameStyles.styleElement.remove();
    }

    GameStyles.styleElement = document.createElement('style');
    GameStyles.styleElement.textContent = GameStyles.getCSS();
    document.head.appendChild(GameStyles.styleElement);
  }

  /**
   * Remove game styles from the document
   */
  static remove(): void {
    if (GameStyles.styleElement) {
      GameStyles.styleElement.remove();
      GameStyles.styleElement = null;
    }
  }

  /**
   * Get the complete CSS for the game
   */
  private static getCSS(): string {
    return `
      /* Game Container Styles */
      body {
        margin: 0;
        padding: 0;
        background: #222;
        color: white;
        font-family: 'Arial', sans-serif;
        overflow: hidden;
        user-select: none;
      }
      
      #game-container {
        width: 100vw;
        height: 100vh;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* UI Panel Styles */
      #game-ui {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 10;
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 12px;
        border: 2px solid #444;
        max-width: 280px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      }
      
      #game-ui h1 {
        margin: 0 0 15px 0;
        font-size: 28px;
        color: #4CAF50;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      #game-ui p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.4;
        color: #ddd;
      }
      
      #score {
        font-size: 20px;
        font-weight: bold;
        color: #4CAF50;
        margin-top: 15px;
        padding: 10px;
        background: rgba(76, 175, 80, 0.1);
        border-radius: 8px;
        border: 1px solid #4CAF50;
        text-align: center;
      }
      
      /* Canvas Styles */
      #game-canvas {
        background: white;
        border: 3px solid #333;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        #game-ui {
          top: 10px;
          left: 10px;
          right: 10px;
          max-width: none;
          padding: 15px;
        }
        
        #game-ui h1 {
          font-size: 24px;
        }
        
        #game-ui p {
          font-size: 12px;
        }
        
        #score {
          font-size: 18px;
        }
      }
      
      /* Loading and error states */
      .game-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-size: 24px;
        color: #4CAF50;
      }
      
      .game-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-size: 18px;
        color: #f44336;
        text-align: center;
        padding: 20px;
      }
    `;
  }
} 