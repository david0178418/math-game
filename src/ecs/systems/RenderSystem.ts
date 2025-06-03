import { gameEngine } from '../Engine';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../../game/config';
import { 
  renderableEntityQuery, 
  playerQuery, 
  mathProblemQuery,
  type PlayerEntity,
  type MathProblemEntity
} from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import flyImage from '../../assets/images/fly.svg';
import { createQueryDefinition } from 'ecspresso';
import type { Components } from '../Engine';

// Canvas context and configuration
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// Image cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();

// Load and cache an image
function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Preload player image
async function preloadPlayerImage(): Promise<void> {
  try {
    await loadImage(flyImage);
    console.log('🖼️ Player image loaded successfully');
  } catch (error) {
    console.warn('⚠️ Failed to load player image:', error);
  }
}

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
  
  // Preload player image
  preloadPlayerImage();
  
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

// Query for frog entities with tongues
const frogTongueQuery = createQueryDefinition({
  with: ['position', 'enemy', 'frogTongue']
});

// Query for spider web entities for enhanced rendering
const spiderWebQuery = createQueryDefinition({
  with: ['position', 'spiderWeb', 'renderable']
});

// Query for frozen players for visual feedback
const frozenPlayerQuery = createQueryDefinition({
  with: ['position', 'player', 'freezeEffect']
});

type FrogTongueEntity = {
  id: number;
  components: {
    position: Components['position'];
    enemy: Components['enemy'];
    frogTongue: Components['frogTongue'];
  };
};

type SpiderWebEntity = {
  id: number;
  components: {
    position: Components['position'];
    spiderWeb: Components['spiderWeb'];
    renderable: Components['renderable'];
  };
};

type FrozenPlayerEntity = {
  id: number;
  components: {
    position: Components['position'];
    player: Components['player'];
    freezeEffect: Components['freezeEffect'];
  };
};

