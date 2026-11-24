// Upstream: Assets/Scripts/Items/Interfaces/IItemTransfer.cs. Objects able to transfer items.

import type { IEnable } from "./ActionCode.ts";
import type { IItemHolder } from "./IItemHolder.ts";

export const IItemTransferKind = "IItemTransfer";

export interface IItemTransfer extends IEnable {
  TryTransferItem(fromHolder: IItemHolder): boolean;
}
