import { GAME_CONFIG } from '../../../config';
import { gridToPixel } from '../../gameUtils';
import type { PlayerEntity } from '../../queries';

const DASH = [4, 3];

export const drawTargetHighlight = (
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity | undefined,
  currentTime: number,
): void => {
  if (!player) return;

  const target = player.components.pathFollower.breadcrumbs.at(-1);
  if (!target) return;

  const { x, y } = gridToPixel(target.x, target.y);
  const cell = GAME_CONFIG.GRID.CELL_SIZE;
  const alpha = 0.3 + 0.15 * Math.sin(currentTime / 350);

  ctx.save();
  ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
  ctx.fillRect(x, y, cell, cell);
  ctx.strokeStyle = 'rgba(255, 60, 60, 0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash(DASH);
  ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
  ctx.restore();
};
