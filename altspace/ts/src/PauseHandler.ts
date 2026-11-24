// Upstream: Assets/Scripts/UI/Menus/PauseHandler.cs. Shows the pause panel while paused and hides it on resume. The pause
// is the kitchen's shared one (MatchManager), so every client shows the panel, with who paused. The PAUSE button shows
// during a round's countdown and the round only (the tutorial cannot be paused, 90).

import { Behaviour, type TextRef } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { PauseCanvas } from "./PauseCanvas.ts";

export class PauseHandler extends Behaviour {
  kitchen!: Kitchen;
  pauseCanvas!: PauseCanvas;
  /** The board's PAUSE button. */
  pauseButton = "";
  pausedBy: TextRef | null = null;
  private paused: boolean | null = null;
  private button: boolean | null = null;

  override Update(): void {
    const match = this.kitchen.match;
    const paused = match.Paused;
    if (paused !== this.paused) {
      this.paused = paused;
      if (paused) this.HandlePaused();
      else this.HandleResumed();
    }
    const m = match.match;
    const button = !paused && m.mode === "game" && (m.phase === "countdown" || m.phase === "round");
    if (button !== this.button && this.pauseButton) {
      this.button = button;
      this.Host.setActive(this.pauseButton, button);
    }
  }

  private HandlePaused(): void {
    this.pauseCanvas.Show();
    const by = this.Networking.GetPlayers().find((p) => p.uid === this.kitchen.match.PausedBy);
    if (this.pausedBy) this.pausedBy.text = by ? `Paused by ${by.displayName}` : "Paused";
  }

  private HandleResumed(): void {
    this.pauseCanvas.Hide();
  }
}
