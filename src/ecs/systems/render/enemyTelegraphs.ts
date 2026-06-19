import { GAME_CONFIG } from '../../../config';
import { cellCenter, clamp, timerElapsedProgress } from '../../gameUtils';
import type { EnemyEntity } from '../../queries';
import type { GameTimer } from '../../types';

const cell = GAME_CONFIG.GRID.CELL_SIZE;
const ringOffsets = [0, 0.16, 0.32] as const;

const easeOutCubic = (value: number): number => 1 - (1 - value) ** 3;

export function enemyEmergencePresentation(
  timer: GameTimer | undefined,
): { opacity: number; scale: number } {
  const progress = timerElapsedProgress(timer);
  const emergence = clamp((progress - 0.46) / 0.54, 0, 1);
  return {
    opacity: emergence,
    scale: 0.68 + easeOutCubic(emergence) * 0.32,
  };
}

export function drawEnemySpawnTelegraphs(
  ctx: CanvasRenderingContext2D,
  enemies: EnemyEntity[],
  currentTime: number,
  reducedMotion: boolean,
): void {
  enemies.forEach(enemy => {
    const timer = enemy.components.timers.enemySpawnTelegraph;
    if (!timer?.active) return;

    const progress = timerElapsedProgress(timer);
    const fade = 1 - progress * 0.48;
    const pulse = reducedMotion ? 0 : Math.sin(currentTime * 0.018) * 2.5;
    const { x, y } = cellCenter(enemy.components.position);

    ctx.save();
    ctx.fillStyle = `rgba(8, 39, 51, ${0.42 * fade})`;
    ctx.beginPath();
    ctx.ellipse(x, y, cell * 0.36 + pulse, cell * 0.15 + pulse * 0.35, -0.18, 0, Math.PI * 2);
    ctx.fill();

    ringOffsets.forEach(offset => {
      const ringProgress = clamp((progress - offset) / (1 - offset), 0, 1);
      const radius = cell * (0.12 + easeOutCubic(ringProgress) * 0.42);
      ctx.strokeStyle = `rgba(188, 236, 230, ${(1 - ringProgress) * 0.72})`;
      ctx.lineWidth = 4 - ringProgress * 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.38, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  });
}
