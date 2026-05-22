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

const FRAME_COUNT = 8;
const TURN_DURATION_S = 0.18;
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

const hopStepForFacing = (facing: FrogFacing, duration: number): SpriteStep => {
  if (facing === 'toward') {
    return { imageSrc: frogHopToward, frameCount: FRAME_COUNT, duration };
  }
  if (facing === 'away') {
    return { imageSrc: frogHopAway, frameCount: FRAME_COUNT, duration };
  }
  return { imageSrc: frogHopSide, frameCount: FRAME_COUNT, duration, flipX: sideFlip(facing) };
};

const turnBetween = (from: FrogFacing, to: FrogFacing): SpriteStep[] => {
  if (from === to) return [];

  if (from === 'toward' && isSide(to)) {
    return [{ imageSrc: frogTurnFrontSide, frameCount: FRAME_COUNT, duration: TURN_DURATION_S, flipX: sideFlip(to) }];
  }
  if (isSide(from) && to === 'toward') {
    return [{ imageSrc: frogTurnFrontSide, frameCount: FRAME_COUNT, duration: TURN_DURATION_S, flipX: sideFlip(from), reverse: true }];
  }
  if (from === 'away' && isSide(to)) {
    return [{ imageSrc: frogTurnSideAway, frameCount: FRAME_COUNT, duration: TURN_DURATION_S, flipX: sideFlip(to), reverse: true }];
  }
  if (isSide(from) && to === 'away') {
    return [{ imageSrc: frogTurnSideAway, frameCount: FRAME_COUNT, duration: TURN_DURATION_S, flipX: sideFlip(from) }];
  }
  if (isSide(from) && isSide(to)) {
    return [{ imageSrc: frogHopSide, frameCount: FRAME_COUNT, duration: TURN_DURATION_S, flipX: sideFlip(to) }];
  }

  const bridge: FrogFacing = 'right';
  return [
    ...turnBetween(from, bridge),
    ...turnBetween(bridge, to),
  ];
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

export const startFrogGridMovement = (
  ecs: GameEngine,
  entityId: number,
  fromGrid: { x: number; y: number },
  toGrid: { x: number; y: number },
  toX: number,
  toY: number,
): void => {
  const position = ecs.entityManager.getComponent(entityId, 'position');
  const renderable = ecs.entityManager.getComponent(entityId, 'renderable');
  const frogSprite = ecs.entityManager.getComponent(entityId, 'frogSprite');
  if (!position || !renderable || !frogSprite) return;

  const targetFacing = facingFromDelta(toGrid.x - fromGrid.x, toGrid.y - fromGrid.y);
  const turnSteps = turnBetween(frogSprite.facing, targetFacing);
  const hopDuration = Math.max(0.2, MOVE_DURATION_S - turnSteps.reduce((sum, step) => sum + step.duration, 0));
  const steps = [...turnSteps, hopStepForFacing(targetFacing, hopDuration)];

  frogSprite.facing = targetFacing;
  applySpriteStep(renderable, steps[0], steps[0].reverse ? FRAME_COUNT - 1 : 0);

  ecs.addComponent(entityId, 'spriteAnimation', {
    elapsed: 0,
    currentStep: 0,
    steps,
  });

  const targets = [
    { component: 'position' as const, field: 'x' as const, to: position.x },
    { component: 'position' as const, field: 'y' as const, to: position.y },
  ];

  ecs.addComponent(entityId, 'tween', createTweenSequence([
    ...turnSteps.map(step => ({ targets, duration: step.duration, easing: easeOutQuad })),
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

export function addFrogSpriteAnimationSystemToEngine(): void {
  gameEngine.addSystem('frogSpriteAnimationSystem')
    .setPriority(SYSTEM_PRIORITIES.ANIMATION)
    .setProcessEach(
      { with: ['renderable', 'spriteAnimation'], mutates: ['renderable', 'spriteAnimation'] } as const,
      ({ entity, dt, ecs }) => {
        const animation = entity.components.spriteAnimation;
        animation.elapsed += dt;

        let elapsedBeforeStep = 0;
        let currentStep = animation.steps[animation.steps.length - 1];
        let stepIndex = animation.steps.length - 1;

        for (let i = 0; i < animation.steps.length; i++) {
          const step = animation.steps[i];
          if (animation.elapsed < elapsedBeforeStep + step.duration) {
            currentStep = step;
            stepIndex = i;
            break;
          }
          elapsedBeforeStep += step.duration;
        }

        animation.currentStep = stepIndex;

        const stepElapsed = Math.max(0, animation.elapsed - elapsedBeforeStep);
        const progress = Math.min(1, stepElapsed / currentStep.duration);
        const forwardFrame = Math.min(
          currentStep.frameCount - 1,
          Math.floor(progress * currentStep.frameCount),
        );
        const frameIndex = currentStep.reverse
          ? currentStep.frameCount - 1 - forwardFrame
          : forwardFrame;

        applySpriteStep(entity.components.renderable, currentStep, frameIndex);

        const totalDuration = animation.steps.reduce((sum, step) => sum + step.duration, 0);
        if (animation.elapsed >= totalDuration) {
          applySpriteStep(
            entity.components.renderable,
            animation.steps[animation.steps.length - 1],
            FRAME_COUNT - 1,
          );
          ecs.commands.removeComponent(entity.id, 'spriteAnimation');
        }
      },
    );
}
