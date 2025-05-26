import { gameEngine } from '../Engine';

// Key press tracking (for discrete movement)
const keyPressed = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
} as const;

// Previous key state for edge detection
const prevKeyState = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
} as const;

// Initialize input system
export function initializeInputSystem(): void {
  // Set up keyboard event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  console.log('Input system initialized for grid-based movement');
}

// Clean up input system
export function cleanupInputSystem(): void {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  
  console.log('Input system cleaned up');
}

// Handle key down events
function handleKeyDown(event: KeyboardEvent): void {
  if (event.code in keyPressed) {
    event.preventDefault();
    (keyPressed as Record<string, boolean>)[event.code] = true;
  }
}

// Handle key up events
function handleKeyUp(event: KeyboardEvent): void {
  if (event.code in keyPressed) {
    event.preventDefault();
    (keyPressed as Record<string, boolean>)[event.code] = false;
  }
}

// Add the input system to ECSpresso
export function addInputSystemToEngine(): void {
  gameEngine.addSystem('inputSystem')
    .setPriority(100) // High priority to process input first
    .addQuery('players', {
      with: ['player', 'position']
    })
    .setProcess((queries) => {
      // Process all entities with player and position components
      for (const entity of queries.players) {
        const playerComponent = entity.components.player;
        
        // Detect key press events (transition from false to true)
        const upPressed = (keyPressed.ArrowUp || keyPressed.KeyW) && !(prevKeyState.ArrowUp || prevKeyState.KeyW);
        const downPressed = (keyPressed.ArrowDown || keyPressed.KeyS) && !(prevKeyState.ArrowDown || prevKeyState.KeyS);
        const leftPressed = (keyPressed.ArrowLeft || keyPressed.KeyA) && !(prevKeyState.ArrowLeft || prevKeyState.KeyA);
        const rightPressed = (keyPressed.ArrowRight || keyPressed.KeyD) && !(prevKeyState.ArrowRight || prevKeyState.KeyD);
        
        // Update player input state with press events
        playerComponent.inputState.up = upPressed;
        playerComponent.inputState.down = downPressed;
        playerComponent.inputState.left = leftPressed;
        playerComponent.inputState.right = rightPressed;
      }
      
      // Update previous key state for next frame
      Object.keys(prevKeyState).forEach(key => {
        (prevKeyState as Record<string, boolean>)[key] = (keyPressed as Record<string, boolean>)[key];
      });
    })
    .build();
}

// Get current key state (for debugging)
export function getKeyPressed(): Readonly<typeof keyPressed> {
  return keyPressed;
} 