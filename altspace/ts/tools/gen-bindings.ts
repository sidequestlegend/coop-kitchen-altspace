// Writes the KIT CONTRACT for coop-kitchen from data/kitchen-data.json (the upstream Game scene's counter layout and the
// prefabs' gameplay values): every object key and path, the refs, the behaviours with their fields and the events the
// script expects of the kit.
//
//   ../Assets/Kit/Editor/kit-contract.json   read by CoopKitchenKitBuilder.cs, which builds the kit (KayKit art, CC0) with
//                                            an object at every path and hands the contract to the portkit KitStage, so
//                                            the real bindings.json it writes has exactly these keys, paths and fields
//                                            Each behaviour carries its id (tests and debug hooks name "kitchen",
//                                            "ct_<cell>"), which the builder asks portkit's KitStage for
//                                            (`Behaviour(go, type, fields, perPlayer, id)`); the kit's lock keeps it.
//                                            The contract also carries the credits text (src/MainMenu.ts CREDITS), so
//                                            the kit and the script show one text.
//   bindings.json                            written only while there is no kit build yet (marked "provisional")
//
//   node tools/gen-bindings.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CREDITS } from "../src/MainMenu.ts";

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, "..", "data", "kitchen-data.json"), "utf8"));
const out = join(here, "..", "bindings.json");

type Obj = { path: string; sync: "none"; grab: boolean; click: boolean; seat: boolean; active?: boolean };
const objects: Record<string, Obj> = {};
const refs: string[] = [];
const behaviours: Array<Record<string, unknown>> = [];
const events: Array<Record<string, unknown>> = [];

function obj(key: string, path: string, opts: { click?: boolean; grab?: boolean; ref?: boolean; active?: boolean } = {}): string {
  objects[key] = { path, sync: "none", grab: opts.grab === true, click: opts.click === true, seat: false };
  if (opts.active === false) objects[key]!.active = false;
  if (opts.ref !== false && !opts.grab) refs.push(key);
  return key;
}
const $obj = (key: string) => ({ $obj: key });
const $beh = (id: string) => ({ $beh: id });
const $tmp = (key: string) => ({ $comp: key, kind: "TMP" });
const click = (object: string, behaviour: string, method: string) => events.push({ object, kind: "click", behaviour, method });

const ROOT = "coop-kitchen";
// Behaviours with no object of their own (managers, the per-player Chef) sit on one empty kit object.
obj("logic", "Logic", { ref: false });
const POOL = 48;

// ---- audio: one clip list on the `sfx` object (indices the kit builder keeps) ---------------------------------------
obj("sfx", "Audio");
const clipNames: Array<[string, number[]]> = [
  ["pickup", [0, 1]], // SFX_object_pickup01, 02
  ["drop", [2, 3]], // SFX_object_drop01, 02
  ["chop", [4, 5, 6]], // SFX_chop01..03
  ["warning", [7]], // SFX_warning01
  ["fail01", [8]], // SFX_delivery_fail01
  ["fail02", [9]], // SFX_delivery_fail02
  ["trash", [10, 11]], // SFX_trash01, 02
  ["success", [12, 13]], // SFX_delivery_success01, 02
  ["newOrder", [0]], // SFX_object_pickup01 (OrderTicketGroup's AudioSource)
  ["countdownStart", [14]], // a replacement for SFX_countdown_start (origin not stated upstream, 6.3 C)
  ["timesUp", [15]], // a replacement for SFX_timesup (same)
  ["tutorialDone", [13]], // SFX_delivery_success02
];
const clips = Object.fromEntries(clipNames.map(([name, list]) => [name, list.map((n) => ({ $clip: n, on: "sfx" }))]));

// ---- the kitchen floor, the item pool ------------------------------------------------------------------------------
obj("floor", "Floor", { click: true });
const slots: string[] = [];
const slotPaths: string[] = [];
for (let i = 0; i < POOL; i++) {
  const key = "s" + String(i).padStart(2, "0");
  const path = `Items/Slot${String(i).padStart(2, "0")}`;
  obj(key, path, { grab: true, active: false });
  slots.push(key);
  slotPaths.push(path);
}

// ---- counters, from the upstream Game scene --------------------------------------------------------------------------
const CRATE: Record<string, number> = { BreadCounter: 0, CabbageCounter: 1, CheeseCounter: 3, MeatCounter: 5, TomatoCounter: 8 };
const cells: Array<{ name: string; prefab: string }> = data.layouts.game;
const corners: string[] = [];
const counterBehaviours: Array<Record<string, unknown>> = [];
const prepBehaviours: Array<Record<string, unknown>> = [];
const canvasBehaviours: Array<Record<string, unknown>> = [];
let deliveryCell = "";

