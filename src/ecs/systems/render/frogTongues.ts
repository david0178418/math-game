import { GAME_CONFIG } from '../../../config';
import { cellCenter, gridCellCenter } from '../../gameUtils';
import type { FrogTongueEntity } from '../../queries';

type Tongue = FrogTongueEntity['components']['frogTongue'];
type ActivePhase = Exclude<Tongue['phase'], 'idle'>;

interface TongueStyle {
  baseOpacity: number;
  lineWidth: number;
  tongueRGB: string;
}

const DEFAULT_RGB = '255, 20, 147';

const TONGUE_PHASE_STYLES: Record<ActivePhase, (currentTime: number, tongue: Tongue) => TongueStyle> = {
  extending: (currentTime) => {
    const pulse = 0.8 + 0.2 * Math.sin(currentTime * 0.01);
    return { baseOpacity: pulse, lineWidth: 8 * pulse, tongueRGB: DEFAULT_RGB };
  },
  holding: () => ({ baseOpacity: 1.0, lineWidth: 10, tongueRGB: '255, 50, 150' }),
  retracting: (_, tongue) => {
    const fade = Math.max(0.3, tongue.currentLength / (tongue.maxRange * GAME_CONFIG.GRID.CELL_SIZE));
    return { baseOpacity: fade, lineWidth: 8, tongueRGB: DEFAULT_RGB };
  },
};

const drawTongueTip = (
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  baseOpacity: number,
): void => {
  const glowRadius = 12;
  const gradient = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowRadius);
  gradient.addColorStop(0, `rgba(${DEFAULT_RGB}, ${baseOpacity * 0.8})`);
  gradient.addColorStop(0.5, `rgba(${DEFAULT_RGB}, ${baseOpacity * 0.3})`);
  gradient.addColorStop(1, `rgba(${DEFAULT_RGB}, 0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(tipX, tipY, glowRadius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = `rgba(${DEFAULT_RGB}, ${baseOpacity})`;
  ctx.beginPath();
  ctx.arc(tipX, tipY, 6, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 150, 200, ${baseOpacity * 0.8})`;
  ctx.beginPath();
  ctx.arc(tipX - 2, tipY - 2, 3, 0, 2 * Math.PI);
  ctx.fill();
};

export const drawEnhancedFrogTongues = (
  ctx: CanvasRenderingContext2D,
  frogs: FrogTongueEntity[],
  currentTime: number,
): void => {
  for (const frog of frogs) {
    const tongue = frog.components.frogTongue;
    if (tongue.phase === 'idle' || tongue.segments.length === 0) continue;

    const { x: frogCenterX, y: frogCenterY } = cellCenter(frog.components.position);
    const { baseOpacity, lineWidth, tongueRGB } = TONGUE_PHASE_STYLES[tongue.phase](currentTime, tongue);
    const segmentCenters = tongue.segments.map(s => gridCellCenter(s.x, s.y));

    ctx.save();

    ctx.strokeStyle = `rgba(120, 10, 80, ${baseOpacity * 0.3})`;
    ctx.lineWidth = lineWidth + 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(frogCenterX + 2, frogCenterY + 2);
    for (const { x, y } of segmentCenters) ctx.lineTo(x + 2, y + 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${tongueRGB}, ${baseOpacity})`;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(frogCenterX, frogCenterY);
    for (const { x, y } of segmentCenters) ctx.lineTo(x, y);
    ctx.stroke();

    const { x: tipX, y: tipY } = segmentCenters[segmentCenters.length - 1];
    drawTongueTip(ctx, tipX, tipY, baseOpacity);

    ctx.restore();
  }
};
