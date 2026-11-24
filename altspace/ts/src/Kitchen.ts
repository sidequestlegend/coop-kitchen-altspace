// New file (no upstream counterpart; PORT.md 7 step 0): the kitchen's bootstrap and its shared state.
//
// Upstream the kitchen is a scene: counters, items and chefs are GameObjects on one machine. In the port every client
// runs the same object graph (counters, holders, preparators, managers, built from bindings.json), but only the
// referee ever changes the state; everyone draws it:
//
//   - The contents of every holder, every item and every board and stove live in this behaviour's synced fields: one
//     leaf, so a transfer between two holders is one write and nobody sees an item in two places or in none (3.2).
//   - Chefs never write kitchen state. A click (or a grab and a release) becomes an intent, E or Q with a target, sent
//     to the referee as a numbered command (SendCommand: in order, never replayed, carried over to a new referee). The
//     referee runs the upstream rule (ItemHandler) on its copy and writes the result.
//   - Time is the shared game clock (GameClock.ts); the referee's Update fires what is due.
//   - What is only seen or heard (a sound, "Wrong Plate!") is sent by the referee as a network event to everyone
//     (`Fx`): it plays once where it happens and is never replayed to a player who arrives later.
//   - Items are drawn with a pool of kit objects (`slots`), each with the ten ingredient variants and a plate as
//     children; which slot shows which item is each client's own business.

import {
  Behaviour,
  NetworkEventTarget,
  Quaternion,
  Vector3,
  type AudioClipRef,
  type GameObject,
  type HostEventDetail,
  type Player,
  type StartKind,
} from "../portkit/src/index.ts";
import type { AbstractItem } from "./AbstractItem.ts";
import type { AbstractIngredientPreparator } from "./AbstractIngredientPreparator.ts";
import { BoxCaster } from "./ActionCode.ts";
import type { Chef } from "./Chef.ts";
import { REACH, type Counter } from "./Counter.ts";
import type { DeliveryCounter } from "./DeliveryCounter.ts";
import { Ingredient } from "./Ingredient.ts";
import type { IngredientData } from "./IngredientData.ts";
import { IngredientIcons } from "./IngredientIcons.ts";
import { IngredientSettings } from "./IngredientSettings.ts";
import { ItemHandler } from "./ItemHandler.ts";
import { ItemHolder } from "./ItemHolder.ts";
import { PLATE_HEIGHT } from "./ItemHolderStack.ts";
import type { GameDataManager } from "./GameDataManager.ts";
import type { MatchManager } from "./MatchManager.ts";
import type { OrderManager } from "./OrderManager.ts";
import { Plate } from "./Plate.ts";
import { RecipeSettings } from "./RecipeSettings.ts";
import type { ScoreManager } from "./ScoreManager.ts";
import type { Trash } from "./Trash.ts";
import type { TutorialManager } from "./TutorialManager.ts";
import { canonicalJson } from "../portkit/src/index.ts";

/** One item in the kitchen's state. */
export interface ItemRec {
  /** The ingredient variant (0 to 9, IngredientData.Index), or -1 for a plate. */
  k: number;
  /** A plate's ingredients, bottom to top. */
  ings?: string[];
  /** A plate that has held bread (Plate.hasBread, never cleared: checklist 127). */
  bread?: 1;
  /** A loose item's position on the floor (world metres). */
  pos?: number[];
  /** A plated ingredient's pose on its plate: x, y, z at upstream scale, yaw in degrees. */
  lp?: number[];
  /** Switched off (IsEnabled false; the tutorial's plate). */
  off?: 1;
}

/** One cutting board or stove (AbstractIngredientPreparator and Stove). */
export interface PrepRec {
  /** IsPreparing. */
  p: 0 | 1;
  /** IsPaused. */
  ps: 0 | 1;
  /** Progress made up to `since` (upstream's coroutine-local `currentTime`). */
  acc: number;
  /** G at which progress last started counting, or null while paused or idle. */
  since: number | null;
  /** The ingredient's preparation time (upstream's `preparingTime`). */
  dur: number;
  /** The ingredient's name (PrepareIngredient(ingredient.Name)). */
  n: number;
  /** Stove: G at which the burn sequence started (IsBurning while set). */
  burn: number | null;
  /** Stove: IsAbleToBurn is false (the tutorial). */
  nb: 0 | 1;
  /** Cutting board: the knife is shown. */
  knife: 0 | 1;
  /** Stove: sizzle and its particles (FryingPan.StartFry). */
  fry: 0 | 1;
  /** Stove: smoke (FryingPan.StartBurn). */
  smoke: 0 | 1;
  /** The legacy animation clip playing (relay animPlay). */
  anim: string;
}

/** What items, holders and plates need from the kitchen. */
export interface KitchenItems {
  items: Record<string, ItemRec>;
  holders: Record<string, string>;
  stacks: Record<string, string[]>;
  readonly ingredientSettings: IngredientSettings;
  readonly recipeSettings: RecipeSettings;
  readonly plateEvents: Array<(ingredient: Ingredient, plate: Plate) => void>;
  Item(id: string): AbstractItem | null;
  NewPlate(): Plate | null;
  DestroyItem(id: string): void;
  /** The holder or plate an item is being released from (where Drop puts it). */
  Releasing(from: string): void;
  DropPoint(): number[];
}