for (const cell of cells) {
  const key = "c_" + cell.name;
  const path = `Counters/${cell.name}`;
  obj(key, path, { click: true });
  if (cell.prefab === "Counter_Corner") {
    corners.push(key);
    continue;
  }
  const top = obj("t_" + cell.name, `${path}/Top`, { ref: false });
  const id = "ct_" + cell.name;
  const base = { kitchen: $beh("kitchen"), cell: cell.name, top: $obj(top) };
  click(key, id, "Clicked");
  if (cell.prefab in CRATE) {
    counterBehaviours.push({ id, type: "IngredientCounter", object: key, fields: { ...base, data: CRATE[cell.prefab] } });
  } else if (cell.prefab === "CutCounter" || cell.prefab === "StoveCounter") {
    const stove = cell.prefab === "StoveCounter";
    const prepId = "pr_" + cell.name;
    const prepPath = `${path}/${stove ? "Stove" : "CuttingBoard"}`;
    const knob = obj("q_" + cell.name, `${path}/${stove ? "Knob" : "CuttingBoard/Knife"}`, { click: true });
    click(knob, id, "ClickedKnob");
    const fill = obj("bar_" + cell.name, `${prepPath}/Canvas/Bar/Fill`, { ref: false });
    counterBehaviours.push({ id, type: "PreparationCounter", object: key, fields: { ...base, preparator: $beh(prepId) } });
    const p = stove ? data.preparators.stove : data.preparators.cuttingBoard;
    prepBehaviours.push({
      id: prepId,
      type: stove ? "Stove" : "CuttingBoard",
      fields: {
        kitchen: $beh("kitchen"),
        cell: cell.name,
        path: prepPath,
        allowedStatus: p.allowedStatus,
        preparatedStatus: p.preparatedStatus,
        finalSecondsBooster: p.finalSecondsBooster,
        ...(stove ? { timeBeforeBurn: p.timeBeforeBurn } : {}),
        counter: $beh(id),
        barFill: $obj(fill),
      },
    });
    canvasBehaviours.push({
      id: "pc_" + cell.name,
      type: "PreparationWorldSpaceCanvas",
      fields: { kitchen: $beh("kitchen"), preparator: $beh(prepId), path: `${prepPath}/Canvas`, barFill: $obj(fill), rejectedText: stove ? "Cannot \nCook" : "Cannot \nCut" },
    });
  } else if (cell.prefab === "Counter_Delivery") {
    deliveryCell = cell.name;
    counterBehaviours.push({ id, type: "DeliveryCounter", object: key, fields: { ...base, canvas: $beh("deliveryCanvas") } });
  } else if (cell.prefab === "Trash") {
    counterBehaviours.push({ id, type: "Trash", object: key, fields: base });
  } else {
    counterBehaviours.push({
      id,
      type: "Counter",
      object: key,
      fields: { ...base, startsWithPlate: cell.prefab === "Counter_Plate", plateStack: cell.prefab === "Counter_PlateStack" },
    });
  }
}
const deliveryTip = obj("deliveryTip", `Counters/${deliveryCell}/Canvas/Tip`);

