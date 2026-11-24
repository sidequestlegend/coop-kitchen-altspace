// Upstream: Assets/Scripts/Serialization/GameDataManager.cs. Loads the save once (Start -> LoadOrCreate). One per
// kitchen here; each client loads its own device's save.

import { Behaviour, type Persistence } from "../portkit/src/index.ts";
import { GameDataSettings } from "./GameDataSettings.ts";

export class GameDataManager extends Behaviour {
  settings!: GameDataSettings;

  override Start(): void {
    let storage: Persistence | null = null;
    try {
      storage = this.Storage;
      storage.has("GameData");
    } catch {
      storage = null; // a rules bench has no device storage: the save lives in memory
    }
    this.settings = new GameDataSettings(storage, () => this.Networking.GetServerTimeInSeconds());
    this.settings.LoadOrCreate();
  }
}
