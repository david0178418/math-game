import { html, nothing, type TemplateResult } from 'lit-html';
import { ref } from 'lit-html/directives/ref.js';
import flyMoveToward from '../../assets/images/fly-move-toward.png';
import frogHopToward from '../../assets/images/frog-hop-toward.png';
import lizardWalkToward from '../../assets/lizard-walk-toward.png';
import spiderWalkToward from '../../assets/spider-walk-toward.png';
import type { GameMode } from '../../ecs/types';
import { $ } from '../dom';
import {
  isGameMode,
  isMathDifficulty,
  modeLabels,
} from '../labels';
import type { ScreenSpec } from '../screenTypes';
import {
  BTN_CHROME,
  BTN_SIZE,
  inputPromptsSlot,
  OVERLAY_BASE,
  type ScreenSpecActions,
} from './shared';

const HOW_TO_PLAY_STEPS = [
  {
    title: 'Read the equation',
    description: 'Look at the equation above the pond. Empty spots show the numbers you need.',
  },
  {
    title: 'Move to a number',
    description: 'Move the fly from pad to pad. Stop on a number you need.',
  },
  {
    title: 'Eat the number',
    description: 'Press Eat to pick the number. You may need to pick two numbers.',
  },
  {
    title: 'Stay safe',
    description: 'A wrong answer or an animal can take one life. Solve more equations to keep going.',
  },
] as const;

function menuSprite(className: string, imageSrc: string): TemplateResult {
  return html`
    <span
      class="menu-board-sprite ${className}"
      style="background-image: url('${imageSrc}')"
      aria-hidden="true"
    ></span>
  `;
}

function howToPlayStep(
  step: (typeof HOW_TO_PLAY_STEPS)[number],
  index: number,
): TemplateResult {
  return html`
    <li class="how-to-play-step p-3 sm:p-4 md:p-5 rounded-xl">
      <span class="how-to-play-step-number" aria-hidden="true">${index + 1}</span>
      <div>
        <h2 class="text-base md:text-xl font-semibold mb-1">${step.title}</h2>
        <p class="text-sm md:text-base opacity-90">${step.description}</p>
      </div>
    </li>
  `;
}

export function resetModeSelect(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.mode-card').forEach(card => {
    card.classList.remove('ring-2', 'ring-yellow-300');
    card.setAttribute('aria-pressed', 'false');
  });
  const difficultySelect = root.querySelector<HTMLElement>('#difficulty-select');
  difficultySelect?.classList.add('hidden');
  if (difficultySelect) delete difficultySelect.dataset.selectedMode;
}

