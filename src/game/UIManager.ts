import { gameEngine } from '../ecs/Engine';
import { GAME_CONFIG } from './config';

type GameScreen = 'menu' | 'modeSelect' | 'playing' | 'settings' | 'gameOver' | 'paused';

const OVERLAY_BASE =
  'absolute inset-0 flex flex-col items-center justify-center text-white z-50';
const BTN_CHROME =
  'text-white border-none rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl btn-mobile';
const BTN_SIZE = {
  lgResponsive: 'px-8 md:px-12 py-4 md:py-5 text-lg md:text-xl font-semibold',
  mdResponsive: 'px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium',
  lg: 'px-8 py-4 text-lg font-semibold',
  md: 'px-6 py-3 text-base font-medium',
} as const;

type ScreenSpec = {
  id: string;
  className: string;
  html: string;
  wire?: (root: HTMLElement) => void;
};

const $ = <T extends HTMLElement = HTMLElement>(root: HTMLElement, sel: string): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Element not found: ${sel}`);
  return el;
};

const startGame = (mode: string): void => {
  // Subsequent start: reload for clean state — canvas/entity teardown is not yet supported.
  if (document.querySelector('canvas')) {
    window.location.reload();
    return;
  }
  gameEngine.setResource('gameMode', mode);
  void gameEngine.setScreen('playing', {
    level: GAME_CONFIG.GAMEPLAY.STARTING_LEVEL,
    isFreshGame: true,
  });
};

// HUD element refs + last-written values. Populated when the playing screen
// mounts; `updateGameplayUI` runs every frame and skips writes when unchanged.
const gameplayHud: {
  score?: HTMLElement;
  lives?: HTMLElement;
  level?: HTMLElement;
  lastScore: number;
  lastLives: number;
  lastLevel: string;
} = {
  lastScore: NaN,
  lastLives: NaN,
  lastLevel: '',
};

const SCREENS: Record<GameScreen, ScreenSpec> = {
  menu: {
    id: 'main-menu',
    className: `${OVERLAY_BASE} app-background`,
    html: `
      <div class="text-center max-w-sm md:max-w-2xl px-6 md:px-10 py-8 md:py-16">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-gold drop-shadow-lg">
          Math Munchers
        </h1>

        <p class="text-base md:text-xl mb-8 md:mb-12 opacity-90 leading-relaxed px-4">
          Navigate the grid and collect correct answers while avoiding enemies!
        </p>

        <div class="flex flex-col gap-4 md:gap-6 items-center">
          <button id="start-game-btn" class="btn-success ${BTN_CHROME} ${BTN_SIZE.lgResponsive} w-full md:w-auto min-w-48 md:min-w-56">
            🎮 Start Game
          </button>
          <button id="settings-btn" class="btn-primary ${BTN_CHROME} ${BTN_SIZE.mdResponsive} w-full md:w-auto min-w-48 md:min-w-56">
            ⚙️ Settings
          </button>
          <button id="high-scores-btn" class="btn-warning ${BTN_CHROME} ${BTN_SIZE.mdResponsive} w-full md:w-auto min-w-48 md:min-w-56">
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
    `,
    wire: (root) => {
      $(root, '#start-game-btn').addEventListener('click', () => showScreen('modeSelect'));
      $(root, '#settings-btn').addEventListener('click', () => showScreen('settings'));
      $(root, '#high-scores-btn').addEventListener('click', () => alert('High Scores feature coming soon!'));
    },
  },

  modeSelect: {
    id: 'mode-select-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: `
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

        <button id="back-to-main-btn" class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.mdResponsive} mt-6 md:mt-8">
          ← Back to Menu
        </button>
      </div>
    `,
    wire: (root) => {
      $(root, '#multiples-mode').addEventListener('click', () => startGame('multiples'));
      $(root, '#back-to-main-btn').addEventListener('click', () => { void gameEngine.setScreen('menu', {}); });
    },
  },

  playing: {
    id: 'gameplay-ui',
    className: 'absolute inset-0 flex flex-col pointer-events-none z-10',
    html: `
      <div id="top-hud" class="hud-top absolute top-0 inset-x-0 p-3 md:p-4 lg:p-5 flex flex-wrap justify-between items-center text-white font-bold pointer-events-auto gap-2 md:gap-4">
        <div class="flex flex-wrap gap-2 md:gap-4 lg:gap-6 items-center">
          <div id="score-display" class="text-sm md:text-base lg:text-lg bg-green-600/90 px-3 md:px-4 py-2 rounded-lg shadow-md whitespace-nowrap">Score: 0</div>
          <div id="lives-display" class="text-sm md:text-base lg:text-lg bg-red-600/90 px-3 md:px-4 py-2 rounded-lg shadow-md whitespace-nowrap">Lives: 3</div>
          <div id="level-display" class="text-xs md:text-sm lg:text-base bg-blue-600/90 px-2 md:px-3 py-1 md:py-2 rounded-lg shadow-md whitespace-nowrap">Level: Easy</div>
        </div>

        <div class="flex gap-2 md:gap-3 items-center">
          <button id="pause-btn" class="bg-gray-600/90 text-white border-none px-3 md:px-4 py-2 rounded-md cursor-pointer text-sm md:text-base transition-colors duration-200 hover:bg-gray-600 min-h-10 min-w-10 flex items-center justify-center">
            ⏸️
          </button>
        </div>
      </div>

      <div id="objective-section" class="absolute top-16 md:top-20 lg:top-24 inset-x-0 flex justify-center items-center px-4 pointer-events-none z-20">
        <div id="objective-display" class="text-sm md:text-base lg:text-lg bg-gradient-to-r from-purple-600/95 to-pink-600/95 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg text-center font-bold border-2 border-white/20 max-w-xs md:max-w-sm lg:max-w-md">
          Find multiples of 2!
        </div>
      </div>

      <div id="canvas-container" class="flex-1 flex items-center justify-center mt-24 md:mt-28 lg:mt-32 mb-16 md:mb-20 px-2 md:px-4">
        <canvas id="game-canvas" class="bg-white rounded-lg shadow-2xl max-w-full max-h-full"></canvas>
      </div>

      <div id="bottom-hud" class="hud-bottom absolute bottom-0 inset-x-0 p-3 md:p-4 lg:p-5 flex justify-center items-center text-white pointer-events-auto">
        <div id="hints-display" class="text-xs md:text-sm lg:text-base text-center opacity-80 max-w-xs md:max-w-md lg:max-w-lg px-2">
          <span class="hidden md:inline">Move with WASD or Arrow Keys • Press SPACE to eat tiles • Avoid red enemies</span>
          <span class="md:hidden">WASD to move • SPACE to eat • Avoid enemies</span>
        </div>
      </div>
    `,
    wire: (root) => {
      $(root, '#pause-btn').addEventListener('click', () => { void gameEngine.pushScreen('paused', {}); });
      gameplayHud.score = $(root, '#score-display');
      gameplayHud.lives = $(root, '#lives-display');
      gameplayHud.level = $(root, '#level-display');
    },
  },

  settings: {
    id: 'settings-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: `
      <div class="text-center max-w-sm md:max-w-lg px-4 md:px-8 py-6 md:py-8">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-gold drop-shadow-lg">⚙️ Settings</h2>

        <div class="flex flex-col gap-4 md:gap-6 text-left">
          <div class="bg-white/10 p-4 md:p-6 rounded-xl backdrop-blur-sm">
            <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4">🎯 Game Difficulty</h3>
            <div class="flex flex-col md:flex-row gap-2 md:gap-3">
              <button class="difficulty-btn flex-1 bg-green-600 text-white border-none px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-green-700 btn-mobile" data-difficulty="easy">Easy</button>
              <button class="difficulty-btn flex-1 bg-orange-600 text-white border-none px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-orange-700 btn-mobile" data-difficulty="medium">Medium</button>
              <button class="difficulty-btn flex-1 bg-red-600 text-white border-none px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-red-700 btn-mobile" data-difficulty="hard">Hard</button>
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

        <button id="back-to-menu-btn" class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.lg} mt-6 md:mt-8 w-full md:w-auto">
          ← Back to Menu
        </button>
      </div>
    `,
    wire: (root) => {
      $(root, '#back-to-menu-btn').addEventListener('click', () => { void gameEngine.setScreen('menu', {}); });
    },
  },

  gameOver: {
    id: 'game-over-screen',
    className: `${OVERLAY_BASE} bg-black/90`,
    html: `
      <div class="text-center max-w-sm md:max-w-md px-6 py-8">
        <h1 class="text-red-400 text-4xl md:text-6xl font-bold mb-6 md:mb-8 drop-shadow-lg animate-pulse">
          💀 GAME OVER
        </h1>

        <div id="final-score" class="text-2xl md:text-3xl mb-8 text-green-400 font-bold drop-shadow-md">
          Final Score: 0
        </div>

        <div class="flex flex-col gap-4 md:gap-5 mt-8">
          <button id="play-again-btn" class="btn-success ${BTN_CHROME} ${BTN_SIZE.lg} w-full">
            🔄 Play Again
          </button>
          <button id="main-menu-btn" class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.md} w-full">
            🏠 Main Menu
          </button>
        </div>
      </div>
    `,
    wire: (root) => {
      $(root, '#play-again-btn').addEventListener('click', () => { window.location.reload(); });
      $(root, '#main-menu-btn').addEventListener('click', () => { void gameEngine.setScreen('menu', {}); });
    },
  },

  paused: {
    id: 'pause-screen',
    className: `${OVERLAY_BASE} bg-black/80`,
    html: `
      <div class="text-center max-w-sm md:max-w-md px-6 py-8">
        <h2 class="text-4xl md:text-5xl font-bold mb-8 md:mb-12 drop-shadow-lg">⏸️ PAUSED</h2>

        <div class="flex flex-col gap-4 md:gap-5">
          <button id="resume-btn" class="btn-success ${BTN_CHROME} ${BTN_SIZE.lg} w-full">
            ▶️ Resume Game
          </button>
          <button id="pause-settings-btn" class="btn-primary ${BTN_CHROME} ${BTN_SIZE.md} w-full">
            ⚙️ Settings
          </button>
          <button id="quit-to-menu-btn" class="btn-danger ${BTN_CHROME} ${BTN_SIZE.md} w-full">
            🏠 Quit to Menu
          </button>
        </div>

        <p class="mt-8 opacity-70 text-sm">Press ESC to resume</p>
      </div>
    `,
    wire: (root) => {
      $(root, '#resume-btn').addEventListener('click', () => { void gameEngine.popScreen(); });
      $(root, '#pause-settings-btn').addEventListener('click', () => showScreen('settings'));
      $(root, '#quit-to-menu-btn').addEventListener('click', () => { void gameEngine.setScreen('menu', {}); });
    },
  },
};

const gameContainer = ((): HTMLElement => {
  const container = document.createElement('div');
  container.id = 'game-container';
  container.className = 'w-screen h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans app-background';
  document.body.appendChild(container);
  return container;
})();

const screenElements = new Map<GameScreen, HTMLElement>();
let currentScreen: GameScreen = 'menu';

const createScreen = (screen: GameScreen): HTMLElement => {
  const spec = SCREENS[screen];
  const root = document.createElement('div');
  root.id = spec.id;
  root.className = spec.className;
  root.innerHTML = spec.html;
  spec.wire?.(root);
  gameContainer.appendChild(root);
  screenElements.set(screen, root);
  return root;
};

export const showScreen = (screen: GameScreen): void => {
  screenElements.get(currentScreen)?.style.setProperty('display', 'none');
  const root = screenElements.get(screen) ?? createScreen(screen);
  root.style.display = 'flex';
  currentScreen = screen;
};

export const updateGameplayUI = (score: number, lives: number, level: string): void => {
  if (gameplayHud.score && score !== gameplayHud.lastScore) {
    gameplayHud.score.textContent = `Score: ${score}`;
    gameplayHud.lastScore = score;
  }
  if (gameplayHud.lives && lives !== gameplayHud.lastLives) {
    gameplayHud.lives.textContent = `Lives: ${lives}`;
    gameplayHud.lastLives = lives;
  }
  if (gameplayHud.level && level !== gameplayHud.lastLevel) {
    gameplayHud.level.textContent = `Level: ${level}`;
    gameplayHud.lastLevel = level;
  }
};

export const updateObjective = (level: number): void => {
  const el = document.getElementById('objective-display');
  if (el) el.textContent = `Find multiples of ${level}!`;
};

const escActions: Partial<Record<GameScreen, () => void>> = {
  playing: () => { void gameEngine.pushScreen('paused', {}); },
  paused:  () => { void gameEngine.popScreen(); },
};

const keyActions: Record<string, (event: KeyboardEvent) => void> = {
  F1: (event) => {
    event.preventDefault();
    showScreen('settings');
  },
  Escape: () => { escActions[currentScreen]?.(); },
};

document.addEventListener('keydown', (event) => {
  keyActions[event.code]?.(event);
});
