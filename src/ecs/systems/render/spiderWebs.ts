import { GAME_CONFIG } from '../../../config';
import { cellCenter, timerProgress } from '../../gameUtils';
import type { SpiderWebEntity } from '../../queries';

export const drawEnhancedSpiderWebs = (
  ctx: CanvasRenderingContext2D,
  spiderWebs: SpiderWebEntity[],
  currentTime: number,
): void => {
  for (const webEntity of spiderWebs) {
    const pos = webEntity.components.position;
    const fadeProgress = timerProgress(webEntity.components.timers.webExpiry);
    const baseOpacity = 0.6 * fadeProgress;

    ctx.save();

    ctx.fillStyle = `rgba(128, 0, 128, ${baseOpacity * 0.3})`;
    ctx.fillRect(pos.x + 5, pos.y + 5, GAME_CONFIG.GRID.CELL_SIZE - 10, GAME_CONFIG.GRID.CELL_SIZE - 10);

    const { x: centerX, y: centerY } = cellCenter(pos);
    const webSize = GAME_CONFIG.GRID.CELL_SIZE * 0.4;

    ctx.strokeStyle = `rgba(160, 32, 160, ${baseOpacity})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = centerX + Math.cos(angle) * 8;
      const y1 = centerY + Math.sin(angle) * 8;
      const x2 = centerX + Math.cos(angle) * webSize;
      const y2 = centerY + Math.sin(angle) * webSize;

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }

    for (let radius = 8; radius <= webSize; radius += 12) {
      ctx.moveTo(centerX + radius, centerY);
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    }

    ctx.stroke();

    if (fadeProgress > 0.5) {
      const sparkleOpacity = (fadeProgress - 0.5) * 2;
      ctx.fillStyle = `rgba(200, 100, 200, ${sparkleOpacity * 0.8})`;

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + (currentTime * 0.001);
        const sparkleX = centerX + Math.cos(angle) * webSize * 0.8;
        const sparkleY = centerY + Math.sin(angle) * webSize * 0.8;

        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }
};
