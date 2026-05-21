import { gameEngine } from '../ecs/Engine';
import type { GameMode } from '../ecs/types';
import { GAME_CONFIG } from '../config';
import {
  applyTouchControlsVisibility,
  bindTouchControls,
  isMode,
  loadTouchControlsMode,
  saveTouchControlsMode,
  type TouchControlsMode,
} from './touchControls';
import {
  isFullscreenActive,
  isFullscreenSupported,
  onFullscreenChange,
  toggleFullscreen,
} from './fullscreen';
import { requestCanvasResize } from '../ecs/systems/render/context';

// UI-layer screen set. Includes UI-only screens (modeSelect, settings) that
// have no ECS gameplay semantics. The ECS engine tracks its own narrower set
// ('menu' | 'playing' | 'paused' | 'gameOver') in Engine.ts.
type UIScreen = 'menu' | 'modeSelect' | 'playing' | 'settings' | 'gameOver' | 'paused';

const OVERLAY_BASE =
  'absolute inset-0 flex flex-col items-center justify-center text-white z-50 overflow-y-auto overscroll-contain overlay-safe-padding';
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
  focusSelector?: string;
  onCancel?: () => void;
};

const DEFAULT_FOCUS_SELECTOR = 'button:not(:disabled), [data-focusable]:not(.disabled)';

const refreshTouchModeButtons = (root: ParentNode, mode: TouchControlsMode): void => {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.touch-mode-btn');
  buttons.forEach((btn) => {
    const isActive = btn.dataset.touchMode === mode;
    btn.setAttribute('aria-pressed', String(isActive));
    btn.classList.toggle('ring-2', isActive);
    btn.classList.toggle('ring-yellow-300', isActive);
  });
};

const syncFullscreenButton = (button: HTMLButtonElement): void => {
  const active = isFullscreenActive();
  button.setAttribute('aria-pressed', String(active));
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
  button.setAttribute('aria-label', label);
  button.title = label;
};

const wireFullscreenButton = (button: HTMLButtonElement): void => {
  if (!isFullscreenSupported()) {
    button.style.display = 'none';
    return;
  }
  syncFullscreenButton(button);
  button.addEventListener('click', () => { void toggleFullscreen(); });
  onFullscreenChange(() => syncFullscreenButton(button));
};

const wireTouchControlsSetting = (root: ParentNode): void => {
  const initial = loadTouchControlsMode();
  refreshTouchModeButtons(root, initial);
  const buttons = root.querySelectorAll<HTMLButtonElement>('.touch-mode-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.touchMode;
      if (!isMode(next)) return;
      saveTouchControlsMode(next);
      applyTouchControlsVisibility(next);
      refreshTouchModeButtons(root, next);
      requestCanvasResize();
    });
  });
};

