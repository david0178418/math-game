import { GAME_CONFIG } from '../../../config';

const boardWidth = GAME_CONFIG.GRID.WIDTH * GAME_CONFIG.GRID.CELL_SIZE;
const boardHeight = GAME_CONFIG.GRID.HEIGHT * GAME_CONFIG.GRID.CELL_SIZE;
const cell = GAME_CONFIG.GRID.CELL_SIZE;
const waterHighlightOffsets = [0, boardWidth * 0.38, boardWidth * 0.76] as const;
const reedOffsets = [0, 7, 14] as const;

type Ripple = {
  x: number;
  y: number;
  width: number;
  alpha: number;
  phase: number;
};

type PondBubble = {
  x: number;
  y: number;
  radius: number;
  phase: number;
};

type ReedCluster = {
  x: number;
  y: number;
  direction: -1 | 1;
  phase: number;
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
    phase: row * 1.7 + column * 0.9,
  })),
);

const pondBubbles: PondBubble[] = [
  { x: cell * 0.72, y: cell * 1.56, radius: 3.2, phase: 0.2 },
  { x: cell * 2.42, y: cell * 0.74, radius: 2.4, phase: 0.66 },
  { x: cell * 4.88, y: cell * 1.92, radius: 3.6, phase: 0.42 },
  { x: cell * 1.36, y: cell * 3.72, radius: 2.8, phase: 0.84 },
  { x: cell * 3.64, y: cell * 4.24, radius: 2.2, phase: 0.08 },
] as const;

const reedClusters: ReedCluster[] = [
  { x: 15, y: cell * 0.86, direction: 1, phase: 0.2 },
  { x: 13, y: cell * 3.48, direction: 1, phase: 1.6 },
  { x: boardWidth - 14, y: cell * 1.62, direction: -1, phase: 0.9 },
  { x: boardWidth - 15, y: cell * 4.12, direction: -1, phase: 2.3 },
] as const;

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

function drawWaterHighlights(ctx: CanvasRenderingContext2D, currentTime: number): void {
  const travel = (currentTime * 0.014) % (boardWidth + cell * 2) - cell;

  ctx.save();
  ctx.strokeStyle = 'rgba(213, 246, 244, 0.075)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  waterHighlightOffsets.forEach((offset, index) => {
    const x = (travel + offset) % (boardWidth + cell) - cell * 0.5;
    const y = cell * (0.8 + index * 1.6);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + cell * 0.75, y - 12, x + cell * 1.5, y + 2);
    ctx.stroke();
  });
  ctx.restore();
}

function drawCellRipples(ctx: CanvasRenderingContext2D, currentTime: number): void {
  pondRipples.forEach(({ x, y, width, alpha, phase }) => {
    const pulse = (Math.sin(currentTime * 0.0011 + phase) + 1) * 0.5;
    drawRipple(ctx, x, y + pulse * 1.5, width + pulse * 5, alpha * (0.58 + pulse * 0.42));
  });
}

function drawBubbles(ctx: CanvasRenderingContext2D, currentTime: number): void {
  pondBubbles.forEach(({ x, y, radius, phase }) => {
    const progress = (currentTime * 0.00012 + phase) % 1;
    const alpha = Math.sin(progress * Math.PI) * 0.24;
    const rise = progress * cell * 0.28;

    ctx.strokeStyle = `rgba(225, 252, 247, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - rise, radius * (0.75 + progress * 0.4), 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawReedCluster(
  ctx: CanvasRenderingContext2D,
  cluster: ReedCluster,
  currentTime: number,
): void {
  const sway = Math.sin(currentTime * 0.0008 + cluster.phase) * 3;

  ctx.strokeStyle = 'rgba(33, 91, 48, 0.58)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  reedOffsets.forEach((offset, index) => {
    const rootX = cluster.x + cluster.direction * offset;
    const height = 23 + index * 5;
    ctx.beginPath();
    ctx.moveTo(rootX, cluster.y + 15);
    ctx.quadraticCurveTo(
      rootX + cluster.direction * 4,
      cluster.y - height * 0.45,
      rootX + cluster.direction * (8 + sway),
      cluster.y - height,
    );
    ctx.stroke();
  });
}

function drawEdgeReeds(ctx: CanvasRenderingContext2D, currentTime: number): void {
  reedClusters.forEach(cluster => drawReedCluster(ctx, cluster, currentTime));
}

export const drawGrid = (ctx: CanvasRenderingContext2D, currentTime: number): void => {
  ctx.save();
  drawWater(ctx);
  drawWaterHighlights(ctx, currentTime);
  drawCellRipples(ctx, currentTime);
  drawBubbles(ctx, currentTime);
  drawEdgeReeds(ctx, currentTime);
  drawSoftPondEdges(ctx);
  ctx.restore();
};
