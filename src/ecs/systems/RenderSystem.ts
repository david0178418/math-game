import { gameEngine } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';

// Canvas context and configuration
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// Initialize the render system
export function initializeRenderSystem(canvasElement: HTMLCanvasElement): void {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D rendering context');
  }
  
  // Set up canvas size
  resizeCanvas();
  
  // Set up canvas resize handling
  window.addEventListener('resize', resizeCanvas);
  
  console.log('Render system initialized');
}

// Clean up render system
export function cleanupRenderSystem(): void {
  window.removeEventListener('resize', resizeCanvas);
  console.log('Render system cleaned up');
}

// Resize canvas to maintain aspect ratio
function resizeCanvas(): void {
  if (!canvas) return;
  
  const gameWidth = GRID_WIDTH * CELL_SIZE;
  const gameHeight = GRID_HEIGHT * CELL_SIZE;
  
  // Calculate scale to fit screen while maintaining aspect ratio
  const scaleX = (window.innerWidth * 0.8) / gameWidth; // Leave some margin
  const scaleY = (window.innerHeight * 0.8) / gameHeight; // Leave some margin
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1:1
  
  // Set actual canvas size (for drawing)
  canvas.width = gameWidth;
  canvas.height = gameHeight;
  
  // Set display size (CSS)
  canvas.style.width = `${gameWidth * scale}px`;
  canvas.style.height = `${gameHeight * scale}px`;
  
  // Center the canvas
  canvas.style.position = 'absolute';
  canvas.style.left = '50%';
  canvas.style.top = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';
  
  if (ctx) {
    // Reset any previous transforms
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Set up pixel perfect rendering
    ctx.imageSmoothingEnabled = false;
  }
}

// Add the render system to ECSpresso
export function addRenderSystemToEngine(): void {
  gameEngine.addSystem('renderSystem')
    .setPriority(10) // Render after all other systems
    .addQuery('renderableEntities', {
      with: ['position', 'renderable']
    })
    .addQuery('players', {
      with: ['position', 'player']
    })
    .addQuery('mathProblems', {
      with: ['position', 'mathProblem']
    })
    .setOnInitialize((_ecs) => {
      console.log('🎨 Render system initialized');
      // Could set up additional rendering resources here
    })
    .setOnDetach((_ecs) => {
      console.log('🎨 Render system detached');
      // Clean up rendering resources
      cleanupRenderSystem();
    })
    .setProcess((queries) => {
      if (!ctx || !canvas) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      
      // Draw grid background
      drawGrid();
      
      // Check if player is on a math problem and draw highlight
      drawPlayerHighlight(queries.players, queries.mathProblems);
      
      // Sort entities by layer (lower layer numbers render first)
      const sortedEntities = [...queries.renderableEntities].sort((a, b) => 
        a.components.renderable.layer - b.components.renderable.layer
      );
      
      // Render all entities
      for (const entity of sortedEntities) {
        const position = entity.components.position;
        const renderable = entity.components.renderable;
        
        drawEntity(position, renderable);
      }
      
      // Draw numbers on math problem tiles (after drawing the entities)
      drawMathProblemNumbers(queries.mathProblems);
    })
    .build();
}

// Draw the grid background
function drawGrid(): void {
  if (!ctx) return;
  
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  
  // Draw vertical lines
  for (let x = 0; x <= GRID_WIDTH; x++) {
    const pixelX = x * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pixelX, 0);
    ctx.lineTo(pixelX, GRID_HEIGHT * CELL_SIZE);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= GRID_HEIGHT; y++) {
    const pixelY = y * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, pixelY);
    ctx.lineTo(GRID_WIDTH * CELL_SIZE, pixelY);
    ctx.stroke();
  }
}

// Draw highlight when player is on a consumable math problem
function drawPlayerHighlight(players: any[], mathProblems: any[]): void {
  if (!ctx) return;
  
  for (const player of players) {
    const playerPos = player.components.position;
    
    // Check if player is on a math problem
    for (const problem of mathProblems) {
      const problemPos = problem.components.position;
      const mathProblemComp = problem.components.mathProblem;
      
      // Skip consumed problems
      if (mathProblemComp.consumed) continue;
      
      // Check if positions match (same grid cell)
      if (Math.abs(playerPos.x - problemPos.x) < CELL_SIZE / 2 && 
          Math.abs(playerPos.y - problemPos.y) < CELL_SIZE / 2) {
        
        // Draw a pulsing highlight around the cell
        const time = Date.now() / 300; // Pulse speed
        const alpha = 0.3 + 0.2 * Math.sin(time); // Pulse between 0.3 and 0.5 alpha
        
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`; // Yellow highlight
        ctx.fillRect(problemPos.x, problemPos.y, CELL_SIZE, CELL_SIZE);
        
        // Add a border
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; // Gold border
        ctx.lineWidth = 2;
        ctx.strokeRect(problemPos.x + 1, problemPos.y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        ctx.restore();
        
        break; // Only highlight one problem per player
      }
    }
  }
}

// Draw an individual entity
function drawEntity(position: { x: number; y: number }, renderable: { shape: 'circle' | 'rectangle'; color: string; size: number }): void {
  if (!ctx) return;
  
  ctx.fillStyle = renderable.color;
  
  const centerX = position.x + CELL_SIZE / 2;
  const centerY = position.y + CELL_SIZE / 2;
  
  if (renderable.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, centerY, renderable.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (renderable.shape === 'rectangle') {
    const halfSize = renderable.size / 2;
    ctx.fillRect(
      centerX - halfSize,
      centerY - halfSize,
      renderable.size,
      renderable.size
    );
  }
}

// Draw numbers on math problem tiles
function drawMathProblemNumbers(mathProblems: any[]): void {
  if (!ctx) return;
  
  // Set up text styling
  ctx.save();
  ctx.font = 'bold 32px Arial'; // Larger font for bigger tiles
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (const problem of mathProblems) {
    const position = problem.components.position;
    const mathProblemComp = problem.components.mathProblem;
    
    // Skip consumed problems (they're already invisible)
    if (mathProblemComp.consumed) continue;
    
    const centerX = position.x + CELL_SIZE / 2;
    const centerY = position.y + CELL_SIZE / 2;
    
    // Use white text with black outline for visibility on both green and gray backgrounds
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 6; // Thicker outline for larger font
    ctx.strokeText(mathProblemComp.value.toString(), centerX, centerY);
    
    ctx.fillStyle = 'white';
    ctx.fillText(mathProblemComp.value.toString(), centerX, centerY);
  }
  
  ctx.restore();
}

// Get canvas element (for external use)
export function getCanvas(): HTMLCanvasElement | null {
  return canvas;
}

// Get rendering context (for external use)
export function getRenderingContext(): CanvasRenderingContext2D | null {
  return ctx;
} 