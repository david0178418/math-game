import { definePlugin, type WithScreens, type EmptyConfig, type ScreenDefinition } from 'ecspresso';
import { addAISystemToEngine } from './systems/AISystem';
import { addEnemySpawnSystemToEngine } from './systems/EnemySpawnSystem';
import { addProblemManagementSystemToEngine } from './systems/ProblemManagementSystem';
import { addUISystemToEngine } from './systems/UISystem';
import type { PlayingScreenConfig } from './Engine';

type RequiresPlayingScreen = WithScreens<EmptyConfig, {
  playing: ScreenDefinition<PlayingScreenConfig, PlayingScreenConfig>;
}>;

/**
 * Plugin bundling systems that only run while the 'playing' screen is active.
 * The `inScreens` default is applied to every system registered inside install,
 * so individual systems no longer need to repeat the gate.
 */
export const gameplayPlugin = definePlugin('gameplay')
  .requires<RequiresPlayingScreen>()
  .setSystemDefaults({ inScreens: ['playing'] })
  .install(() => {
    addAISystemToEngine();
    addEnemySpawnSystemToEngine();
    addProblemManagementSystemToEngine();
    addUISystemToEngine();
  });
