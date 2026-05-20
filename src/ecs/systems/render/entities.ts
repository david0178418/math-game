import { GAME_CONFIG } from '../../../config';
import { cellCenter } from '../../gameUtils';
import type { AllComponents } from '../../types';
import { getCachedImage } from './images';

type Renderable = AllComponents['renderable'];

const MAX_IMAGE_SIZE = GAME_CONFIG.GRID.CELL_SIZE * 0.8;

const calculateImageDimensions = (
  img: HTMLImageElement,
  requestedWidth?: number,
  requestedHeight?: number,
): { width: number; height: number } => {
  const aspectRatio = img.width / img.height;
  const width0 = requestedWidth || MAX_IMAGE_SIZE;
  const height0 = requestedHeight || MAX_IMAGE_SIZE;

  if (aspectRatio > 1) {
    const heightFromWidth = width0 / aspectRatio;
    if (heightFromWidth > MAX_IMAGE_SIZE) {
      return { width: MAX_IMAGE_SIZE * aspectRatio, height: MAX_IMAGE_SIZE };
    }
    return { width: width0, height: heightFromWidth };
  }

  const widthFromHeight = height0 * aspectRatio;
  if (widthFromHeight > MAX_IMAGE_SIZE) {
    return { width: MAX_IMAGE_SIZE, height: MAX_IMAGE_SIZE / aspectRatio };
  }
  return { width: widthFromHeight, height: height0 };
};

interface ShapeArgs {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  rotation: number;
  renderable: Renderable;
  deathScale: number;
}

const drawImageShape = ({ ctx, centerX, centerY, rotation, renderable, deathScale }: ShapeArgs): void => {
  const img = renderable.imageSrc ? getCachedImage(renderable.imageSrc) : undefined;
  if (!img || !img.complete) {
    ctx.fillStyle = renderable.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (renderable.size / 2) * deathScale, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const { width, height } = calculateImageDimensions(img, renderable.imageWidth, renderable.imageHeight);
  const scaledWidth = width * deathScale;
  const scaledHeight = height * deathScale;

  if (rotation === 0) {
    ctx.drawImage(img, centerX - scaledWidth / 2, centerY - scaledHeight / 2, scaledWidth, scaledHeight);
    return;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  ctx.restore();
};

const drawCircleShape = ({ ctx, centerX, centerY, renderable, deathScale }: ShapeArgs): void => {
  ctx.fillStyle = renderable.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, (renderable.size / 2) * deathScale, 0, Math.PI * 2);
  ctx.fill();
};

const drawRectangleShape = ({ ctx, centerX, centerY, renderable, deathScale }: ShapeArgs): void => {
  ctx.fillStyle = renderable.color;
  const halfSize = (renderable.size / 2) * deathScale;
  ctx.fillRect(
    centerX - halfSize,
    centerY - halfSize,
    renderable.size * deathScale,
    renderable.size * deathScale,
  );
};

const SHAPE_RENDERERS: Record<Renderable['shape'], (args: ShapeArgs) => void> = {
  image: drawImageShape,
  circle: drawCircleShape,
  rectangle: drawRectangleShape,
};

export interface DrawEntityArgs {
  position: { x: number; y: number; rotation?: number };
  renderable: Renderable;
  isInvulnerable: boolean;
  deathScale: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
}

export const drawEntity = (ctx: CanvasRenderingContext2D, args: DrawEntityArgs): void => {
  const { position, renderable, isInvulnerable, deathScale, shakeOffsetX, shakeOffsetY } = args;
  const center = cellCenter(position);

  ctx.save();
  if (isInvulnerable) ctx.globalAlpha = 0.5;

  SHAPE_RENDERERS[renderable.shape]({
    ctx,
    centerX: center.x + shakeOffsetX,
    centerY: center.y + shakeOffsetY,
    rotation: position.rotation ?? 0,
    renderable,
    deathScale,
  });

  ctx.restore();
};
