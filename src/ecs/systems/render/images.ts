import type { GameEngine } from '../../Engine';
import { imageAssetKeyFromSrc } from '../../assets';

export function getCachedImage(ecs: GameEngine, src: string): HTMLImageElement | undefined {
  const key = imageAssetKeyFromSrc(src);
  return key === undefined ? undefined : ecs.tryGetAsset(key);
}