export const HAND = "hand:";
export const MAX_CHEFS = 8;
/** Kitchen-wide limit of items (C10). */
export const POOL_SIZE = 48;
/** The floor's half width and half depth at upstream scale (the kit builder's floor: 11 by 7 cells of 1.5 m). */
const FLOOR_HALF = [8.25, 5.25] as const;
/** How long (s) a grab waits for the referee to put the item in the grabbing chef's hand before it lets go. */
const GRAB_WAIT = 3;
const round3 = (v: number) => Math.round(v * 1000) / 1000;

export class Kitchen extends Behaviour implements KitchenItems {
  static override synced = ["items", "holders", "stacks", "off", "prep", "roster", "next"];
  /** What other clients may run here: chefs' intents and COOK (commands to the referee), the referee's effects. */
  static override networkCallable = ["Intent", "Cook", "OnFx"];

  items: Record<string, ItemRec> = {};
  holders: Record<string, string> = {};
  stacks: Record<string, string[]> = {};
  /** Switched-off counters, boards, stoves, trash and the delivery counter (tutorial gating), by key. */
  off: Record<string, 1> = {};
  prep: Record<string, PrepRec> = {};
  /** Who is cooking: user id -> colour slot (Blue, Green, Red, Yellow, ...). */
  roster: Record<string, number> = {};
  next = 1;

  // ---- from bindings.json -------------------------------------------------------------------------------------
  match!: MatchManager;
  orders!: OrderManager;
  score!: ScoreManager;
  tutorial: TutorialManager | null = null;
  gameData: GameDataManager | null = null;
  /** The item pool: one kit object per item shown. */
  slots: GameObject[] = [];
  /** Each slot's path under the kit root: its variant children are switched by path (relay "@<path>/V<k>"). */
  slotPaths: string[] = [];
  floor: GameObject | null = null;
  corners: GameObject[] = [];
  /** Clip lists by sound name (`{"$clip": n, "on": "<object>"}`). */
  clips: Record<string, AudioClipRef[]> = {};
  /** The kit's scale against upstream (PORT.md 8.1). */
  kitScale = 0.64;

  // ---- built at Start -----------------------------------------------------------------------------------------
  ingredientSettings!: IngredientSettings;
  recipeSettings!: RecipeSettings;
  readonly plateEvents: Array<(ingredient: Ingredient, plate: Plate) => void> = [];
  readonly counters = new Map<string, Counter | DeliveryCounter | Trash>();
  readonly preparators = new Map<string, AbstractIngredientPreparator>();
  private readonly holderMap = new Map<string, ItemHolder>();
  private readonly handlerMap = new Map<string, ItemHandler>();
  private readonly views = new Map<string, AbstractItem>();
  private readonly fxHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  private readonly sent = new Map<Behaviour, string>();
  private releasingFrom = "";
  private dropAt: number[] | null = null;
  /** The target of the intent being run ("c:<cell>", "i:<item>", "floor", "corner"), for SoundSpot. */
  private actionTarget = "";
  private lastSweep = 0;

  // pool drawing, per client
  private readonly slotOf = new Map<string, number>();
  private readonly slotShown: Array<{ id: string; k: number; at: string; icons: string } | null> = [];
  private readonly grabbedSlot = new Set<number>();
  /** Grabs waiting for the referee (or confirmed): slot -> the item and when it was grabbed. A grab the referee did not
   *  give this chef (another chef got there first) is let go, so the hand does not keep a slot nobody draws. */
  private readonly grabs = new Map<number, { id: string; at: number; ok: boolean }>();
  /** Where each chef's head was last seen (from their Chef), kept after they leave: a departing chef's item falls there. */
  private readonly lastHead = new Map<string, number[]>();
  /** The layer pool slots are on: Grabbable (20), or UI (5) with input="click". */
  private slotLayer = 20;
  /** The slot whose item this page's chef holds by a click (not a physical grab), put on Default (0) so that it never
   *  catches the pointer: it is drawn just in front of the head, in the way of every click (found in Play mode). The
   *  slots of the ingredients on a held plate too. */
  private heldSlots = new Set<number>();

