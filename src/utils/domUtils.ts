/**
 * DOM Utility Functions
 * Common DOM manipulation and styling helpers
 */

import { UI_STYLES, UI_TIMING } from '../game/UIConstants';

/**
 * Create a styled button element
 */
export function createStyledButton(
  text: string,
  id: string,
  style: 'success' | 'primary' | 'warning' | 'danger' | 'secondary',
  size: 'large' | 'medium' = 'medium'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = id;
  button.textContent = text;
  
  const styleMap = {
    success: UI_STYLES.COLORS.BUTTON_SUCCESS,
    primary: UI_STYLES.COLORS.BUTTON_PRIMARY,
    warning: UI_STYLES.COLORS.BUTTON_WARNING,
    danger: UI_STYLES.COLORS.BUTTON_DANGER,
    secondary: UI_STYLES.COLORS.BUTTON_SECONDARY,
  };
  
  const sizeMap = {
    large: {
      padding: '15px 40px',
      fontSize: UI_STYLES.FONTS.BUTTON_LARGE,
      shadow: UI_STYLES.SHADOWS.BUTTON,
      minWidth: '200px',
    },
    medium: {
      padding: '12px 30px',
      fontSize: UI_STYLES.FONTS.BUTTON_MEDIUM,
      shadow: UI_STYLES.SHADOWS.BUTTON_SMALL,
      minWidth: '200px',
    },
  };
  
  const sizeStyle = sizeMap[size];
  
  button.style.cssText = `
    background: ${styleMap[style]};
    color: white;
    border: none;
    padding: ${sizeStyle.padding};
    font-size: ${sizeStyle.fontSize};
    border-radius: ${UI_STYLES.RADIUS.LARGE};
    cursor: pointer;
    box-shadow: ${sizeStyle.shadow};
    transition: all ${UI_TIMING.TRANSITION_NORMAL} ease;
    min-width: ${sizeStyle.minWidth};
  `;
  
  // Add hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = UI_TIMING.HOVER_TRANSFORM;
    button.style.boxShadow = UI_STYLES.SHADOWS.BUTTON_HOVER;
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = UI_TIMING.HOVER_TRANSFORM_NONE;
    button.style.boxShadow = sizeStyle.shadow;
  });
  
  return button;
}

/**
 * Create a styled container div
 */
export function createStyledContainer(styles: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const container = document.createElement('div');
  Object.assign(container.style, styles);
  return container;
}

/**
 * Create a HUD display element
 */
export function createHUDElement(
  id: string,
  text: string,
  colorType: 'success' | 'danger' | 'info' | 'purple' | 'gray'
): HTMLDivElement {
  const element = document.createElement('div');
  element.id = id;
  element.textContent = text;
  
  const colorMap = {
    success: UI_STYLES.COLORS.HUD_SUCCESS,
    danger: UI_STYLES.COLORS.HUD_DANGER,
    info: UI_STYLES.COLORS.HUD_INFO,
    purple: UI_STYLES.COLORS.HUD_PURPLE,
    gray: UI_STYLES.COLORS.HUD_GRAY,
  };
  
  element.style.cssText = `
    font-size: ${UI_STYLES.FONTS.HUD_LARGE};
    background: ${colorMap[colorType]};
    padding: 8px 16px;
    border-radius: ${UI_STYLES.RADIUS.MEDIUM};
    box-shadow: ${UI_STYLES.SHADOWS.HUD_ELEMENT};
  `;
  
  return element;
}

/**
 * Safe DOM element selection with error handling
 */
export function safeQuerySelector<T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): T | null {
  try {
    return parent.querySelector<T>(selector);
  } catch (error) {
    console.warn(`Failed to select element: ${selector}`, error);
    return null;
  }
}

/**
 * Set multiple CSS properties at once
 */
export function setStyles(element: HTMLElement, styles: Record<string, string>): void {
  for (const [property, value] of Object.entries(styles)) {
    element.style.setProperty(property, value);
  }
}

/**
 * Create a responsive container with proper spacing
 */
export function createResponsiveContainer(content: string): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = content;
  
  container.style.cssText = `
    text-align: center;
    max-width: 600px;
    padding: ${UI_STYLES.SPACING.PADDING_LARGE};
    margin: 0 auto;
  `;
  
  return container;
} 