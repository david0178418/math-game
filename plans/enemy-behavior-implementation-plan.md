# Multiple Enemy Behaviors Implementation Plan

## Overview

This document outlines the implementation plan for introducing three distinct enemy types in the math game:

1. **Lizard** - Current enemy behavior (baseline) - **Spawns First**
2. **Spider** - Moves around and randomly leaves spider webs that freeze the player for 2 seconds - **Spawns Second**
3. **Frog** - Moves around and randomly shoots tongue up to 3 tiles that damages the player - **Spawns Last**

### Spawn Order Behavior
The game will spawn exactly **3 enemies total** in a specific sequence:
- **First spawn**: Lizard (existing behavior)
- **Second spawn**: Spider (web mechanics)
- **Third spawn**: Frog (tongue mechanics)

This replaces the previous system of spawning 4 generic enemies with random behaviors.

## Current System Analysis

### Architecture
- **ECS-based**: Entity-Component-System using ECSpresso framework
- **Grid-based Movement**: Discrete grid with smooth animations (6x5 grid, 106px cells)
- **Current AI System**: Single enemy type with 4 behavior patterns (chase, patrol, random, guard)
- **Current Components**: `enemy`, `position`, `renderable`, `collider`, `health`

### Existing Enemy Implementation
- Movement controlled by `AISystem.ts` with grid-based pathfinding
- Smooth animations handled by `AnimationSystem.ts`
- Collision detection in `CollisionSystem.ts`
- Dynamic spawning from grid edges via `EnemySpawnSystem.ts`

## Task List

### **Phase 1: Core Architecture Enhancement** ✅ **COMPLETE**

#### **Task 1.1: Extend Enemy Component Interface** ✅
- **File**: `src/ecs/Engine.ts`
- **Priority**: High
- **Action**: Modify the `enemy` component to include `enemyType` field
- **Changes**: 
  ```typescript
  enemy: { 
    enemyType: 'lizard' | 'spider' | 'frog';
    behaviorType: 'chase' | 'patrol' | 'random' | 'guard';
    nextMoveTime: number;
    // ... existing fields (aiState, waypoints, etc.)
  };
  ```
- **Impact**: Foundation for all type-specific behaviors

#### **Task 1.2: Create Spider-Specific Components** ✅
- **File**: `src/ecs/Engine.ts`  
- **Priority**: High
- **Action**: Add new components for spider web mechanics
- **Changes**:
  ```typescript
  spiderWeb: {
    duration: number;        // Time until web disappears (8000ms)
    freezeTime: number;      // Time player is frozen when caught (2000ms)
    createdTime: number;     // When the web was created (timestamp)
    isActive: boolean;       // Whether the web is still active
  };
  freezeEffect: {
    startTime: number;       // When freeze started
    duration: number;        // How long to freeze (2000ms)
    isActive: boolean;       // Whether player is currently frozen
    sourceWebId?: number;    // ID of the spider web that caused this freeze
  };
  ```

#### **Task 1.3: Create Frog-Specific Components** ✅
- **File**: `src/ecs/Engine.ts`
- **Priority**: High
- **Action**: Add components for frog tongue mechanics
- **Changes**:
  ```typescript
  frogTongue: {
    isExtended: boolean;                    // Whether tongue is currently out
    direction: { x: number; y: number };    // Direction tongue extends
    maxRange: number;                       // Maximum tiles (3)
    currentLength: number;                  // Current extension distance
    startTime: number;                      // When tongue action started
    phase: 'extending' | 'holding' | 'retracting' | 'idle';
    segments: Array<{ x: number; y: number }>; // Tongue path for collision
  };
  ```

### **Phase 2: Enemy Type System** ✅ **COMPLETE**

#### **Task 2.1: Update Entity Factory** ✅
- **File**: `src/ecs/Engine.ts`
- **Priority**: High
- **Action**: Modify `createEnemy` function to accept enemy type
- **Changes**: 
  - Update function signature: `createEnemy(x, y, enemyType, behaviorType)`
  - Add type-specific component initialization
  - Set appropriate visual properties per type

