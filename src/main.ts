import { createGame } from './game/createGame';
import { platformService } from './platform/PlatformService';

async function boot(): Promise<void> {
  await platformService.init();
  createGame();
}

void boot();
