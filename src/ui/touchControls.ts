// Touch / on-screen controls. Drives the existing keyboard-action pipeline
// (ECSpresso input plugin listens on globalThis, reads event.key, ignores
// event.repeat === true) by dispatching synthesized KeyboardEvents — so no
// gameplay system needs to know that touch exists.

export type TouchControlsMode = 'auto' | 'on' | 'off';

const STORAGE_KEY = 'mathmunchers.touchControls';
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
const INITIAL_REPEAT_DELAY_MS = 250;
const REPEAT_INTERVAL_MS = 150;

const MODES: readonly TouchControlsMode[] = ['auto', 'on', 'off'];

const isMode = (value: unknown): value is TouchControlsMode =>
	typeof value === 'string' && MODES.some((m) => m === value);

export const loadTouchControlsMode = (): TouchControlsMode => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return isMode(stored) ? stored : 'auto';
	} catch {
		return 'auto';
	}
};

export const saveTouchControlsMode = (mode: TouchControlsMode): void => {
	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// Storage unavailable (private mode, quota) — in-memory state still
		// drives the current session via applyTouchControlsVisibility.
	}
};

export const isTouchPrimary = (): boolean => {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia(TOUCH_QUERY).matches;
};

export const shouldShowTouchControls = (mode: TouchControlsMode): boolean =>
	mode === 'on' || (mode === 'auto' && isTouchPrimary());

export const applyTouchControlsVisibility = (mode: TouchControlsMode = loadTouchControlsMode()): void => {
	document.body.dataset.touchControls = shouldShowTouchControls(mode) ? 'on' : 'off';
};

const ACTION_KEYS = {
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight',
	eat: ' ',
	pause: 'Escape',
} as const;

type TouchAction = keyof typeof ACTION_KEYS;

const dispatchKey = (type: 'keydown' | 'keyup', key: string): void => {
	window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
};

// Single module-scope visibilitychange listener that fans out to whichever
// buttons are currently pressed — registering one per button leaked listeners
// every time the playing screen was re-mounted.
const activeReleases = new Set<() => void>();
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState !== 'hidden') return;
	activeReleases.forEach((r) => r());
});

type BindOptions = { repeat: boolean };

const bindButton = (button: HTMLButtonElement, action: TouchAction, options: BindOptions): void => {
	const key = ACTION_KEYS[action];
	let timers: { initial: number | null; interval: number | null } = { initial: null, interval: null };

	const clearTimers = (): void => {
		if (timers.initial !== null) window.clearTimeout(timers.initial);
		if (timers.interval !== null) window.clearInterval(timers.interval);
		timers = { initial: null, interval: null };
	};

	const release = (): void => {
		clearTimers();
		activeReleases.delete(release);
		dispatchKey('keyup', key);
	};

	button.addEventListener('pointerdown', (event) => {
		event.preventDefault();
		button.setPointerCapture(event.pointerId);
		activeReleases.add(release);
		dispatchKey('keydown', key);
		if (!options.repeat) return;
		timers.initial = window.setTimeout(() => {
			dispatchKey('keydown', key);
			timers.interval = window.setInterval(() => dispatchKey('keydown', key), REPEAT_INTERVAL_MS);
		}, INITIAL_REPEAT_DELAY_MS);
	});
	button.addEventListener('pointerup', (event) => {
		event.preventDefault();
		release();
	});
	button.addEventListener('pointercancel', release);
	button.addEventListener('lostpointercapture', release);
};

const findButton = (root: ParentNode, id: string): HTMLButtonElement => {
	const el = root.querySelector<HTMLButtonElement>(`#${id}`);
	if (!el) throw new Error(`Touch control button not found: #${id}`);
	return el;
};

export const bindTouchControls = (root: ParentNode): void => {
	bindButton(findButton(root, 'touch-up'), 'up', { repeat: true });
	bindButton(findButton(root, 'touch-down'), 'down', { repeat: true });
	bindButton(findButton(root, 'touch-left'), 'left', { repeat: true });
	bindButton(findButton(root, 'touch-right'), 'right', { repeat: true });
	// Eat: keydown on pointerdown, keyup on pointerup. The two events must
	// straddle a frame so the input plugin's per-frame poll observes the edge.
	bindButton(findButton(root, 'touch-eat'), 'eat', { repeat: false });
};

export { isMode };
