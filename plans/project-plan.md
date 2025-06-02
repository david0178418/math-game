# Project Plan: Math Game
## Overview

"Math Game" is a client-side, web-based educational game inspired by "Number Munchers." Players will navigate a grid, "eating" numbers or solving math problems that match a given criterion while avoiding AI-controlled enemies. The game will use web technologies to ensure it runs entirely in the browser, requiring no server-side infrastructure, and will be designed for easy distribution via a Content Delivery Network (CDN) and potentially run as an offline PWA.

# Objectives
- Create a functional game that mirrors the core mechanics of "Number Munchers" with a focus on math-based challenges.
- Utilize simple geometric shapes (e.g., circles, squares, rectangles) and basic colors for visuals, pending a final theme.
- Ensure the game operates entirely client-side, with all logic and assets handled in the browser.

# Technology Stack

## Core Technologies
- Frontend: HTML5, CSS3, TypeScript (all strict options enabled)
- Rendering: HTML5 Canvas for efficient 2D game rendering

## Build Tools & Development Environment
- Build System: **Vite** (fast development server, optimized production builds)
- Package Manager: **npm** or **pnpm** (for faster installs)
- TypeScript Compiler: **tsc** with strict mode enabled
- Linting: **ESLint** with TypeScript support (@typescript-eslint/parser)

## Libraries & Frameworks
- **Entity Component System**: **ECSpresso** (minimal ECS library for TypeScript/JavaScript)
- Animation: **requestAnimationFrame** (native) with optional **GSAP** for complex animations
- Audio: **Howler.js** (cross-browser audio support, better than Web Audio API for games)
- Math Utilities: **Custom implementation** (no external library needed for basic math operations)
- Canvas Utilities: **Konva.js** (optional, for advanced canvas management) or **native Canvas API**
- Game Loop: **ECSpresso systems** with requestAnimationFrame integration
- State Management: **ECSpresso entities and components** (replaces custom state management)

## Testing & Quality Assurance
- Unit Testing: **Vitest** (faster alternative to Jest, integrates well with Vite)
- E2E Testing: **Playwright** (for cross-browser testing)
- Type Checking: **TypeScript compiler** in strict mode
- Code Coverage: **c8** (built into Vitest)

