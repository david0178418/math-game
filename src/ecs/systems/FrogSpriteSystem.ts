import { createTweenSequence } from 'ecspresso/plugins/scripting/tween';
import { gameEngine, type GameEngine } from '../Engine';
import type { AllComponents } from '../types';
import { ANIMATION_CONFIG } from '../../config';
import { SYSTEM_PRIORITIES } from '../systemConfigs';
import frogHopAway from '../../assets/images/frog-hop-away.png';
import frogHopSide from '../../assets/images/frog-hop-side.png';
import frogHopToward from '../../assets/images/frog-hop-toward.png';
import frogTurnFrontSide from '../../assets/images/frog-turn-front-side.png';
import frogTurnSideAway from '../../assets/images/frog-turn-side-away.png';

export const FROG_SPRITE_IMAGES = [
  frogHopAway,
  frogHopSide,
  frogHopToward,
  frogTurnFrontSide,
  frogTurnSideAway,
] as const;

type FrogFacing = AllComponents['frogSprite']['facing'];
type SpriteStep = AllComponents['spriteAnimation']['steps'][number];
type GridPoint = { x: number; y: number };
type SpriteStepOptions = Pick<SpriteStep, 'flipX' | 'reverse' | 'staticFrameIndex'>;

const FRAME_COUNT = 8;
const FROG_RENDER_SCALE = 1.5;
const TURN_DURATION_S = 0.18;
const JUMP_INTENT_DELAY_S = 1;
const MOVE_DURATION_S = ANIMATION_CONFIG.MOVEMENT_DURATION / 1000;

const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);

export const defaultFrogRenderable = (
  layer: number,
  color: string,
  size: number,
): AllComponents['renderable'] => ({
  shape: 'image',
  color,
  size,
  layer,
  imageSrc: frogHopToward,
  imageWidth: size * FROG_RENDER_SCALE,
  imageHeight: size * FROG_RENDER_SCALE,
  spriteSheet: {
    frameCount: FRAME_COUNT,
    frameIndex: FRAME_COUNT - 1,
  },
});

export const defaultFrogSprite = (): AllComponents['frogSprite'] => ({
  facing: 'toward',
});

const facingFromDelta = (dx: number, dy: number): FrogFacing => {
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'away' : 'toward';
};

const isSide = (facing: FrogFacing): boolean => facing === 'left' || facing === 'right';
const sideFlip = (facing: FrogFacing): boolean => facing === 'left';
const randomSideTurnBridge = (): FrogFacing => Math.random() < 0.5 ? 'toward' : 'away';
const randomDepthTurnBridge = (): FrogFacing => Math.random() < 0.5 ? 'left' : 'right';

const spriteStep = (
  imageSrc: string,
  duration: number,
  options: SpriteStepOptions = {},
): SpriteStep => ({
  imageSrc,
  frameCount: FRAME_COUNT,
  duration,
  ...options,
});

const hopStepForFacing = (facing: FrogFacing, duration: number): SpriteStep => {
  if (facing === 'toward') {
    return spriteStep(frogHopToward, duration);
  }
  if (facing === 'away') {
    return spriteStep(frogHopAway, duration);
  }
  return spriteStep(frogHopSide, duration, { flipX: sideFlip(facing) });
};

function turnThrough(from: FrogFacing, bridge: FrogFacing, to: FrogFacing): SpriteStep[] {
  return [
    ...turnBetween(from, bridge),
    ...turnBetween(bridge, to),
  ];
}

const turnBetween = (from: FrogFacing, to: FrogFacing): SpriteStep[] => {
  if (from === to) return [];

  if (from === 'toward' && isSide(to)) {
    return [spriteStep(frogTurnFrontSide, TURN_DURATION_S, { flipX: sideFlip(to) })];
  }
  if (isSide(from) && to === 'toward') {
    return [spriteStep(frogTurnFrontSide, TURN_DURATION_S, {
      flipX: sideFlip(from),
      reverse: true,
    })];
  }
  if (from === 'away' && isSide(to)) {
    return [spriteStep(frogTurnSideAway, TURN_DURATION_S, {
      flipX: sideFlip(to),
      reverse: true,
    })];
  }
  if (isSide(from) && to === 'away') {
    return [spriteStep(frogTurnSideAway, TURN_DURATION_S, { flipX: sideFlip(from) })];
  }
  if (isSide(from) && isSide(to)) {
    return turnThrough(from, randomSideTurnBridge(), to);
  }

  return turnThrough(from, randomDepthTurnBridge(), to);
};

const finalFrameIndexForStep = (step: SpriteStep): number =>
  step.reverse ? 0 : step.frameCount - 1;

const intentDelayStepForFacing = (
  facing: FrogFacing,
  turnSteps: readonly SpriteStep[],
): SpriteStep => {
  const finalTurnStep = turnSteps.at(-1);
  if (finalTurnStep) {
    return spriteStep(finalTurnStep.imageSrc, JUMP_INTENT_DELAY_S, {
      flipX: finalTurnStep.flipX,
      staticFrameIndex: finalFrameIndexForStep(finalTurnStep),
    });
  }

  const facingStep = hopStepForFacing(facing, JUMP_INTENT_DELAY_S);
  return {
    ...facingStep,
    staticFrameIndex: facingStep.frameCount - 1,
  };
};