// ---- the board ---------------------------------------------------------------------------------------------------
obj("board", "Board");
const t = (key: string, path: string) => obj(key, `Board/${path}`);
const button = (key: string, path: string, behaviour: string, method: string) => {
  obj(key, `Board/${path}`, { click: true });
  click(key, behaviour, method);
  return key;
};
t("scoreText", "Hud/Score/Current");
t("scoreDelta", "Hud/Score/Delta");
t("timerText", "Hud/Timer/Text");
obj("timerFill", "Board/Hud/Timer/Bar/Fill", { ref: false });
t("countDownText", "CountDown/Text");
const ticketPaths: string[] = [];
for (let i = 0; i < 3; i++) {
  ticketPaths.push(`Board/Orders/Ticket${i}`);
  t(`ticketName${i}`, `Orders/Ticket${i}/Name`);
  t(`ticketIcons${i}`, `Orders/Ticket${i}/Icons`);
  obj(`ticketBar${i}`, `Board/Orders/Ticket${i}/Bar/Fill`, { ref: false });
}
obj("lobby", "Board/Lobby");
t("rosterText", "Lobby/Roster");
button("btnPlay", "Lobby/Play", "mainMenuOptions", "PlayGame");
button("btnTutorial", "Lobby/Tutorial", "mainMenuOptions", "PlayTutorial");
button("btnSounds", "Lobby/Sounds", "mainMenuOptions", "RequestOpenSoundOptions");
button("btnCredits", "Lobby/Credits", "mainMenuOptions", "RequestOpenCredits");
button("btnCook", "Lobby/Cook", "mainMenuOptions", "ToggleCook");
obj("credits", "Board/Credits", { active: false });
t("creditsText", "Credits/Text");
button("btnCloseCredits", "Credits/Close", "mainMenu", "CloseCredits");
obj("sounds", "Board/Sounds", { active: false });
t("musicLabel", "Sounds/Music/Value");
t("effectsLabel", "Sounds/Effects/Value");
button("btnMusicUp", "Sounds/Music/Up", "soundPopup", "MusicUp");
button("btnMusicDown", "Sounds/Music/Down", "soundPopup", "MusicDown");
button("btnEffectsUp", "Sounds/Effects/Up", "soundPopup", "EffectsUp");
button("btnEffectsDown", "Sounds/Effects/Down", "soundPopup", "EffectsDown");
button("btnResetVolumes", "Sounds/Reset", "soundPopup", "HandleResetButtonClick");
button("btnSoundsBack", "Sounds/Back", "soundPopup", "HandleCloseButtonClick");
button("btnPause", "Hud/Pause", "pauseOptions", "Pause");
obj("pausePanel", "Board/PausePanel", { active: false });
obj("pauseOptions", "Board/PausePanel/Options");
t("pausedBy", "PausePanel/PausedBy");
button("btnResume", "PausePanel/Options/Resume", "pauseOptions", "Resume");
button("btnRestart", "PausePanel/Options/Restart", "pauseOptions", "Restart");
button("btnPauseSounds", "PausePanel/Options/Sounds", "pauseOptions", "Sound");
button("btnEndRound", "PausePanel/Options/EndRound", "pauseOptions", "Exit");
obj("confirm", "Board/PausePanel/Confirm", { active: false });
button("btnYes", "PausePanel/Confirm/Yes", "pauseCanvas", "Confirmed");
button("btnNo", "PausePanel/Confirm/No", "pauseCanvas", "Declined");
for (const [key, path] of [
  ["resFailed", "Failed"],
  ["resFailedTotal", "FailedTotal"],
  ["resDelivered", "Delivered"],
  ["resDeliveredTotal", "DeliveredTotal"],
  ["resTips", "Tips"],
  ["resTotal", "Total"],
  ["resBest", "Best"],
]) t(key!, `Results/${path}`);
obj("newHighScore", "Board/Results/NewHighScore", { active: false });
button("btnContinue", "Results/Continue", "results", "HandleContinueButtonClick");
t("tutorialText", "Tutorial/Description/Text");
obj("arrow0", "Arrows/Arrow0", { active: false, ref: false });
obj("arrow1", "Arrows/Arrow1", { active: false, ref: false });

