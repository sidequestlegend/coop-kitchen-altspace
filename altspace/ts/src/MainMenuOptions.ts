// Upstream: Assets/Scripts/UI/Menus/MainMenuOptions.cs. PLAY, TUTORIAL, SOUNDS, CREDITS (3); plus the port's COOK (join
// or leave the kitchen; PORT.md 8.6). PLAY and TUTORIAL go to the referee as commands; whoever presses them cooks.
// The upstream's 0.2 s button delay and navigation sounds are left out (89).

import { Behaviour } from "../portkit/src/index.ts";
import { CanvasViewer } from "./ActionCode.ts";
import type { Kitchen } from "./Kitchen.ts";

export class MainMenuOptions extends Behaviour {
  kitchen!: Kitchen;
  /** The TUTORIAL button (hidden when the `tutorial` setting is off). */
  tutorialButton = "";
  readonly OnOpenCreditsRequested: Array<() => void> = [];
  readonly OnOpenSoundsOptionsRequested: Array<() => void> = [];
  viewer!: CanvasViewer;

  override Start(): void {
    this.viewer = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
    if (this.tutorialButton && this.Settings.get("tutorial") === "off") this.Host.setActive(this.tutorialButton, false);
  }

  Show(): void {
    this.viewer.Show();
  }

  Hide(): void {
    this.viewer.Hide();
  }

  PlayGame(): void {
    this.kitchen.match.SendCommand("Play");
  }

  PlayTutorial(): void {
    this.kitchen.match.SendCommand("Tutorial");
  }

  /** COOK: join the kitchen, or leave it. */
  ToggleCook(): void {
    this.kitchen.SendCommand("Cook", !this.kitchen.IsChef(this.Networking.LocalPlayer.uid));
  }

  RequestOpenCredits(): void {
    for (const l of this.OnOpenCreditsRequested.slice()) l();
  }

  RequestOpenSoundOptions(): void {
    for (const l of this.OnOpenSoundsOptionsRequested.slice()) l();
  }
}
