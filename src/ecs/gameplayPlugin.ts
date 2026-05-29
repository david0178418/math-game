import { definePlugin, type ScreenDefinition, type ScreensConfig } from 'ecspresso';
import { addAISystemToEngine } from './systems/AISystem';
import { addEnemySpawnSystemToEngine } from './systems/EnemySpawnSystem';
import { addProblemManagementSystemToEngine } from './systems/ProblemManagementSystem';
import { addUISystemToEngine } from './systems/UISystem';
import { registerFrogTongueInit } from './systems/FrogTongueSystem';
import type { PlayingScreenConfig } from './types';

type RequiresPlayingScreen = ScreensConfig<{
  playing: ScreenDefinition<PlayingScreenConfig>;
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
    registerFrogTongueInit();
  });