// Add the render system to ECSpresso
export function addRenderSystemToEngine(): void {
  gameEngine.addSystem('renderSystem')
    .setPriority(SYSTEM_PRIORITIES.RENDER)
    .addQuery('renderableEntities', renderableEntityQuery)
    .addQuery('players', playerQuery)
    .addQuery('mathProblems', mathProblemQuery)
    .addQuery('frogTongues', frogTongueQuery)
    .addQuery('spiderWebs', spiderWebQuery)
    .addQuery('frozenPlayers', frozenPlayerQuery)
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
      
      // Draw enhanced spider webs with fade effects
      drawEnhancedSpiderWebs(queries.spiderWebs as SpiderWebEntity[]);
      
      // Sort entities by layer (lower layer numbers render first)
      const sortedEntities = [...queries.renderableEntities].sort((a, b) => 
        a.components.renderable.layer - b.components.renderable.layer
      );
      
      // Render all entities
      for (const entity of sortedEntities) {
        const position = entity.components.position;
        const renderable = entity.components.renderable;
        
        // Check if entity has health component for invincibility
        const healthComp = 'health' in entity.components ? entity.components.health : undefined;
        const isInvulnerable = healthComp?.invulnerable || false;
        
        // Check if entity has player component for death scaling
        const playerComp = 'player' in entity.components ? entity.components.player : undefined;
        const deathScale = playerComp?.deathScale ?? 1.0;
        
        drawEntity(position, renderable, isInvulnerable, deathScale, entity.id);
      }
      
      // Draw enhanced frog tongues (after entities but before UI text)
      drawEnhancedFrogTongues(queries.frogTongues as FrogTongueEntity[]);
      
      // Draw frozen player visual effects
      drawFrozenPlayerEffects(queries.frozenPlayers as FrozenPlayerEntity[]);
      
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
function drawPlayerHighlight(players: PlayerEntity[], mathProblems: MathProblemEntity[]): void {
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

// Calculate image render dimensions while maintaining aspect ratio
function calculateImageDimensions(
  img: HTMLImageElement,
  requestedWidth?: number,
  requestedHeight?: number
): { width: number; height: number } {
  const aspectRatio = img.width / img.height;
  let renderWidth = requestedWidth || CELL_SIZE * 0.8;
  let renderHeight = requestedHeight || CELL_SIZE * 0.8;
  
  // Adjust to maintain aspect ratio and fit in cell
  if (aspectRatio > 1) {
    // Wider than tall
    renderHeight = renderWidth / aspectRatio;
    if (renderHeight > CELL_SIZE * 0.8) {
      renderHeight = CELL_SIZE * 0.8;
      renderWidth = renderHeight * aspectRatio;
    }
  } else {
    // Taller than wide or square
    renderWidth = renderHeight * aspectRatio;
    if (renderWidth > CELL_SIZE * 0.8) {
      renderWidth = CELL_SIZE * 0.8;
      renderHeight = renderWidth / aspectRatio;
    }
  }
  
  return { width: renderWidth, height: renderHeight };
}

// Draw an individual entity
function drawEntity(
  position: { x: number; y: number; rotation?: number; shakeOffsetX?: number; shakeOffsetY?: number }, 
  renderable: { 
    shape: 'circle' | 'rectangle' | 'image'; 
    color: string; 
    size: number; 
    imageSrc?: string;
    imageWidth?: number;
    imageHeight?: number;
  },
  isInvulnerable: boolean = false,
  deathScale: number = 1.0,
  entityId?: number // Add entity ID to determine enemy type
): void {
  if (!ctx) return;
  
  // Apply shake offset to position
  const shakeX = position.shakeOffsetX || 0;
  const shakeY = position.shakeOffsetY || 0;
  const centerX = position.x + CELL_SIZE / 2 + shakeX;
  const centerY = position.y + CELL_SIZE / 2 + shakeY;
  
  // Apply reduced opacity for invulnerable entities
  if (isInvulnerable) {
    ctx.save();
    ctx.globalAlpha = 0.5; // 50% opacity during invincibility
  }
  
  // Check if this is an enemy entity and get enemy type for special rendering
  let enemyType: 'lizard' | 'spider' | 'frog' | null = null;
  if (entityId) {
    const enemyComponent = gameEngine.entityManager.getComponent(entityId, 'enemy');
    if (enemyComponent) {
      enemyType = enemyComponent.enemyType;
    }
  }
  
  if (renderable.shape === 'image' && renderable.imageSrc) {
    // Draw image
    const img = imageCache.get(renderable.imageSrc);
    if (img && img.complete) {
      const { width, height } = calculateImageDimensions(img, renderable.imageWidth, renderable.imageHeight);
      
      // Apply death scale
      const scaledWidth = width * deathScale;
      const scaledHeight = height * deathScale;
      
      // Apply rotation if specified
      if (position.rotation !== undefined && position.rotation !== 0) {
        // Additional save for rotation (nested within invincibility save if applicable)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((position.rotation * Math.PI) / 180); // Convert degrees to radians
        ctx.drawImage(
          img,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
        ctx.restore(); // Restore rotation transform
      } else {
        // Draw without rotation
        ctx.drawImage(
          img,
          centerX - scaledWidth / 2,
          centerY - scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      }
    } else {
      // Fallback to circle if image not loaded
      ctx.fillStyle = renderable.color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (renderable.size / 2) * deathScale, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (renderable.shape === 'circle') {
    ctx.fillStyle = renderable.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (renderable.size / 2) * deathScale, 0, Math.PI * 2);
    ctx.fill();
  } else if (renderable.shape === 'rectangle') {
    // Enhanced enemy rendering with distinctive shapes
    if (enemyType) {
      drawEnhancedEnemy(centerX, centerY, renderable, enemyType, deathScale);
    } else {
      // Default rectangle rendering for non-enemies
      ctx.fillStyle = renderable.color;
      const halfSize = (renderable.size / 2) * deathScale;
      ctx.fillRect(
        centerX - halfSize,
        centerY - halfSize,
        renderable.size * deathScale,
        renderable.size * deathScale
      );
    }
  }
  
  // Restore opacity for invulnerable entities
  if (isInvulnerable) {
    ctx.restore();
  }
}

/**
 * Draw enhanced enemy with type-specific visual patterns
 */
function drawEnhancedEnemy(
  centerX: number, 
  centerY: number, 
  renderable: { color: string; size: number }, 
  enemyType: 'lizard' | 'spider' | 'frog',
  deathScale: number
): void {
  if (!ctx) return;
  
  const size = renderable.size * deathScale;
  const halfSize = size / 2;
  const currentTime = performance.now();
  
  ctx.save();
  
  switch (enemyType) {
    case 'lizard':
      // Lizard: Diamond shape with scales pattern
      ctx.fillStyle = renderable.color;
      
      // Draw diamond body
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - halfSize);
      ctx.lineTo(centerX + halfSize, centerY);
      ctx.lineTo(centerX, centerY + halfSize);
      ctx.lineTo(centerX - halfSize, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Add scales pattern
      ctx.strokeStyle = 'rgba(139, 0, 0, 0.6)'; // Dark red scales
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const scaleRadius = (halfSize * 0.3) + (i * halfSize * 0.2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, scaleRadius, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // Add eyes
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(centerX - halfSize * 0.3, centerY - halfSize * 0.3, 3, 0, 2 * Math.PI);
      ctx.arc(centerX + halfSize * 0.3, centerY - halfSize * 0.3, 3, 0, 2 * Math.PI);
      ctx.fill();
      break;
      
    case 'spider':
      // Spider: Oval body with 8 legs
      ctx.fillStyle = renderable.color;
      
      // Draw spider body (oval)
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, halfSize * 0.6, halfSize * 0.8, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw spider legs
      ctx.strokeStyle = renderable.color;
      ctx.lineWidth = 3;
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const legLength = halfSize * 1.2;
        const legBend = halfSize * 0.7;
        
        // Joint position
        const jointX = centerX + Math.cos(angle) * legBend;
        const jointY = centerY + Math.sin(angle) * legBend;
        
        // Leg end position
        const legEndX = centerX + Math.cos(angle) * legLength;
        const legEndY = centerY + Math.sin(angle) * legLength;
        
        // Draw leg from body to joint to end
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * halfSize * 0.6, centerY + Math.sin(angle) * halfSize * 0.6);
        ctx.lineTo(jointX, jointY);
        ctx.lineTo(legEndX, legEndY);
        ctx.stroke();
      }
      
      // Add spider pattern on body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, halfSize * 0.3, halfSize * 0.5, 0, 0, 2 * Math.PI);
      ctx.fill();
      break;
      
    case 'frog':
      // Frog: Rounded rectangle with eyes on top
      ctx.fillStyle = renderable.color;
      
      // Draw frog body (rounded rectangle)
      const cornerRadius = halfSize * 0.3;
      ctx.beginPath();
      ctx.roundRect(
        centerX - halfSize,
        centerY - halfSize,
        size,
        size,
        cornerRadius
      );
      ctx.fill();
      
      // Add frog belly
      ctx.fillStyle = 'rgba(144, 238, 144, 0.7)'; // Light green belly
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + halfSize * 0.2, halfSize * 0.6, halfSize * 0.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw bulging eyes on top
      const eyeRadius = halfSize * 0.25;
      const eyeOffsetY = -halfSize * 0.7;
      
      // Eye backgrounds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(centerX - halfSize * 0.3, centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
      ctx.arc(centerX + halfSize * 0.3, centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Eye pupils
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(centerX - halfSize * 0.3, centerY + eyeOffsetY, eyeRadius * 0.6, 0, 2 * Math.PI);
      ctx.arc(centerX + halfSize * 0.3, centerY + eyeOffsetY, eyeRadius * 0.6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Eye highlights
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX - halfSize * 0.3 + 2, centerY + eyeOffsetY - 2, eyeRadius * 0.3, 0, 2 * Math.PI);
      ctx.arc(centerX + halfSize * 0.3 + 2, centerY + eyeOffsetY - 2, eyeRadius * 0.3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add subtle throat movement animation
      const throatPulse = 0.9 + 0.1 * Math.sin(currentTime * 0.005);
      ctx.fillStyle = `rgba(144, 238, 144, ${0.4 * throatPulse})`;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + halfSize * 0.5, halfSize * 0.4, halfSize * 0.2 * throatPulse, 0, 0, 2 * Math.PI);
      ctx.fill();
      break;
  }
  
  ctx.restore();
}

// Draw numbers on math problem tiles
function drawMathProblemNumbers(mathProblems: MathProblemEntity[]): void {
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

// Draw frog tongues
// @ts-ignore - Legacy function kept for reference
function drawFrogTongues(frogs: FrogTongueEntity[]): void {
  // This function is now empty as per the instructions
}

/**
 * Draw enhanced spider webs with fade effects and better visuals
 */
function drawEnhancedSpiderWebs(spiderWebs: SpiderWebEntity[]): void {
  if (!ctx) return;
  
  const currentTime = performance.now();
  
  for (const webEntity of spiderWebs) {
    const web = webEntity.components.spiderWeb;
    const pos = webEntity.components.position;
    
    // Skip inactive webs
    if (!web.isActive) continue;
    
    // Calculate fade effect based on remaining lifetime
    const timeElapsed = currentTime - web.createdTime;
    const timeRemaining = web.duration - timeElapsed;
    const fadeProgress = Math.max(0, timeRemaining / web.duration);
    
    // Base opacity that fades over time
    const baseOpacity = 0.6 * fadeProgress;
    
    ctx.save();
    
    // Draw web background with fade
    ctx.fillStyle = `rgba(128, 0, 128, ${baseOpacity * 0.3})`;
    ctx.fillRect(pos.x + 5, pos.y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    
    // Draw web pattern
    const centerX = pos.x + CELL_SIZE / 2;
    const centerY = pos.y + CELL_SIZE / 2;
    const webSize = CELL_SIZE * 0.4;
    
    ctx.strokeStyle = `rgba(160, 32, 160, ${baseOpacity})`;
    ctx.lineWidth = 2;
    
    // Draw radial web strands
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = centerX + Math.cos(angle) * 8;
      const y1 = centerY + Math.sin(angle) * 8;
      const x2 = centerX + Math.cos(angle) * webSize;
      const y2 = centerY + Math.sin(angle) * webSize;
      
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    
    // Draw concentric circles
    for (let radius = 8; radius <= webSize; radius += 12) {
      ctx.moveTo(centerX + radius, centerY);
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    }
    
    ctx.stroke();
    
    // Add sparkle effect for active webs
    if (fadeProgress > 0.5) {
      const sparkleOpacity = (fadeProgress - 0.5) * 2;
      ctx.fillStyle = `rgba(200, 100, 200, ${sparkleOpacity * 0.8})`;
      
      // Draw small sparkles around the web
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + (currentTime * 0.001);
        const sparkleX = centerX + Math.cos(angle) * webSize * 0.8;
        const sparkleY = centerY + Math.sin(angle) * webSize * 0.8;
        
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
}

/**
 * Draw enhanced frog tongues with improved animation and visual feedback
 */
function drawEnhancedFrogTongues(frogs: FrogTongueEntity[]): void {
  if (!ctx) return;
  
  const currentTime = performance.now();
  
  for (const frog of frogs) {
    const tongue = frog.components.frogTongue;
    const frogPos = frog.components.position;
    
    // Only draw if tongue is extended and has segments
    if (!tongue.isExtended || tongue.segments.length === 0) {
      continue;
    }
    
    // Get frog center position
    const frogCenterX = frogPos.x + CELL_SIZE / 2;
    const frogCenterY = frogPos.y + CELL_SIZE / 2;
    
    ctx.save();
    
    // Calculate animation effects based on tongue phase
    let baseOpacity = 1.0;
    let lineWidth = 8;
    let tongueColor = 'rgba(255, 20, 147, 1.0)';
    
    switch (tongue.phase) {
      case 'extending':
        // Pulsing effect during extension
        const extendPulse = 0.8 + 0.2 * Math.sin(currentTime * 0.01);
        baseOpacity = extendPulse;
        lineWidth *= extendPulse;
        break;
      case 'holding':
        // Steady glow during hold
        tongueColor = 'rgba(255, 50, 150, 1.0)';
        lineWidth = 10;
        break;
      case 'retracting':
        // Fading effect during retraction
        const retractFade = Math.max(0.3, tongue.currentLength / (tongue.maxRange * CELL_SIZE));
        baseOpacity = retractFade;
        break;
    }
    
    // Draw tongue shadow for depth
    ctx.strokeStyle = `rgba(120, 10, 80, ${baseOpacity * 0.3})`;
    ctx.lineWidth = lineWidth + 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(frogCenterX + 2, frogCenterY + 2);
    
    for (const segment of tongue.segments) {
      const segmentCenterX = segment.x * CELL_SIZE + CELL_SIZE / 2 + 2;
      const segmentCenterY = segment.y * CELL_SIZE + CELL_SIZE / 2 + 2;
      ctx.lineTo(segmentCenterX, segmentCenterY);
    }
    
    ctx.stroke();
    
    // Draw main tongue
    ctx.strokeStyle = tongueColor.replace('1.0)', `${baseOpacity})`);
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    ctx.moveTo(frogCenterX, frogCenterY);
    
    for (const segment of tongue.segments) {
      const segmentCenterX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const segmentCenterY = segment.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.lineTo(segmentCenterX, segmentCenterY);
    }
    
    ctx.stroke();
    
    // Draw enhanced tongue tip with glow effect
    if (tongue.segments.length > 0) {
      const lastSegment = tongue.segments[tongue.segments.length - 1];
      const tipX = lastSegment.x * CELL_SIZE + CELL_SIZE / 2;
      const tipY = lastSegment.y * CELL_SIZE + CELL_SIZE / 2;
      
      // Glow effect
      const glowRadius = 12;
      const gradient = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowRadius);
      gradient.addColorStop(0, `rgba(255, 20, 147, ${baseOpacity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 20, 147, ${baseOpacity * 0.3})`);
      gradient.addColorStop(1, `rgba(255, 20, 147, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tipX, tipY, glowRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Tongue tip
      ctx.fillStyle = `rgba(255, 20, 147, ${baseOpacity})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Highlight on tip
      ctx.fillStyle = `rgba(255, 150, 200, ${baseOpacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(tipX - 2, tipY - 2, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Draw visual effects for frozen players
 */
function drawFrozenPlayerEffects(frozenPlayers: FrozenPlayerEntity[]): void {
  if (!ctx) return;
  
  const currentTime = performance.now();
  
  for (const playerEntity of frozenPlayers) {
    const pos = playerEntity.components.position;
    const freezeEffect = playerEntity.components.freezeEffect;
    
    // Skip inactive freeze effects
    if (!freezeEffect.isActive) continue;
    
    // Calculate freeze effect intensity based on remaining time
    const timeElapsed = currentTime - freezeEffect.startTime;
    const timeRemaining = freezeEffect.duration - timeElapsed;
    const freezeProgress = Math.max(0, timeRemaining / freezeEffect.duration);
    
    ctx.save();
    
    // Ice crystal overlay
    const centerX = pos.x + CELL_SIZE / 2;
    const centerY = pos.y + CELL_SIZE / 2;
    
    // Draw ice effect background
    const iceOpacity = 0.4 * freezeProgress;
    ctx.fillStyle = `rgba(173, 216, 230, ${iceOpacity})`;
    ctx.fillRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);
    
    // Draw ice crystals
    ctx.strokeStyle = `rgba(135, 206, 250, ${freezeProgress})`;
    ctx.lineWidth = 2;
    
    // Draw 6 ice crystal spikes
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const crystalLength = 20 * freezeProgress;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * crystalLength,
        centerY + Math.sin(angle) * crystalLength
      );
      ctx.stroke();
      
      // Draw smaller side spikes
      const sideLength = crystalLength * 0.4;
      const sideAngle1 = angle + Math.PI / 6;
      const sideAngle2 = angle - Math.PI / 6;
      
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * crystalLength * 0.7,
        centerY + Math.sin(angle) * crystalLength * 0.7
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * crystalLength * 0.7 + Math.cos(sideAngle1) * sideLength,
        centerY + Math.sin(angle) * crystalLength * 0.7 + Math.sin(sideAngle1) * sideLength
      );
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * crystalLength * 0.7,
        centerY + Math.sin(angle) * crystalLength * 0.7
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * crystalLength * 0.7 + Math.cos(sideAngle2) * sideLength,
        centerY + Math.sin(angle) * crystalLength * 0.7 + Math.sin(sideAngle2) * sideLength
      );
      ctx.stroke();
    }
    
    // Add sparkling ice particles
    const sparkleCount = Math.floor(8 * freezeProgress);
    ctx.fillStyle = `rgba(255, 255, 255, ${freezeProgress * 0.8})`;
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleAngle = (i * 2 * Math.PI) / sparkleCount + currentTime * 0.002;
      const sparkleRadius = 25 + 10 * Math.sin(currentTime * 0.003 + i);
      const sparkleX = centerX + Math.cos(sparkleAngle) * sparkleRadius;
      const sparkleY = centerY + Math.sin(sparkleAngle) * sparkleRadius;
      
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
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