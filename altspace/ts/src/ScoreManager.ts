// Upstream: Assets/Scripts/Score/ScoreManager.cs (Awake -> settings.Initialize). The score's synced home: the referee
// writes it, everyone reads it.

import { Behaviour } from "../portkit/src/index.ts";
import { ScoreSettings, type ScoreState } from "./ScoreSettings.ts";

export class ScoreManager extends Behaviour {
  static override synced = ["tips", "failed", "ok", "score"];
  tips = 0;
  failed = 0;
  ok = 0;
  score = 0;

  readonly Asset = new ScoreSettings(() => this as ScoreState);
}
