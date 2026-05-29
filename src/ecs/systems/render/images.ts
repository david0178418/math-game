import { gameEngine } from '../../Engine';
import { imageAssetKeyFromSrc } from '../../assets';

export function getCachedImage(src: string): HTMLImageElement | undefined {
  const key = imageAssetKeyFromSrc(src);
  return key === undefined ? undefined : gameEngine.tryGetAsset(key);
}
