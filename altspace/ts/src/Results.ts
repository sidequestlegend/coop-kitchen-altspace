// Upstream: Assets/Scripts/UI/Results.cs. "Delivered Orders x NN" with NN x 20, "Failed Orders x NN" with NN x 10,
// Tips, Total (83); "New High Score!" when the score beats the saved one, which is then saved (84); Continue (85).
//
// The values are the match's results (copied from the score when time was up). The high score is each chef's own, on
// their own device; the board also shows the kitchen's best (C16). The tutorial's results do not touch the high score.

import { Behaviour, type GameObject, type TextRef } from "../portkit/src/index.ts";
import type { GameDataManager } from "./GameDataManager.ts";
import type { Kitchen } from "./Kitchen.ts";
import { FloatText } from "./Score.ts";

/** string.Format("... x {0:D2}", n). */
function Format(format: string, value: number): string {
  return format.replace("{0:D2}", String(value).padStart(2, "0"));
}

export class Results extends Behaviour {
  kitchen!: Kitchen;
  gameData!: GameDataManager;
  path = "";
  failedDeliveries: TextRef | null = null;
  totalFailedDeliveries: TextRef | null = null;
  successfulDeliveries: TextRef | null = null;
  totalSuccessfulDeliveries: TextRef | null = null;
  tips: TextRef | null = null;
  totalScore: TextRef | null = null;
  best: TextRef | null = null;
  newHighScore: GameObject | null = null;
  private visible: boolean | null = null;
  /** Whether this client's last results showed "New High Score!" (for tests). */
  isNewHighScore = false;

  override Update(): void {
    const m = this.kitchen.match.match;
    const visible = m.phase === "results" && m.res !== null;
    if (visible !== this.visible) {
      this.visible = visible;
      this.Host.setActive(`@${this.path}`, visible);
      if (visible) this.ShowResults();
    }
  }

  private ShowResults(): void {
    const res = this.kitchen.match.match.res!;
    const failedOrdersFormat = "Failed Orders x {0:D2}";
    const deliveredOrdersFormat = "Delivered Orders x {0:D2}";
    if (this.failedDeliveries) this.failedDeliveries.text = Format(failedOrdersFormat, res.bad);
    if (this.totalFailedDeliveries) this.totalFailedDeliveries.text = FloatText(res.bad * 10);
    if (this.successfulDeliveries) this.successfulDeliveries.text = Format(deliveredOrdersFormat, res.ok);
    if (this.totalSuccessfulDeliveries) this.totalSuccessfulDeliveries.text = FloatText(res.ok * 20);
    if (this.tips) this.tips.text = String(res.tips);
    if (this.totalScore) this.totalScore.text = FloatText(res.score);
    if (this.best) this.best.text = res.mode === "game" ? `Kitchen best: ${FloatText(this.kitchen.match.match.best)}` : "";
    this.CheckHighScore();
  }

  private CheckHighScore(): void {
    const m = this.kitchen.match.match;
    const res = m.res!;
    const data = this.gameData.settings.Data;
    const me = this.Networking.LocalPlayer.uid;
    const mine = res.mode === "game" && this.kitchen.IsChef(me) && data.Checked.indexOf(m.round) < 0;
    // (uint)score > HighScore
    this.isNewHighScore = mine && Math.trunc(res.score) > data.HighScore;
    this.newHighScore?.SetActive(this.isNewHighScore);
    if (!mine) return;
    data.Checked = [...data.Checked.slice(-19), m.round];
    if (this.isNewHighScore) data.HighScore = Math.trunc(res.score);
    this.gameData.settings.Save();
  }

  /** The Continue button. */
  HandleContinueButtonClick(): void {
    this.kitchen.match.SendCommand("Continue");
  }
}
