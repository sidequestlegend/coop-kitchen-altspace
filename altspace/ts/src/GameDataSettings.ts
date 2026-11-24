// Upstream: Assets/Scripts/Serialization/GameDataSettings.cs. Loads the save (or makes a new one) and saves it; the
// persistence package becomes the runtime's per-device storage (`this.Storage`: localStorage under
// pk1.coop-kitchen.<inst>.<uid>.).

import type { Persistence } from "../portkit/src/index.ts";
import { invoke } from "./ActionCode.ts";
import { NewGameData, type GameData } from "./GameData.ts";

const saveFileName = "GameData";

export class GameDataSettings {
  private readonly storage: Persistence | null;
  private readonly now: () => number;
  readonly OnSaveFinished: Array<() => void> = [];
  readonly OnLoadFinished: Array<() => void> = [];
  Data: GameData;

  constructor(storage: Persistence | null, now: () => number) {
    this.storage = storage;
    this.now = now;
    this.Data = NewGameData(now());
  }

  Save(): void {
    this.Data.LastUpdateTime = this.now();
    this.storage?.set(saveFileName, this.Data);
    invoke(this.OnSaveFinished);
  }

  LoadOrCreate(): void {
    const loaded = this.storage ? this.storage.get<GameData | null>(saveFileName, null) : null;
    this.Data = loaded && typeof loaded.HighScore === "number" ? { ...NewGameData(this.now()), ...loaded } : NewGameData(this.now());
    invoke(this.OnLoadFinished);
  }
}
