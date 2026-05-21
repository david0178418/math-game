// iOS Safari on iPhone doesn't implement requestFullscreen; callers should
// hide their UI when isFullscreenSupported() returns false.
export const isFullscreenSupported = (): boolean =>
	typeof document.documentElement.requestFullscreen === 'function';

export const isFullscreenActive = (): boolean => document.fullscreenElement !== null;

export const toggleFullscreen = async (): Promise<void> => {
	if (isFullscreenActive()) {
		await document.exitFullscreen();
		return;
	}
	await document.documentElement.requestFullscreen();
};

export const onFullscreenChange = (handler: () => void): void => {
	document.addEventListener('fullscreenchange', handler);
};
