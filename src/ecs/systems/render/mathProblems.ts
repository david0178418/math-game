import { GAME_CONFIG } from '../../../config';
import { cellCenter, sameGridPosition } from '../../gameUtils';
import type { MathProblemEntity, PlayerEntity } from '../../queries';

export const drawPlayerHighlight = (
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity | undefined,
  mathProblems: MathProblemEntity[],
): void => {
  if (!player) return;

  const playerPos = player.components.position;
  const problem = mathProblems.find(p =>
    !p.components.mathProblem.consumed && sameGridPosition(playerPos, p.components.position),
  );
  if (!problem) return;

  const { x, y } = problem.components.position;
  const time = Date.now() / 300;
  const alpha = 0.3 + 0.2 * Math.sin(time);

  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
  ctx.fillRect(x, y, GAME_CONFIG.GRID.CELL_SIZE, GAME_CONFIG.GRID.CELL_SIZE);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, GAME_CONFIG.GRID.CELL_SIZE - 2, GAME_CONFIG.GRID.CELL_SIZE - 2);
  ctx.restore();
};

export const drawMathProblemNumbers = (
  ctx: CanvasRenderingContext2D,
  mathProblems: MathProblemEntity[],
): void => {
  ctx.save();
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const problem of mathProblems) {
    const mathProblemComp = problem.components.mathProblem;
    if (mathProblemComp.consumed) continue;

    const { x: centerX, y: centerY } = cellCenter(problem.components.position);
    const text = mathProblemComp.value.toString();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 6;
    ctx.strokeText(text, centerX, centerY);

    ctx.fillStyle = 'white';
    ctx.fillText(text, centerX, centerY);
  }

  ctx.restore();
};
