// Upstream: Assets/Scripts/Items/Interfaces/IItemDisposer.cs. Objects able to dispose items.

import type { IEnable } from "./ActionCode.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";

export const IItemDisposerKind = "IItemDisposer";

export interface IItemDisposer extends IEnable {
  Dispose(item: IItemCollectable): void;
}
