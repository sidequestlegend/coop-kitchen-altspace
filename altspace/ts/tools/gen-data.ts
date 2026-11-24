// Writes data/kitchen-data.json: the upstream's ScriptableObject data (ingredients, collections, recipes, order, match
// and score settings), the gameplay values serialized on its prefabs, and the counter layout of its Game and Tutorial
// scenes. Read from the upstream's YAML as text; nothing of its art is read or copied (an icon is named, not taken).
//
//   node tools/gen-data.ts [<upstream Assets folder>]      default: ../../Assets (the upstream clone this port sits in)
//
// The output is checked in, so the port builds and tests without the upstream clone (a fresh repository has none).

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { argv, exit } from "node:process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(argv[2] ?? join(here, "..", "..", "..", "Assets"));
const out = join(here, "..", "data", "kitchen-data.json");
if (!existsSync(join(assets, "Settings"))) {
  console.error(`no upstream Assets folder at ${assets}: data/kitchen-data.json is kept as it is`);
  exit(1);
}

function walk(dir: string, ext: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, ext, found);
    else if (name.endsWith(ext)) found.push(path);
  }
  return found;
}

/** GUID of an asset, from its .meta file. */
function guidOf(path: string): string {
  const meta = readFileSync(path + ".meta", "utf8");
  return /guid: ([0-9a-f]{32})/.exec(meta)![1]!;
}

const guidToPath = new Map<string, string>();
for (const folder of ["Settings", "Prefabs", "_Assets/Textures/Icons"]) {
  for (const ext of [".asset", ".prefab", ".png"]) {
    const dir = join(assets, folder);
    if (!existsSync(dir)) continue;
    for (const path of walk(dir, ext)) guidToPath.set(guidOf(path), path);
  }
}

const read = (path: string) => readFileSync(path, "utf8");
const field = (text: string, name: string): string | null => {
  const m = new RegExp(`^\\s*${name.replace(/[<>]/g, (c) => "\\" + c)}: ?(.*)$`, "m").exec(text);
  return m ? m[1]!.trim() : null;
};
const num = (text: string, name: string): number => Number(field(text, name));
const guidIn = (value: string | null) => (value ? (/guid: ([0-9a-f]{32})/.exec(value)?.[1] ?? null) : null);
const settings = (rel: string) => read(join(assets, "Settings", rel));

// ---- ingredients: the order of PORT.md 5.6 (variant index 0 to 9) ----------------------------------------------

const VARIANT_ASSETS = [
  "Ingredients/Breads/Bread.asset",
  "Ingredients/Cabbages/Cabbage.asset",
  "Ingredients/Cabbages/Cabbage_Sliced.asset",
  "Ingredients/Cheeses/Cheese.asset",
  "Ingredients/Cheeses/Cheese_Sliced.asset",
  "Ingredients/Meats/Meat.asset",
  "Ingredients/Meats/Meat_Cooked.asset",
  "Ingredients/Meats/Meat_Burned.asset",
  "Ingredients/Tomatos/Tomato.asset",
  "Ingredients/Tomatos/Tomato_Sliced.asset",
];
const variantByGuid = new Map<string, number>();
const ingredients = VARIANT_ASSETS.map((rel, index) => {
  const text = settings(rel);
  variantByGuid.set(guidOf(join(assets, "Settings", rel)), index);
  const icon = guidToPath.get(guidIn(field(text, "<Icon>k__BackingField")) ?? "");
  const prefab = guidToPath.get(guidIn(field(text, "<Prefab>k__BackingField")) ?? "");
  return {
    index,
    asset: field(text, "m_Name"),
    name: num(text, "<Name>k__BackingField"),
    status: num(text, "<Status>k__BackingField"),
    preparationTime: num(text, "<PreparationTime>k__BackingField"),
    icon: icon ? basename(icon, ".png") : null,
    prefab: prefab ? basename(prefab, ".prefab") : null,
  };
});

