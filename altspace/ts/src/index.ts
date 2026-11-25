// coop-kitchen: a co-op game on the portkit runtime, based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos
// (MIT, Copyright (c) 2023 Hyago Oliveira). The classes bindings.json names by `type`; the build bundles this with bindings.json into
// pk-coop-kitchen.js.

import type { GameDefinition, GameInstance } from "../portkit/src/index.ts";
import { BackgroundMusic } from "./BackgroundMusic.ts";
import { Chef } from "./Chef.ts";
import { CountDown } from "./CountDown.ts";
import { Counter } from "./Counter.ts";
import { CuttingBoard } from "./CuttingBoard.ts";
import { DeliveryCounter } from "./DeliveryCounter.ts";
import { DeliveryCounterCanvas } from "./DeliveryCounterCanvas.ts";
import { GameDataManager } from "./GameDataManager.ts";
import { IngredientCounter } from "./IngredientCounter.ts";
import { Kitchen } from "./Kitchen.ts";
import { MainMenu } from "./MainMenu.ts";
import { MainMenuOptions } from "./MainMenuOptions.ts";
import { MatchManager } from "./MatchManager.ts";
import { OrderManager } from "./OrderManager.ts";
import { OrderTicketGroup } from "./OrderTicketGroup.ts";
import { PauseCanvas } from "./PauseCanvas.ts";
import { PauseHandler } from "./PauseHandler.ts";
import { PauseOptions } from "./PauseOptions.ts";
import { PreparationCounter } from "./PreparationCounter.ts";
import { PreparationWorldSpaceCanvas } from "./PreparationWorldSpaceCanvas.ts";
import { Results } from "./Results.ts";
import { Score } from "./Score.ts";
import { ScoreManager } from "./ScoreManager.ts";
import { SoundPopup } from "./SoundPopup.ts";
import { Stove } from "./Stove.ts";
import { Timer } from "./Timer.ts";
import { TimesUp } from "./TimesUp.ts";
import { Trash } from "./Trash.ts";
import { TutorialDescription } from "./TutorialDescription.ts";
import { TutorialManager } from "./TutorialManager.ts";

const game: GameDefinition = {
  slug: "coop-kitchen",
  behaviours: {
    Kitchen,
    MatchManager,
    ScoreManager,
    OrderManager,
    GameDataManager,
    Counter,
    IngredientCounter,
    PreparationCounter,
    DeliveryCounter,
    Trash,
    CuttingBoard,
    Stove,
    PreparationWorldSpaceCanvas,
    DeliveryCounterCanvas,
    OrderTicketGroup,
    Score,
    Timer,
    CountDown,
    TimesUp,
    Results,
    BackgroundMusic,
    SoundPopup,
    MainMenuOptions,
    MainMenu,
    PauseOptions,
    PauseCanvas,
    PauseHandler,
    TutorialDescription,
    TutorialManager,
    Chef,
  },
  // a click with a reach does not count while the page knows no position for its player (the referee checks it again)
  reachWhenUnknown: false,
  debug: (instance: GameInstance) => debugHooks(instance),
};

/** Readers for Play-mode tests (window.__pk1.debug["coop-kitchen:<inst>"]). */
function debugHooks(instance: GameInstance): Record<string, unknown> {
  const kitchen = () => instance.behaviour<Kitchen>("kitchen");
  return {
    phase: () => kitchen().match.Phase,
    holders: () => ({ ...kitchen().holders }),
    items: () => JSON.parse(JSON.stringify(kitchen().items)),
    orders: () => kitchen().orders.orders.list.map((o) => ({ ...o })),
    score: () => kitchen().score.Asset.Score,
    roster: () => ({ ...kitchen().roster }),
    paused: () => kitchen().match.Paused,
    pausedBy: () => kitchen().match.PausedBy,
    /** The local player as the instance knows them. */
    me: () => ({ sid: instance.networking.LocalPlayer.sid, uid: instance.networking.LocalPlayer.uid, name: instance.networking.LocalPlayer.displayName }),
    /** A cutting board's or stove's state: preparing, paused, burning. */
    prep: (cell: string) => {
      const p = kitchen().prep[cell];
      return p ? { p: p.p, ps: p.ps, burn: p.burn !== null } : null;
    },
    /** The pool slot that shows an item on this page (-1: none). */
    slotOf: (id: string) => kitchen().SlotOf(id),
    /** The referee's reach checks of other chefs' intents: how many it refused, and its latest checks. */
    reach: () => ({ refused: kitchen().reachRefused, log: kitchen().reachLog.map((c) => ({ ...c })) }),
    /** Sends an intent as a modified client would: past this page's own reach check (Play-mode test of the referee's). */
    forceIntent: (kind: "E" | "Q", target: string) => kitchen().LocalIntent(kind, target, null),
    /** A kit object's path by its key (bindings.json). */
    pathOf: (key: string) => instance.bindings.objects[key]?.path ?? "",
  };
}

export default game;