  override Start(): void {
    this.ingredientSettings = new IngredientSettings();
    this.ingredientSettings.logError = (m) => this.Debug.LogError(m);
    this.ingredientSettings.InitializeDictionary();
    for (const v of this.ingredientSettings.variants) v.spawner = (d) => this.NewIngredient(d);
    this.recipeSettings = new RecipeSettings(this.ingredientSettings);
    this.recipeSettings.logError = (m) => this.Debug.LogError(m);
    this.recipeSettings.Initialize();
    const scale = Number(this.Settings.get("scale") ?? "");
    if (scale > 0) this.kitScale *= scale;

    for (const type of ["Counter", "IngredientCounter", "PreparationCounter", "DeliveryCounter", "Trash"]) {
      for (const c of this.FindBehavioursOfType<Counter | DeliveryCounter | Trash>(type)) this.counters.set(c.cell, c);
    }
    // The doorway (PORT.md 8.1, C13): one plain counter is left out so that players can walk in.
    const door = this.Settings.get("door") ?? "west";
    const doorway = door === "west" ? "Counter_Normal_10" : door === "east" ? "Counter_Normal_06" : "";
    const gap = doorway ? this.counters.get(doorway) : undefined;
    if (gap) {
      this.counters.delete(doorway);
      gap.gameObject.SetActive(false);
    }
    for (const type of ["CuttingBoard", "Stove"]) {
      for (const p of this.FindBehavioursOfType<AbstractIngredientPreparator>(type)) this.preparators.set(p.cell, p);
    }
    this.slots.forEach((slot, index) => {
      this.slotShown.push(null);
      slot.On("click", (detail) => this.Reaches(detail, slot) && this.ClickSlot(index, detail));
      slot.On("grab", () => this.GrabSlot(index));
      slot.On("drop", (detail) => this.DropSlot(index, detail));
    });
    this.floor?.On("click", (detail) => this.Reaches(detail, null) && this.LocalIntent("E", "floor", detail.point ?? null));
    for (const corner of this.corners) corner.On("click", (detail) => this.Reaches(detail, corner) && this.LocalIntent("E", "corner", null));
    this.slotLayer = this.Settings.get("input") === "click" ? 5 : 20;
    for (const slot of this.slots) slot.layer = this.slotLayer;

    // effects of the items and counters (sounds of ItemHandler, IngredientCounter's door, Trash's shrink)
    // a pick-up or drop sounds at the counter where it happened (each has a 3D speaker), or the one nearest the floor spot
    this.OnEffect("hand", (kind, at) => this.PlaySound(kind === "pickup" ? "pickup" : "drop", typeof at === "string" && /^c_[A-Za-z0-9_]+$/.test(at) ? at : "floor"));
    this.OnEffect("crate", (cell) => this.Host.animPlay(Kitchen.CellKey(String(cell)), "IngredientCounter@Open"));
    this.OnEffect("trash", (cell) => {
      this.PlaySound("trash", Kitchen.CellKey(String(cell)));
      this.Host.animPlay(Kitchen.CellKey(String(cell)), "Trash@DropItem");
    });
    this.OnEffect("full", (cell) => this.PlaySound("fail01", Kitchen.CellKey(String(cell))));
  }

  override OnInstanceStart(kind: StartKind): void {
    if (!this.Networking.IsReferee || (kind !== "fresh" && kind !== "resumed")) return;
    this.match.ResetToLobby();
    this.CommitAll();
  }

  /** The start state of the kitchen (a scene load): two plates on their counters, nothing else (8, 12). */
  ResetKitchen(): void {
    this.items = {};
    this.holders = {};
    this.stacks = {};
    this.off = {};
    this.prep = {};
    this.next = 1;
    this.views.clear();
    for (const p of this.preparators.values()) this.prep[p.cell] = p.DefaultState();
    for (const c of this.counters.values()) {
      if (!(c as Counter).startsWithPlate) continue;
      const plate = this.NewPlate();
      if (plate) this.Holder(c.cell).PlaceItem(plate);
    }
  }

  // ---- holders, items, views ----------------------------------------------------------------------------------

  Holder(key: string): ItemHolder {
    let holder = this.holderMap.get(key);
    if (!holder) this.holderMap.set(key, (holder = new ItemHolder(this, key)));
    return holder;
  }

  Handler(uid: string): ItemHandler {
    let handler = this.handlerMap.get(uid);
    if (!handler) this.handlerMap.set(uid, (handler = new ItemHandler(this, this.Holder(HAND + uid))));
    return handler;
  }

  Item(id: string): AbstractItem | null {
    const rec = this.items[id];
    if (!rec) {
      this.views.delete(id);
      return null;
    }
    let view = this.views.get(id);
    const wanted = rec.k < 0 ? "plate" : "ingredient";
    if (!view || view.kind !== wanted) {
      view = rec.k < 0 ? new Plate(this, id) : new Ingredient(this, id);
      this.views.set(id, view);
    }
    return view;
  }

  ItemCount(): number {
    return Object.keys(this.items).length;
  }

  private NewItem(k: number): string | null {
    // The pool's limit is enforced where items are made from nothing (a crate, IngredientCounter); a preparation
    // replacing its ingredient or a returning plate may pass it by the two items the pool keeps spare.
    if (this.ItemCount() >= POOL_SIZE + 2) return null;
    const id = "i" + this.next++;
    this.items[id] = { k, pos: this.DropPoint() };
    return id;
  }

  NewIngredient(data: IngredientData): Ingredient | null {
    const id = this.NewItem(data.Index);
    return id ? (this.Item(id) as Ingredient) : null;
  }

  NewPlate(): Plate | null {
    const id = this.NewItem(-1);
    return id ? (this.Item(id) as Plate) : null;
  }

