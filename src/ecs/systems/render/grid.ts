import { GAME_CONFIG } from '../../../config';

const boardWidth = GAME_CONFIG.GRID.WIDTH * GAME_CONFIG.GRID.CELL_SIZE;
const boardHeight = GAME_CONFIG.GRID.HEIGHT * GAME_CONFIG.GRID.CELL_SIZE;
const cell = GAME_CONFIG.GRID.CELL_SIZE;

type Ripple = {
  x: number;
  y: number;
  width: number;
  alpha: number;
};

const pondRipples: Ripple[] = Array.from(
  { length: GAME_CONFIG.GRID.HEIGHT },
  (_, row) => row,
).flatMap(row =>
  Array.from({ length: GAME_CONFIG.GRID.WIDTH }, (_, column) => ({
    x: column * cell + cell * (0.24 + ((row + column) % 3) * 0.21),
    y: row * cell + cell * (0.26 + ((row * 2 + column) % 4) * 0.14),
    width: 12 + ((row + column * 2) % 4) * 5,
    alpha: 0.10 + ((row * 3 + column) % 3) * 0.035,
  })),
);

const drawWater = (ctx: CanvasRenderingContext2D): void => {
  const gradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
  gradient.addColorStop(0, '#4fb7c5');
  gradient.addColorStop(0.45, '#237f91');
  gradient.addColorStop(1, '#135466');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, boardWidth, boardHeight);
};

const drawSoftPondEdges = (ctx: CanvasRenderingContext2D): void => {
  ctx.strokeStyle = 'rgba(64, 115, 65, 0.52)';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, boardWidth - 16, boardHeight - 16);

  ctx.strokeStyle = 'rgba(222, 209, 137, 0.28)';
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, boardWidth - 36, boardHeight - 36);
};

const drawRipple = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  alpha: number,
): void => {
  ctx.strokeStyle = `rgba(213, 246, 244, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, width, width * 0.18, -0.18, 0, Math.PI * 2);
  ctx.stroke();
};

const drawCellRipples = (ctx: CanvasRenderingContext2D): void => {
  pondRipples.forEach(({ x, y, width, alpha }) => {
    drawRipple(ctx, x, y, width, alpha);
  });
};

export const drawGrid = (ctx: CanvasRenderingContext2D): void => {
  ctx.save();
  drawWater(ctx);
  drawCellRipples(ctx);
  drawSoftPondEdges(ctx);
  ctx.restore();
};