const listOfGuids = (text: string, name: string): string[] => {
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((l) => l.trim() === `${name}:`);
  const out: string[] = [];
  for (let i = at + 1; i < lines.length && /^\s*- /.test(lines[i]!); i++) out.push(guidIn(lines[i]!)!);
  return out;
};

const ingredientSettings = settings("Ingredients/IngredientSettings.asset");
const collections = listOfGuids(ingredientSettings, "collections").map((guid) => {
  const text = read(guidToPath.get(guid)!);
  return {
    asset: field(text, "m_Name"),
    name: num(text, "<Name>k__BackingField"),
    ingredients: listOfGuids(text, "ingredients").map((g) => variantByGuid.get(g)!),
  };
});

// ---- recipes ------------------------------------------------------------------------------------------------------

function recipe(path: string) {
  const text = read(path);
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((l) => l.trim() === "<PlatedIngredients>k__BackingField:");
  const plated: Array<{ variant: number; position: number[]; rotation: number[] }> = [];
  const vec = (line: string) => [...line.matchAll(/[xyz]: (-?[0-9.eE+-]+)/g)].map((m) => Number(m[1]));
  for (let i = at + 1; i + 2 < lines.length && /^\s*- ingredientData:/.test(lines[i]!); i += 3) {
    plated.push({ variant: variantByGuid.get(guidIn(lines[i]!)!)!, position: vec(lines[i + 1]!), rotation: vec(lines[i + 2]!) });
  }
  return {
    asset: field(text, "m_Name"),
    name: field(text, "<Name>k__BackingField"),
    plated,
    chance: num(text, "<Chance>k__BackingField"),
    tipMultiplier: num(text, "TipMultiplier"),
  };
}
const recipeSettings = settings("Recipes/RecipeSettings.asset");
const recipeGuids = listOfGuids(recipeSettings, "recipes");
const recipes = recipeGuids.map((g) => recipe(guidToPath.get(g)!));
const recipeIndexByGuid = new Map(recipeGuids.map((g, i) => [g, i]));

// ---- settings -----------------------------------------------------------------------------------------------------

const orderText = settings("Orders/OrderSettings.asset");
const order = {
  maxOrders: num(orderText, "maxOrders"),
  additionalTimePerIngredient: num(orderText, "additionalTimePerIngredient"),
  timeByNewOrder: num(orderText, "timeByNewOrder"),
  timeToRemoveAfterFail: num(orderText, "timeToRemoveAfterFail"),
  timeToRemoveAfterDelivery: num(orderText, "timeToRemoveAfterDelivery"),
  timeToReturnPlate: num(orderText, "timeToReturnPlate"),
};
const matchText = settings("MatchSettings.asset").split(/\r?\n/);
const timeAfter = (header: string) => Number(/: (\d+)/.exec(matchText[matchText.findIndex((l) => l.includes(header)) + 1]!)![1]);
const match = {
  countDown: timeAfter("<CountDown>k__BackingField"),
  timeLimit: timeAfter("<TimeLimit>k__BackingField"),
  finalSeconds: Number(field(settings("MatchSettings.asset"), "finalSeconds")),
  startDelay: 0.2, // MatchManager.cs: Invoke(nameof(StartCountDown), 0.2F)
};
const scoreText = settings("ScoreSettings.asset");
const score = { deliveredOrdersMultiplier: num(scoreText, "deliveredOrdersMultiplier"), failedOrdersMultiplier: num(scoreText, "failedOrdersMultiplier") };

// ---- values serialized on prefabs ---------------------------------------------------------------------------------