  /** Destroy(gameObject): the item and, for a plate, everything on it. */
  DestroyItem(id: string): void {
    const rec = this.items[id];
    if (!rec) return;
    for (const child of rec.ings ?? []) this.DestroyItem(child);
    delete this.items[id];
    for (const key of Object.keys(this.holders)) if (this.holders[key] === id) delete this.holders[key];
    for (const key of Object.keys(this.stacks)) {
      const at = this.stacks[key]!.indexOf(id);
      if (at >= 0) this.stacks[key]!.splice(at, 1);
      if (this.stacks[key]!.length === 0) delete this.stacks[key];
    }
    this.views.delete(id);
  }

  Releasing(from: string): void {
    this.releasingFrom = from;
  }

  /** Where a dropped item lands: the point the chef chose for this action, else below the holder it left, else the
   *  middle of the kitchen's floor (never the world's origin: the kitchen may stand anywhere). */
  DropPoint(): number[] {
    if (this.dropAt && this.releasingFrom.startsWith(HAND)) return this.dropAt.slice();
    const anchor = this.AnchorOf(this.releasingFrom);
    if (anchor) return this.OnFloor([anchor.x, anchor.y, anchor.z]);
    const centre = this.floor?.transform.known ? this.floor.transform.position : Vector3.zero;
    return this.OnFloor([centre.x, centre.y, centre.z]);
  }

  /**
   * A point on the kitchen's floor below `p`: at the floor's height (a hand lets go in the air, the item falls to the
   * floor), and inside the floor's footprint (a click names its point, and a modified client could name any point: an
   * item never lands outside the kitchen). Without the floor's pose, only the height (0) is set.
   */
  OnFloor(p: number[]): number[] {
    const floor = this.floor?.transform;
    if (!floor?.known) return [round3(p[0]!), 0, round3(p[2]!)];
    const centre = floor.position;
    const rotation = floor.rotation;
    const local = rotation.inverse.rotate(new Vector3(p[0]! - centre.x, 0, p[2]! - centre.z));
    const hx = FLOOR_HALF[0] * this.kitScale;
    const hz = FLOOR_HALF[1] * this.kitScale;
    const clamped = new Vector3(Math.max(-hx, Math.min(hx, local.x)), 0, Math.max(-hz, Math.min(hz, local.z)));
    const world = centre.add(rotation.rotate(clamped));
    return [round3(world.x), round3(centre.y), round3(world.z)];
  }

  /** The world position a holder shows its item at; null for a hand whose chef cannot be placed. */
  AnchorOf(key: string): Vector3 | null {
    if (key.startsWith(HAND)) return this.HandPosition(key.slice(HAND.length));
    const counter = this.counters.get(key);
    const top = counter?.top ?? null;
    if (top?.transform.known) return top.transform.position;
    return counter?.gameObject.transform.known ? counter.gameObject.transform.position : null;
  }

  /** Where a chef's held item is drawn: in front of the local head, or where a remote chef last said their head was. */
  HandPosition(uid: string): Vector3 | null {
    const local = this.Networking.LocalPlayer;
    if (local.uid === uid) {
      const poses = this.Input.Poses;
      if (poses) return poses.head.position.add(poses.head.rotation.rotate(new Vector3(0, -0.3, 0.45)));
      return this.Input.Position?.add(new Vector3(0, -0.3, 0)) ?? null;
    }
    const head = this.HeadOf(uid);
    return head ? new Vector3(head[0]!, head[1]! - 0.3, head[2]!) : null;
  }

  /** Where a chef's head is, as their Chef publishes it, else where it was last seen (also after they left). */
  HeadOf(uid: string): number[] | null {
    const head = this.ChefOf(uid)?.head ?? null;
    if (head) return head;
    return this.lastHead.get(uid) ?? null;
  }

  ChefOf(uid: string): Chef | null {
    for (const chef of this.PlayerBehaviours<Chef>("Chef")) if (chef.Player?.uid === uid) return chef;
    return null;
  }

  // ---- intents ------------------------------------------------------------------------------------------------

  /** A local click (or release) becomes an intent for the referee. `target`: "c:<cell>", "i:<item>", "floor", "corner". */
  LocalIntent(kind: "E" | "Q", target: string, point: Vector3 | null, release = false): void {
    const args: unknown[] = [kind, target];
    if (point) args.push(round3(point.x), round3(point.y), round3(point.z));
    else args.push(null, null, null);
    args.push(release, this.Seen(target));
    this.SendCommand("Intent", ...args);
  }

  /**
   * What a chef saw of a target when they acted (sent with the intent): the item on a counter (the top of a stack), and
   * for a cutting board or stove whether it was preparing, paused or burning. Upstream one chef acts on what is in front
   * of it; here two chefs can act on one counter within one round trip, and the second must not act on what the first
   * just changed (start-then-pause a board with two Q presses, put an item where the other chef just took one).
   */
  Seen(target: string): string {
    if (!target.startsWith("c:")) return "";
    const cell = target.slice(2);
    const stack = this.stacks[cell];
    const item = stack && stack.length ? stack[stack.length - 1]! : (this.holders[cell] ?? "");
    const prep = this.prep[cell];
    return prep ? `${item}|${prep.p}${prep.ps}${prep.burn !== null ? 1 : 0}` : item;
  }