const $ = <T extends HTMLElement = HTMLElement>(root: HTMLElement, sel: string): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Element not found: ${sel}`);
  return el;
};

const startGame = (mode: GameMode): void => {
  gameEngine.setResource('gameMode', mode);
  void gameEngine.setScreen('playing', {
    level: GAME_CONFIG.GAMEPLAY.STARTING_LEVEL,
    isFreshGame: true,
  });
};

// popScreen doesn't fire onScreenEnter on the screen now at the top, so
// resuming play needs to explicitly re-show the gameplay UI.
const resumePlay = (): void => {
  void gameEngine.popScreen();
  showScreen('playing');
};

const goToMenu = (): void => { void gameEngine.setScreen('menu', {}); };

// Settings is a UI-only screen — the ECS screen stack still reflects where
// the player came from (menu or paused), so use that to route "back".
const openSettings = (): void => {
  showScreen('settings');
  const backBtn = document.getElementById('back-to-menu-btn');
  if (!backBtn) return;
  backBtn.textContent = gameEngine.getCurrentScreen() === 'paused' ? '← Back to Game' : '← Back to Menu';
};

const exitSettings = (): void => {
  if (gameEngine.getCurrentScreen() === 'paused') return showScreen('paused');
  goToMenu();
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

const SCREENS: Record<UIScreen, ScreenSpec> = {
  menu: {
    id: 'main-menu',
    className: `${OVERLAY_BASE} app-background`,
    html: `
      <div class="px-6 md:px-10 py-6 sm:py-8 md:py-16 max-w-sm md:max-w-2xl landscape:max-w-4xl flex flex-col landscape:flex-row landscape:items-center text-center landscape:text-left gap-6 landscape:gap-10 lg:landscape:gap-16">
        <div class="landscape:flex-1">
          <h1 class="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 text-gold drop-shadow-lg">
            Math Munchers
          </h1>

          <p class="text-sm sm:text-base md:text-xl opacity-90 leading-relaxed">
            Navigate the grid and collect correct answers while avoiding enemies!
          </p>
        </div>

        <div class="flex flex-col gap-4 md:gap-6 items-center landscape:items-stretch landscape:flex-1">
          <button id="start-game-btn" class="btn-success ${BTN_CHROME} ${BTN_SIZE.lgResponsive} w-full md:w-auto landscape:w-full min-w-48 md:min-w-56">
            🎮 Start Game
          </button>
          <button id="settings-btn" class="btn-primary ${BTN_CHROME} ${BTN_SIZE.mdResponsive} w-full md:w-auto landscape:w-full min-w-48 md:min-w-56">
            ⚙️ Settings
          </button>
          <button id="high-scores-btn" class="btn-warning ${BTN_CHROME} ${BTN_SIZE.mdResponsive} w-full md:w-auto landscape:w-full min-w-48 md:min-w-56">
            🏆 High Scores
          </button>
        </div>
      </div>

      <button id="menu-fullscreen-btn" type="button" class="absolute top-3 right-3 md:top-4 md:right-4 bg-gray-600/80 hover:bg-gray-600 text-white border-none w-10 h-10 md:w-12 md:h-12 rounded-md cursor-pointer text-lg md:text-xl shadow-md transition-colors duration-200 flex items-center justify-center z-10">
        ⛶
      </button>
    `,
    wire: (root) => {
      $(root, '#start-game-btn').addEventListener('click', () => showScreen('modeSelect'));
      $(root, '#settings-btn').addEventListener('click', openSettings);
      $(root, '#high-scores-btn').addEventListener('click', () => alert('High Scores feature coming soon!'));
      wireFullscreenButton($<HTMLButtonElement>(root, '#menu-fullscreen-btn'));
    },
  },

  modeSelect: {
    id: 'mode-select-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: `
      <div class="text-center max-w-sm md:max-w-3xl landscape:max-w-6xl px-4 md:px-8 py-4 sm:py-6 md:py-12 landscape:py-3 w-full">
        <h1 class="text-2xl sm:text-3xl md:text-5xl lg:text-6xl landscape:text-2xl landscape:md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 landscape:mb-2 text-gold drop-shadow-lg">
          Select Game Mode
        </h1>

        <p class="text-sm sm:text-base md:text-xl mb-4 sm:mb-6 md:mb-12 opacity-90 leading-relaxed px-2 landscape:hidden">
          Choose a math challenge to begin your adventure!
        </p>

        <div class="grid grid-cols-1 landscape:grid-cols-3 gap-3 md:gap-6 items-stretch">
          <div id="multiples-mode" tabindex="0" data-focusable class="mode-card text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg cursor-pointer text-left">
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">🔢 Multiples</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Find all multiples of the given number! Start with multiples of 2 and work your way up.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: For multiples of 2, eat 2, 4, 6, 8, 10, 12...
            </div>
          </div>

          <div id="factors-mode" class="mode-card disabled text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg text-left">
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">🧮 Factors (Coming Soon)</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Find all factors of the given number! This mode will be available in a future update.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: For factors of 12, eat 1, 2, 3, 4, 6, 12...
            </div>
          </div>

          <div id="prime-mode" class="mode-card disabled text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg text-left">
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">🔑 Prime Numbers (Coming Soon)</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Find all prime numbers! Only eat numbers that have exactly two factors.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: Eat 2, 3, 5, 7, 11, 13...
            </div>
          </div>
        </div>

        <button id="back-to-main-btn" class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.mdResponsive} mt-4 md:mt-8 landscape:mt-3">
          ← Back to Menu
        </button>
      </div>
    `,
    wire: (root) => {
      $(root, '#multiples-mode').addEventListener('click', () => startGame('multiples'));
      $(root, '#back-to-main-btn').addEventListener('click', goToMenu);
    },
    onCancel: goToMenu,
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
          <div id="objective-inline" class="hud-objective-inline text-xs bg-gradient-to-r from-purple-600/95 to-pink-600/95 px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">Multiples of 2</div>
        </div>

        <div class="flex gap-2 md:gap-3 items-center">
          <button id="hud-fullscreen-btn" type="button" class="bg-gray-600/90 text-white border-none px-3 md:px-4 py-2 rounded-md cursor-pointer text-sm md:text-base transition-colors duration-200 hover:bg-gray-600 min-h-10 min-w-10 flex items-center justify-center">
            ⛶
          </button>
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

      <div id="canvas-container" class="flex-1 min-h-0 min-w-0 flex items-center justify-center mt-24 md:mt-28 lg:mt-32 mb-16 md:mb-20 px-2 md:px-4">
        <canvas id="game-canvas" class="bg-white rounded-lg shadow-2xl max-w-full max-h-full"></canvas>
      </div>

      <div id="bottom-hud" class="hud-bottom absolute bottom-0 inset-x-0 p-3 md:p-4 lg:p-5 flex justify-center items-center text-white pointer-events-auto">
        <div id="hints-display" class="text-xs md:text-sm lg:text-base text-center opacity-80 max-w-xs md:max-w-md lg:max-w-lg px-2">
          <span class="hidden md:inline">Move: WASD / Arrows / D-pad • Eat: Space / A • Pause: Esc / Start</span>
          <span class="md:hidden">WASD/D-pad to move • Space/A to eat • Avoid enemies</span>
        </div>
      </div>

      <div id="touch-dpad" class="touch-controls" aria-label="Movement controls">
        <button id="touch-up"    type="button" aria-label="Move up"><span class="dpad-glyph">▲</span></button>
        <button id="touch-left"  type="button" aria-label="Move left"><span class="dpad-glyph">▲</span></button>
        <button id="touch-right" type="button" aria-label="Move right"><span class="dpad-glyph">▲</span></button>
        <button id="touch-down"  type="button" aria-label="Move down"><span class="dpad-glyph">▲</span></button>
      </div>
      <div id="touch-action" class="touch-controls" aria-label="Action controls">
        <button id="touch-eat" type="button" aria-label="Eat">EAT</button>
      </div>
    `,
    wire: (root) => {
      $(root, '#pause-btn').addEventListener('click', () => { void gameEngine.pushScreen('paused', {}); });
      wireFullscreenButton($<HTMLButtonElement>(root, '#hud-fullscreen-btn'));
      gameplayHud.score = $(root, '#score-display');
      gameplayHud.lives = $(root, '#lives-display');
      gameplayHud.level = $(root, '#level-display');
      bindTouchControls(root);
    },
  },

  settings: {
    id: 'settings-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: `
      <div class="text-center max-w-sm md:max-w-lg landscape:max-w-4xl w-full px-4 md:px-8 py-4 sm:py-6 md:py-8 landscape:py-3">
        <h2 class="text-2xl sm:text-3xl md:text-4xl landscape:text-xl landscape:md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 landscape:mb-3 text-gold drop-shadow-lg">⚙️ Settings</h2>

        <div class="grid grid-cols-1 landscape:grid-cols-2 gap-3 md:gap-6 landscape:gap-3 text-left items-stretch">
          <div class="bg-white/10 p-3 md:p-6 landscape:p-3 rounded-xl backdrop-blur-sm">
            <h3 class="text-base md:text-xl landscape:text-base font-semibold mb-2 md:mb-4 landscape:mb-2">🎯 Game Difficulty</h3>
            <div class="flex flex-col md:flex-row gap-2 md:gap-3">
              <button class="difficulty-btn flex-1 bg-green-600 text-white border-none px-3 py-2 landscape:py-2 md:py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-green-700 btn-mobile" data-difficulty="easy">Easy</button>
              <button class="difficulty-btn flex-1 bg-orange-600 text-white border-none px-3 py-2 landscape:py-2 md:py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-orange-700 btn-mobile" data-difficulty="medium">Medium</button>
              <button class="difficulty-btn flex-1 bg-red-600 text-white border-none px-3 py-2 landscape:py-2 md:py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-red-700 btn-mobile" data-difficulty="hard">Hard</button>
            </div>
          </div>

          <div class="bg-white/10 p-3 md:p-6 landscape:p-3 rounded-xl backdrop-blur-sm">
            <h3 class="text-base md:text-xl landscape:text-base font-semibold mb-2 md:mb-4 landscape:mb-2">🔊 Audio</h3>
            <div class="space-y-2 md:space-y-3">
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

          <div class="bg-white/10 p-3 md:p-6 landscape:p-3 rounded-xl backdrop-blur-sm">
            <h3 class="text-base md:text-xl landscape:text-base font-semibold mb-2 md:mb-4 landscape:mb-2">🎮 Controls</h3>
            <div class="text-xs md:text-base landscape:text-xs space-y-0.5 md:space-y-1 opacity-90">
              <p>🔤 Move: WASD / Arrows / D-pad</p>
              <p>🍽️ Eat / Select: Space / Enter / A</p>
              <p>⏸️ Pause / Back: Esc / Start</p>
              <p>⚙️ F1: Settings</p>
            </div>
          </div>

          <div class="bg-white/10 p-3 md:p-6 landscape:p-3 rounded-xl backdrop-blur-sm">
            <h3 class="text-base md:text-xl landscape:text-base font-semibold mb-2 md:mb-4 landscape:mb-2">📱 Touch Controls</h3>
            <p class="text-xs md:text-sm opacity-80 mb-2 landscape:hidden">Show on-screen D-pad and Eat button.</p>
            <div class="flex flex-col md:flex-row gap-2 md:gap-3">
              <button class="touch-mode-btn flex-1 bg-blue-600 text-white border-none px-3 py-2 landscape:py-2 md:py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-700 btn-mobile" data-touch-mode="auto">Auto</button>
              <button class="touch-mode-btn flex-1 bg-blue-600 text-white border-none px-3 py-2 landscape:py-2 md:py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-700 btn-mobile" data-touch-mode="on">Always On</button>
              <button class="touch-mode-btn flex-1 bg-blue-600 text-white border-none px-3 py-2 landscape:py-2 md:py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-700 btn-mobile" data-touch-mode="off">Always Off</button>
            </div>
          </div>
        </div>

        <button id="back-to-menu-btn" class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.lg} mt-4 md:mt-8 landscape:mt-3 w-full md:w-auto">
          ← Back to Menu
        </button>
      </div>
    `,
    wire: (root) => {
      $(root, '#back-to-menu-btn').addEventListener('click', exitSettings);
      wireTouchControlsSetting(root);
    },
    onCancel: exitSettings,
  },

  gameOver: {
    id: 'game-over-screen',
    className: `${OVERLAY_BASE} bg-black/90`,
    html: `
      <div class="text-center max-w-sm md:max-w-md px-6 py-6 sm:py-8">
        <h1 class="text-red-400 text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 drop-shadow-lg animate-pulse">
          💀 GAME OVER
        </h1>

        <div id="final-score" class="text-xl sm:text-2xl md:text-3xl mb-6 sm:mb-8 text-green-400 font-bold drop-shadow-md">
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
      $(root, '#play-again-btn').addEventListener('click', () => { startGame(gameEngine.getResource('gameMode')); });
      $(root, '#main-menu-btn').addEventListener('click', goToMenu);
    },
    onCancel: goToMenu,
  },

  paused: {
    id: 'pause-screen',
    className: `${OVERLAY_BASE} bg-black/80`,
    html: `
      <div class="text-center max-w-sm md:max-w-md px-6 py-6 sm:py-8">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 md:mb-12 drop-shadow-lg">⏸️ PAUSED</h2>

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
      $(root, '#resume-btn').addEventListener('click', resumePlay);
      $(root, '#pause-settings-btn').addEventListener('click', openSettings);
      $(root, '#quit-to-menu-btn').addEventListener('click', goToMenu);
    },
    onCancel: resumePlay,
  },
};

const gameContainer = ((): HTMLElement => {
  const container = document.createElement('div');
  container.id = 'game-container';
  container.className = 'w-screen h-dvh relative overflow-hidden flex flex-col items-center justify-center font-sans app-background';
  document.body.appendChild(container);
  return container;
})();

applyTouchControlsVisibility();
// Re-evaluate auto mode if the primary pointer changes (e.g. window moved
// between a touchscreen and a regular monitor, or device rotated into a
// virtual-keyboard state).
window.matchMedia('(hover: none) and (pointer: coarse)').addEventListener('change', () => {
  applyTouchControlsVisibility();
  requestCanvasResize();
});

const screenElements = new Map<UIScreen, HTMLElement>();
let currentScreen: UIScreen = 'menu';

const createScreen = (screen: UIScreen): HTMLElement => {
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

const getFocusables = (screen: UIScreen): HTMLElement[] => {
  const root = screenElements.get(screen);
  if (!root) return [];
  const selector = SCREENS[screen].focusSelector ?? DEFAULT_FOCUS_SELECTOR;
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
};

const focusFirstOn = (screen: UIScreen): void => {
  const [first] = getFocusables(screen);
  first?.focus();
};

export const showScreen = (screen: UIScreen): void => {
  screenElements.get(currentScreen)?.style.setProperty('display', 'none');
  const root = screenElements.get(screen) ?? createScreen(screen);
  root.style.display = 'flex';
  currentScreen = screen;
  // Gameplay screen is driven by inputState, not DOM focus — leaving focus
  // there would show a focus ring on the pause button during play.
  if (screen !== 'playing') return focusFirstOn(screen);
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

const focusedIndex = (focusables: HTMLElement[]): number => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return -1;
  return focusables.indexOf(active);
};

export const navigateFocus = (direction: 'prev' | 'next'): void => {
  const focusables = getFocusables(currentScreen);
  if (focusables.length === 0) return;
  const current = focusedIndex(focusables);
  if (current < 0) {
    focusables[direction === 'next' ? 0 : focusables.length - 1]?.focus();
    return;
  }
  const offset = direction === 'next' ? 1 : -1;
  focusables[(current + offset + focusables.length) % focusables.length]?.focus();
};

export const activateFocus = (): void => {
  const focusables = getFocusables(currentScreen);
  const current = focusedIndex(focusables);
  const target = current >= 0 ? focusables[current] : focusables[0];
  target?.click();
};

export const triggerCancel = (): void => {
  SCREENS[currentScreen].onCancel?.();
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
  const full = document.getElementById('objective-display');
  if (full) full.textContent = `Find multiples of ${level}!`;
  const inline = document.getElementById('objective-inline');
  if (inline) inline.textContent = `Multiples of ${level}`;
};

export const setFinalScore = (score: number): void => {
  const el = document.getElementById('final-score');
  if (el) el.textContent = `Final Score: ${score}`;
};

// UI-only shortcuts. Gameplay input (movement, eat, pause) lives in the ECS input plugin.
const keyActions: Record<string, (event: KeyboardEvent) => void> = {
  F1: (event) => {
    event.preventDefault();
    openSettings();
  },
};

document.addEventListener('keydown', (event) => {
  keyActions[event.code]?.(event);
});
