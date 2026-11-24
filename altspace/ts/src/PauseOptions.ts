// Upstream: Assets/Scripts/UI/Menus/PauseOptions.cs. The pause panel's buttons: Resume, Restart, Sounds, Exit (86); the
// port's Exit reads "End round". Plus the board's PAUSE button (upstream: the P key).

import { Behaviour } from "../portkit/src/index.ts";
import { CanvasViewer } from "./ActionCode.ts";
import type { Kitchen } from "./Kitchen.ts";

export class PauseOptions extends Behaviour {
  kitchen!: Kitchen;
  readonly OnResumeClicked: Array<() => void> = [];
  readonly OnRestartClicked: Array<() => void> = [];
  readonly OnSoundClicked: Array<() => void> = [];
  readonly OnExitClicked: Array<() => void> = [];
  viewer!: CanvasViewer;

  override Start(): void {
    this.viewer = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
  }

  Show(): void {
    this.viewer.Show();
  }

  Hide(): void {
    this.viewer.Hide();
  }

  /** The PAUSE button (PlayerManager.HandlePlayerPause). */
  Pause(): void {
    this.kitchen.match.SendCommand("RequestPause");
  }

  Resume(): void {
    for (const l of this.OnResumeClicked.slice()) l();
  }

  Restart(): void {
    for (const l of this.OnRestartClicked.slice()) l();
  }

  Sound(): void {
    for (const l of this.OnSoundClicked.slice()) l();
  }

  Exit(): void {
    for (const l of this.OnExitClicked.slice()) l();
  }
}
