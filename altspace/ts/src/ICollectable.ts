// Upstream: Assets/Scripts/_Globals/Interfaces/ICollectable.cs. Objects able to be picked and dropped.

import type { IDroppable } from "./IDroppable.ts";
import type { IPickable } from "./IPickable.ts";

export interface ICollectable extends IPickable, IDroppable {}
