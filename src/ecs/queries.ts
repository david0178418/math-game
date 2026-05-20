import { type QueryResultEntity } from 'ecspresso';
import type { AllComponents } from './Engine';

/**
 * Centralized Query Definitions
 * Reusable query definitions used across multiple systems
 */

// Common entity queries
export const playerQuery = {
  with: ['position', 'player', 'timers'],
} as const;

export const playerWithHealthQuery = {
  with: ['position', 'player', 'collider', 'health', 'timers'],
} as const;

export const mathProblemQuery = {
  with: ['position', 'mathProblem'],
} as const;

export const mathProblemWithRenderableQuery = {
  with: ['position', 'mathProblem', 'collider', 'renderable'],
} as const;

export const enemyQuery = {
  with: ['position', 'enemy', 'timers'],
} as const;

export const enemyWithColliderQuery = {
  with: ['position', 'enemy', 'collider', 'timers'],
} as const;

export const renderableEntityQuery = {
  with: ['position', 'renderable'],
} as const;

export const positionEntityQuery = {
  with: ['position'],
} as const;

export const spiderWebQuery = {
  with: ['position', 'spiderWeb', 'timers'],
} as const;

export const spiderWebWithRenderableQuery = {
  with: ['position', 'spiderWeb', 'renderable', 'collider', 'timers'],
} as const;

export const frogTongueQuery = {
  with: ['position', 'enemy', 'frogTongue'],
} as const;

/**
 * Centralized Entity Types
 * Type-safe entity types derived from query definitions
 */

export type PlayerEntity = QueryResultEntity<AllComponents, typeof playerQuery>;
export type PlayerEntityWithHealth = QueryResultEntity<AllComponents, typeof playerWithHealthQuery>;
export type MathProblemEntity = QueryResultEntity<AllComponents, typeof mathProblemQuery>;
export type MathProblemEntityWithRenderable = QueryResultEntity<AllComponents, typeof mathProblemWithRenderableQuery>;
export type EnemyEntity = QueryResultEntity<AllComponents, typeof enemyQuery>;
export type EnemyEntityWithCollider = QueryResultEntity<AllComponents, typeof enemyWithColliderQuery>;
export type RenderableEntity = QueryResultEntity<AllComponents, typeof renderableEntityQuery>;
export type PositionEntity = QueryResultEntity<AllComponents, typeof positionEntityQuery>;

export type SpiderWebEntity = QueryResultEntity<AllComponents, typeof spiderWebQuery>;
export type SpiderWebEntityWithRenderable = QueryResultEntity<AllComponents, typeof spiderWebWithRenderableQuery>;
export type FrogTongueEntity = QueryResultEntity<AllComponents, typeof frogTongueQuery>;

/**
 * Query Utilities
 * Helper functions for common query operations
 */

export function isEntityAtGridPosition(
  entity: { components: { position: { x: number; y: number } } },
  gridX: number,
  gridY: number,
  cellSize: number
): boolean {
  const entityGridX = Math.round(entity.components.position.x / cellSize);
  const entityGridY = Math.round(entity.components.position.y / cellSize);
  return entityGridX === gridX && entityGridY === gridY;
}

export function getEntitiesAtGridPosition<T extends { components: { position: { x: number; y: number } } }>(
  entities: T[],
  gridX: number,
  gridY: number,
  cellSize: number
): T[] {
  return entities.filter(entity => isEntityAtGridPosition(entity, gridX, gridY, cellSize));
}

export function getDistanceBetweenEntities(
  entity1: { components: { position: { x: number; y: number } } },
  entity2: { components: { position: { x: number; y: number } } }
): number {
  const dx = entity1.components.position.x - entity2.components.position.x;
  const dy = entity1.components.position.y - entity2.components.position.y;
  return Math.sqrt(dx * dx + dy * dy);
} 