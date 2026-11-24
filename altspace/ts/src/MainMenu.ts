// Upstream: Assets/Scripts/UI/Menus/MainMenu.cs. The main menu's buttons, the credits popup and the sounds popup (3, 4).
// On the board: the lobby panel, shown between rounds; the credits name the upstream's author and licence and every
// licensed file the kit uses (no art of the upstream is used). Also the roster line: who is cooking.

import { Behaviour, type GameObject, type TextRef } from "../portkit/src/index.ts";
import { CanvasViewer } from "./ActionCode.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { MainMenuOptions } from "./MainMenuOptions.ts";
import type { SoundPopup } from "./SoundPopup.ts";

export const CHEF_COLOURS = ["Blue", "Green", "Red", "Yellow", "Orange", "Purple", "Pink", "White"];

/**
 * The credits panel's text: the one source of it. The kit builder puts the same text into the kit (it reads it from
 * Assets/Kit/Editor/kit-contract.json, which tools/gen-bindings.ts writes from here), and Start sets it again. The MIT
 * licence asks for the upstream's copyright and permission notice; the notice is in the script's banner and the kit's
 * notices, and the panel names the author, the repository and the licence.
 */
export const CREDITS =
  "<b>Co-op Kitchen</b> (working title)\n\n" +
  "Based on code by <color=yellow>Hyago Oliveira</color>, github.com/HyagoOliveira/KitchenChaos (MIT), " +
  "Copyright (c) 2023 Hyago Oliveira; made co-op for Altspace with the portkit runtime (MIT).\n\n" +
  "Models: <color=yellow>KayKit Restaurant Bits</color> by Kay Lousberg, www.kaylousberg.com (CC0 1.0).\n" +
  "Sounds: <color=yellow>Kenney</color> Interface Sounds and Impact Sounds, www.kenney.nl (CC0 1.0); the sizzle made for this port (CC0 1.0).\n" +
  "Font: Liberation Sans, Copyright (c) 2012 Red Hat, Inc. (SIL Open Font License 1.1).\n\n" +
  "No art, sound or music of the upstream project is used. Not affiliated with or endorsed by the upstream author " +
  "or any commercial cooking game. Full licence texts: THIRD-PARTY-NOTICES.md in the kit.";

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
