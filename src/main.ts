import './style.css'
import { 
  initializeEngine, 
  startGameLoop, 
  EntityFactory
} from './ecs/Engine';
import { 
  initializeInputSystem, 
  addInputSystemToEngine 
} from './ecs/systems/InputSystem';
import { 
  addMovementSystemToEngine,
  gridToPixel 
} from './ecs/systems/MovementSystem';
import { 
  initializeRenderSystem, 
  addRenderSystemToEngine 
} from './ecs/systems/RenderSystem';

// Initialize the game
async function initializeGame(): Promise<void> {
  // Set up HTML structure
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div id="game-container">
      <div id="game-ui">
        <h1>Math Game Demo</h1>
        <p>Use WASD or Arrow Keys to move the blue circle</p>
        <p>Eat the green squares (correct answers) and avoid gray ones!</p>
        <div id="score">Score: 0</div>
      </div>
      <canvas id="game-canvas"></canvas>
    </div>
  `;

  // Get canvas element
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  // Initialize ECS engine
  initializeEngine();

  // Initialize systems
  initializeInputSystem();
  initializeRenderSystem(canvas);

  // Add systems to engine
  console.log('Adding systems to ECSpresso engine...');
  addInputSystemToEngine();
  addMovementSystemToEngine();
  addRenderSystemToEngine();

  // Note: ECSpresso systems are immediately ready after being added
  console.log('ECSpresso systems added and ready');

  // Create player entity
  const playerGridPos = { x: 10, y: 10 }; // Center of 20x20 grid
  const playerPixelPos = gridToPixel(playerGridPos.x, playerGridPos.y);
  console.log('Creating player at position:', playerPixelPos);
  EntityFactory.createPlayer(playerPixelPos.x, playerPixelPos.y);

  // Create some math problems for demonstration
  createDemoMathProblems();

  console.log('Game initialized successfully');
}

// Create demonstration math problems
function createDemoMathProblems(): void {
  const problems = [
    // Correct answers (green)
    { gridX: 5, gridY: 5, value: 10, isCorrect: true },
    { gridX: 15, gridY: 5, value: 15, isCorrect: true },
    { gridX: 5, gridY: 15, value: 20, isCorrect: true },
    { gridX: 15, gridY: 15, value: 25, isCorrect: true },
    
    // Incorrect answers (gray)
    { gridX: 8, gridY: 8, value: 13, isCorrect: false },
    { gridX: 12, gridY: 8, value: 17, isCorrect: false },
    { gridX: 8, gridY: 12, value: 19, isCorrect: false },
    { gridX: 12, gridY: 12, value: 23, isCorrect: false },
  ];

  console.log('Creating math problems...');
  for (const problem of problems) {
    const pixelPos = gridToPixel(problem.gridX, problem.gridY);
    EntityFactory.createMathProblem(
      pixelPos.x, 
      pixelPos.y, 
      problem.value, 
      problem.isCorrect, 
      1
    );
  }
  console.log(`Created ${problems.length} math problems`);
}

// Add some basic styling
function addGameStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      background: #222;
      color: white;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }
    
    #game-container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    
    #game-ui {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 8px;
      max-width: 300px;
    }
    
    #game-ui h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    
    #game-ui p {
      margin: 5px 0;
      font-size: 14px;
    }
    
    #score {
      font-size: 18px;
      font-weight: bold;
      color: #4CAF50;
      margin-top: 10px;
    }
    
    #game-canvas {
      background: white;
      border: 2px solid #333;
    }
  `;
  document.head.appendChild(style);
}

// Start the game
async function startGame(): Promise<void> {
  try {
    addGameStyles();
    await initializeGame();
    startGameLoop();
    console.log('Math Game started successfully!');
  } catch (error) {
    console.error('Failed to start game:', error);
  }
}

// Start the game when the page loads
startGame();
