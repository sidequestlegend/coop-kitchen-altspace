// Upstream: Assets/Scripts/Score/ScoreSettings.cs. Score = max(0, tips + 20 x delivered - 10 x wrong plates) (75).
// An expired order costs nothing (72, 130: a rule, kept). The values live in ScoreManager's synced fields; the
// increase and decrease events fire on the referee, which shows the "+ N" / "- N" to everyone (Score.ts).

import data from "../data/kitchen-data.json" with { type: "json" };
import { invoke } from "./ActionCode.ts";

export interface ScoreState {
  tips: number;
  failed: number;
  ok: number;
  score: number;
}

const f = Math.fround;

export class ScoreSettings {
  private readonly deliveredOrdersMultiplier = data.score.deliveredOrdersMultiplier;
  private readonly failedOrdersMultiplier = data.score.failedOrdersMultiplier;
  private readonly state: () => ScoreState;
  readonly OnScoreIncreased: Array<(delta: number) => void> = [];
  readonly OnScoreDecreased: Array<(delta: number) => void> = [];

  constructor(state: () => ScoreState) {
    this.state = state;
  }

  get Tips(): number {
    return this.state().tips;
  }
  get FailedDeliveries(): number {
    return this.state().failed;
  }
  get SuccessfulDeliveries(): number {
    return this.state().ok;
  }
  get Score(): number {
    return this.state().score;
  }

  Initialize(): void {
    const s = this.state();
    s.tips = 0;
    s.score = 0;
    s.failed = 0;
    s.ok = 0;
  }

  DeliveryOrder(tip: number): void {
    const s = this.state();
    s.tips += tip;
    s.ok++;
    const lastScore = s.score;
    s.score = this.GetTotalScore();
    invoke(this.OnScoreIncreased, f(s.score - lastScore));
  }

  DeliveryFailedOrder(): void {
    const s = this.state();
    s.failed++;
    const lastScore = s.score;
    s.score = this.GetTotalScore();
    invoke(this.OnScoreDecreased, f(lastScore - s.score));
  }

  GetTotalFailedDeliveries(): number {
    return f(this.state().failed * f(this.failedOrdersMultiplier));
  }

  GetTotalSuccessfulDeliveries(): number {
    return f(this.state().ok * f(this.deliveredOrdersMultiplier));
  }

  private GetTotalScore(): number {
    const score = f(f(this.state().tips + this.GetTotalSuccessfulDeliveries()) - this.GetTotalFailedDeliveries());
    return Math.max(0, score);
  }
}
