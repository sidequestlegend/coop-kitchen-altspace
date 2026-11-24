// Upstream: Assets/Scripts/_Globals/Interfaces/IPickable.cs. Objects able to be picked up.
// The picker is a holder key in the kitchen's state (upstream: a Transform the item is parented to).

export interface IPickable {
  PickUp(picker: string): void;
}