  /** Runs on the referee (a command): the upstream rule, for the calling chef, against the named target. */
  Intent(kind: string, target: string, x: number | null, y: number | null, z: number | null, release = false, seen: string | null = null): void {
    const player = this.Networking.CallingPlayer;
    if (!player || typeof kind !== "string" || typeof target !== "string") return;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    this.IntentFor(player.uid, kind, target, n(x), n(y), n(z), release === true, typeof seen === "string" ? seen : null);
  }

  /** The kit object a pick-up or drop of the intent being run sounds at: the counter acted on, else the counter nearest
   *  the spot on the floor (every counter has a 3D speaker), else the floor's own speaker in the kitchen's middle. */
  SoundSpot(): string {
    if (this.actionTarget.startsWith("c:") && this.counters.has(this.actionTarget.slice(2))) return Kitchen.CellKey(this.actionTarget.slice(2));
    const loose = this.actionTarget.startsWith("i:") ? this.items[this.actionTarget.slice(2)]?.pos : undefined;
    const spot = loose ?? this.dropAt;
    if (!spot) return "floor";
    let best = "floor";
    let bestDistance = Infinity;
    for (const [cell, counter] of this.counters) {
      const t = counter.gameObject.transform;
      if (!t.known) continue;
      const d = Math.hypot(t.position.x - spot[0]!, t.position.z - spot[2]!);
      if (d < bestDistance) {
        bestDistance = d;
        best = Kitchen.CellKey(cell);
      }
    }
    return best;
  }

  /**
   * The intent of the chef with user id `uid` (Intent, and rules tests that have no room). `seen`: what the chef saw of
   * the target (Seen); when the target has changed since, the intent is stale and nothing happens, except that an item a
   * VR hand has already let go of falls to the floor (C9). Null: not checked (rules tests).
   */
  IntentFor(uid: string, kind: string, target: string, x: number | null = null, y: number | null = null, z: number | null = null, release = false, seen: string | null = null): void {
    if (this.roster[uid] === undefined || !this.match.AcceptsInput()) return;
    if (seen !== null && seen !== this.Seen(target)) {
      if (kind === "E" && release && target !== "floor") this.IntentFor(uid, "E", "floor", x, y, z, true, null);
      return;
    }
    const handler = this.Handler(uid);
    handler.detector = new BoxCaster(this.TargetObject(target));
    this.actionTarget = target;
    this.dropAt = x !== null && y !== null && z !== null ? this.OnFloor([x, y, z]) : this.FloorBelowChef(uid);
    try {
      if (kind === "E") {
        const held = handler.holder.CurrentItem;
        handler.TryInteractWithItem();
        // C9: in VR the hand has already let go; an item a place refused falls to the floor there.
        if (release && held && handler.holder.CurrentItem === held) handler.holder.ReleaseItem();
      } else if (kind === "Q") handler.TryInteractWithEnvironment();
    } finally {
      this.dropAt = null;
      this.releasingFrom = "";
      this.actionTarget = "";
    }
    this.CommitAll();
  }

  /** The floor below where the chef's head is or was last seen (null when it never was). */
  private FloorBelowChef(uid: string): number[] | null {
    const head = this.HeadOf(uid);
    return head ? this.OnFloor(head) : null;
  }

  /** What a target names, as the box cast would hit it: a counter, a loose item, a corner (a hit with nothing), or nothing. */
  TargetObject(target: string): object | null {
    if (target === "floor") return null;
    if (target.startsWith("c:")) {
      const counter = this.counters.get(target.slice(2));
      return counter ?? { kinds: [] };
    }
    if (target.startsWith("i:")) {
      const id = target.slice(2);
      const rec = this.items[id];
      // only a loose item can be faced; one that has been picked up since is a hit on nothing usable
      if (!rec || !rec.pos || this.WhereIs(id) !== "loose") return { kinds: [] };
      return this.Item(id);
    }
    return { kinds: [] };
  }

  /** "holder:<key>", "stack:<key>", "plate:<id>" or "loose". */
  WhereIs(id: string): string {
    for (const key of Object.keys(this.stacks)) if (this.stacks[key]!.indexOf(id) >= 0) return "stack:" + key;
    for (const key of Object.keys(this.holders)) if (this.holders[key] === id) return "holder:" + key;
    for (const other of Object.keys(this.items)) if (this.items[other]!.ings?.indexOf(id) !== undefined && this.items[other]!.ings!.indexOf(id) >= 0) return "plate:" + other;
    return "loose";
  }

  // ---- roster -------------------------------------------------------------------------------------------------

  /** Command: join the kitchen as a chef, or leave it. */
  Cook(join: boolean): void {
    const player = this.Networking.CallingPlayer;
    if (!player) return;
    if (join) this.Enrol(player.uid);
    else this.Dismiss(player.uid);
    this.CommitAll();
  }

