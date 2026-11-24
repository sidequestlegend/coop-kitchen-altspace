// Upstream: Assets/Scripts/UI/Counters/DeliveryCounterCanvas.cs. The texts over the delivery counter: "Need Plate!" (2 s,
// SFX_delivery_fail01; 59), "+NN Tip!" (2.5 s; 62), "Wrong Plate!" (2 s, SFX_delivery_fail02; 63). Playing one stops
// the others ("PlayOnly...").
//
// Called on the referee; sent to everyone as an effect, shown by each client.

import data from "../data/kitchen-data.json" with { type: "json" };
import { Behaviour, type TextRef } from "../portkit/src/index.ts";
import { Kitchen } from "./Kitchen.ts";

/** C#'s string.Format("+{0:D2} Tip!", value). */
export function FormatTip(format: string, value: number): string {
  return format.replace(/\{0(?::D(\d+))?\}/, (_m, digits: string | undefined) => {
    const text = String(Math.abs(Math.trunc(value))).padStart(digits ? Number(digits) : 0, "0");
    return (value < 0 ? "-" : "") + text;
  });
}

export class DeliveryCounterCanvas extends Behaviour {
  kitchen!: Kitchen;
  cell = "";
  path = "";
  tip: TextRef | null = null;
  tipFormat = data.ui.tipFormat ?? "+{0:D2} Tip!";
  /** What this client has shown, newest last (for tests). */
  readonly shown: string[] = [];

  override Start(): void {
    for (const name of ["NeedPlate", "Tip", "WrongPlate"]) this.Host.setActive(`@${this.path}/${name}`, false);
    this.kitchen.OnEffect("delivery", (kind, value) => this.Play(String(kind), Number(value ?? 0)));
  }

  ShowTip(value: number): void {
    this.kitchen.Fx("delivery", "tip", value);
  }

  ShowNeedPlate(): void {
    this.kitchen.Fx("delivery", "needPlate", 0);
  }

  ShowWrongPlate(): void {
    this.kitchen.Fx("delivery", "wrongPlate", 0);
  }

  private Play(kind: string, value: number): void {
    const all = ["NeedPlate", "Tip", "WrongPlate"].map((n) => `@${this.path}/${n}`);
    const at = Kitchen.CellKey(this.cell);
    if (kind === "tip") {
      const text = FormatTip(this.tipFormat, value);
      if (this.tip) this.tip.text = text;
      this.shown.push(text);
      this.kitchen.Flash(`@${this.path}/Tip`, 2.5, all);
    } else if (kind === "needPlate") {
      this.shown.push("Need Plate!");
      this.kitchen.PlaySound("fail01", at);
      this.kitchen.Flash(`@${this.path}/NeedPlate`, 2, all);
    } else if (kind === "wrongPlate") {
      this.shown.push("Wrong Plate!");
      this.kitchen.PlaySound("fail02", at);
      this.kitchen.Flash(`@${this.path}/WrongPlate`, 2, all);
    }
  }
}
