import { GAME_CONFIG } from '../../../config';
import flyImage from '../../../assets/images/fly.svg';
import { FROG_SPRITE_IMAGES } from '../FrogSpriteSystem';
import { ENEMY_SPRITE_IMAGES } from '../EnemySpriteSystem';

const PRELOAD_IMAGES: readonly string[] = [
  flyImage,
  ...FROG_SPRITE_IMAGES,
  ...ENEMY_SPRITE_IMAGES,
  ...Object.values(GAME_CONFIG.ENEMY_TYPES).map(t => t.IMAGE),
];

const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadEntityImages = async (): Promise<void> => {
  const results = await Promise.allSettled(PRELOAD_IMAGES.map(loadImage));
  const failures = results
    .map((r, i) => (r.status === 'rejected' ? PRELOAD_IMAGES[i] : null))
    .filter((src): src is string => src !== null);

  if (failures.length > 0) {
    console.warn('Failed to load some entity images:', failures);
  }
};

export const getCachedImage = (src: string): HTMLImageElement | undefined => imageCache.get(src);
