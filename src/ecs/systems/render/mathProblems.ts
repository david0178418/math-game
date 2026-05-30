import { GAME_CONFIG } from '../../../config';
import { cellCenter, sameGridPosition } from '../../gameUtils';
import type { MathProblemEntity, PlayerEntity } from '../../queries';

const cell = GAME_CONFIG.GRID.CELL_SIZE;
const lilyPadRadius = cell * 0.38;

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
): void => {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.18);
  ctx.translate(-centerX, -centerY);

  ctx.fillStyle = 'rgba(11, 61, 66, 0.26)';
  ctx.beginPath();
  ctx.ellipse(centerX + 4, centerY + 6, lilyPadRadius * 0.98, lilyPadRadius * 0.74, 0.1, 0, Math.PI * 2);
  ctx.fill();

  drawLilyPadShape(ctx, centerX, centerY, lilyPadRadius);
  drawLilyPadVeins(ctx, centerX, centerY, lilyPadRadius);
  ctx.restore();
};

const activeProblemAtPlayer = (
  player: PlayerEntity,
  mathProblems: MathProblemEntity[],
): MathProblemEntity | undefined =>
  mathProblems.find(p =>
    !p.components.mathProblem.consumed && sameGridPosition(player.components.position, p.components.position),
  );

export const drawPlayerHighlight = (
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity | undefined,
  mathProblems: MathProblemEntity[],
): void => {
  if (!player) return;

  const problem = activeProblemAtPlayer(player, mathProblems);
  if (!problem) return;

  const { x: centerX, y: centerY } = cellCenter(problem.components.position);
  const time = Date.now() / 300;
  const alpha = 0.3 + 0.2 * Math.sin(time);

  ctx.save();
  ctx.strokeStyle = `rgba(248, 232, 112, ${alpha + 0.18})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, lilyPadRadius + 9, lilyPadRadius * 0.76 + 7, -0.18, 0, Math.PI * 2);
  ctx.stroke();
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

  mathProblems.forEach(problem => {
    const mathProblemComp = problem.components.mathProblem;
    if (mathProblemComp.consumed) return;

    const { x: centerX, y: centerY } = cellCenter(problem.components.position);
    const text = mathProblemComp.value.toString();

    drawLilyPad(ctx, centerX, centerY);

    ctx.strokeStyle = 'rgba(12, 54, 28, 0.9)';
    ctx.lineWidth = 7;
    ctx.strokeText(text, centerX, centerY);

    ctx.fillStyle = '#fff7c6';
    ctx.fillText(text, centerX, centerY);
  });

  ctx.restore();
};