  Enrol(uid: string): boolean {
    if (this.roster[uid] !== undefined) return true;
    const max = Math.max(1, Math.min(MAX_CHEFS, Number(this.Settings.get("chefs") ?? "") || 4));
    const used = new Set(Object.values(this.roster));
    if (used.size >= max) return false;
    let slot = 0;
    while (used.has(slot)) slot++;
    this.roster[uid] = slot;
    return true;
  }

  /** A chef leaves the kitchen (or the room): what they held falls where they were (PORT.md 8.6). */
  Dismiss(uid: string): void {
    if (this.roster[uid] === undefined) return;
    const hand = this.Holder(HAND + uid);
    if (hand.HasItem()) {
      this.dropAt = this.FloorBelowChef(uid);
      this.releasingFrom = hand.key;
      hand.ReleaseItem();
      this.dropAt = null;
      this.releasingFrom = "";
    }
    delete this.roster[uid];
  }

  IsChef(uid: string): boolean {
    return this.roster[uid] !== undefined;
  }

  override OnPlayerLeft(_player: Player): void {
    if (this.Networking.IsReferee) this.SweepRoster();
  }

  /** Every chef who is no longer in the room is dismissed (also catches a leave the referee missed). */
  private SweepRoster(): void {
    const present = new Set(this.Networking.GetPlayers().map((p) => p.uid));
    let changed = false;
    for (const uid of Object.keys(this.roster)) {
      if (present.has(uid)) continue;
      this.Dismiss(uid);
      changed = true;
    }
    if (changed) this.CommitAll();
  }

  // ---- the referee's clock ------------------------------------------------------------------------------------

  override Update(): void {
    this.NoteHeads();
    if (this.Networking.IsReferee) this.RefereeTick();
    this.Render();
    this.CheckGrabs();
    const now = this.Time.time;
    for (const [target, until] of [...this.flashes]) {
      if (now < until) continue;
      this.flashes.delete(target);
      this.Host.setActive(target, false);
    }
  }

  private readonly flashes = new Map<string, number>();

  /** Remembers where each chef's head was last published: a Chef goes with its player, the position must not. */
  private NoteHeads(): void {
    for (const chef of this.PlayerBehaviours<Chef>("Chef")) {
      const uid = chef.Player?.uid;
      if (uid && chef.head) this.lastHead.set(uid, chef.head.slice());
    }
  }

  /**
   * VR: a grab sends E for the grabbed item; if the referee gives the item to another chef (or nobody) instead, this
   * hand lets go, so it does not hold a slot nobody draws. Also lets go when an item this hand held leaves it some other
   * way (a reset of the kitchen).
   */
  private CheckGrabs(): void {
    if (!this.grabs.size) return;
    const me = HAND + this.Networking.LocalPlayer.uid;
    const now = this.Time.time;
    for (const [slot, grab] of [...this.grabs]) {
      if (this.holders[me] === grab.id) {
        grab.ok = true;
        continue;
      }
      const where = this.items[grab.id] ? this.WhereIs(grab.id) : "gone";
      const elsewhere = where === "gone" || (where.startsWith("holder:" + HAND) && where !== "holder:" + me);
      if (!grab.ok && !elsewhere && now - grab.at < GRAB_WAIT) continue;
      this.grabs.delete(slot);
      this.grabbedSlot.delete(slot);
      this.slots[slot]?.ReleaseGrab();
    }
  }

  /** Shows a kit object (a floating text) for a while on this client: the upstream's one-shot text animations. */
  Flash(target: string, seconds: number, others: string[] = []): void {
    for (const other of others) {
      if (other === target || !this.flashes.has(other)) continue;
      this.flashes.delete(other);
      this.Host.setActive(other, false);
    }
    this.Host.setActive(target, false);
    this.Host.setActive(target, true);
    this.flashes.set(target, this.Time.time + seconds);
  }

  private RefereeTick(): void {
    if (this.Time.time - this.lastSweep >= 1) {
      this.lastSweep = this.Time.time;
      this.SweepRoster();
    }
    const G = this.match.G;
    if (!this.match.Paused) {
      this.match.Tick(G);
      if (this.match.KitchenRuns()) {
        for (const p of this.preparators.values()) p.Tick(G);
        this.orders.Asset.Tick(G);
        this.tutorial?.Tick(G);
      }
    }
    this.CommitAll();
  }

  /** Sends whatever the referee changed (each behaviour's synced fields, when they differ from what was last sent). */
  CommitAll(): void {
    if (!this.Networking.IsReferee) return;
    for (const b of [this, this.match, this.orders, this.score, this.tutorial] as Array<Behaviour | null>) {
      if (!b) continue;
      const fields = (b.constructor as { synced?: readonly string[] }).synced ?? [];
      const bag = b as unknown as Record<string, unknown>;
      const text = canonicalJson(fields.map((f) => bag[f] ?? null));
      if (this.sent.get(b) === text) continue;
      this.sent.set(b, text);
      b.RequestSerialization();
    }
  }

  // ---- effects: seen and heard once, where they happen -------------------------------------------------------

