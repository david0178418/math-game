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
    .setProcess((queries) => {
      if (!ctx || !canvas) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      
      // Draw grid background
      drawGrid();
      
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

// Get canvas element (for external use)
export function getCanvas(): HTMLCanvasElement | null {
  return canvas;
}

// Get rendering context (for external use)
export function getRenderingContext(): CanvasRenderingContext2D | null {
  return ctx;
} 