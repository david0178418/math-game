/**
 * UI Constants
 * Centralized styling and configuration constants for the UI system
 */

export const UI_STYLES = {
  // Color themes
  COLORS: {
    PRIMARY_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    GAME_OVER_BG: 'rgba(0, 0, 0, 0.9)',
    PAUSE_BG: 'rgba(0, 0, 0, 0.8)',
    BUTTON_SUCCESS: 'linear-gradient(45deg, #4CAF50, #45a049)',
    BUTTON_PRIMARY: 'linear-gradient(45deg, #2196F3, #1976D2)',
    BUTTON_WARNING: 'linear-gradient(45deg, #FF9800, #F57C00)',
    BUTTON_DANGER: 'linear-gradient(45deg, #f44336, #d32f2f)',
    BUTTON_SECONDARY: 'linear-gradient(45deg, #607D8B, #455A64)',
    TEXT_GOLD: 'linear-gradient(45deg, #FFD700, #FFA500)',
    HUD_SUCCESS: 'rgba(76, 175, 80, 0.9)',
    HUD_DANGER: 'rgba(244, 67, 54, 0.9)',
    HUD_INFO: 'rgba(33, 150, 243, 0.9)',
    HUD_PURPLE: 'rgba(156, 39, 176, 0.9)',
    HUD_GRAY: 'rgba(96, 125, 139, 0.9)',
    TOP_HUD_BG: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
    BOTTOM_HUD_BG: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
  },

  // Box shadows
  SHADOWS: {
    BUTTON: '0 6px 12px rgba(0, 0, 0, 0.3)',
    BUTTON_HOVER: '0 8px 16px rgba(0, 0, 0, 0.4)',
    BUTTON_SMALL: '0 4px 8px rgba(0, 0, 0, 0.3)',
    HUD_ELEMENT: '0 2px 4px rgba(0,0,0,0.3)',
  },

  // Typography
  FONTS: {
    TITLE_SIZE: '4rem',
    SUBTITLE_SIZE: '2.5rem',
    HEADING_SIZE: '3rem',
    BUTTON_LARGE: '1.3rem',
    BUTTON_MEDIUM: '1.1rem',
    HUD_LARGE: '1.4rem',
    HUD_MEDIUM: '1.2rem',
    HUD_SMALL: '1.1rem',
    BODY: '1rem',
    SMALL: '0.9rem',
  },

  // Spacing
  SPACING: {
    PADDING_LARGE: '40px',
    PADDING_MEDIUM: '20px',
    PADDING_SMALL: '15px',
    MARGIN_LARGE: '30px',
    MARGIN_MEDIUM: '20px',
    MARGIN_SMALL: '15px',
    GAP_LARGE: '30px',
    GAP_MEDIUM: '15px',
    GAP_SMALL: '10px',
  },

  // Border radius
  RADIUS: {
    LARGE: '12px',
    MEDIUM: '8px',
    SMALL: '6px',
  },
} as const;

export const UI_BREAKPOINTS = {
  TABLET: 768,
  MOBILE: 480,
} as const;

export const UI_TIMING = {
  TRANSITION_FAST: '0.2s',
  TRANSITION_NORMAL: '0.3s',
  HOVER_TRANSFORM: 'translateY(-2px)',
  HOVER_TRANSFORM_NONE: 'translateY(0)',
} as const;

export const UI_MESSAGES = {
  LOADING: 'Loading Math Game...',
  ERROR_TITLE: 'Failed to Load Game',
  ERROR_MESSAGE: 'An error occurred while loading the Math Game.',
  ERROR_RETRY: 'Please refresh the page to try again.',
  HIGH_SCORES_COMING_SOON: 'High Scores feature coming soon!',
  CONTROLS_HINT: 'Move with WASD or Arrow Keys • Press SPACE to eat tiles • Avoid red enemies',
  GAME_OVER_TITLE: 'GAME OVER',
  PAUSED_TITLE: 'PAUSED',
  RESUME_HINT: 'Press ESC to resume',
} as const; 