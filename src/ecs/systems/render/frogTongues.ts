import { GAME_CONFIG } from '../../../config';
import { cellCenter, gridCellCenter } from '../../gameUtils';
import type { FrogTongueEntity } from '../../queries';

type Tongue = FrogTongueEntity['components']['frogTongue'];
type ActivePhase = Exclude<Tongue['phase'], 'idle'>;
type TongueLayer = 'behindFrog' | 'aboveFrog';
type DirectionKey = 'away' | 'toward' | 'left' | 'right';
type TonguePresentation = {
  anchor: { x: number; y: number };
  layer: TongueLayer;
  flattenToAnchorY: boolean;
};

interface TongueStyle {
  baseOpacity: number;
  lineWidth: number;
  tongueRGB: string;
}

const DEFAULT_RGB = '255, 20, 147';
const CELL = GAME_CONFIG.GRID.CELL_SIZE;
const AWAY_MOUTH_ANCHOR = { x: 0, y: -0.40 } as const;
const TOWARD_MOUTH_ANCHOR = { x: 0, y: -0.31 } as const;
const SIDE_MOUTH_ANCHOR = { x: 0.14, y: -0.34 } as const;

const TONGUE_PRESENTATION: Record<DirectionKey, TonguePresentation> = {
  away: {
    anchor: AWAY_MOUTH_ANCHOR,
    layer: 'behindFrog',
    flattenToAnchorY: false,
  },
  toward: {
    anchor: TOWARD_MOUTH_ANCHOR,
    layer: 'aboveFrog',
    flattenToAnchorY: false,
  },
  left: {
    anchor: { x: -SIDE_MOUTH_ANCHOR.x, y: SIDE_MOUTH_ANCHOR.y },
    layer: 'aboveFrog',
    flattenToAnchorY: true,
  },
  right: {
    anchor: SIDE_MOUTH_ANCHOR,
    layer: 'aboveFrog',
    flattenToAnchorY: true,
  },
} as const;

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

function directionKey({ x, y }: Tongue['direction']): DirectionKey {
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'away' : 'toward';
}

function tonguePresentation(tongue: Tongue): TonguePresentation {
  return TONGUE_PRESENTATION[directionKey(tongue.direction)];
}

function mouthAnchor(
  position: FrogTongueEntity['components']['position'],
  anchor: TonguePresentation['anchor'],
): { x: number; y: number } {
  const center = cellCenter(position);
  return {
    x: center.x + anchor.x * CELL,
    y: center.y + anchor.y * CELL,
  };
}

function visibleTonguePoints(
  tongue: Tongue,
  mouthY: number,
  flattenToAnchorY: boolean,
): Array<{ x: number; y: number }> {
  const gridPoints = tongue.segments.map(s => gridCellCenter(s.x, s.y));
  if (!flattenToAnchorY) return gridPoints;
  return gridPoints.map(({ x }) => ({ x, y: mouthY }));
}

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
  layer: TongueLayer = 'aboveFrog',
): void => {
  for (const frog of frogs) {
    const tongue = frog.components.frogTongue;
    if (tongue.phase === 'idle' || tongue.segments.length === 0) continue;
    const presentation = tonguePresentation(tongue);
    if (presentation.layer !== layer) continue;

    const { x: mouthX, y: mouthY } = mouthAnchor(frog.components.position, presentation.anchor);
    const { baseOpacity, lineWidth, tongueRGB } = TONGUE_PHASE_STYLES[tongue.phase](currentTime, tongue);
    const segmentCenters = visibleTonguePoints(tongue, mouthY, presentation.flattenToAnchorY);

    ctx.save();

    ctx.strokeStyle = `rgba(120, 10, 80, ${baseOpacity * 0.3})`;
    ctx.lineWidth = lineWidth + 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(mouthX + 2, mouthY + 2);
    for (const { x, y } of segmentCenters) ctx.lineTo(x + 2, y + 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${tongueRGB}, ${baseOpacity})`;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(mouthX, mouthY);
    for (const { x, y } of segmentCenters) ctx.lineTo(x, y);
    ctx.stroke();

    const { x: tipX, y: tipY } = segmentCenters[segmentCenters.length - 1];
    drawTongueTip(ctx, tipX, tipY, baseOpacity);

    ctx.restore();
  }
};
