// Upstream: Assets/Scripts/Serialization/GameData.cs. What is saved: high score and the two volumes (the language is
// never set upstream and is left out). Saved per device and per world (localStorage), not per account (C16).

export interface AudioData {
  music: number;
  effects: number;
}

export interface GameData {
  HighScore: number;
  Audio: AudioData;
  /** Rounds whose results were already compared with the high score (so a reload does not count one twice). */
  Checked: number[];
  CreationTime: number;
  LastUpdateTime: number;
}

export const DefaultVolume = 1;

export function NewGameData(now: number): GameData {
  return { HighScore: 0, Audio: { music: DefaultVolume, effects: DefaultVolume }, Checked: [], CreationTime: now, LastUpdateTime: 0 };
}
