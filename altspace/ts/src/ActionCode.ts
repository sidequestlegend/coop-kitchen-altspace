// New file (no upstream counterpart): what the author's `com.actioncode.*` packages (MIT) did for the game, re-implemented
// for the port. Their behaviour is taken from this repo's history (`git show 773181e^:Assets/Scripts/...`) and from the
// author's public repositories (PORT.md 4.2):
//
//   physics          IEnable; BoxCaster.HasHit / TryGetEnabledComponent  -> `BoxCaster` over the target the chef chose
//   audio            AudioSourceDictionary.PlayRandom                     -> `AudioSourceDictionary`
//   visual-effects   HighlighterContainer, IHighlightable                 -> no shared effect (the highlight is local, C19)
//   pause-system     PauseSettings.Pause / Resume, OnPaused / OnResumed   -> `PauseSettings` over the shared game clock
//   ui               CanvasViewer / Popup Show and Hide                   -> `CanvasViewer` (a board panel switched on and off)

import type { AudioClipRef, AudioSourceRef, GameObject, RandomView } from "../portkit/src/index.ts";

/** physics: something that can be switched off; a switched-off target is ignored by E and Q. */
export interface IEnable {
  IsEnabled: boolean;
}

/**
 * C# finds a component by interface at run time; TypeScript interfaces do not exist at run time, so every class that
 * a chef can face lists the interfaces it implements, by name (the `*Kind` constants of the interface files).
 */
export interface Kinded {
  readonly kinds: readonly string[];
}

export function implementsKind(value: unknown, kind: string): boolean {
  if (value === null || value === undefined || typeof value !== "object") return false;
  const kinds = (value as Partial<Kinded>).kinds;
  return Array.isArray(kinds) && kinds.indexOf(kind) >= 0;
}

/**
 * physics: `BoxCaster`. Upstream casts a 0.5 m box 0.8 m ahead of the chef every frame; the port's chef names what
 * they act on instead (C2): a counter, a loose item, a corner (a hit with nothing on it), or nothing (the floor).
 * The lookup is on the hit object only, as upstream's `currentHit.transform.TryGetComponent`.
 */
export class BoxCaster {
  private readonly hit: object | null;

  constructor(hit: object | null) {
    this.hit = hit;
  }

  get HasHit(): boolean {
    return this.hit !== null;
  }

  /** `HasHit && TryGetComponent(out component) && component.IsEnabled`; the component, or null. */
  TryGetEnabledComponent<T extends IEnable>(kind: string): T | null {
    if (!this.hit || !implementsKind(this.hit, kind)) return null;
    const component = this.hit as unknown as T;
    return component.IsEnabled ? component : null;
  }
}

/** visual-effects: a highlight target. The port highlights locally, for the pointer of each client (C19). */
export interface IHighlightable {
  SetHighlight(on: boolean): void;
}

export const NoHighlight: IHighlightable = { SetHighlight: () => undefined };

/** visual-effects: forwards the highlight to its renderers and to whatever item is added to it. */
export class HighlighterContainer implements IHighlightable {
  private readonly items = new Set<IHighlightable>();
  private on = false;

  Add(item: IHighlightable): void {
    this.items.add(item);
    item.SetHighlight(this.on);
  }

  Remove(item: IHighlightable): void {
    this.items.delete(item);
    item.SetHighlight(false);
  }

  SetHighlight(on: boolean): void {
    this.on = on;
    for (const item of this.items) item.SetHighlight(on);
  }
}

/** audio: `AudioSourceDictionary.PlayRandom()`: one clip of the list, picked at random, as a one-shot (sounds overlap). */
export class AudioSourceDictionary {
  readonly source: AudioSourceRef | null;
  readonly clips: AudioClipRef[];
  private readonly random: RandomView;

  constructor(source: AudioSourceRef | null, clips: AudioClipRef[], random: RandomView) {
    this.source = source;
    this.clips = clips;
    this.random = random;
  }

  PlayRandom(): void {
    if (!this.source || this.clips.length === 0) return;
    this.source.PlayOneShot(this.clips[this.random.RangeInt(0, this.clips.length)]!);
  }
}

/**
 * pause-system: upstream sets `Time.timeScale = 0`. A snippet cannot stop the world's time, so the kitchen's own game
 * clock stops instead (GameClock.ts), for everyone in that kitchen (C5). The state lives in MatchManager's leaf.
 */
export interface PauseSettings {
  readonly IsPaused: boolean;
  /** Who paused (a user id), or "" when not paused. */
  readonly PausedBy: string;
  Pause(by: string): void;
  Resume(): void;
  OnPaused: Array<() => void>;
  OnResumed: Array<() => void>;
}

/** ui: `CanvasViewer` / `Popup`: a panel that is shown and hidden. On a board, a panel object switched on and off. */
export class CanvasViewer {
  readonly panel: GameObject | null;
  readonly OnHidden: Array<() => void> = [];

  constructor(panel: GameObject | null) {
    this.panel = panel;
  }

  get IsVisible(): boolean {
    return this.panel?.activeSelf ?? false;
  }

  Show(): void {
    this.panel?.SetActive(true);
  }

  Hide(): void {
    const was = this.IsVisible;
    this.panel?.SetActive(false);
    if (was) for (const listener of this.OnHidden.slice()) listener();
  }
}

/** C#'s `event Action<T>`: a list of listeners called in order. */
export function invoke<A extends unknown[]>(listeners: Array<(...args: A) => void>, ...args: A): void {
  for (const listener of listeners.slice()) listener(...args);
}

export function unsubscribe<F>(listeners: F[], listener: F): void {
  const at = listeners.indexOf(listener);
  if (at >= 0) listeners.splice(at, 1);
}
