import { GAME_CONFIG } from '../../../config';

export const drawGrid = (ctx: CanvasRenderingContext2D): void => {
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  for (let x = 0; x <= GAME_CONFIG.GRID.WIDTH; x++) {
    const pixelX = x * GAME_CONFIG.GRID.CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pixelX, 0);
    ctx.lineTo(pixelX, GAME_CONFIG.GRID.HEIGHT * GAME_CONFIG.GRID.CELL_SIZE);
    ctx.stroke();
  }

  for (let y = 0; y <= GAME_CONFIG.GRID.HEIGHT; y++) {
    const pixelY = y * GAME_CONFIG.GRID.CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, pixelY);
    ctx.lineTo(GAME_CONFIG.GRID.WIDTH * GAME_CONFIG.GRID.CELL_SIZE, pixelY);
    ctx.stroke();
  }
};