## Progressive Web App (PWA)
- Service Worker: **Workbox** (Google's PWA toolkit)
- Web App Manifest: **Custom JSON configuration**
- Offline Support: **Cache API** with Workbox strategies

## Deployment & Distribution
- Bundling: **Vite's built-in Rollup bundler**
- Minification: **Terser** (JavaScript) and **cssnano** (CSS)
- Asset Optimization: **Vite's asset pipeline**
- CDN Deployment: **Netlify**, **Vercel**, or **GitHub Pages**
- Performance Monitoring: **Web Vitals** API

# Game Features
- Grid-Based Gameplay: Players move across a 2D grid (e.g., 20x20 cells) using arrow keys.
- Math Problems: Players must "eat" numbers or solve problems matching a specified rule (e.g., "multiples of 5," "prime numbers").
- Enemies: AI-driven enemies roam the grid, attempting to catch the player.
- Levels: Difficulty increases with more enemies and complex math problems as players progress.
- User Interface: Displays the current criterion, score, and game status (e.g., start and game-over screens).
- Audio and Visual Effects: Basic sound effects and animations enhance key actions (e.g., eating correct answers).
# Development Phases

## Phase 1: Project Setup & Configuration
- **Repository Setup**
	- Create project directory structure following modern web app conventions
- **Development Environment**
	- Initialize `package.json` with Vite + TypeScript template: `npm create vite@latest math-game -- --template vanilla-ts`
	- Configure TypeScript with strict settings in `tsconfig.json`
	- Set up ESLint configurations
	- Install core dependencies: `vite`, `typescript`, `howler`, `@types/howler`
	- Install dev dependencies: `eslint`, `vitest`, `playwright`
- **Basic Project Structure (ECS Architecture)**
	```
	src/
	├── index.html
	├── main.ts
	├── style.css
	├── ecs/
	│   ├── Engine.ts              # ECSpresso engine setup
	│   ├── components/
	│   │   ├── Position.ts
	│   │   ├── Velocity.ts
	│   │   ├── Renderable.ts
	│   │   ├── Player.ts
	│   │   ├── Enemy.ts
	│   │   ├── MathProblem.ts
	│   │   ├── Collider.ts
	│   │   └── Health.ts
	│   └── systems/
	│       ├── MovementSystem.ts
	│       ├── RenderSystem.ts
	│       ├── CollisionSystem.ts
	│       ├── InputSystem.ts
	│       ├── AISystem.ts
	│       └── GameLogicSystem.ts
	├── game/
	│   ├── Game.ts
	│   ├── Grid.ts
	│   └── MathProblemGenerator.ts
	├── utils/
	│   ├── math.ts
	│   └── canvas.ts
	└── assets/
	    └── sounds/
	```
## Phase 2: ECSpresso Engine Setup & Core Components
- **ECSpresso Engine Initialization**
	- Set up ECSpresso engine instance in `Engine.ts`
	- Configure engine with default components and systems
	- Implement game loop integration with `requestAnimationFrame`
	- Create entity factory functions for common game objects
- **Core Components Definition**
	- `Position.ts`: x, y coordinates with grid-based positioning
	- `Velocity.ts`: movement speed and direction vectors
	- `Renderable.ts`: visual properties (shape, color, size, layer)
	- `Player.ts`: player-specific data (score, lives, input state)
	- `Enemy.ts`: AI behavior type and state machine data
	- `MathProblem.ts`: problem data, correctness, difficulty level
	- `Collider.ts`: collision bounds and collision groups
	- `Health.ts`: lives/health system for player and enemies
- **Canvas Setup & Grid System**
	- Implement `Grid.ts` class with configurable dimensions (default 20x20)
	- Create viewport management for different screen sizes
	- Implement pixel-perfect rendering using `devicePixelRatio`
	- Use `Canvas.getContext('2d')` with hardware acceleration when available

## Phase 3: Core Systems Implementation
- **Input System (`InputSystem.ts`)**
	- Create ECSpresso system to handle keyboard events
	- Track input state in player entities with `Player` component
	- Implement key state tracking with proper key repeat handling
	- Add touch/swipe support for mobile devices using pointer events
- **Movement System (`MovementSystem.ts`)**
	- Process entities with `Position`, `Velocity`, and `Player`/`Enemy` components
	- Implement grid-based movement with smooth interpolation
	- Handle boundary collision detection within grid constraints
	- Apply movement speed modifiers based on entity type
- **Rendering System (`RenderSystem.ts`)**
	- Process entities with `Position` and `Renderable` components
	- Implement layer-based rendering (background, entities, UI)
	- Create efficient sprite batching for repeated shapes
	- Use `OffscreenCanvas` for pre-rendering static elements when supported

## Phase 4: Math Problem & Entity Management
- **Math Problem Entities**
	- Create entities with `Position`, `Renderable`, and `MathProblem` components
	- Use ECSpresso's `createEntities()` for batch creation of math problems
	- Implement entity factory functions for different problem types
	- Add `Collider` component for interaction detection
- **Problem Generation System**
	- Create `MathProblemGenerator.ts` with configurable difficulty levels
	- Implement problem types: arithmetic, primes, multiples, factors, fractions
	- Use `crypto.getRandomValues()` for secure random number generation
	- Create validation functions for each problem type
- **Grid Population & Entity Spawning**
	- Use ECSpresso entity creation to populate grid with math problems
	- Implement smart distribution algorithm to ensure solvable puzzles
	- Add configurable ratio of correct/incorrect answers using component data
	- Implement difficulty scaling based on player performance

## Phase 5: AI & Game Logic Systems
- **AI System (`AISystem.ts`)**
	- Process entities with `Position`, `Velocity`, `Enemy`, and `Collider` components
	- Implement pluggable AI behaviors stored in `Enemy` component data
	- Create pathfinding using A* algorithm for chasing behavior
	- Add random movement with collision avoidance patterns
- **Collision System (`CollisionSystem.ts`)**
	- Process entities with `Position` and `Collider` components
	- Implement AABB collision detection between player and math problems
	- Handle player-enemy collision with invincibility frame logic
	- Use ECSpresso's entity filtering for efficient collision queries
- **Game Logic System (`GameLogicSystem.ts`)**
	- Process game state changes using ECSpresso's global state management
	- Handle score calculation with combo multipliers using `Player` component
	- Implement lives system stored in `Health` component
	- Manage game progression and level transitions

## Phase 6: User Interface & Experience
- **UI Framework**
	- Create custom UI components using Canvas 2D or DOM overlay
	- Implement responsive design using CSS Grid and Flexbox
	- Add smooth transitions using CSS animations or GSAP
	- Create accessibility features (keyboard navigation, screen reader support)
- **Game Screens**
	- Main menu with options (start, settings, high scores)
	- In-game HUD showing criterion, score, lives, timer
	- Game over screen with restart and menu options
	- Settings screen for audio/visual preferences

## Phase 7: Audio & Visual Polish
- **Audio System**
	- Initialize Howler.js with Web Audio API fallback
	- Implement spatial audio for positional sound effects
	- Add background music with seamless looping
	- Create audio sprite sheets for efficient loading
- **Visual Effects**
	- Implement particle system for eating effects and explosions
	- Add screen shake effects using canvas transformations
	- Create smooth transitions between game states
	- Implement color schemes and accessibility options

## Phase 8: Testing & Quality Assurance
- **Automated Testing**
	- Unit tests for math problem generation using Vitest
	- Integration tests for game logic and state management
	- Performance testing with synthetic user interactions
	- Cross-browser testing using Playwright test suite
- **Manual Testing**
	- Gameplay balance testing across difficulty levels
	- Accessibility testing with screen readers and keyboard-only navigation
	- Mobile device testing for touch responsiveness
	- Performance profiling on low-end devices

## Phase 9: PWA Implementation & Optimization
- **Progressive Web App Features**
	- Configure Workbox for offline gameplay capability
	- Implement app shell architecture for instant loading
	- Add Web App Manifest for installable experience
	- Create app icons and splash screens for different platforms
- **Performance Optimization**
	- Implement lazy loading for non-critical assets
	- Use tree shaking to eliminate unused code
	- Optimize images using WebP format with fallbacks
	- Implement resource preloading strategies

## Phase 10: Deployment & Distribution
- **Build Optimization**
	- Configure Vite for production builds with code splitting
	- Implement asset fingerprinting for cache busting
	- Set up gzip/brotli compression
	- Generate source maps for debugging in production
- **Deployment Pipeline**
	- Set up CI/CD using GitHub Actions
	- Configure deployment to multiple CDNs (Netlify, Vercel, Cloudflare)
	- Implement A/B testing infrastructure
	- Set up analytics and error reporting (optional)

# ECSpresso Integration Patterns

## Entity Creation Patterns
```typescript
// Player entity creation
engine.createEntity()
  .addComponent('Position', { x: 10, y: 10 })
  .addComponent('Velocity', { x: 0, y: 0 })
  .addComponent('Renderable', { shape: 'circle', color: 'blue', size: 20 })
  .addComponent('Player', { score: 0, lives: 3, inputState: {} })
  .addComponent('Collider', { width: 20, height: 20, group: 'player' })
  .addComponent('Health', { current: 3, max: 3, invulnerable: false });

// Math problem entity creation
engine.createEntity()
  .addComponent('Position', { x: 5, y: 7 })
  .addComponent('Renderable', { shape: 'rectangle', color: 'green', size: 15 })
  .addComponent('MathProblem', { value: 15, isCorrect: true, difficulty: 2 })
  .addComponent('Collider', { width: 15, height: 15, group: 'problem' });
```

## System Implementation Patterns
```typescript
// Movement System example
engine.createSystem('Movement', 'Position', 'Velocity', (entity, { Position, Velocity }) => {
  Position.x += Velocity.x;
  Position.y += Velocity.y;
  
  // Grid boundary checking
  Position.x = Math.max(0, Math.min(19, Position.x));
  Position.y = Math.max(0, Math.min(19, Position.y));
});

// Collision System example
engine.createSystem('Collision', 'Position', 'Collider', (entity, { Position, Collider }) => {
  const playerEntities = engine.getEntitiesWithComponents('Player', 'Position', 'Collider');
  // Collision detection logic here
});
```

## Game Loop Integration
```typescript
// Main game loop using ECSpresso
const gameLoop = (timestamp: number) => {
  // Update all systems
  engine.update();
  
  // Continue loop
  requestAnimationFrame(gameLoop);
};

// Initialize and start
engine.beforeTick(() => {
  // Clear canvas, handle input
}).afterTick(() => {
  // Post-processing, UI updates
});

requestAnimationFrame(gameLoop);
```
# Package Dependencies

## Production Dependencies
```json
{
  "ecspresso": "^0.3.6",
  "howler": "^2.2.3",
  "workbox-window": "^7.0.0"
}
```

## Development Dependencies
```json
{
  "@types/howler": "^2.2.7",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "eslint": "^8.45.0",
  "playwright": "^1.37.0",
  "typescript": "^5.0.2",
  "vite": "^4.4.5",
  "vitest": "^0.34.0",
  "workbox-cli": "^7.0.0"
}
```

## Optional Enhancement Libraries
```json
{
  "gsap": "^3.12.2",
  "konva": "^9.2.0"
}
```

# Resources Required

## Development Team
- **Frontend Developer**: Skilled in TypeScript, HTML5 Canvas, and modern web development
- **Optional Game Designer**: For balancing difficulty progression and user experience

## Technical Skills Required
- TypeScript/JavaScript proficiency
- HTML5 Canvas 2D API experience
- Web Audio API or audio library experience
- Game development fundamentals (game loops, state management)
- Modern build tools (Vite, npm/pnpm)
- Testing frameworks (unit and integration testing)

## Assets & Resources
- **Sound Effects**: 
  - Free libraries: Freesound.org, Zapsplat (with attribution)
  - Formats: OGG Vorbis (primary), MP3 (fallback), WAV (development)
- **Visual Assets**: 
  - Geometric shapes (programmatically generated via Canvas)
  - Color palettes following accessibility guidelines (WCAG 2.1)
  - Potential sprite sheets for animations (PNG format)

## Infrastructure
- **Development**: Local development environment with Node.js 18+
- **Hosting**: CDN-based hosting (Netlify/Vercel free tiers sufficient)
- **Testing**: Cross-browser testing tools (BrowserStack optional)
- **Analytics**: Google Analytics 4 or privacy-focused alternatives (optional)
- Potential Challenges
	- Performance: Maintaining smooth gameplay on lower-end devices.
	- Difficulty Balance: Ensuring math problems are educational yet engaging.
	- Problem Variety: Generating diverse math challenges dynamically.
# Mitigation Strategies

## Performance Optimization
- **Rendering Efficiency**
  - Implement object pooling for frequently created/destroyed entities
  - Use dirty rectangle rendering to update only changed areas
  - Implement frame rate adaptive rendering (30fps on low-end devices)
  - Cache pre-rendered sprites using `OffscreenCanvas`
- **Memory Management**
  - Implement proper cleanup of event listeners and timers
  - Use `WeakMap` for object associations to prevent memory leaks
  - Lazy load audio assets and unload unused sounds
  - Monitor memory usage with Performance API

## Accessibility & User Experience
- **Difficulty Scaling**
  - Implement adaptive difficulty based on player performance metrics
  - Provide multiple game modes (Practice, Timed, Endless)
  - Add visual difficulty indicators and progress tracking
  - Include colorblind-friendly color schemes and high contrast mode
- **Cross-Device Compatibility**
  - Responsive design with viewport meta tag configuration
  - Touch-friendly interface with minimum 44px touch targets
  - Keyboard-only navigation support with visible focus indicators
  - Graceful degradation for older browsers

## Content Generation & Balance
- **Math Problem Diversity**
  - Modular problem generator architecture for easy extension
  - Weighted random selection to ensure variety within difficulty levels
  - Content validation system to prevent impossible or trivial problems
  - A/B testing framework for problem type effectiveness
- **Educational Value**
  - Integration with common core math standards alignment
  - Progress tracking and performance analytics
  - Spaced repetition algorithms for reinforcing weak areas
  - Optional integration with learning management systems (LMS)