  /** Referee: plays a cosmetic effect on every client (a network event; never replayed to a late joiner). */
  Fx(name: string, ...args: unknown[]): void {
    if (!this.Networking.IsReferee) return;
    this.SendCustomNetworkEvent(NetworkEventTarget.All, "OnFx", name, args);
  }

  /** An effect from the referee. Any client can send the event; only the current referee's are played (a modified
   *  client cannot make everyone hear sounds or see "+NN Tip!"). */
  OnFx(name: string, args: unknown[]): void {
    const from = this.Networking.CallingSession;
    const referee = this.Networking.Master;
    if (!from || !referee || from.sid !== referee.sid || typeof name !== "string") return;
    for (const handler of (this.fxHandlers.get(name) ?? []).slice()) handler(...(Array.isArray(args) ? args : []));
  }

  OnEffect(name: string, handler: (...args: unknown[]) => void): void {
    let list = this.fxHandlers.get(name);
    if (!list) this.fxHandlers.set(name, (list = []));
    list.push(handler);
  }

  /** Plays one clip of a named list (random, as AudioSourceDictionary.PlayRandom) at a kit object. */
  PlaySound(name: string, at: string, index = -1): void {
    const list = this.clips[name];
    if (!list || list.length === 0 || !at) return;
    const clip = list[index >= 0 ? Math.min(index, list.length - 1) : this.Random.RangeInt(0, list.length)]!;
    // the Sound Effects volume of this device (SoundPopup) scales every effect it plays
    const volume = this.gameData?.settings?.Data.Audio.effects ?? 1;
    this.Host.playClip(at, clip.index, clip.on ?? undefined, volume < 1 ? volume : undefined);
  }

  // ---- the item pool, per client ------------------------------------------------------------------------------

  /** The kit object key of a counter cell ("c_<cell>"). */
  static CellKey(cell: string): string {
    return "c_" + cell;
  }

  private lastRenderG: number | null = null;

  private Render(): void {
    const G = this.match.KitchenG;
    for (const p of this.preparators.values()) p.Render(G, this.lastRenderG);
    this.lastRenderG = G;
    if (!this.slots.length) return;
    // where each item is
    const place = new Map<string, { at: string; pos: Vector3 | null }>();
    const scale = this.kitScale;
    const holderPos = (key: string) => this.AnchorOf(key);
    for (const key of Object.keys(this.holders)) {
      if (this.stacks[key]) continue;
      place.set(this.holders[key]!, { at: "h:" + key, pos: holderPos(key) });
    }
    for (const key of Object.keys(this.stacks)) {
      const base = holderPos(key);
      this.stacks[key]!.forEach((id, i) => place.set(id, { at: `s:${key}:${i}`, pos: base ? base.add(Vector3.up.scale(i * PLATE_HEIGHT * scale)) : null }));
    }
    for (const id of Object.keys(this.items)) {
      const rec = this.items[id]!;
      if (rec.pos && !place.has(id)) place.set(id, { at: "loose", pos: new Vector3(rec.pos[0]!, rec.pos[1]!, rec.pos[2]!) });
    }
    for (const id of Object.keys(this.items)) {
      const rec = this.items[id]!;
      if (!rec.ings) continue;
      const platePos = place.get(id)?.pos ?? null;
      for (const child of rec.ings) {
        const lp = this.items[child]?.lp;
        const pos = platePos && lp ? platePos.add(new Vector3(lp[0]!, lp[1]!, lp[2]!).scale(scale)) : platePos;
        place.set(child, { at: "p:" + id, pos });
      }
    }
    const heldNow = new Set<number>();
    const mine = "h:" + HAND + this.Networking.LocalPlayer.uid;
    const heldItem = this.holders[HAND + this.Networking.LocalPlayer.uid];
    // free the slots of items that are gone
    for (const [id, slot] of [...this.slotOf]) {
      if (this.items[id]) continue;
      this.slotOf.delete(id);
      this.ShowSlot(slot, null);
    }
    for (const id of Object.keys(this.items)) {
      let slot = this.slotOf.get(id);
      if (slot === undefined) {
        slot = this.FreeSlot();
        if (slot < 0) continue;
        this.slotOf.set(id, slot);
      }
      const rec = this.items[id]!;
      const where = place.get(id) ?? { at: "?", pos: null };
      if ((where.at === mine || (heldItem !== undefined && where.at === "p:" + heldItem)) && !this.grabbedSlot.has(slot)) heldNow.add(slot);
      const icons = rec.k < 0 ? IngredientIcons.Text((rec.ings ?? []).map((c) => this.ingredientSettings.variants[this.items[c]?.k ?? 0]?.Icon ?? "")) : "";
      this.ShowSlot(slot, { id, k: rec.k, at: where.at, icons });
      if (where.pos && !this.grabbedSlot.has(slot)) {
        const object = this.slots[slot]!;
        const now = object.transform.position;
        if (!object.transform.known || Vector3.Distance(now, where.pos) > 0.001) {
          object.transform.SetPositionAndRotation(where.pos, rec.lp ? Quaternion.Euler(0, rec.lp[3]!, 0) : Quaternion.identity);
        }
      }
    }
    this.SetHeldSlots(heldNow);
  }

