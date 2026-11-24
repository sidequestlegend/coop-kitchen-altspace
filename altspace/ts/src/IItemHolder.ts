// Upstream: Assets/Scripts/Items/Interfaces/IItemHolder.cs. Objects able to hold items.

import type { IItemCollectable } from "./IItemCollectable.ts";
import type { IItemTransfer } from "./IItemTransfer.ts";

export const IItemHolderKind = "IItemHolder";

export interface IItemHolder extends IItemTransfer {
  readonly CurrentItem: IItemCollectable | null;
  ReleaseItem(): void;
}
