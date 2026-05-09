import { gameEngine, type Components } from '../Engine';
import { playerQuery } from '../queries';

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
  Space: false,
  Enter: false,
};

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
  Space: false,
  Enter: false,
};

// Type for valid key codes
type ValidKeyCode = keyof typeof keyPressed;

// Type guard to check if a key code is valid
function isValidKeyCode(code: string): code is ValidKeyCode {
  return code in keyPressed;
}

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
  if (isValidKeyCode(event.code)) {
    event.preventDefault();
    keyPressed[event.code] = true;
  }
}

// Handle key up events
function handleKeyUp(event: KeyboardEvent): void {
  if (isValidKeyCode(event.code)) {
    event.preventDefault();
    keyPressed[event.code] = false;
  }
}

// Add the input system to ECSpresso
export function addInputSystemToEngine(): void {
  gameEngine.addSystem('inputSystem')
    .setPriority(100)
    .addSingleton('player', playerQuery)
    .setProcess(({ queries }) => {
      const player = queries.player;
      if (player) {
        applyInputToPlayer(player.components.player);
      }

      for (const key of Object.keys(prevKeyState) as ValidKeyCode[]) {
        prevKeyState[key] = keyPressed[key];
      }
    });
}

function applyInputToPlayer(playerComponent: Components['player']): void {
  if (playerComponent.gameOverPending) {
    playerComponent.inputState.up = false;
    playerComponent.inputState.down = false;
    playerComponent.inputState.left = false;
    playerComponent.inputState.right = false;
    playerComponent.inputState.eat = false;
    return;
  }

  playerComponent.inputState.up = (keyPressed.ArrowUp || keyPressed.KeyW) && !(prevKeyState.ArrowUp || prevKeyState.KeyW);
  playerComponent.inputState.down = (keyPressed.ArrowDown || keyPressed.KeyS) && !(prevKeyState.ArrowDown || prevKeyState.KeyS);
  playerComponent.inputState.left = (keyPressed.ArrowLeft || keyPressed.KeyA) && !(prevKeyState.ArrowLeft || prevKeyState.KeyA);
  playerComponent.inputState.right = (keyPressed.ArrowRight || keyPressed.KeyD) && !(prevKeyState.ArrowRight || prevKeyState.KeyD);
  playerComponent.inputState.eat = (keyPressed.Space || keyPressed.Enter) && !(prevKeyState.Space || prevKeyState.Enter);
}

// Get current key state (for debugging)
export function getKeyPressed(): Readonly<typeof keyPressed> {
  return keyPressed;
} 