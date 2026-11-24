// Upstream: Assets/Scripts/Musics/BackgroundMusic.cs. One looping music source; pitch 1.25 in the final seconds and 1
// again when time is up (81, 82).
//
// Per kitchen, switched on by the `music` setting (default on). Pitch and volume (this device's Background Music
// volume, SoundPopup) go to the source through the relay ops `audioPitch` and `audioVolume`.

import { Behaviour } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";

export class BackgroundMusic extends Behaviour {
  kitchen!: Kitchen;
  path = "";
  accelerateSpeed = 1.25;
  /** The pitch upstream would set now. */
  pitch = 1;
  private on: boolean | null = null;

  override Update(): void {
    const on = this.Settings.get("music") !== "off" && (this.kitchen.gameData?.settings.Data.Audio.music ?? 1) > 0;
    if (on !== this.on) {
      this.on = on;
      this.Host.setActive(`@${this.path}`, on);
    }
    const m = this.kitchen.match.match;
    const pitch = m.phase === "round" && m.ff === 1 ? this.accelerateSpeed : 1;
    if (pitch !== this.pitch) {
      this.pitch = pitch;
      this.Host.audioPitch(`@${this.path}`, pitch);
    }
    const volume = this.kitchen.gameData?.settings?.Data.Audio.music ?? 1;
    if (volume !== this.volume) {
      this.volume = volume;
      this.Host.audioVolume(`@${this.path}`, volume);
    }
  }

  private volume = -1;
}
