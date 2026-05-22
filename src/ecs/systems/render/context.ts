import { GAME_CONFIG } from '../../../config';
import { preloadEntityImages } from './images';

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let observer: ResizeObserver | null = null;
let observedTarget: Element | null = null;

export const renderMargin = (): number =>
	Math.ceil(GAME_CONFIG.GRID.CELL_SIZE * GAME_CONFIG.RENDER.PLAY_AREA_MARGIN_RATIO);

const canvasPixelSize = (): { width: number; height: number } => {
	const margin = renderMargin();
	const gridWidth = GAME_CONFIG.GRID.WIDTH * GAME_CONFIG.GRID.CELL_SIZE;
	const gridHeight = GAME_CONFIG.GRID.HEIGHT * GAME_CONFIG.GRID.CELL_SIZE;
	return {
		width: gridWidth + margin * 2,
		height: gridHeight + margin * 2,
	};
};

const resizeCanvas = (): void => {
	if (!canvas) return;

	const gameSize = canvasPixelSize();

	// #canvas-container is a flex-1 region between the top HUD and bottom hints
	// / on-screen touch controls. Sizing against its rect (instead of the window)
	// makes the canvas grow into space the surrounding chrome leaves behind.
	const container = canvas.parentElement;
	const availW = container?.clientWidth ?? window.innerWidth;
	const availH = container?.clientHeight ?? window.innerHeight;

	const scale = Math.min(availW / gameSize.width, availH / gameSize.height, 1);

	canvas.width = gameSize.width;
	canvas.height = gameSize.height;

	canvas.style.width = `${gameSize.width * scale}px`;
	canvas.style.height = `${gameSize.height * scale}px`;

	if (ctx) {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.imageSmoothingEnabled = false;
	}
};

// ResizeObserver fires after the browser has committed the new layout, so the
// container's reported rect is always current. `orientationchange` / `resize`
// fire too early on some browsers and can leave the canvas sized against a
// stale rect — observing the container directly avoids that.
const observeContainer = (target: Element): void => {
	if (typeof ResizeObserver === 'undefined') return;
	if (observer && observedTarget === target) return;
	observer?.disconnect();
	observer = new ResizeObserver(() => resizeCanvas());
	observer.observe(target);
	observedTarget = target;
};

export const initializeRenderSystem = (canvasElement: HTMLCanvasElement): void => {
	const isFirstInit = canvas === null;

	canvas = canvasElement;
	ctx = canvas.getContext('2d');

	if (!ctx) throw new Error('Failed to get 2D rendering context');

	resizeCanvas();

	const container = canvas.parentElement;
	if (container) observeContainer(container);

	if (isFirstInit) {
		// Belt-and-suspenders fallback for environments without ResizeObserver.
		window.addEventListener('resize', resizeCanvas);
		void preloadEntityImages();
	}
};

export const cleanupRenderSystem = (): void => {
	window.removeEventListener('resize', resizeCanvas);
	observer?.disconnect();
	observer = null;
	observedTarget = null;
};

export const getCtx = (): CanvasRenderingContext2D | null => ctx;

// Called from UIManager when overlay chrome (touch controls, HUD visibility)
// changes the available area without firing a window resize event.
export const requestCanvasResize = (): void => resizeCanvas();