  private SetHeldSlots(slots: Set<number>): void {
    for (const slot of this.heldSlots) if (!slots.has(slot)) this.slots[slot]!.layer = this.slotLayer;
    for (const slot of slots) if (!this.heldSlots.has(slot)) this.slots[slot]!.layer = 0;
    this.heldSlots = slots;
  }

  private FreeSlot(): number {
    const used = new Set(this.slotOf.values());
    for (let i = 0; i < this.slots.length; i++) if (!used.has(i)) return i;
    return -1;
  }

  private ShowSlot(slot: number, show: { id: string; k: number; at: string; icons: string } | null): void {
    const object = this.slots[slot]!;
    const path = this.slotPaths[slot] ?? "";
    const before = this.slotShown[slot] ?? null;
    if (!show) {
      if (before) object.SetActive(false);
      this.slotShown[slot] = null;
      return;
    }
    if (!before) object.SetActive(true);
    if (!before || before.k !== show.k) {
      for (let v = 0; v < this.ingredientSettings.variants.length; v++) this.Host.setActive(`@${path}/V${v}`, v === show.k);
      this.Host.setActive(`@${path}/Plate`, show.k < 0);
    }
    if (show.k < 0 && (!before || before.icons !== show.icons)) this.Host.setText(`@${path}/Plate/Icons`, show.icons);
    this.slotShown[slot] = show;
  }

  /** The item a slot shows on this client, if any. */
  SlotItem(slot: number): string | null {
    return this.slotShown[slot]?.id ?? null;
  }

  /** The slot that shows an item on this client, or -1. */
  SlotOf(id: string): number {
    return this.slotOf.get(id) ?? -1;
  }

  /** The target a click on an item means: the counter it is on, the plate it is on, or the item itself when loose. */
  TargetOfItem(id: string): string | null {
    const where = this.WhereIs(id);
    if (where.startsWith("holder:") || where.startsWith("stack:")) {
      const key = where.slice(where.indexOf(":") + 1);
      return key.startsWith(HAND) ? null : "c:" + key;
    }
    if (where.startsWith("plate:")) return this.TargetOfItem(where.slice(6));
    return "i:" + id;
  }

  /** A click counts within a chef's reach of the point clicked (C2; Counter.interactReach for counters, knives, knobs). */
  private Reaches(detail: HostEventDetail, object: GameObject | null): boolean {
    const point = detail.point ?? (object?.transform.known ? object.transform.position : null);
    return !point || this.Input.InReach(point, REACH);
  }

  private ClickSlot(slot: number, detail: HostEventDetail): void {
    const id = this.SlotItem(slot);
    if (!id) return;
    const target = this.TargetOfItem(id);
    if (target) this.LocalIntent("E", target, detail.point ?? null);
  }

  /** VR: picking an item up is E on wherever it is; a grab that cannot take it is let go at once. */
  private GrabSlot(slot: number): void {
    const id = this.SlotItem(slot);
    const me = this.Networking.LocalPlayer.uid;
    if (!id || !this.IsChef(me) || this.holders[HAND + me] !== undefined) {
      this.slots[slot]!.ReleaseGrab();
      return;
    }
    const target = this.TargetOfItem(id);
    if (!target) {
      this.slots[slot]!.ReleaseGrab();
      return;
    }
    this.grabbedSlot.add(slot);
    this.grabs.set(slot, { id, at: this.Time.time, ok: false });
    this.LocalIntent("E", target, null);
  }

  /** VR: letting go is E on what is under the hand: a counter top within reach, a loose plate, else the floor (C9). */
  private DropSlot(slot: number, _detail: HostEventDetail): void {
    this.grabbedSlot.delete(slot);
    this.grabs.delete(slot);
    const id = this.SlotItem(slot);
    const me = this.Networking.LocalPlayer.uid;
    if (!id || this.holders[HAND + me] !== id) return;
    const at = this.slots[slot]!.transform.position;
    this.LocalIntent("E", this.TargetBelow(at, id), at, true);
  }

  /** The counter whose top is nearest a point (within half a cell), else a loose plate there, else the floor. */
  TargetBelow(at: Vector3, except: string): string {
    const reach = 0.75 * this.kitScale;
    let best: string | null = null;
    let bestDistance = reach;
    for (const [cell, counter] of this.counters) {
      const p = counter.top?.transform.known ? counter.top.transform.position : counter.gameObject.transform.known ? counter.gameObject.transform.position : null;
      if (!p) continue;
      const d = Math.hypot(p.x - at.x, p.z - at.z);
      if (d < bestDistance) {
        bestDistance = d;
        best = "c:" + cell;
      }
    }
    if (best) return best;
    for (const id of Object.keys(this.items)) {
      const rec = this.items[id]!;
      if (id === except || rec.k >= 0 || !rec.pos) continue;
      if (Math.hypot(rec.pos[0]! - at.x, rec.pos[2]! - at.z) < 0.5 * this.kitScale) return "i:" + id;
    }
    return "floor";
  }
}
