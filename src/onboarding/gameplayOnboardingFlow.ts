import { playSound } from '../audio/audio';
import type { GameEngine } from '../ecs/Engine';
import {
  completedOnboardingCompletion,
  saveOnboardingCompletion,
  skippedOnboardingCompletion,
  tutorialStepIndex,
  tutorialSteps,
  type GameplayOnboardingCompletion,
  type GameplayOnboardingKind,
  type GameplayOnboardingSession,
} from './gameplayOnboarding';

const ONBOARDING_COMPLETION_RESOURCES = {
  basics: 'gameplayOnboardingCompletion',
  operands: 'operandOnboardingCompletion',
} as const;

function onboardingCompletion(
  engine: GameEngine,
  kind: GameplayOnboardingKind,
): GameplayOnboardingCompletion {
  return engine.getResource(ONBOARDING_COMPLETION_RESOURCES[kind]);
}

export function startNormalGame(engine: GameEngine): void {
  void engine.setScreen('playing', {
    level: 1,
    isFreshGame: true,
  });
}

async function continueToOperandTutorial(engine: GameEngine): Promise<void> {
  await engine.popScreen();
  await engine.pushScreen('tutorial', {
    kind: 'operands',
    isReplay: true,
    returnTo: { kind: 'previousScreen' },
  });
}

function restoreActivePlayer(
  engine: GameEngine,
  session: Extract<GameplayOnboardingSession, { active: true }>,
): void {
  const player = engine.tryGetSingleton(['player', 'position', 'health', 'pathFollower'] as const);
  const snapshot = session.playerSnapshot;
  if (!player || !snapshot) throw new Error('Operand tutorial cannot restore the active player');

  Object.assign(player.components.position, snapshot.position);
  player.components.player.lives = snapshot.lives;
  player.components.player.gameOverPending = snapshot.gameOverPending;
  Object.assign(player.components.health, snapshot.health);
  Object.assign(player.components.pathFollower, snapshot.pathFollower, {
    breadcrumbs: snapshot.pathFollower.breadcrumbs.map(point => ({ ...point })),
  });
  (['tween', 'spriteAnimation', 'shake'] as const).forEach(component => {
    if (engine.hasComponent(player.id, component)) engine.commands.removeComponent(player.id, component);
  });
}

function continueAfterTutorial(
  engine: GameEngine,
  session: Extract<GameplayOnboardingSession, { active: true }>,
): void {
  if (session.returnTo.kind === 'nextTutorial') {
    void continueToOperandTutorial(engine);
    return;
  }
  if (session.returnTo.kind === 'previousScreen') {
    void engine.popScreen();
    return;
  }
  if (session.returnTo.kind === 'newGame') {
    startNormalGame(engine);
    return;
  }

  restoreActivePlayer(engine, session);
  void engine.setScreen('playing', {
    level: session.returnTo.level,
    isFreshGame: false,
  });
}

export function skipGameplayOnboarding(engine: GameEngine): void {
  const session = engine.getResource('gameplayOnboardingSession');
  const kind = session.active ? session.kind : 'basics';
  const current = onboardingCompletion(engine, kind);
  const next = skippedOnboardingCompletion(current);
  playSound('uiSelect');
  engine.setResource(ONBOARDING_COMPLETION_RESOURCES[kind], next);
  if (next === 'skipped' && current !== 'skipped') saveOnboardingCompletion(kind, 'skipped');
  if (!session.active) {
    startNormalGame(engine);
    return;
  }
  if (session.returnTo.kind === 'nextTutorial') {
    void engine.popScreen();
    return;
  }
  continueAfterTutorial(engine, session);
}

function completeTutorial(engine: GameEngine): void {
  const session = engine.getResource('gameplayOnboardingSession');
  if (!session.active) return;
  const current = onboardingCompletion(engine, session.kind);
  const next = completedOnboardingCompletion(current);
  playSound('uiSelect');
  engine.setResource(ONBOARDING_COMPLETION_RESOURCES[session.kind], next);
  if (next === 'completed' && current !== 'completed') {
    saveOnboardingCompletion(session.kind, 'completed');
  }
  continueAfterTutorial(engine, session);
}

function setGameplayOnboardingStep(engine: GameEngine, stepIndex: number): void {
  const session = engine.getResource('gameplayOnboardingSession');
  if (!session.active) return;
  engine.setResource('gameplayOnboardingSession', {
    ...session,
    stepIndex: tutorialStepIndex(session.kind, stepIndex),
  });
}

export function nextGameplayOnboardingStep(engine: GameEngine): void {
  const session = engine.getResource('gameplayOnboardingSession');
  if (!session.active) return;
  if (session.stepIndex >= tutorialSteps(session.kind).length - 1) {
    completeTutorial(engine);
    return;
  }
  playSound('uiSelect');
  setGameplayOnboardingStep(engine, session.stepIndex + 1);
}

export function previousGameplayOnboardingStep(engine: GameEngine): void {
  const session = engine.getResource('gameplayOnboardingSession');
  if (!session.active) return;
  if (session.stepIndex === 0) {
    skipGameplayOnboarding(engine);
    return;
  }
  playSound('uiBack');
  setGameplayOnboardingStep(engine, session.stepIndex - 1);
}