#### **Task 2.2: Create Type-Specific Enemy Factories** ✅
- **File**: `src/ecs/Engine.ts`
- **Priority**: Medium
- **Action**: Add specialized creation methods for better type safety
- **Changes**: 
  ```typescript
  createLizard(x: number, y: number, behaviorType): { id: number };
  createSpider(x: number, y: number, behaviorType): { id: number };
  createFrog(x: number, y: number, behaviorType): { id: number };
  ```

#### **Task 2.3: Update Enemy Spawn System** ✅
- **File**: `src/ecs/systems/EnemySpawnSystem.ts`
- **Priority**: High
- **Action**: Implement sequential enemy type spawning
- **Changes**: 
  - Replace random enemy type selection with sequential spawn order
  - Track spawn count and current enemy type to spawn
  - First spawn: Lizard, Second spawn: Spider, Third spawn: Frog
  - Stop spawning after 3 enemies are created
  - Reset spawn sequence when all enemies are defeated

#### **Task 2.4: Add Spawn State Tracking** ✅
- **File**: `src/ecs/systems/EnemySpawnSystem.ts`
- **Priority**: High
- **Action**: Implement spawn state management for sequential enemy creation
- **Changes**:
  ```typescript
  // Spawn state tracking
  let currentSpawnIndex = 0;           // Track which enemy type to spawn next
  let totalEnemiesSpawned = 0;         // Track total spawned this cycle
  let spawnCycleComplete = false;      // Track if all 3 enemies have been spawned
  
  // Functions to manage spawn state
  function getNextEnemyType(): 'lizard' | 'spider' | 'frog' | null;
  function incrementSpawnIndex(): void;
  function resetSpawnCycle(): void;
  function shouldResetCycle(currentEnemyCount: number): boolean;
  ```

### **Phase 3: Spider Implementation** ✅ **COMPLETE**

#### **Task 3.1: Create Spider Web System** ✅
- **File**: `src/ecs/systems/SpiderWebSystem.ts`
- **Priority**: Medium
- **Action**: Create new system to manage spider web lifecycle
- **Features**:
  - Query for entities with `spiderWeb` component
  - Handle 8-second countdown timer
  - Automatic web cleanup after timeout
  - Web cleanup when player is freed from freeze

#### **Task 3.2: Implement Player Freeze System** ✅
- **File**: `src/ecs/systems/MovementSystem.ts`
- **Priority**: Medium
- **Action**: Add freeze effect checks to player movement
- **Changes**: 
  - Check for `freezeEffect` component before processing player input
  - Ignore all movement input while frozen
  - Visual feedback for frozen state

#### **Task 3.3: Create Web-Player Collision Detection** ✅
- **File**: `src/ecs/systems/CollisionSystem.ts`
- **Priority**: Medium
- **Action**: Add collision handling between player and spider webs
- **Changes**: 
  - Query for player entities and spider web entities
  - Apply freeze effect when player enters web tile
  - Remove web when player is caught

#### **Task 3.4: Update AI System for Spider Behavior** ✅
- **File**: `src/ecs/systems/AISystem.ts`
- **Priority**: Medium
- **Action**: Add spider-specific movement logic
- **Changes**: 
  - Add web placement probability during movement (20% chance)
  - Ensure spiders don't place webs too frequently
  - Web placement only on empty tiles

### **Phase 4: Frog Implementation** ✅ **COMPLETE**

#### **Task 4.1: Create Frog Tongue System** ✅
- **File**: `src/ecs/systems/FrogTongueSystem.ts`
- **Priority**: Medium
- **Action**: Create system to manage tongue extension/retraction
- **Features**:
  - Query for entities with `frogTongue` component
  - Handle tongue extension up to 3 tiles or map boundary
  - Smooth tongue animation phases (extending → holding → retracting → idle)
  - Random tongue direction selection