// ---- behaviours, in start order (the upstream's managers first: DefaultExecutionOrder(-1)) -----------------------
behaviours.push({
  id: "kitchen",
  type: "Kitchen",
  fields: {
    match: $beh("match"),
    orders: $beh("orders"),
    score: $beh("score"),
    tutorial: $beh("tutorial"),
    gameData: $beh("gameData"),
    slots: slots.map($obj),
    slotPaths,
    floor: $obj("floor"),
    corners: corners.map($obj),
    clips,
    kitScale: 0.64,
  },
});
behaviours.push({ id: "match", type: "MatchManager", fields: { kitchen: $beh("kitchen") } });
behaviours.push({ id: "score", type: "ScoreManager" });
behaviours.push({ id: "orders", type: "OrderManager", fields: { kitchen: $beh("kitchen") } });
behaviours.push({ id: "gameData", type: "GameDataManager" });
behaviours.push(...counterBehaviours, ...prepBehaviours, ...canvasBehaviours);
behaviours.push({ id: "deliveryCanvas", type: "DeliveryCounterCanvas", fields: { kitchen: $beh("kitchen"), cell: deliveryCell, path: `Counters/${deliveryCell}/Canvas`, tip: $tmp(deliveryTip), tipFormat: data.ui.tipFormat } });
behaviours.push({
  id: "tickets",
  type: "OrderTicketGroup",
  fields: {
    kitchen: $beh("kitchen"),
    board: "board",
    ticketPaths,
    names: [0, 1, 2].map((i) => $tmp(`ticketName${i}`)),
    icons: [0, 1, 2].map((i) => $tmp(`ticketIcons${i}`)),
    bars: [0, 1, 2].map((i) => $obj(`ticketBar${i}`)),
  },
});
behaviours.push({ id: "scoreUi", type: "Score", fields: { kitchen: $beh("kitchen"), path: "Board/Hud/Score", current: $tmp("scoreText"), delta: $tmp("scoreDelta") } });
behaviours.push({ id: "timer", type: "Timer", fields: { kitchen: $beh("kitchen"), path: "Board/Hud/Timer", board: "board", timer: $tmp("timerText"), slider: $obj("timerFill") } });
behaviours.push({ id: "countDown", type: "CountDown", fields: { kitchen: $beh("kitchen"), path: "Board/CountDown", board: "board", countDown: $tmp("countDownText") } });
behaviours.push({ id: "timesUp", type: "TimesUp", fields: { kitchen: $beh("kitchen"), path: "Board/TimesUp", board: "board" } });
behaviours.push({
  id: "results",
  type: "Results",
  fields: {
    kitchen: $beh("kitchen"),
    gameData: $beh("gameData"),
    path: "Board/Results",
    failedDeliveries: $tmp("resFailed"),
    totalFailedDeliveries: $tmp("resFailedTotal"),
    successfulDeliveries: $tmp("resDelivered"),
    totalSuccessfulDeliveries: $tmp("resDeliveredTotal"),
    tips: $tmp("resTips"),
    totalScore: $tmp("resTotal"),
    best: $tmp("resBest"),
    newHighScore: $obj("newHighScore"),
  },
});
behaviours.push({ id: "music", type: "BackgroundMusic", fields: { kitchen: $beh("kitchen"), path: "Music" } });
behaviours.push({ id: "soundPopup", type: "SoundPopup", object: "sounds", fields: { gameData: $beh("gameData"), path: "Board/Sounds", musicLabel: $tmp("musicLabel"), effectsLabel: $tmp("effectsLabel") } });
behaviours.push({ id: "mainMenuOptions", type: "MainMenuOptions", object: "lobby", fields: { kitchen: $beh("kitchen"), tutorialButton: "btnTutorial" } });
behaviours.push({
  id: "mainMenu",
  type: "MainMenu",
  fields: { kitchen: $beh("kitchen"), mainMenuOptions: $beh("mainMenuOptions"), soundPopup: $beh("soundPopup"), credits: $obj("credits"), creditsText: $tmp("creditsText"), roster: $tmp("rosterText") },
});
behaviours.push({ id: "pauseOptions", type: "PauseOptions", object: "pauseOptions", fields: { kitchen: $beh("kitchen") } });
behaviours.push({ id: "pauseCanvas", type: "PauseCanvas", object: "pausePanel", fields: { kitchen: $beh("kitchen"), pauseOptions: $beh("pauseOptions"), soundPopup: $beh("soundPopup"), confirm: $obj("confirm") } });
behaviours.push({ id: "pauseHandler", type: "PauseHandler", fields: { kitchen: $beh("kitchen"), pauseCanvas: $beh("pauseCanvas"), pauseButton: "btnPause", pausedBy: $tmp("pausedBy") } });
behaviours.push({ id: "tutorialDescription", type: "TutorialDescription", fields: { kitchen: $beh("kitchen"), manager: $beh("tutorial"), path: "Board/Tutorial/Description", board: "board", text: $tmp("tutorialText") } });
behaviours.push({
  id: "tutorial",
  type: "TutorialManager",
  fields: {
    kitchen: $beh("kitchen"),
    description: $beh("tutorialDescription"),
    titlePath: "@Board/Tutorial/Title",
    arrowObjects: [$obj("arrow0"), $obj("arrow1")],
    deliveryCounter: $beh("ct_" + deliveryCell),
    plateCounterCell: "Counter_Plate_00",
    timeBetweenSteps: data.tutorial.timeBetweenSteps,
  },
});
behaviours.push({ id: "chef", type: "Chef", perPlayer: true, fields: { kitchen: $beh("kitchen") } });

for (const b of behaviours) if (b.object === undefined) b.object = "logic";

const EOL = String.fromCharCode(10);
const editor = join(here, "..", "..", "Assets", "Kit", "Editor");
mkdirSync(editor, { recursive: true });
const contract = { schema: 1, slug: "coop-kitchen", generatedBy: "ts/tools/gen-bindings.ts", credits: CREDITS, objects, refs, behaviours, events };
writeFileSync(join(editor, "kit-contract.json"), JSON.stringify(contract, null, 2) + EOL);

const existing = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : null;
if (!existing || existing.provisional) {
  const bindings = {
    provisional: "Written by tools/gen-bindings.ts, not by the kit builder: no kit build yet. PortKit/Kit/Build Prefabs replaces it.",
    schema: 1,
    slug: "coop-kitchen",
    hash: "",
    root: ROOT,
    bundles: { windows: "", android: "" },
    objects,
    refs,
    behaviours,
    events,
  };
  writeFileSync(out, JSON.stringify(bindings, null, 2) + EOL);
}
console.log(`kit contract: ${Object.keys(objects).length} objects, ${refs.length} refs, ${behaviours.length} behaviours, ${events.length} events`);
