import { gameEngine } from '../Engine';
import { GAME_CONFIG } from '../../config';
import {
  renderableEntityQuery,
  playerQuery,
  mathProblemQuery,
  frogTongueQuery,
  spiderWebQuery,
} from '../queries';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import { cleanupRenderSystem, getCtx, renderMargins } from './render/context';
import { drawGrid } from './render/grid';
import { drawEntity } from './render/entities';
import { drawEquationSelectionHighlights, drawPlayerHighlight, drawMathProblemLilyPads, drawMathProblemNumbers } from './render/mathProblems';
import { drawEnhancedSpiderWebs } from './render/spiderWebs';
import { drawEnhancedFrogTongues } from './render/frogTongues';
import { drawFrozenPlayerEffect } from './render/frozenPlayer';
import { drawBoardObjective } from './render/objective';
import { IMAGE_ASSET_KEYS } from '../assets';

export { initializeRenderSystem } from './render/context';

export const addRenderSystemToEngine = (): void => {
  gameEngine.addSystem('renderSystem')
    .setPriority(SYSTEM_PRIORITIES.RENDER)
    .inScreens(['playing'])
    .requiresAssets(IMAGE_ASSET_KEYS)
    .addQuery('renderableEntities', renderableEntityQuery)
    .addSingleton('player', playerQuery)
    .addQuery('mathProblems', mathProblemQuery)
    .addQuery('frogTongues', frogTongueQuery)
    .addQuery('spiderWebs', spiderWebQuery)
    .setOnDetach(cleanupRenderSystem)
    .setProcess(({ queries }) => {
      const ctx = getCtx();
      if (!ctx) return;

      const currentTime = performance.now();
      const margins = renderMargins();

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawBoardObjective(
        ctx,
        gameEngine.getResource('gameMode'),
        queries.mathProblems,
        margins.top,
      );
      ctx.save();
      ctx.translate(margins.left, margins.top);

      drawGrid(ctx);
      drawPlayerHighlight(ctx, queries.player, queries.mathProblems);

      const sortedEntities = [...queries.renderableEntities].sort(
        (a, b) => a.components.renderable.layer - b.components.renderable.layer,
      );

      const drawRenderableEntity = (entity: (typeof sortedEntities)[number]): void => {
        const timers = 'timers' in entity.components ? entity.components.timers : undefined;
        const playerComp = 'player' in entity.components ? entity.components.player : undefined;
        const shake = gameEngine.entityManager.getComponent(entity.id, 'shake');

        drawEntity(ctx, {
          position: entity.components.position,
          renderable: entity.components.renderable,
          isInvulnerable: timers?.invulnerability?.active === true,
          deathScale: playerComp?.deathScale ?? 1.0,
          shakeOffsetX: shake?.offsetX ?? 0,
          shakeOffsetY: shake?.offsetY ?? 0,
        });
      };

      for (const entity of sortedEntities) {
        if ('mathProblem' in entity.components) continue;
        if (entity.components.renderable.layer >= GAME_CONFIG.LAYERS.ENTITIES) continue;
        drawRenderableEntity(entity);
      }

      drawMathProblemLilyPads(ctx, queries.mathProblems);
      drawEnhancedSpiderWebs(ctx, queries.spiderWebs, currentTime);
      drawMathProblemNumbers(ctx, queries.mathProblems);
      drawEquationSelectionHighlights(
        ctx,
        queries.mathProblems,
        gameEngine.getResource('equationMode').selectedProblemIds,
      );
      drawEnhancedFrogTongues(ctx, queries.frogTongues, currentTime, 'behindFrog');

      for (const entity of sortedEntities) {
        if (entity.components.renderable.layer < GAME_CONFIG.LAYERS.ENTITIES) continue;
        drawRenderableEntity(entity);
      }

      drawEnhancedFrogTongues(ctx, queries.frogTongues, currentTime, 'aboveFrog');
      if (queries.player) drawFrozenPlayerEffect(ctx, queries.player, currentTime);
      ctx.restore();
    });
};