function selectMode(root: HTMLElement, mode: GameMode): void {
  root.querySelectorAll<HTMLElement>('.mode-card').forEach(card => {
    const selected = card.dataset.mode === mode;
    card.classList.toggle('ring-2', selected);
    card.classList.toggle('ring-yellow-300', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  const difficultySelect = $<HTMLElement>(root, '#difficulty-select');
  $<HTMLElement>(root, '#selected-mode-label').textContent = modeLabels[mode];
  difficultySelect.dataset.selectedMode = mode;
  difficultySelect.classList.remove('hidden');
  $<HTMLButtonElement>(root, '#easy-difficulty').focus();
}

export function createMenuScreenSpec(actions: ScreenSpecActions): ScreenSpec {
  return {
    id: 'main-menu',
    className: `${OVERLAY_BASE} app-background`,
    html: html`
      <div class="menu-shell w-[min(92vw,980px)] px-5 sm:px-7 md:px-9 py-5 sm:py-7 md:py-8 grid gap-5 sm:gap-7 md:gap-9 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] items-center">
        <div class="menu-copy text-center md:text-left">
          <h1 class="menu-title text-gold drop-shadow-lg">
            Math Marsh
          </h1>

          <div class="menu-actions mt-5 sm:mt-7">
            <button @click=${actions.openModeSelect} class="btn-success menu-primary-action ${BTN_CHROME} ${BTN_SIZE.lgResponsive}">
              Start Game
            </button>
            <div class="menu-secondary-actions">
              <button @click=${actions.openHowToPlay} class="btn-primary menu-secondary-action ${BTN_CHROME} ${BTN_SIZE.mdResponsive}">
                How to Play
              </button>
              <button @click=${actions.openSettings} class="btn-primary menu-secondary-action ${BTN_CHROME} ${BTN_SIZE.mdResponsive}">
                Settings
              </button>
              ${actions.quitApplication ? html`
                <button @click=${actions.quitApplication} class="btn-danger menu-secondary-action ${BTN_CHROME} ${BTN_SIZE.mdResponsive}">
                  Quit
                </button>
              ` : nothing}
            </div>
          </div>
        </div>

        <div class="menu-board" aria-hidden="true">
          <div class="menu-board-grid">
            <span class="menu-board-tile menu-board-answer">8</span>
            <span class="menu-board-tile"></span>
            <span class="menu-board-tile menu-board-answer">12</span>
            <span class="menu-board-tile"></span>
            <span class="menu-board-tile"></span>
            <span class="menu-board-tile menu-board-answer">16</span>
            <span class="menu-board-tile"></span>
            <span class="menu-board-tile"></span>
            <span class="menu-board-tile menu-board-answer">24</span>
          </div>
          ${menuSprite('menu-board-frog', frogHopToward)}
          ${menuSprite('menu-board-fly', flyMoveToward)}
          ${menuSprite('menu-board-lizard', lizardWalkToward)}
          ${menuSprite('menu-board-spider', spiderWalkToward)}
          <div class="menu-equation-chip">6 x 4 = ?</div>
        </div>
      </div>

      <button
        ${ref(function connectFullscreenButton(element): void {
          if (!element) return;
          if (!(element instanceof HTMLButtonElement)) throw new Error('Fullscreen control must be a button');
          actions.wireFullscreenButton(element);
        })}
        type="button"
        class="utility-btn absolute top-3 right-3 md:top-4 md:right-4 text-white border-none w-10 h-10 md:w-12 md:h-12 rounded-md cursor-pointer text-lg md:text-xl transition-colors duration-200 flex items-center justify-center z-10"
      >
        ⛶
      </button>
      <div class="input-prompts-slot" data-input-prompts></div>
    `,
    prompts: [
      { action: 'navigate', label: 'Navigate' },
      { action: 'select', label: 'Select' },
    ],
    promptPlacement: 'viewport',
  };
}

export function createModeSelectScreenSpec(actions: ScreenSpecActions): ScreenSpec {
  return {
    id: 'mode-select-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: `
      <div class="text-center max-w-sm md:max-w-3xl landscape:max-w-6xl px-4 md:px-8 py-4 sm:py-6 md:py-12 landscape:py-3 w-full">
        <h1 class="pond-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl landscape:text-2xl landscape:md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 landscape:mb-2 text-gold drop-shadow-lg">
          Select Math Mode
        </h1>

        <p class="text-sm sm:text-base md:text-xl mb-4 sm:mb-6 md:mb-12 opacity-90 leading-relaxed px-2 landscape:hidden">
          Choose an operation, then choose a difficulty.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-5 gap-3 md:gap-6 items-stretch">
          <button type="button" data-mode="addition" data-focusable class="mode-card text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg cursor-pointer text-left">
            <span class="mode-symbol" aria-hidden="true">+</span>
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">Addition</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Solve addition equations with result and operand prompts.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: 2 + 3 = _
            </div>
          </button>

          <button type="button" data-mode="subtraction" data-focusable class="mode-card text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg cursor-pointer text-left">
            <span class="mode-symbol" aria-hidden="true">-</span>
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">Subtraction</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Select subtraction operands in order on operand levels.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: _ - _ = 4
            </div>
          </button>

          <button type="button" data-mode="multiplication" data-focusable class="mode-card border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg cursor-pointer text-left">
            <span class="mode-symbol" aria-hidden="true">x</span>
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">Multiplication</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Build products or find the result tile.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: 3 x 4 = _
            </div>
          </button>

          <button type="button" data-mode="division" data-focusable class="mode-card text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg cursor-pointer text-left">
            <span class="mode-symbol" aria-hidden="true">÷</span>
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">Division</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Solve whole-number division equations.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Example: 12 ÷ 3 = _
            </div>
          </button>

          <button type="button" data-mode="anything" data-focusable class="mode-card text-white border-none p-3 md:p-6 landscape:p-3 rounded-xl shadow-lg cursor-pointer text-left">
            <span class="mode-symbol" aria-hidden="true">?</span>
            <h3 class="text-lg md:text-2xl landscape:text-base font-bold mb-1 md:mb-3 landscape:mb-1">Anything</h3>
            <p class="text-xs md:text-base landscape:text-xs opacity-90 mb-1 md:mb-3 landscape:mb-1">
              Mix addition, subtraction, multiplication, and division prompts.
            </p>
            <div class="text-xs opacity-70 landscape:hidden">
              Operation changes from prompt to prompt.
            </div>
          </button>
        </div>

        <div id="difficulty-select" class="difficulty-panel hidden mt-4 md:mt-8 landscape:mt-3 p-3 md:p-5 rounded-xl backdrop-blur-sm">
          <h2 class="text-base md:text-xl font-semibold mb-3">
            <span id="selected-mode-label">Addition</span> Difficulty
          </h2>
          <div class="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
            <button id="easy-difficulty" type="button" class="difficulty-choice easy text-white border-none px-5 py-3 rounded-lg cursor-pointer transition-colors duration-200 btn-mobile" data-difficulty="easy">Easy</button>
            <button type="button" class="difficulty-choice medium border-none px-5 py-3 rounded-lg cursor-pointer transition-colors duration-200 btn-mobile" data-difficulty="medium">Medium</button>
            <button type="button" class="difficulty-choice expert text-white border-none px-5 py-3 rounded-lg cursor-pointer transition-colors duration-200 btn-mobile" data-difficulty="expert">Expert</button>
          </div>
        </div>

        <button id="back-to-main-btn" class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.mdResponsive} mt-4 md:mt-8 landscape:mt-3">
          ← Back to Menu
        </button>
        ${inputPromptsSlot()}
      </div>
    `,
    prompts: [
      { action: 'navigate', label: 'Navigate' },
      { action: 'select', label: 'Select' },
      { action: 'back', label: 'Back' },
    ],
    promptPlacement: 'viewport',
    wire: (root): void => {
      root.querySelectorAll<HTMLElement>('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
          if (!isGameMode(card.dataset.mode)) return;
          selectMode(root, card.dataset.mode);
        });
      });
      root.querySelectorAll<HTMLButtonElement>('.difficulty-choice').forEach(button => {
        button.addEventListener('click', () => {
          const mode = $<HTMLElement>(root, '#difficulty-select').dataset.selectedMode;
          if (!isGameMode(mode)) return;
          if (!isMathDifficulty(button.dataset.difficulty)) return;
          actions.startGame(mode, button.dataset.difficulty);
        });
      });
      $(root, '#back-to-main-btn').addEventListener('click', actions.goToMenu);
    },
    onCancel: actions.goToMenu,
  };
}

export function createHowToPlayScreenSpec(actions: ScreenSpecActions): ScreenSpec {
  return {
    id: 'how-to-play-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: html`
      <div class="text-center max-w-sm md:max-w-4xl w-full px-4 md:px-8 py-4 sm:py-6 md:py-8 landscape:py-3">
        <h1 class="pond-title text-2xl sm:text-3xl md:text-5xl landscape:text-2xl landscape:md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-gold drop-shadow-lg">
          How to Play
        </h1>
        <p class="text-sm sm:text-base md:text-xl mb-4 sm:mb-5 md:mb-7 opacity-90 leading-relaxed">
          Eat the right numbers to solve the equation. Stay away from pond animals.
        </p>

        <ol class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 text-left">
          ${HOW_TO_PLAY_STEPS.map(howToPlayStep)}
        </ol>

        <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4 md:mt-7 landscape:mt-3">
          <button @click=${actions.startTutorial} class="btn-success ${BTN_CHROME} ${BTN_SIZE.lg} w-full sm:w-auto">
            Play Tutorial
          </button>
          <button @click=${actions.goToMenu} class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.lg} w-full sm:w-auto">
            ← Back to Menu
          </button>
        </div>
        <div class="input-prompts-slot" data-input-prompts></div>
      </div>
    `,
    prompts: [
      { action: 'back', label: 'Back' },
    ],
    promptPlacement: 'viewport',
    onCancel: actions.goToMenu,
  };
}

export function createTutorialOfferScreenSpec(actions: ScreenSpecActions): ScreenSpec {
  return {
    id: 'tutorial-offer-screen',
    className: `${OVERLAY_BASE} app-background`,
    html: html`
      <div class="overlay-panel text-center w-[min(92vw,620px)] px-6 sm:px-8 py-7 sm:py-9">
        <p class="text-sm md:text-base uppercase tracking-widest text-gold font-bold mb-2">First game</p>
        <h1 class="pond-title text-3xl sm:text-4xl md:text-5xl font-bold text-gold drop-shadow-lg">
          Learn on the pond
        </h1>
        <p class="text-base sm:text-lg md:text-xl mt-5 opacity-90 leading-relaxed">
          Try a short game that shows you how to play. You can skip it now and play it again later.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-7">
          <button @click=${actions.startTutorial} class="btn-success ${BTN_CHROME} ${BTN_SIZE.lgResponsive}">
            Start Tutorial
          </button>
          <button @click=${actions.skipTutorial} class="btn-secondary ${BTN_CHROME} ${BTN_SIZE.mdResponsive}">
            Skip and Play
          </button>
        </div>
        <div class="input-prompts-slot" data-input-prompts></div>
      </div>
    `,
    prompts: [
      { action: 'navigate', label: 'Choose' },
      { action: 'select', label: 'Select' },
    ],
    promptPlacement: 'panel',
  };
}