#### **Task 4.2: Implement Tongue Damage System** ✅
- **File**: `src/ecs/systems/CollisionSystem.ts`
- **Priority**: Medium
- **Action**: Add collision detection between player and frog tongues
- **Changes**: 
  - Check collision between player and tongue segments
  - Apply damage when player touches extended tongue
  - Integrate with existing health/damage system

#### **Task 4.3: Update AI System for Frog Behavior** ✅
- **File**: `src/ecs/systems/AISystem.ts`
- **Priority**: Medium
- **Action**: Add frog-specific behavior logic
- **Changes**: 
  - Add tongue shooting probability during idle moments
  - Implement pause mechanic (frog stops moving while tongue is out)
  - Random direction selection for tongue shots

### **Phase 5: Visual and Audio Enhancements** ✅ **COMPLETE**

#### **Task 5.1: Update Render System for Enemy Types** ✅
- **File**: `src/ecs/systems/RenderSystem.ts`
- **Priority**: Low
- **Action**: Add different visual representations for each enemy type
- **Changes**: 
  - **Lizard**: Diamond shape with scale patterns and yellow eyes
  - **Spider**: Oval body with 8 articulated legs extending from the center
  - **Frog**: Rounded rectangle with bulging eyes and animated throat movement
  - Enhanced enemy visual distinctions with type-specific shapes and animations

#### **Task 5.2: Add Spider Web Rendering** ✅
- **File**: `src/ecs/systems/RenderSystem.ts`
- **Priority**: Low
- **Action**: Implement spider web visual representation
- **Changes**: 
  - Enhanced web pattern with radial strands and concentric circles
  - Fade effects based on remaining web lifetime
  - Sparkle animations for active webs
  - Semi-transparent purple background with opacity fade

#### **Task 5.3: Add Frog Tongue Rendering** ✅
- **File**: `src/ecs/systems/RenderSystem.ts`
- **Priority**: Low
- **Action**: Implement tongue extension visualization
- **Changes**: 
  - Enhanced tongue rendering with shadows and depth
  - Phase-based animations (pulsing during extension, glow during hold, fade during retraction)
  - Glowing tongue tip with highlight effects
  - Smooth visual feedback for tongue reach and direction

#### **Task 5.4: Add Frozen Player Visual Effects** ✅
- **File**: `src/ecs/systems/RenderSystem.ts`
- **Priority**: Low
- **Action**: Implement frozen player visual effects
- **Changes**: 
  - Ice crystal overlay with 6-pointed star pattern
  - Light blue background fade based on remaining freeze time
  - Sparkling ice particles that rotate around the frozen player
  - Progressive fade effects as freeze effect expires

### **Phase 6: System Integration** ✅ **COMPLETE**

#### **Task 6.1: Update System Priorities** ✅
- **File**: `src/ecs/systemConfigs.ts`
- **Status**: Implemented
- **Changes**: 
  - Added `FROG_TONGUE: 22` and `SPIDER_WEB: 20` to SYSTEM_PRIORITIES
  - Updated ENEMY_SPAWN_CONFIG to reflect new 3-enemy sequential system
  - Added spawn order configuration and reset behavior settings
  - Proper system execution order maintained

#### **Task 6.2: Register New Systems** ✅
- **File**: `src/game/GameInitializer.ts`
- **Status**: Implemented
- **Changes**: 
  - SpiderWebSystem and FrogTongueSystem properly imported and registered
  - Correct priority-based execution order maintained
  - Systems added in correct sequence with proper priority values

#### **Task 6.3: Update Queries** ✅
- **File**: `src/ecs/queries.ts`
- **Status**: Implemented
- **Changes**: 
  ```typescript
  export const spiderWebQuery = createQueryDefinition({
    with: ['position', 'spiderWeb']
  });
  export const spiderWebWithRenderableQuery = createQueryDefinition({
    with: ['position', 'spiderWeb', 'renderable', 'collider']
  });
  export const frogTongueQuery = createQueryDefinition({
    with: ['position', 'enemy', 'frogTongue']
  });
  export const frozenPlayerQuery = createQueryDefinition({
    with: ['position', 'player', 'freezeEffect']
  });
  
  // Corresponding TypeScript entity types
  export type SpiderWebEntity = QueryResultEntity<Components, typeof spiderWebQuery>;
  export type SpiderWebEntityWithRenderable = QueryResultEntity<Components, typeof spiderWebWithRenderableQuery>;
  export type FrogTongueEntity = QueryResultEntity<Components, typeof frogTongueQuery>;
  export type FrozenPlayerEntity = QueryResultEntity<Components, typeof frozenPlayerQuery>;
  ```

