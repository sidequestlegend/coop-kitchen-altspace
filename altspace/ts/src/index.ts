// coop-kitchen: the rules of HyagoOliveira/KitchenChaos (MIT, Copyright (c) 2023 Hyago Oliveira) as a co-op game on the
// portkit runtime. The classes bindings.json names by `type`; the build bundles this with bindings.json into
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
  };
}

export default game;
