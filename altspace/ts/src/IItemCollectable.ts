// Upstream: Assets/Scripts/Items/Interfaces/IItemCollectable.cs. Objects able to be a collectable item.

import type { IEnable, IHighlightable } from "./ActionCode.ts";
import type { ICollectable } from "./ICollectable.ts";
import type { Vector3 } from "../portkit/src/index.ts";

export const IItemCollectableKind = "IItemCollectable";

export interface IItemCollectable extends IEnable {
  /** The item's id in the kitchen's state (upstream: the item's GameObject). */
  readonly id: string;
  GetCollectible(): ICollectable;
  GetHighlightable(): IHighlightable;
  SetPosition(position: Vector3): void;
  Destroy(): void;
}
