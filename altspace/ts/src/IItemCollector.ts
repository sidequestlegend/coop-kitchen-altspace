// Upstream: Assets/Scripts/Items/Interfaces/IItemCollector.cs. Objects able to collect items.
// C#'s `out` parameter becomes a returned record.

import type { IEnable } from "./ActionCode.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";

export const IItemCollectorKind = "IItemCollector";

export interface Collected {
  ok: boolean;
  item: IItemCollectable | null;
}

export interface IItemCollector extends IEnable {
  TryCollectItem(): Collected;
}
