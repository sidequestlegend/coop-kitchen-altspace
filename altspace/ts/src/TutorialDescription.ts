// Upstream: Assets/Scripts/UI/TutorialDescription.cs. The tutorial's prompt: set (normal colour, full alpha); completed
// (green, SFX_delivery_success02); faded out at 1.2 a second (115).
//
// The text, its colour and the fade's start are in the tutorial's synced state; each client draws them. The relay has
// no op for a canvas group's alpha (a gap), so the text shows until its fade has run, then hides.

import { Behaviour, Color, type TextRef } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { TutorialManager } from "./TutorialManager.ts";

export class TutorialDescription extends Behaviour {
  kitchen!: Kitchen;
  manager!: TutorialManager;
  path = "";
  board = "";
  text: TextRef | null = null;
  uncompletedColor = new Color(1, 1, 1, 1);
  completedColor = new Color(0, 1, 0, 1);
  private shown = "";
  /** Completions this client heard (for tests). */
  completions = 0;

  override Start(): void {
    this.kitchen.OnEffect("tutorial", () => {
      this.completions++;
      this.kitchen.PlaySound("tutorialDone", this.board);
    });
  }

  SetUncompletedText(value: string): void {
    const tut = this.manager.tut;
    tut.text = value;
    tut.green = 0;
    tut.fade = null;
  }

  Complete(): void {
    this.manager.tut.green = 1;
    this.kitchen.Fx("tutorial");
  }

  FadeOut(): void {
    this.manager.tut.fade = this.kitchen.match.G;
  }

  /** The prompt as this client shows it ("" when hidden). */
  get Visible(): string {
    const tut = this.manager.tut;
    if (!this.manager.IsRunning || !tut.text) return "";
    if (tut.fade !== null && this.kitchen.match.KitchenG - tut.fade >= this.manager.FadeSeconds) return "";
    return tut.text;
  }

  override Update(): void {
    const text = this.Visible;
    const key = text + "|" + this.manager.tut.green;
    if (key === this.shown) return;
    this.shown = key;
    this.Host.setActive(`@${this.path}`, text !== "");
    if (this.text) {
      this.text.text = text;
      this.text.color = this.manager.tut.green === 1 ? this.completedColor : this.uncompletedColor;
    }
  }
}