### **Phase 7: Configuration and Balancing** ✅ **COMPLETE**

#### **Task 7.1: Add Enemy Type Configuration** ✅
- **File**: `src/game/config.ts`
- **Status**: Implemented
- **Changes**: 
  ```typescript
  ENEMY_SPAWN: {
    MAX_ENEMIES: 3,                    // Total enemies in game
    SPAWN_ORDER: ['lizard', 'spider', 'frog'] as const,
    RESET_ON_ALL_DEFEATED: true,      // Restart spawn cycle when all enemies defeated
    BASE_SPAWN_INTERVAL: 3000,        // 3 seconds between spawns
    MIN_SPAWN_INTERVAL: 1500,         // Minimum spawn interval with difficulty scaling
  },
  ENEMY_TYPES: {
    LIZARD: {
      COLOR: 'red',                    // Diamond-shaped lizard
      MOVE_SPEED_MULTIPLIER: 1.0,      // Normal movement speed
      AI_BEHAVIORS: ['chase', 'patrol', 'random', 'guard'] as const,
    },
    SPIDER: {
      COLOR: 'purple',                 // 8-legged spider
      MOVE_SPEED_MULTIPLIER: 0.9,      // Slightly slower than lizard
      WEB_DURATION: 8000,              // 8 seconds until web disappears
      FREEZE_DURATION: 2000,           // 2 seconds freeze when caught
      WEB_PLACEMENT_CHANCE: 0.20,      // 20% chance per move to place web
      WEB_COOLDOWN: 1000,              // 1 second cooldown between web placements
      AI_BEHAVIORS: ['random', 'patrol'] as const,
    },
    FROG: {
      COLOR: 'green',                  // Bulging-eyed frog
      MOVE_SPEED_MULTIPLIER: 1.1,      // Slightly faster when not attacking
      TONGUE_RANGE: 3,                 // 3 tiles maximum range
      TONGUE_SPEED: 424,               // Pixels per second (106px/0.25s = 424px/s)
      TONGUE_ATTACK_PROBABILITY: 0.10, // 10% chance per second to attack
      TONGUE_COOLDOWN: 2000,           // 2 seconds between attacks
      TONGUE_HOLD_DURATION: 1000,     // 1 second hold when fully extended
      AI_BEHAVIORS: ['chase', 'random'] as const,
    },
  }
  ```

#### **Task 7.2: Update System Configurations** ✅
- **File**: `src/ecs/systemConfigs.ts`
- **Status**: Implemented
- **Changes**: 
  - Updated `ENEMY_SPAWN_CONFIG` to reference centralized `GAME_CONFIG.ENEMY_SPAWN`
  - Added `ENEMY_SPEED_MULTIPLIERS` to `AI_CONFIG` for type-specific movement speeds
  - Eliminated configuration duplication between files
  - Systems now use single source of truth for all enemy configurations

#### **Task 7.3: Update System Implementations** ✅
- **Files**: `FrogTongueSystem.ts`, `SpiderWebSystem.ts`, `AISystem.ts`, `Engine.ts`
- **Status**: Implemented
- **Changes**: 
  - **FrogTongueSystem**: Updated to use `GAME_CONFIG.ENEMY_TYPES.FROG` configuration
  - **SpiderWebSystem**: Updated to use `GAME_CONFIG.ENEMY_TYPES.SPIDER` configuration
  - **AISystem**: Updated to use centralized web placement probability and enemy speed multipliers
  - **Engine**: Updated enemy color assignments to use centralized `ENEMY_TYPES` configuration
  - **Enhanced AI**: Movement intervals now factor in enemy type-specific speed multipliers
  - All hardcoded values replaced with centralized configuration references

