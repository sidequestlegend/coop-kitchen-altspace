// Upstream: Assets/Scripts/UI/Menus/SoundPopup.cs. "Background Music" and "Sound Effects" volumes (shown as value x 100,
// two digits), Reset, Back (saves, then closes) (88).
//
// Reduced to steps of 0.1 with minus and plus buttons, local to each device (C21). Saved with the high score. The values
// are kept and shown; applying them to the kit's sources needs a volume op the relay does not have (a gap, PORT.md 11).

import { Behaviour, type TextRef } from "../portkit/src/index.ts";
import { CanvasViewer } from "./ActionCode.ts";
import { DefaultVolume } from "./GameData.ts";
import type { GameDataManager } from "./GameDataManager.ts";
import { D2 } from "./CountDown.ts";

export class SoundPopup extends Behaviour {
  gameData!: GameDataManager;
  path = "";
  musicLabel: TextRef | null = null;
  effectsLabel: TextRef | null = null;
  popup!: CanvasViewer;

  override Start(): void {
    this.popup = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
    this.popup.Hide();
    this.Refresh();
  }

  Show(): void {
    this.Refresh();
    this.popup.Show();
  }

  private Step(which: "music" | "effects", delta: number): void {
    const audio = this.gameData.settings.Data.Audio;
    audio[which] = Math.round(Math.min(1, Math.max(0, audio[which] + delta)) * 10) / 10;
    this.Refresh();
  }

  MusicUp(): void {
    this.Step("music", 0.1);
  }
  MusicDown(): void {
    this.Step("music", -0.1);
  }
  EffectsUp(): void {
    this.Step("effects", 0.1);
  }
  EffectsDown(): void {
    this.Step("effects", -0.1);
  }

  HandleResetButtonClick(): void {
    const audio = this.gameData.settings.Data.Audio;
    audio.music = DefaultVolume;
    audio.effects = DefaultVolume;
    this.Refresh();
  }

  /** Back: saves, then closes. */
  HandleCloseButtonClick(): void {
    this.gameData.settings.Save();
    this.popup.Hide();
  }

  private Refresh(): void {
    const audio = this.gameData.settings.Data.Audio;
    if (this.musicLabel) this.musicLabel.text = D2(Math.round(audio.music * 100));
    if (this.effectsLabel) this.effectsLabel.text = D2(Math.round(audio.effects * 100));
  }
}
