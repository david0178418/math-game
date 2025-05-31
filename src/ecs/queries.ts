import { createQueryDefinition, type QueryResultEntity } from 'ecspresso';
import type { Components } from './Engine';

/**
 * Centralized Query Definitions
 * Reusable query definitions used across multiple systems
 */

// Common entity queries
export const playerQuery = createQueryDefinition({
  with: ['position', 'player']
});

export const playerWithHealthQuery = createQueryDefinition({
  with: ['position', 'player', 'collider', 'health']
});

export const mathProblemQuery = createQueryDefinition({
  with: ['position', 'mathProblem']
});

export const mathProblemWithRenderableQuery = createQueryDefinition({
  with: ['position', 'mathProblem', 'collider', 'renderable']
});

export const enemyQuery = createQueryDefinition({
  with: ['position', 'enemy']
});

export const enemyWithColliderQuery = createQueryDefinition({
  with: ['position', 'enemy', 'collider']
});

export const renderableEntityQuery = createQueryDefinition({
  with: ['position', 'renderable']
});

export const positionEntityQuery = createQueryDefinition({
  with: ['position']
});

/**
 * Centralized Entity Types
 * Type-safe entity types derived from query definitions
 */

export type PlayerEntity = QueryResultEntity<Components, typeof playerQuery>;
export type PlayerEntityWithHealth = QueryResultEntity<Components, typeof playerWithHealthQuery>;
export type MathProblemEntity = QueryResultEntity<Components, typeof mathProblemQuery>;
export type MathProblemEntityWithRenderable = QueryResultEntity<Components, typeof mathProblemWithRenderableQuery>;
export type EnemyEntity = QueryResultEntity<Components, typeof enemyQuery>;
export type EnemyEntityWithCollider = QueryResultEntity<Components, typeof enemyWithColliderQuery>;
export type RenderableEntity = QueryResultEntity<Components, typeof renderableEntityQuery>;
export type PositionEntity = QueryResultEntity<Components, typeof positionEntityQuery>;

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