import { GAME_CONFIG } from '../../../config';
import { activePlayerGridCell, cellCenter, positionInGridCell } from '../../gameUtils';
import { gridCellKey, positionedEntityGridCellKey } from '../../lilyPads';
import type { MathProblemEntity, PlayerEntity } from '../../queries';

const cell = GAME_CONFIG.GRID.CELL_SIZE;
const lilyPadRadius = cell * 0.38;

type LilyPadMotion = {
  centerX: number;
  centerY: number;
  rotation: number;
};

function lilyPadMotion(problem: MathProblemEntity, currentTime: number): LilyPadMotion {
  const center = cellCenter(problem.components.position);
  const phase = problem.id * 0.73
    + problem.components.position.x * 0.013
    + problem.components.position.y * 0.019;

  return {
    centerX: center.x,
    centerY: center.y + Math.sin(currentTime * 0.0011 + phase) * 1.8,
    rotation: -0.18 + Math.sin(currentTime * 0.0007 + phase) * 0.025,
  };
}

const drawLilyPadShape = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
): void => {
  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.28,
    centerY - radius * 0.35,
    radius * 0.1,
    centerX,
    centerY,
    radius,
  );
  gradient.addColorStop(0, '#9bd45e');
  gradient.addColorStop(0.62, '#4b9f3b');
  gradient.addColorStop(1, '#276b35');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, -0.28, Math.PI * 1.82);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(17, 72, 36, 0.72)';
  ctx.lineWidth = 3;
  ctx.stroke();
};

const drawLilyPadVeins = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
): void => {
  const veinAngles = [-1.9, -1.25, -0.68, 0.68, 1.28] as const;

  ctx.strokeStyle = 'rgba(224, 248, 156, 0.28)';
  ctx.lineWidth = 2;
  veinAngles.forEach(angle => {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius * 0.78,
      centerY + Math.sin(angle) * radius * 0.78,
    );
    ctx.stroke();
  });
};

const drawLilyPad = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: number,
): void => {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.translate(-centerX, -centerY);

  drawLilyPadShape(ctx, centerX, centerY, lilyPadRadius);
  drawLilyPadVeins(ctx, centerX, centerY, lilyPadRadius);
  ctx.restore();
};

const activeProblemAtPlayer = (
  player: PlayerEntity,
  mathProblems: MathProblemEntity[],
  blockedCells: ReadonlySet<string>,
): MathProblemEntity | undefined => {
  const activeCell = activePlayerGridCell(player);
  return mathProblems.find(p =>
    !p.components.mathProblem.consumed
      && !blockedCells.has(gridCellKey(activeCell))
      && positionInGridCell(p.components.position, activeCell),
  );
};

export const drawPlayerHighlight = (
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity | undefined,
  mathProblems: MathProblemEntity[],
  blockedCells: ReadonlySet<string>,
  currentTime: number,
): void => {
  if (!player) return;

  const problem = activeProblemAtPlayer(player, mathProblems, blockedCells);
  if (!problem) return;

  const { centerX, centerY, rotation } = lilyPadMotion(problem, currentTime);
  const time = currentTime / 300;
  const alpha = 0.3 + 0.2 * Math.sin(time);

  ctx.save();
  ctx.strokeStyle = `rgba(248, 232, 112, ${alpha + 0.18})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, lilyPadRadius + 9, lilyPadRadius * 0.76 + 7, rotation, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawEquationSelectionHighlights = (
  ctx: CanvasRenderingContext2D,
  mathProblems: MathProblemEntity[],
  selectedProblemIds: readonly number[],
  blockedCells: ReadonlySet<string>,
  currentTime: number,
): void => {
  if (selectedProblemIds.length === 0) return;

  ctx.save();
  selectedProblemIds.forEach((id, index) => {
    const problem = mathProblems.find(candidate => candidate.id === id);
    if (!problem || problem.components.mathProblem.consumed) return;
    if (blockedCells.has(positionedEntityGridCellKey(problem))) return;

    const { centerX, centerY, rotation } = lilyPadMotion(problem, currentTime);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, lilyPadRadius + 14, lilyPadRadius * 0.76 + 12, rotation, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(8, 47, 73, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX + lilyPadRadius * 0.62, centerY - lilyPadRadius * 0.62, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((index + 1).toString(), centerX + lilyPadRadius * 0.62, centerY - lilyPadRadius * 0.62);
  });
  ctx.restore();
};

function forEachVisibleMathProblem(
  mathProblems: MathProblemEntity[],
  drawProblem: (problem: MathProblemEntity) => void,
): void {
  mathProblems.forEach(problem => {
    if (problem.components.mathProblem.consumed) return;
    drawProblem(problem);
  });
}

export const drawMathProblemLilyPads = (
  ctx: CanvasRenderingContext2D,
  mathProblems: MathProblemEntity[],
  currentTime: number,
): void => {
  ctx.save();
  forEachVisibleMathProblem(mathProblems, problem => {
    const motion = lilyPadMotion(problem, currentTime);
    drawLilyPad(ctx, motion.centerX, motion.centerY, motion.rotation);
  });
  ctx.restore();
};

export const drawMathProblemNumbers = (
  ctx: CanvasRenderingContext2D,
  mathProblems: MathProblemEntity[],
  currentTime: number,
): void => {
  ctx.save();
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  forEachVisibleMathProblem(mathProblems, problem => {
    const motion = lilyPadMotion(problem, currentTime);
    const text = problem.components.mathProblem.value.toString();

    ctx.strokeStyle = 'rgba(12, 54, 28, 0.9)';
    ctx.lineWidth = 7;
    ctx.strokeText(text, motion.centerX, motion.centerY);

    ctx.fillStyle = '#fff7c6';
    ctx.fillText(text, motion.centerX, motion.centerY);
  });

  ctx.restore();
};
