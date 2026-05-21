import { GAME_CONFIG } from '../../../config';
import { gridToPixel } from '../../gameUtils';
import type { PlayerEntity } from '../../queries';

export const drawTargetHighlight = (
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity | undefined,
): void => {
  if (!player) return;

  const breadcrumbs = player.components.pathFollower.breadcrumbs;
  if (breadcrumbs.length === 0) return;

  const cell = GAME_CONFIG.GRID.CELL_SIZE;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 80, 80, 0.22)';

  breadcrumbs.slice(0, -1).forEach((crumb) => {
    const { x, y } = gridToPixel(crumb.x, crumb.y);
    ctx.fillRect(x, y, cell, cell);
  });

  const target = breadcrumbs[breadcrumbs.length - 1];
  const { x, y } = gridToPixel(target.x, target.y);
  ctx.fillStyle = 'rgba(255, 80, 80, 0.55)';
  ctx.fillRect(x, y, cell, cell);

  ctx.restore();
};