const applySpriteStep = (
  renderable: AllComponents['renderable'],
  step: SpriteStep,
  frameIndex: number,
): void => {
  renderable.imageSrc = step.imageSrc;
  renderable.spriteSheet = {
    frameCount: step.frameCount,
    frameIndex,
    flipX: step.flipX,
  };
};

const totalStepDuration = (steps: readonly SpriteStep[]): number =>
  steps.reduce((sum, step) => sum + step.duration, 0);

const lastStep = (steps: readonly SpriteStep[]): SpriteStep => steps[steps.length - 1];

const findCurrentStep = (
  steps: readonly SpriteStep[],
  elapsed: number,
): { step: SpriteStep; stepIndex: number; elapsedBeforeStep: number } => {
  let elapsedBeforeStep = 0;

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    if (elapsed < elapsedBeforeStep + step.duration) {
      return { step, stepIndex, elapsedBeforeStep };
    }
    elapsedBeforeStep += step.duration;
  }

  return {
    step: lastStep(steps),
    stepIndex: steps.length - 1,
    elapsedBeforeStep: totalStepDuration(steps) - lastStep(steps).duration,
  };
};

const frameIndexForStep = (
  step: SpriteStep,
  elapsed: number,
  elapsedBeforeStep: number,
): number => {
  if (step.staticFrameIndex !== undefined) {
    return Math.max(0, Math.min(step.frameCount - 1, step.staticFrameIndex));
  }

  const stepElapsed = Math.max(0, elapsed - elapsedBeforeStep);
  const progress = Math.min(1, stepElapsed / step.duration);
  const forwardFrame = Math.min(
    step.frameCount - 1,
    Math.floor(progress * step.frameCount),
  );

  return step.reverse ? step.frameCount - 1 - forwardFrame : forwardFrame;
};

export const startFrogGridMovement = (
  ecs: GameEngine,
  entityId: number,
  fromGrid: GridPoint,
  toGrid: GridPoint,
  toX: number,
  toY: number,
): void => {
  const position = ecs.entityManager.getComponent(entityId, 'position');
  const renderable = ecs.entityManager.getComponent(entityId, 'renderable');
  const frogSprite = ecs.entityManager.getComponent(entityId, 'frogSprite');
  if (!position || !renderable || !frogSprite) return;

  const targetFacing = facingFromDelta(toGrid.x - fromGrid.x, toGrid.y - fromGrid.y);
  const turnSteps = turnBetween(frogSprite.facing, targetFacing);
  const hopDuration = Math.max(0.2, MOVE_DURATION_S - totalStepDuration(turnSteps));
  const steps = [
    ...turnSteps,
    intentDelayStepForFacing(targetFacing, turnSteps),
    hopStepForFacing(targetFacing, hopDuration),
  ];

  frogSprite.facing = targetFacing;
  applySpriteStep(renderable, steps[0], steps[0].reverse ? FRAME_COUNT - 1 : 0);

  ecs.addComponent(entityId, 'spriteAnimation', {
    elapsed: 0,
    duration: totalStepDuration(steps),
    currentStep: 0,
    steps,
  });

  const targets = [
    { component: 'position' as const, field: 'x' as const, to: position.x },
    { component: 'position' as const, field: 'y' as const, to: position.y },
  ];

  ecs.addComponent(entityId, 'tween', createTweenSequence([
    ...turnSteps.map(step => ({ targets, duration: step.duration, easing: easeOutQuad })),
    { targets, duration: JUMP_INTENT_DELAY_S, easing: easeOutQuad },
    {
      targets: [
        { component: 'position' as const, field: 'x' as const, to: toX },
        { component: 'position' as const, field: 'y' as const, to: toY },
      ],
      duration: hopDuration,
      easing: easeOutQuad,
    },
  ]).tween);
};

export const faceFrogDirection = (
  ecs: GameEngine,
  entityId: number,
  direction: GridPoint,
): void => {
  const renderable = ecs.entityManager.getComponent(entityId, 'renderable');
  const frogSprite = ecs.entityManager.getComponent(entityId, 'frogSprite');
  if (!renderable || !frogSprite) return;
  if (direction.x === 0 && direction.y === 0) return;

  const targetFacing = facingFromDelta(direction.x, direction.y);
  const facingStep = hopStepForFacing(targetFacing, 0);

  frogSprite.facing = targetFacing;
  applySpriteStep(renderable, facingStep, FRAME_COUNT - 1);
};

export function addFrogSpriteAnimationSystemToEngine(): void {
  gameEngine.addSystem('frogSpriteAnimationSystem')
    .setPriority(SYSTEM_PRIORITIES.ANIMATION)
    .setProcessEach(
      { with: ['renderable', 'spriteAnimation'], mutates: ['renderable', 'spriteAnimation'] } as const,
      ({ entity, dt, ecs }) => {
        const animation = entity.components.spriteAnimation;
        animation.elapsed += dt;
        const { step: currentStep, stepIndex, elapsedBeforeStep } = findCurrentStep(
          animation.steps,
          animation.elapsed,
        );

        animation.currentStep = stepIndex;

        applySpriteStep(
          entity.components.renderable,
          currentStep,
          frameIndexForStep(currentStep, animation.elapsed, elapsedBeforeStep),
        );

        if (animation.elapsed >= animation.duration) {
          const finalStep = lastStep(animation.steps);
          applySpriteStep(
            entity.components.renderable,
            finalStep,
            finalStep.frameCount - 1,
          );
          ecs.commands.removeComponent(entity.id, 'spriteAnimation');
        }
      },
    );
}