### **Phase 8: Testing and Polish** ✅ **COMPLETE**

#### **Task 8.1: Update Type Definitions** ✅
- **File**: `src/ecs/queries.ts`
- **Status**: Completed in Phase 6
- **Changes**: All TypeScript entity types properly defined and integrated

#### **Task 8.2: Error Handling and Edge Cases** ✅
- **Files**: All new systems
- **Status**: Implemented with focused approach
- **Philosophy**: Leveraged ECSpresso's query system guarantees rather than redundant assertions
- **Changes**: 
  - **Removed redundant component existence checks** - ECSpresso queries guarantee component presence
  - **Kept meaningful validations**:
    - Game state consistency (tongue phases, web active state)
    - Data bounds validation (negative durations, invalid coordinates)
    - Business logic edge cases (invulnerability checks, duplicate collision prevention)
    - Grid boundary validation for position-dependent operations
  - **Enhanced error recovery**:
    - Graceful fallbacks for invalid data (default durations, clamped values)
    - Try-catch blocks around critical entity operations (spawn, remove, component operations)
    - Clear logging for debugging without excessive noise
  - **Performance optimization**: Removed unnecessary type checks and validations that TypeScript already handles

#### **Key Error Handling Improvements**:
- **FrogTongueSystem**: Validates tongue phase states, direction vectors, and grid boundaries
- **SpiderWebSystem**: Validates timing data and handles entity cleanup gracefully
- **CollisionSystem**: Validates game state conditions and prevents duplicate effects
- **EnemySpawnSystem**: Simplified to essential spawn cycle management
- **Focused Logging**: Reduced verbose error messages while maintaining debugging capability

## Implementation Priority

1. **Critical**: Core architecture (Phase 1-2) - Foundation for all enemy types
2. **High**: System integration (Phase 6) - Required for everything to work together
3. **Medium**: Spider implementation (Phase 3) - Simpler of the two new types
4. **Medium**: Frog implementation (Phase 4) - More complex tongue mechanics  
5. **Low**: Visual enhancements (Phase 5) - Can start with simple color changes
6. **Medium**: Configuration and testing (Phase 7-8) - Polish and balance

## Key Technical Considerations

### Type Safety
- All new components and systems must maintain strict TypeScript typing
- Use proper type guards and component queries
- Avoid any type casting unless absolutely necessary

### Performance
- New systems should not impact game performance significantly
- Efficient collision detection for webs and tongues
- Proper cleanup of temporary entities (webs, tongue segments)

### Modularity
- Each enemy type's special behavior isolated in its own system
- Clear separation of concerns between movement, special abilities, and rendering
- Reusable components where possible

### Existing Code Compatibility
- Minimal changes to existing lizard behavior to avoid regressions
- Backward compatible enemy spawning
- Preserve existing AI behavior patterns

## Success Criteria

- [ ] Three distinct enemy types with unique behaviors
- [ ] **Sequential spawn order**: Lizard → Spider → Frog, exactly 3 enemies total
- [ ] **Spawn cycle reset**: New sequence starts when all enemies are defeated
- [ ] Spider webs freeze player for 2 seconds, disappear after 3 seconds if unused
- [ ] Frog tongues extend up to 3 tiles, damage player on contact
- [ ] All enemy types maintain existing AI behavior patterns (chase, patrol, etc.)
- [ ] No performance degradation
- [ ] Maintains TypeScript type safety
- [ ] Visual distinction between enemy types (Lizard: red, Spider: purple, Frog: green)
- [ ] Proper game balance and player experience

## Future Enhancements

- Sprite-based enemy graphics instead of colored rectangles
- Sound effects for web placement and tongue attacks
- Particle effects for special abilities
- Additional enemy types with different mechanics
- Enemy type-specific AI behavior patterns 