const prefab = (rel: string) => read(join(assets, "Prefabs", rel));
const board = prefab("Counters/PreparationsCounters/CuttingCounter/CuttingBoard.prefab");
const stove = prefab("Counters/PreparationsCounters/StoveCounter/Stove/Stove.prefab");
const tutorialManager = prefab("Levels/Tutorials/TutorialManager.prefab");
const showOrderRecipe = /recipe: \{fileID: \d+, guid: ([0-9a-f]{32})/.exec(tutorialManager)?.[1] ?? "";
const preparators = {
  cuttingBoard: { allowedStatus: num(board, "allowedStatus"), preparatedStatus: num(board, "preparatedStatus"), finalSecondsBooster: num(board, "finalSecondsBooster") },
  stove: { allowedStatus: num(stove, "allowedStatus"), preparatedStatus: num(stove, "preparatedStatus"), finalSecondsBooster: num(stove, "finalSecondsBooster"), timeBeforeBurn: num(stove, "timeBeforeBurn") },
};
const ui = {
  tipFormat: field(prefab("Counters/Delivery/Canvas/DeliveryCounterCanvas.prefab"), "tipFormat"),
  tutorialFadeSpeed: num(prefab("UI/TutorialDescription.prefab"), "fadeSpeed"),
};
const tutorial = {
  timeBetweenSteps: num(tutorialManager, "timeBetweenSteps"),
  showOrderRecipe: recipeIndexByGuid.get(showOrderRecipe) ?? -1,
  timeToRead: num(tutorialManager, "timeToRead"),
};

// ---- scene layouts ------------------------------------------------------------------------------------------------

interface Cell {
  name: string;
  prefab: string;
  x: number;
  z: number;
  yaw: number;
}

function layout(scene: string): Cell[] {
  const text = read(join(assets, "Scenes", scene));
  const blocks = text.split(/^--- /m).filter((b) => b.startsWith("!u!1001 "));
  const cells: Cell[] = [];
  for (const block of blocks) {
    const source = guidIn(/m_SourcePrefab: (.*)$/m.exec(block)?.[1] ?? null);
    const path = source ? guidToPath.get(source) : undefined;
    if (!path) continue;
    const values = new Map<string, string>();
    for (const m of block.matchAll(/propertyPath: (\S+)\s+value: ?(.*)/g)) values.set(m[1]!, m[2]!.trim());
    const name = values.get("m_Name") ?? basename(path, ".prefab");
    const yawHint = values.get("m_LocalEulerAnglesHint.y");
    const qy = Number(values.get("m_LocalRotation.y") ?? 0);
    const qw = Number(values.get("m_LocalRotation.w") ?? 1);
    const yaw = yawHint !== undefined ? Number(yawHint) : Math.round((2 * Math.atan2(qy, qw) * 180) / Math.PI);
    const rel = relative(join(assets, "Prefabs"), path).split("\\").join("/");
    if (!rel.startsWith("Counters/") && !rel.startsWith("Items/Trash/")) continue;
    const round = (v: string | undefined) => Math.round(Number(v ?? 0) * 1000) / 1000;
    cells.push({ name, prefab: basename(path, ".prefab"), x: round(values.get("m_LocalPosition.x")), z: round(values.get("m_LocalPosition.z")), yaw: ((yaw % 360) + 540) % 360 - 180 });
  }
  cells.sort((a, b) => (a.z - b.z) || (a.x - b.x));
  return cells;
}

const data = {
  source: "HyagoOliveira/KitchenChaos @ 4a73a26 (MIT, Copyright (c) 2023 Hyago Oliveira): Assets/Settings/**, prefab fields, scene layouts",
  generatedBy: "tools/gen-data.ts",
  enums: {
    IngredientName: { None: 0, Bread: 1, Cabbage: 2, Cheese: 3, Tomato: 4, Meat: 5 },
    IngredientStatus: { None: 0, Raw: 1, Ready: 2, Burned: 3, Cuttable: 4 },
  },
  ingredients,
  collections,
  recipes,
  order,
  match,
  score,
  preparators,
  tutorial,
  ui,
  layouts: { game: layout("Game.unity"), tutorial: layout("Tutorial.unity") },
};

writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
console.log(`wrote ${out}: ${ingredients.length} ingredients, ${collections.length} collections, ${recipes.length} recipes, ${data.layouts.game.length} + ${data.layouts.tutorial.length} counter cells`);
