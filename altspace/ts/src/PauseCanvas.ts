// Upstream: Assets/Scripts/UI/Menus/PauseCanvas.cs. The pause panel and its popups: Restart and Exit first ask "You will
// lose your progress. Are you sure?" with Yes and No (87); Sounds opens the sounds popup; closing a popup shows the
// options again. The popups are each client's own; Resume, Restart and End round go to the referee as commands.

import { Behaviour, type GameObject } from "../portkit/src/index.ts";
import { CanvasViewer } from "./ActionCode.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { PauseOptions } from "./PauseOptions.ts";
import type { SoundPopup } from "./SoundPopup.ts";

export class PauseCanvas extends Behaviour {
  kitchen!: Kitchen;
  pauseOptions!: PauseOptions;
  soundPopup!: SoundPopup;
  confirm: GameObject | null = null;
  viewer!: CanvasViewer;
  private confirmPopup!: CanvasViewer;
  /** What the open confirmation is for. */
  asking: "restart" | "exit" | "" = "";

  override Start(): void {
    this.viewer = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
    this.confirmPopup = new CanvasViewer(this.confirm);
    this.OnEnable();
  }

  private OnEnable(): void {
    this.confirmPopup.OnHidden.push(() => this.HandleAnyPopupHidden());
    this.soundPopup.popup.OnHidden.push(() => this.HandleAnyPopupHidden());
    this.pauseOptions.OnResumeClicked.push(() => this.HandleResumeClicked());
    this.pauseOptions.OnRestartClicked.push(() => this.HandleRestartClicked());
    this.pauseOptions.OnSoundClicked.push(() => this.HandleSoundClicked());
    this.pauseOptions.OnExitClicked.push(() => this.HandleExitClicked());
    this.confirmPopup.Hide();
  }

  Show(): void {
    this.viewer.Show();
    this.pauseOptions.Show();
  }

  Hide(): void {
    this.asking = "";
    this.confirmPopup.Hide();
    this.viewer.Hide();
  }

  private HandleAnyPopupHidden(): void {
    if (this.viewer.IsVisible) this.pauseOptions.Show();
  }

  private HandleResumeClicked(): void {
    this.kitchen.match.SendCommand("RequestResume");
  }

  private HandleRestartClicked(): void {
    this.pauseOptions.Hide();
    this.asking = "restart";
    this.confirmPopup.Show();
  }

  private HandleSoundClicked(): void {
    this.pauseOptions.Hide();
    this.soundPopup.Show();
  }

  private HandleExitClicked(): void {
    this.pauseOptions.Hide();
    this.asking = "exit";
    this.confirmPopup.Show();
  }

  /** Yes on the confirmation. */
  Confirmed(): void {
    const asking = this.asking;
    this.asking = "";
    this.confirmPopup.Hide();
    if (asking === "restart") this.kitchen.match.SendCommand("Restart");
    else if (asking === "exit") this.kitchen.match.SendCommand("EndRound");
  }

  /** No on the confirmation. */
  Declined(): void {
    this.asking = "";
    this.confirmPopup.Hide();
  }
}
