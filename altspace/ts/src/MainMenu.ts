// Upstream: Assets/Scripts/UI/Menus/MainMenu.cs. The main menu's buttons, the credits popup and the sounds popup (3, 4).
// On the board: the lobby panel, shown between rounds; the credits name the upstream's author and licence (no art of
// the upstream is used). Also the roster line: who is cooking.

import { Behaviour, type GameObject, type TextRef } from "../portkit/src/index.ts";
import { CanvasViewer } from "./ActionCode.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { MainMenuOptions } from "./MainMenuOptions.ts";
import type { SoundPopup } from "./SoundPopup.ts";

export const CHEF_COLOURS = ["Blue", "Green", "Red", "Yellow", "Orange", "Purple", "Pink", "White"];

export const CREDITS =
  "Rules and original code: <color=yellow>Hyago Oliveira</color> (github.com/HyagoOliveira/KitchenChaos, MIT License, Copyright (c) 2023 Hyago Oliveira)\n\n" +
  "Kitchen art: <color=yellow>KayKit</color> by Kay Lousberg (CC0)\n\n" +
  "Port to Altspace: AltspaceGames";

export class MainMenu extends Behaviour {
  kitchen!: Kitchen;
  mainMenuOptions!: MainMenuOptions;
  soundPopup!: SoundPopup;
  credits: GameObject | null = null;
  creditsText: TextRef | null = null;
  roster: TextRef | null = null;
  private creditsPopup!: CanvasViewer;
  private shownPhase = "";

  override Start(): void {
    this.creditsPopup = new CanvasViewer(this.credits);
    this.creditsPopup.Hide();
    if (this.creditsText) this.creditsText.text = CREDITS;
    this.mainMenuOptions.OnOpenCreditsRequested.push(() => this.HandleOpenCreditsRequested());
    this.mainMenuOptions.OnOpenSoundsOptionsRequested.push(() => this.HandleOpenSoundsOptionsRequested());
    this.soundPopup.popup.OnHidden.push(() => this.HandlePopupHidden());
    this.creditsPopup.OnHidden.push(() => this.HandlePopupHidden());
  }

  override Update(): void {
    const phase = this.kitchen.match.Phase;
    if (phase !== this.shownPhase) {
      this.shownPhase = phase;
      if (phase === "lobby" && !this.creditsPopup.IsVisible && !this.soundPopup.popup.IsVisible) this.mainMenuOptions.Show();
      else if (phase !== "lobby") {
        this.mainMenuOptions.Hide();
        this.creditsPopup.Hide();
      }
    }
    if (this.roster) {
      const names = this.Networking.GetPlayers()
        .filter((p) => this.kitchen.roster[p.uid] !== undefined)
        .sort((a, b) => this.kitchen.roster[a.uid]! - this.kitchen.roster[b.uid]!)
        .map((p) => `${CHEF_COLOURS[this.kitchen.roster[p.uid]!] ?? ""}: ${p.displayName}`);
      this.roster.text = names.length ? names.join("\n") : "Press COOK to join the kitchen";
    }
  }

  private HandleOpenCreditsRequested(): void {
    this.mainMenuOptions.Hide();
    this.creditsPopup.Show();
  }

  private HandleOpenSoundsOptionsRequested(): void {
    this.mainMenuOptions.Hide();
    this.soundPopup.Show();
  }

  /** The credits popup's Close button. */
  CloseCredits(): void {
    this.creditsPopup.Hide();
  }

  private HandlePopupHidden(): void {
    if (this.kitchen.match.Phase === "lobby") this.mainMenuOptions.Show();
  }
}
