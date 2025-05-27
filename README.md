# Math Munchers Game

A modern educational math game inspired by the classic "Number Munchers", built with TypeScript, Vite, and the ECSpresso ECS library.

## 🎮 Game Features

- **Grid-based Movement**: Classic Number Munchers gameplay with WASD/Arrow key controls
- **AI Enemies**: Four different enemy behaviors (chase, patrol, random, guard)
- **Math Problem Generation**: Dynamic problems with configurable difficulty levels
- **Progressive Difficulty**: Automatic difficulty scaling based on player performance
- **Professional UI**: Modern, responsive interface with accessibility support
- **Performance Monitoring**: Built-in FPS tracking and optimization
- **High Score Persistence**: Local storage for high scores

## 🏗️ Architecture

### ECS (Entity Component System)
- **ECSpresso Library**: Modern ECS implementation for game logic
- **Component-based Design**: Modular entity composition
- **System Priorities**: Optimized execution order for performance

### Core Systems
- **Input System** (Priority 100): Handles player input
- **Movement System** (Priority 90): Processes entity movement
- **AI System** (Priority 85): Manages enemy behaviors
- **Collision System** (Priority 70): Detects and handles collisions
- **UI System** (Priority 50): Updates user interface
- **Problem Management** (Priority 30): Spawns and manages math problems
- **Render System** (Priority 10): Handles canvas rendering

### Key Components
- **Position**: Entity coordinates
- **Renderable**: Visual representation
- **Player**: Player-specific data (score, lives, input state)
- **Enemy**: AI behavior configuration
- **MathProblem**: Problem data and correctness
- **Collider**: Collision detection bounds
- **Health**: Life and invulnerability system

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd math

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Gameplay

1. **Navigate** the grid using WASD or Arrow keys
2. **Collect** green squares (correct answers) to increase your score
3. **Avoid** red enemies that patrol the grid
4. **Survive** as long as possible while answering math problems
5. **Progress** through difficulty levels as your score increases

### Controls
- **WASD** or **Arrow Keys**: Move player
- **ESC**: Pause/Resume game
- **F1**: Open settings

## 🛠️ Development

### Project Structure
```
src/
├── ecs/                 # ECS implementation
│   ├── components/      # Component definitions
│   ├── systems/         # Game systems
│   └── Engine.ts        # ECSpresso engine setup
├── game/                # Game-specific logic
│   ├── UIManager.ts     # User interface management
│   ├── GameInitializer.ts # Game setup and initialization
│   ├── GameStateManager.ts # State management
│   ├── MathProblemGenerator.ts # Math problem creation
│   ├── UIConstants.ts   # UI styling constants
│   └── config.ts        # Game configuration
├── utils/               # Utility functions
│   ├── domUtils.ts      # DOM manipulation helpers
│   └── performance.ts   # Performance monitoring
├── assets/              # Game assets
└── style.css           # Global styles
```

### Configuration
Game settings can be modified in `src/game/config.ts`:
- Grid dimensions
- Entity sizes and colors
- Game mechanics (lives, scoring)
- Performance settings

### Adding New Features
1. **Components**: Define in `src/ecs/Engine.ts` interface
2. **Systems**: Create in `src/ecs/systems/` directory
3. **Entities**: Use `EntityFactory` for consistent creation
4. **UI**: Modify `UIManager.ts` or create new UI components

## 🎨 Customization

### Visual Themes
Modify colors and styling in:
- `src/game/UIConstants.ts` - UI color scheme
- `src/game/config.ts` - Entity colors
- `src/style.css` - CSS custom properties

### Game Balance
Adjust difficulty in:
- `src/game/config.ts` - Core game settings
- `src/game/MathProblemGenerator.ts` - Problem difficulty
- `src/ecs/systems/AISystem.ts` - Enemy behavior

## 📊 Performance

The game includes built-in performance monitoring:
- **FPS Tracking**: Real-time frame rate monitoring
- **System Timing**: Execution time for each system
- **Entity Counting**: Memory usage tracking
- **Performance Warnings**: Automatic detection of performance issues

Access performance data via the browser console or the `PerformanceMonitor` class.

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build verification
npm run build
```

## 🚀 Deployment

### Automatic GitHub Pages Deployment

This repository includes GitHub Actions for automatic deployment to GitHub Pages:

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Set Source to "GitHub Actions"

2. **Update Repository Name** in `vite.config.ts` if different from "math":
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
   ```

3. **Push to main branch** to trigger automatic deployment:
   ```bash
   git push origin main
   ```

4. **Access your game** at: `https://your-username.github.io/your-repo-name/`

### Manual Deployment

The game can also be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages (manual)
- Any static file server

```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the classic "Number Munchers" educational game
- Built with [ECSpresso](https://github.com/pedronasser/ecspresso) ECS library
- Powered by [Vite](https://vitejs.dev/) for development and build tooling

## 📈 Roadmap

### Completed Features
- ✅ Core gameplay mechanics
- ✅ AI enemy system
- ✅ Math problem generation
- ✅ Professional UI/UX
- ✅ Performance optimization
- ✅ State management

### Planned Features
- 🎵 Audio system (sound effects, background music)
- ✨ Visual effects and animations
- 🏆 Achievement system
- 💾 Save game functionality
- 🌐 Online leaderboards
- �� Mobile app version 