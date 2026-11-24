// Upstream: Assets/Scripts/_Globals/Interfaces/IInteractable.cs. Objects able to be interacted with (Q).

import type { IEnable } from "./ActionCode.ts";

export const IInteractableKind = "IInteractable";

export interface IInteractable extends IEnable {
  OnInteracted: Array<() => void>;
  Interact(): void;
}
