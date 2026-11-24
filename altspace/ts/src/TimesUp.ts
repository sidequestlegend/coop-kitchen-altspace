// Upstream: Assets/Scripts/UI/TimesUp.cs. At time up "Times Up!" animates for 3 s with SFX_timesup, then the results
// open (82). The 3 s and the results are the match's (MatchManager, phase "timesup"); this draws and sounds it.

import { Behaviour } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";

export class TimesUp extends Behaviour {
  kitchen!: Kitchen;
  path = "";
  board = "";
  private visible: boolean | null = null;
  private seenRound = -1;
  played = 0;

  override Update(): void {
    const m = this.kitchen.match.match;
    const visible = m.phase === "timesup";
    if (visible !== this.visible) {
      // only a time up this client saw happen is played (not one it found on arrival)
      if (visible && this.visible === false && this.seenRound !== m.round) this.HandleMatchFinished();
      this.visible = visible;
      this.Host.setActive(`@${this.path}`, visible);
    }
    if (visible) this.seenRound = m.round;
  }

  private HandleMatchFinished(): void {
    this.played++;
    this.kitchen.PlaySound("timesUp", this.board);
    this.Host.animPlay(`@${this.path}`, "TimesUp@Show");
  }
}
