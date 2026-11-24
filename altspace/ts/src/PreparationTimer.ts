// Upstream: Assets/Scripts/UI/PreparationTimer.cs. The bar over a board or stove: shown when a preparation starts, filled
// 0 to 1, hidden when it completes; it stays while paused (40).
//
// The relay has no slider op (PORT.md 10.3 item 4, a gap): the fill is a kit object scaled along x, which the page can
// do itself; the bar's canvas is switched on and off by path.

import type { GameObject, HostActions } from "../portkit/src/index.ts";
import { Vector3 } from "../portkit/src/index.ts";

export class PreparationTimer {
  private readonly host: HostActions;
  private readonly canvasPath: string;
  private readonly fill: GameObject | null;
  private shown: boolean | null = null;
  private progress = -1;

  constructor(host: HostActions, canvasPath: string, fill: GameObject | null) {
    this.host = host;
    this.canvasPath = canvasPath;
    this.fill = fill;
  }

  get Progress(): number {
    return Math.max(0, this.progress);
  }
  set Progress(value: number) {
    const rounded = Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
    if (rounded === this.progress) return;
    this.progress = rounded;
    if (this.fill) this.fill.transform.localScale = new Vector3(Math.max(0.001, rounded), 1, 1);
  }

  Show(): void {
    if (this.shown === true) return;
    this.shown = true;
    this.host.setActive(this.canvasPath, true);
  }

  Hide(): void {
    if (this.shown === false) return;
    this.shown = false;
    this.host.setActive(this.canvasPath, false);
  }

  get Visible(): boolean {
    return this.shown === true;
  }
}
