import { GAME_CONFIG } from '../../../config';
import { preloadEntityImages } from './images';

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

const resizeCanvas = (): void => {
  if (!canvas) return;

  const gameWidth = GAME_CONFIG.GRID.WIDTH * GAME_CONFIG.GRID.CELL_SIZE;
  const gameHeight = GAME_CONFIG.GRID.HEIGHT * GAME_CONFIG.GRID.CELL_SIZE;

  const scaleX = (window.innerWidth * 0.8) / gameWidth;
  const scaleY = (window.innerHeight * 0.8) / gameHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  canvas.width = gameWidth;
  canvas.height = gameHeight;

  canvas.style.width = `${gameWidth * scale}px`;
  canvas.style.height = `${gameHeight * scale}px`;
  canvas.style.position = 'absolute';
  canvas.style.left = '50%';
  canvas.style.top = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';

  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
};

export const initializeRenderSystem = (canvasElement: HTMLCanvasElement): void => {
  const isFirstInit = canvas === null;

  canvas = canvasElement;
  ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get 2D rendering context');

  resizeCanvas();

  if (isFirstInit) {
    window.addEventListener('resize', resizeCanvas);
    void preloadEntityImages();
  }
};

export const cleanupRenderSystem = (): void => {
  window.removeEventListener('resize', resizeCanvas);
};

export const getCtx = (): CanvasRenderingContext2D | null => ctx;
