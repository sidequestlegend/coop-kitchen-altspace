# PORT.md: coop-kitchen

**Status (2026-11-25): the rules are ported to TypeScript and tested in Node, the kit is built, rungs 0 to 4 pass in the editor, and the independent review's findings are fixed (11.8); kit re-synced to portkit c971100 and rungs 0 to 4 passed again on the rebuilt bundles (TESTS.md); see section 11 (status, decisions, the three proposed names, gaps, trust). Sections 1 to 10 are the analysis made before the port; where the port went another way, section 11 says so.**

Upstream: `HyagoOliveira/KitchenChaos` at commit `4a73a26`. Target: one Altspace snippet, a co-op
cooking game under its own name, with the upstream rules. (This analysis first planned to use Code Monkey's course
art, credited; the owner decided otherwise: no upstream art is used, the kit is KayKit (CC0), 11.7.)

This file was written from a read-only pass over the clone on 2026-11-24. Nothing was compiled, run,
built or opened in Unity. Scripts were read in full; scenes, prefabs and assets were read as YAML and
scripts matched by GUID from their `.meta` files; git history was read (no writes).

Path shorthand used throughout (all relative to `C:\workspace\AltspaceGames\coop-kitchen\`):
`S/` = `Assets/Scripts/`, `P/` = `Assets/Prefabs/`, `T/` = `Assets/Settings/`. A reference such as
`S/Orders/Order.cs:62-66` is a line range in the file at commit `4a73a26`.

Where the five requested analysis points live:

| Point | Section |
|---|---|
| (a) co-op redesign, VR and desktop interaction | 8 (design), 3 (who writes what), 10 (exact list of changes) |
| (b) every use of each `com.actioncode.*` package | 4.2 |
| (c) art inventory and whose it is | 6.1 to 6.3 |
| (d) recipe and order data as tables | 5.6 |
| (e) the tutorial | 2 (group Q), 8.7 |

Things I could not determine are marked **Not determined**.

---

## 1. Upstream at a glance

| Item | Value | Where |
|---|---|---|
| Repository | `https://github.com/HyagoOliveira/KitchenChaos`, branch `main` | `git remote -v` |
| Commit | `4a73a26cbfdaa3c3dc13e134947dbdb41f6a2857`, 2023-09-22, "Fix Unity Packages link", 254 commits, one author (Hyago Oliveira) | `git log` |
| Clone state | branch `altspace`, same commit, clean; no Git LFS (`.gitattributes:2` is only `* text=auto`) | |
| Unity | 2021.3.27f1 | `ProjectSettings/ProjectVersion.txt:1` |
| Company / product | "Nost Games" / "Kitchen Chaos", version 1.0.0 | `ProjectSettings/ProjectSettings.asset:15-16,137` |
| Colour space, input | Linear; new Input System only (`activeInputHandler: 1`) | `ProjectSettings/ProjectSettings.asset:50,871` |
| Physics | fixed step 0.02 s, gravity −9.81, every layer collides with every layer | `ProjectSettings/TimeManager.asset:6`, `DynamicsManager.asset:7,20` |
| Layers | 6 Counters, 7 Ingredients, 8 Level, 9 Items, 10 Boundaries | `ProjectSettings/TagManager.asset` |
| Size | 123 `.cs` files in the repo: 100 handwritten game files (4,635 lines), 1 generated input wrapper (`S/Players/Inputs/PlayerInputActions.cs`, 638 lines), 22 files of a third-party editor plugin (`Assets/Plugins/CodeAssist`, not game code). 660 non-meta files under `Assets`, 124.9 MB | counted |

Packages (`Packages/manifest.json:3-27`):

| Package | Version | Note |
|---|---|---|
| `com.actioncode.audio` | 3.0.0 | private registry |
| `com.actioncode.pause-system` | 1.1.0 | private registry |
| `com.actioncode.persistence` | 2.2.0 | private registry |
| `com.actioncode.physics` | 0.2.0 | private registry |
| `com.actioncode.scene-management` | 2.0.1 | private registry |
| `com.actioncode.shapes` | 1.2.0 | private registry |
| `com.actioncode.ui` | 4.1.1 | private registry |
| `com.actioncode.visual-effects` | 1.0.0 | private registry |
| `com.unity.render-pipelines.universal` | 12.1.12 | URP 12 |
| `com.unity.inputsystem` | 1.6.1 | |
| `com.unity.textmeshpro` | 3.0.6 | |
| `com.unity.timeline` | 1.7.2 | no timeline asset in the repo |
| `com.unity.nuget.newtonsoft-json` | 3.2.1 | needed by the CodeAssist plugin and probably by persistence |
| `com.unity.ugui`, `com.unity.2d.sprite`, `com.unity.ide.visualstudio` 2.0.18, built-in modules | | |

`Packages/packages-lock.json` lists **fourteen** `com.actioncode.*` packages, not eight: the eight
above plus six pulled in by them: `async-io` 1.0.0, `attributes` 2.1.0, `awaitable-coroutines` 1.0.0,
`collider-adapter` 3.1.0, `cryptography` 1.0.0, `scriptable-settings-provider` 1.0.0. Game code calls
one of the six directly (`ActionCode.AwaitableCoroutines`, `S/Orders/Order.cs:7,54`).

The scoped registry is `http://34.151.243.47:4873/` (`Packages/manifest.json:32`,
`ProjectSettings/PackageManagerSettings.asset`). The README links a different address,
`http://34.125.146.81:4873/` (`README.md:18`). Both timed out on 2026-11-24 (8 s, no response).
No copy of any package is in the working tree and none is in this machine's Unity package cache.
Two other sources do exist, see 4.2.

Entry scenes (`ProjectSettings/EditorBuildSettings.asset:8-23`), in build order:

| # | Scene | Role |
|---|---|---|
| 0 | `Assets/Scenes/Loader.unity` | loads the save file, shows a notice, goes to MainMenu after 4 s |
| 1 | `Assets/Scenes/MainMenu.unity` | logo, PLAY / TUTORIAL / SOUNDS / CREDITS, starts the music |
| 2 | `Assets/Scenes/Game.unity` | the 120 s round |
| 3 | `Assets/Scenes/Tutorial.unity` | guided cheeseburger, then Results |
| 4 | `Assets/Scenes/Results.unity` | score breakdown, high score, Continue to MainMenu |

`Assets/Scenes/PrefabMode/UIEnvironment.unity` is an editor-only scene and is not in the build.

### Licences and attribution statements found in the repo (quoted)

1. `LICENSE:1-3`: "MIT License" / "Copyright (c) 2023 Hyago Oliveira". Standard MIT text follows.
2. `README.md:12`: "This game is a study case for the game Overcooked! 2."
3. `README.md:14`: "All art assets like Textures, models, audio clips etc where created by the indie
   game maker **Code Monkey** for this [Free Complete Unity Course](https://youtu.be/AmGSEH7QcDg)."
4. `README.md:16`: "However, the game structure and the source-code were created by me and they are
   very different from the course."
5. `README.md:18`: "This project uses many [Unity Packages](http://34.125.146.81:4873/) created and
   published by me. All of them are on the MIT license so you can freely use them into your project."
6. In-game credits, `P/UI/Menus/CreditsPopup.prefab:69-70` (TextMeshPro rich text, quoted as stored):
   `- Audio, 3D Models, Textures: \n   <color=yellow>Code Monkey</color> <size=60%>(youtube.com/@CodeMonkeyUnity)</size>\n\n- Code:\n   <color=yellow>Hyago Oliveira</color> <size=60%>(github.com/HyagoOliveira)</size>`
   On screen that reads: "- Audio, 3D Models, Textures: Code Monkey (youtube.com/@CodeMonkeyUnity)" and
   "- Code: Hyago Oliveira (github.com/HyagoOliveira)".
7. `Assets/Plugins/CodeAssist/THIRD-PARTY-NOTICES.TXT:1`: "This asset is governed by the Asset Store
   EULA; however, the following components are governed by the licenses indicated below:" (the
   plugin is "Code Assist" by Merry Yellow, `Assets/Plugins/CodeAssist/README.TXT:1-15`).
8. `Assets/TextMesh Pro/Fonts/LiberationSans - OFL.txt` (SIL Open Font License, Red Hat / Google) and
   `Assets/TextMesh Pro/Sprites/EmojiOne Attribution.txt:1-3`: "This sample of beautiful emojis are
   provided by EmojiOne https://www.emojione.com/ / Please visit their website to view the complete
   set of their emojis and review their licensing terms."

No file in the repo carries a licence text **from Code Monkey**. The MIT file is the author's and
cannot license someone else's art. Section 6.3 lists what the statements above do not cover.

---

## 2. Feature checklist

Every statement is literal upstream behaviour with where it is implemented. The last column is the
port's intent: **K** keep exactly, **A** keep the rule but adapt how it is presented or triggered
(detail in 8 and 10), **X** leave out (reason in 10). "E" is the upstream *Collect Item* action
(keyboard E, gamepad south) and "Q" is *Interact With Environment* (keyboard Q, gamepad west),
`T/Inputs/PlayerInputActions.inputactions`, `S/Players/Inputs/PlayerInputSettings.cs:48-59`.
"Facing" means the chef's box cast hits it: a 0.5 m cube cast 0.8 m forward from 0.25 m above the
chef's feet against layers Counters, Ingredients and Items (`P/Players/_BasePlayer.prefab:50-52`,
detector child at local `(0, 0.25, 0)`), with the component looked up on the hit object only (4.2).

### A. Programme flow

| # | Statement | Upstream | Port |
|---|---|---|---|
| 1 | The build has five scenes in the order Loader, MainMenu, Game, Tutorial, Results. | `ProjectSettings/EditorBuildSettings.asset:8-23` | A |
| 2 | Loader loads the save file or creates an empty one, shows "This game saves automatically. Don't close it when this saving message is visible.", and 4 s after loading goes to MainMenu. | `S/Serialization/Loader.cs:12-23`, `S/Serialization/GameDataManager.cs:13-25`, `P/UI/Canvases/LoaderCanvas.prefab:69-70,413` | X |
| 3 | MainMenu shows a logo and four buttons: PLAY (loads Game), TUTORIAL (loads Tutorial), SOUNDS, CREDITS. | `S/UI/Menus/MainMenuOptions.cs:22-41`, `P/UI/Menus/MainMenu/MainMenuOptions.prefab` | A |
| 4 | CREDITS opens a popup with the text quoted in 1 and a Close button; closing returns to the buttons. | `S/UI/Menus/MainMenu.cs:38-51`, `P/UI/Menus/CreditsPopup.prefab:69-70` | A |
| 5 | Every scene change fades: 0.2 s before loading and 0.5 s after. | `T/Scenes/DefaultSceneTransition.asset:15-16`, `S/Scenes/SceneSettings.cs:17-20` | X |
| 6 | Music (`Music.wav`, looping, 2D) starts in MainMenu, survives scene changes, and only one copy ever exists. | `S/Musics/BackgroundMusic.cs:26-36`, `P/Levels/BackgroundMusic.prefab` | A |
| 7 | In Game, a 3 s countdown starts 0.2 s after the scene starts. | `S/Matches/MatchManager.cs:12,17` | K |
| 8 | Restarting or re-entering Game resets score, orders, items and plates (scene reload plus explicit resets). | `S/Score/ScoreSettings.cs:21-27`, `S/Orders/OrderSettings.cs:35-41` | K |

### B. Kitchen and items

| # | Statement | Upstream | Port |
|---|---|---|---|
| 9 | The kitchen is a closed ring of 34 counter cells on a 1.5 m grid, 11 by 8 cells outside, the chefs inside (walkable area about 13.5 m by 9.0 m). | `Assets/Scenes/Game.unity` (positions in 5.1), `P/Counters/Counter_Base.prefab:46` | A |
| 10 | The ring holds: 11 plain counters, 2 plain counters with a plate on them, 1 plate-stack counter, 2 crates each of Bread, Cabbage, Cheese, Meat, Tomato, 2 cutting counters, 2 stove counters, 1 trash, 1 delivery counter, 4 corner pieces. | `Assets/Scenes/Game.unity` | K |
| 11 | Corner pieces are solid and do nothing. | `P/Counters/Counter_Corner.prefab` (no `Counter` component) | K |
| 12 | Exactly 2 plates exist at the start, one on each plate counter. | `P/Counters/Counter_Plate.prefab:97,163`, `S/Items/ItemHolder.cs:20,107-111` | K |
| 13 | A holder (a counter top, a board, a stove, a crate top, a chef's hands) holds at most one item. A plate counts as one item whatever is on it. | `S/Items/ItemHolder.cs:18,86-88` | K |
| 14 | Ingredient kinds: Bread, Cabbage, Cheese, Tomato, Meat. States: Raw, Cuttable, Ready, Burned. The ten ingredient variants are in 5.6. | `S/Items/Ingredients/IngredientName.cs:3-11`, `IngredientStatus.cs:3-10`, `T/Ingredients/**` | K |
| 15 | The kitchen is surrounded by four invisible walls 8 m high. | `P/Levels/Boundries.prefab:46,126,171,216` | A |
| 138 | Each crate shows its ingredient's icon on its door (added after the review: the first count of 137 missed it). | `S/Counters/IngredientCounter.cs:11-13,43-47` (`UpdateIcon`), the crate prefabs' `SpriteRenderer` | A |

### C. Taking and placing (E)

| # | Statement | Upstream | Port |
|---|---|---|---|
| 16 | Empty hands, facing a crate with nothing on top: the crate door swings (0.33 s) and a new ingredient of that crate's kind is in the chef's hands. Supply is unlimited. | `S/Counters/IngredientCounter.cs:26-37`, `P/Counters/Ingredients/Meshes/IngredientCounter@Open.anim` | K |
| 17 | Empty hands, facing any counter that holds an item (plain, crate top, board, stove, plate stack): the chef takes that item. | `S/Counters/Counter.cs:52`, `S/Items/ItemHolder.cs:46-58`, `S/Items/ItemHandler.cs:40-44,86-92` | K |
| 18 | Taking an item into the hands plays a random pick-up sound (2 clips). | `S/Items/ItemHandler.cs:42-43`, `P/Players/_BasePlayer.prefab` | K |
| 19 | An item cannot be taken from a board or stove while it is preparing, including while the preparation is paused. | `S/Counters/Preparation/PreparationCounter.cs:22-31` | K |
| 20 | Holding an item, facing an empty counter: the item is put there. No sound. | `S/Items/ItemHolder.cs:70-75`, `S/Items/ItemHandler.cs:31,80-84` | K |
| 21 | Nothing can be put on a board or stove while it is preparing. | `S/Counters/Preparation/PreparationCounter.cs:33-34` | K |
| 22 | Holding an item, facing a counter that holds something that is not a plate: nothing happens. Items are never swapped. | `S/Items/ItemHolder.cs:62-68`, `S/Items/ItemHandler.cs:32` | K |
| 23 | Holding an item, facing nothing: the item is dropped on the floor as a loose physics object, with a random drop sound (2 clips). | `S/Items/ItemHandler.cs:32-38`, `S/Physics/CollectableBody.cs:27-37` | A |
| 24 | Empty hands, facing a loose item: the chef picks it up. | `S/Items/ItemHandler.cs:91` | A |
| 25 | Holding an ingredient, facing a loose plate: the ingredient goes onto that plate under rules 30 to 32. | `S/Items/ItemHandler.cs:82-83`, `S/Items/Plate.cs:11,24` | A |
| 26 | A crate top holds any item, like a plain counter; an item on top is taken before a new ingredient is dispensed. | `S/Counters/IngredientCounter.cs:28-29` | K |
| 27 | The plate-stack counter stacks whatever is placed on it 0.12 m apart and gives back the top one first. | `S/Items/ItemHolderStack.cs:36-51` | K |
| 28 | Holding a plate, facing a crate: the plate is put on the crate top (if free). An ingredient is never dispensed straight onto a held plate. | `S/Items/ItemHandler.cs:74-84` with `S/Items/Plate.cs:32-33` | K |
| 29 | Empty hands facing the trash or the delivery counter: nothing happens. | `S/Items/ItemHandler.cs:86-92` | K |

### D. Plates

| # | Statement | Upstream | Port |
|---|---|---|---|
| 30 | A plate accepts an ingredient only if some recipe contains that exact variant: Bread, cooked Meat, sliced Cheese, sliced Cabbage, sliced Tomato. Whole, raw and burned ingredients are refused. | `S/Items/Plate.cs:32-33`, `S/Recipes/RecipeSettings.cs:21-28`, `S/Recipes/RecipeData.cs:40-42` | K |
| 31 | A plate refuses a second Bread. | `S/Items/Plate.cs:16,29-30,56` | K |
| 32 | A plate refuses an ingredient coming from a board or stove that is preparing. | `S/Items/Plate.cs:26-27` | K |
| 33 | Holding an ingredient, facing a counter with a plate: the ingredient goes onto that plate (rules 30 to 32); if refused nothing happens. | `S/Items/ItemHolder.cs:64-65` | K |
| 34 | Holding a plate, facing a counter with an ingredient: the ingredient moves from the counter onto the held plate (rules 30 to 32). | `S/Items/ItemHandler.cs:53-62,74-78` | K |
| 35 | Holding a plate, facing a counter with a plate: nothing happens. Holding a plate, facing an empty counter: the plate is put down. | `S/Items/ItemHandler.cs:29-32`, `S/Items/ItemHolder.cs:60-76` | K |
| 36 | Ingredients on a plate are arranged at the positions of the first recipe, in settings order, that contains every ingredient on the plate; all are re-arranged on each addition. | `S/Recipes/RecipeSettings.cs:30-59`, `S/Recipes/RecipeData.cs:37-38`, `S/Recipes/PlatedIngredient.cs:23-27`; positions in 5.6 | K |
| 37 | A plate shows one round icon per ingredient on it, floating above it and turned to the camera. | `S/Items/Plate.cs:63`, `S/UI/Ingredients/IngredientIcons.cs:13-22`, `S/Utils/RotateTowardsCamera.cs:12-16`, `P/Items/Plates/Plate_Normal.prefab` | A |

### E. Cutting board

| # | Statement | Upstream | Port |
|---|---|---|---|
| 38 | Q at a cutting counter holding a Cuttable ingredient (whole Cabbage, Cheese or Tomato) starts cutting. One press is enough; cutting runs on its own. | `S/Counters/Preparation/PreparationCounter.cs:36-40`, `S/Counters/Preparation/AbstractIngredientPreparator.cs:82-86,102-125`, `S/Counters/Preparation/CuttingBoard.cs:33-37` | K |
| 39 | Cutting takes Cabbage 3 s, Cheese 3 s, Tomato 4 s. | `T/Ingredients/Cabbages/Cabbage.asset:21`, `Cheeses/Cheese.asset:21`, `Tomatos/Tomato.asset:21`, `AbstractIngredientPreparator.cs:139-155` | K |
| 40 | A bar over the counter fills from 0 to 1 during the preparation and hides when it completes. It stays visible while paused. | `S/UI/PreparationWorldSpaceCanvas.cs:26,44-46`, `S/UI/PreparationTimer.cs:14-27` | A |
| 41 | Q again during cutting pauses it (progress frozen); Q again resumes. | `AbstractIngredientPreparator.cs:102-107,127-137,40-48` | K |
| 42 | On completion the ingredient is replaced by its Ready (sliced) variant on the board. | `AbstractIngredientPreparator.cs:157-167`, `S/Items/Ingredients/IngredientSettings.cs:24-41` | K |
| 43 | Q with an empty board or an item that is not Cuttable: "Cannot Cut" rises over the counter for 2 s with `SFX_delivery_fail01`; nothing changes. | `AbstractIngredientPreparator.cs:109-116`, `S/UI/PreparationWorldSpaceCanvas.cs:48-52`, `P/Counters/PreparationsCounters/CuttingCounter/CuttingBoard.prefab` (text override), `P/UI/Preparations/PreparationWorldSpaceCanvas@ShowIngredientRejectedText.anim` | K |
| 44 | While cutting, a chop sound (random of 3) plays every 0.25 s and the knife animates. | `P/Counters/PreparationsCounters/CuttingCounter/CuttingBoard@Cutting.anim` (12 events), `CuttingBoard.cs:31`, `S/Counters/Preparation/CounterKnife.cs:20` | K |
| 45 | The knife lies on an empty board, is hidden when an item is put on the board, is shown while cutting, hidden again while cutting is paused, and shown again when the item is removed. | `CuttingBoard.cs:42-55` | K |

### F. Stove

| # | Statement | Upstream | Port |
|---|---|---|---|
| 46 | Q at a stove counter holding raw Meat starts cooking; it takes 6 s, with the same bar as 40. | `S/Counters/Preparation/Stove.cs:48-52,54-58`, `T/Ingredients/Meats/Meat.asset:21` | K |
| 47 | While cooking: looping sizzle sound, sizzle particles, pan animation. | `Stove.cs:60-64`, `S/Counters/Preparation/FryingPan.cs:17-21`, `Stove@Heatting.anim` | K |
| 48 | Q during cooking pauses it (sizzle and particles stop); Q again resumes. | `Stove.cs:66-70`, `AbstractIngredientPreparator.cs:102-107` | K |
| 49 | On completion the meat becomes Cooked and a burn sequence starts at once. | `Stove.cs:72-76` | K |
| 50 | Burn sequence, measured from completion: 0 s heater flashes; 2 s burn animation starts and a warning icon blinks 3 times (0.8 s on, 0.2 s off) with `SFX_warning01` each time; 5 s animation doubles in speed and the icon blinks 5 times (0.2 s on, 0.2 s off); 7 s the meat becomes Burned and smoke particles start. | `Stove.cs:12,81-113,119-125`, `P/Counters/PreparationsCounters/StoveCounter/Stove/Stove.prefab:265`, `S/Counters/Preparation/PreparationWarning.cs:27-33` | K |
| 51 | Removing the meat during the sequence (into hands or onto a plate) stops it; the meat stays Cooked. | `Stove.cs:141-145` | K |
| 52 | Q during the burn sequence cancels it: the cooked meat stays on the stove and never burns. | `Stove.cs:54-58,127-139` | K |
| 53 | Smoke stops when the burned meat is removed. | `Stove.cs:144`, `FryingPan.cs:29-30` | K |
| 54 | Q with an empty stove or anything other than raw Meat (and not in a burn sequence): "Cannot Cook" for 2 s with `SFX_delivery_fail01`. | `AbstractIngredientPreparator.cs:109-116`, `Stove.prefab` (text override) | K |
| 55 | In the last 20 s of a round all cutting and cooking progresses 1.25 times faster. The burn sequence is not sped up. The factor returns to 1 when time is up. | `AbstractIngredientPreparator.cs:18,150,169-172` | K |

### G. Trash

| # | Statement | Upstream | Port |
|---|---|---|---|
| 56 | Holding an ingredient (any state), facing the trash: it is thrown away with a random trash sound (2 clips) and a 0.52 s shrink, then destroyed. | `S/Items/Trash.cs:32-59`, `P/Items/Trash/Trash@DropItem.anim` | K |
| 57 | Holding a plate with ingredients, facing the trash: only the ingredient added last is removed and thrown away, one per press; its icon is removed; the plate stays in hand. | `S/Items/ItemHandler.cs:64-72`, `S/Items/Plate.cs:44-52` | K |
| 58 | An empty plate cannot be thrown away. | `S/Items/Trash.cs:34-41` | K |

### H. Delivery

| # | Statement | Upstream | Port |
|---|---|---|---|
| 59 | Holding something that is not a plate, facing the delivery counter: "Need Plate!" for 2 s with `SFX_delivery_fail01`; the item stays in hand. | `S/Counters/DeliveryCounter.cs:38-42`, `S/UI/Counters/DeliveryCounterCanvas.cs:29-33` | K |
| 60 | Holding a plate (even empty), facing the delivery counter: the plate leaves the hands and is destroyed with everything on it. | `DeliveryCounter.cs:44-48` | K |
| 61 | Matching: orders are tried in the order they were created. An order matches when the number of ingredients on the plate equals the number of ingredients in its recipe and every ingredient on the plate is in the recipe. The first match is delivered. | `S/Orders/OrderSettings.cs:47-54`, `S/Orders/Order.cs:44-50`, `S/Recipes/RecipeData.cs:44-58` | K |
| 62 | On a match: "+NN Tip!" (two digits) rises for 2.5 s, the ticket flashes for 1 s and is removed, a random success sound (2 clips) plays, the score changes (group J). | `DeliveryCounter.cs:50-55`, `DeliveryCounterCanvas.cs:15,23-27`, `OrderSettings.cs:110-114,139-143`, `S/UI/Orders/OrderTicket.cs:90,94`, `S/UI/Orders/OrderTicketGroup.cs:56,60` | K |
| 63 | No match: "Wrong Plate!" for 2 s with `SFX_delivery_fail02`; the wrong-plate count goes up by one (group J). | `DeliveryCounter.cs:57-60`, `DeliveryCounterCanvas.cs:35-39` | K |
| 64 | 4 s after every plate handed in, right or wrong, a clean plate appears on the plate-stack counter. | `OrderSettings.cs:21,45,145-149`, `S/Items/ItemHolderStack.cs:53-58`, `T/Orders/OrderSettings.asset:22` | K |
| 65 | The delivery counter top shows arrows scrolling across it. | `P/Counters/Delivery/Counter_Delivery.prefab` (`Arrows` quad), `Assets/Shaders/SpriteUVSpeed.shadergraph` | K |

### I. Orders

| # | Statement | Upstream | Port |
|---|---|---|---|
| 66 | The first order is created the moment the countdown ends. | `S/Orders/OrderManager.cs:25-26,37`, `OrderSettings.cs:61,133` | K |
| 67 | After each new order the game waits until fewer than 3 orders are listed, then 15 s more, then creates the next. At most 3 are listed (orders being removed still count for their last second). | `OrderSettings.cs:16,18,124-137`, `T/Orders/OrderSettings.asset:17,19` | K |
| 68 | The recipe is a weighted random pick: Burger 35, Salad Burger 15, X Burger 25, "XSalad" 15, X Salad Burger 10 (sum 100). | `S/Recipes/RecipeSettings.cs:19`, `S/Utils/RandomUtils.cs:14-47`, `T/Recipes/*.asset` | K |
| 69 | An order's waiting time is 30 s per ingredient plus the preparation times the data yields: 60, 127, 93, 130, 160 s for the five recipes (table in 5.6; cooked meat adds 0, see 123). | `S/Recipes/RecipeData.cs:26-35`, `S/Items/Ingredients/IngredientSettings.cs:46-55`, `T/Orders/OrderSettings.asset:18` | K |
| 70 | Each order is a ticket with the recipe's name, one icon per ingredient, and a bar that runs from full to empty over the waiting time. The ticket is 120 px wide per ingredient. Tickets sit in a row at the top left. | `S/UI/Orders/OrderTicket.cs:36-87`, `P/UI/Orders/OrderTicketGroup.prefab` | A |
| 71 | A new order plays `SFX_object_pickup01` (2D). | `S/UI/Orders/OrderTicketGroup.cs:45,58`, `P/UI/Orders/OrderTicketGroup.prefab` | K |
| 72 | When the waiting time reaches 0 the ticket flashes for 1 s and is removed. Nothing else happens: no score change, no count, no sound. | `Order.cs:74-84`, `OrderSettings.cs:104-108`; `OnOrderFailed` has no subscriber; `OrderTicketGroup.cs:59` is never called | K |
| 73 | When time is up no more orders are created and the remaining bars stop. | `OrderManager.cs:38`, `OrderSettings.cs:63-67,116-122` | K |

### J. Score

| # | Statement | Upstream | Port |
|---|---|---|---|
| 74 | Tip = ceiling of (seconds left on the order × the recipe's tip multiplier), in 32-bit floats. Multipliers 0.10, 0.15, 0.12, 0.18, 0.20; largest possible tips 6, 20, 12, 24, 32. | `Order.cs:62-66`, `T/Recipes/*.asset` | K |
| 75 | Score = max(0, sum of tips + 20 × delivered orders − 10 × wrong plates). | `S/Score/ScoreSettings.cs:9-10,29-63`, `T/ScoreSettings.asset:15-16` | K |
| 76 | The HUD shows the score; each change shows "+ N" in green or "- N" in red rising for 2.5 s. A wrong plate at score 0 shows "- 0". | `S/UI/Score.cs:48-68`, `ScoreSettings.cs:41-50` | A |
| 77 | The score panel is hidden during the countdown and shown from its end. | `S/UI/Score.cs:35-36,60-61` | A |

### K. Round clock

| # | Statement | Upstream | Port |
|---|---|---|---|
| 78 | The countdown shows 03, 02, 01 one second apart, each with a pop animation and `SFX_warning01`; one second after 01 the pop and beep fire once more for "00" and, in the same frame, `SFX_countdown_start` plays and the number hides. | `S/Matches/TimeDown.cs:20-35`, `S/UI/CountDown.cs:16,42-53`, `T/MatchSettings.asset:16` | K |
| 79 | Chefs can already move (speed 3) and use E and Q during the countdown. | `S/Players/PlayerManager.cs:23-27`, `S/Players/PlayerMatchController.cs:34-39` | A |
| 80 | The round lasts 120 s. The timer shows mm:ss, updated once a second, with a bar at remaining/120 whose colour follows a gradient. | `S/UI/Timer.cs:21,54-63`, `T/MatchSettings.asset:18`, `P/UI/Timers/Timer.prefab` | A |
| 81 | 100 s into the round (20 s left) "final seconds" start: timer text turns red and pulses with `SFX_warning01` every second; music pitch 1.25; chef speed 8 and a faster dust trail; preparation ×1.25 (55). | `S/Matches/TimeLimit.cs:17-22`, `Timer.cs:65-75`, `S/Musics/BackgroundMusic.cs:13,52-54`, `PlayerMatchController.cs:43-48` | A |
| 82 | At 0: "Times Up!" animates for 3 s with `SFX_timesup`; chefs can no longer act; music pitch returns to 1; then Results opens. | `S/UI/TimesUp.cs:27-34`, `PlayerManager.cs:56-60`, `BackgroundMusic.cs:50`, `P/UI/Timers/TimesUp/TimesUp@Show.anim` | A |

### L. Results

| # | Statement | Upstream | Port |
|---|---|---|---|
| 83 | Results lists "Delivered Orders x NN" with NN × 20, "Failed Orders x NN" with NN × 10, Tips, and Total (the score). | `S/UI/Results.cs:30-45` | A |
| 84 | "New High Score!" shows when the score (as an unsigned integer) is greater than the saved high score, which is then saved. | `Results.cs:50-59`, `S/Serialization/GameDataSettings.cs:21-32` | A |
| 85 | Continue returns to MainMenu. | `Results.cs:61` | A |

### M. Pause and menus

| # | Statement | Upstream | Port |
|---|---|---|---|
| 86 | P (gamepad Start) pauses: time scale 0, so every timer, animation and physics step stops; chef input is disabled; a panel offers Resume, Restart, Sounds, Exit. | `PlayerManager.cs:40,68-71`, `S/UI/Menus/PauseHandler.cs:24-25`, `S/UI/Menus/PauseOptions.cs:21-40`, package `PauseSettings` (4.2) | A |
| 87 | Restart and Exit first ask "You will lose your progress. Are you sure?" with Yes and No. Yes restarts the round or returns to MainMenu. | `S/UI/Menus/PauseCanvas.cs:64-92`, `P/UI/Popups/RestartPopup.prefab`, `ExitPopup.prefab` | A |
| 88 | Sounds panel: sliders "Background Music" and "Sound Effects" (0 to 1, shown as value × 100 with two digits), Reset (default volumes), Back (saves, then closes). | `S/UI/Menus/SoundPopup.cs:28-44`, `P/UI/Menus/SoundPopup.prefab`, `P/UI/Menus/Sound/*.prefab` | A |
| 89 | Menu buttons act 0.2 s after the click; moving between buttons plays `SFX_chop01`, pressing plays `SFX_object_drop02`. | `P/UI/Menus/Button.prefab:125`, `T/UI/MenuData.asset:15-18` | X |
| 90 | The tutorial cannot be paused. | `P/Players/PlayerManager_Tutorial.prefab:17-18`, `PlayerManager.cs:15,40` | A |
| 91 | While anything is being saved a "Saving" panel shows for at least 2 s. | `P/UI/Canvases/SavingCanvas.prefab` (package component, `minimumDisplayTime: 2`) | X |

### N. Sounds (every trigger)

| # | When | Clip(s) | 2D/3D | Upstream | Port |
|---|---|---|---|---|---|
| 92 | Item taken into hands | random of `SFX_object_pickup01`, `02` | 3D | `S/Items/ItemHandler.cs:43` | K |
| 93 | Item dropped on the floor | random of `SFX_object_drop01`, `02` | 3D | `ItemHandler.cs:37` | K |
| 94 | Each chop while cutting | random of `SFX_chop01`, `02`, `03` | 3D | `CounterKnife.cs:20` | K |
| 95 | Cooking | `SFX_pan_sizzle_loop` (7.5 s loop) | 3D | `FryingPan.cs:19,25` | K |
| 96 | Each burn warning blink | `SFX_warning01` | 3D | `PreparationWarning.cs:29` | K |
| 97 | Preparation refused | `SFX_delivery_fail01` | 3D | `PreparationWorldSpaceCanvas.cs:51` | K |
| 98 | Trash | random of `SFX_trash01`, `02` | 3D | `Trash.cs:52` | K |
| 99 | Need Plate | `SFX_delivery_fail01` | 3D | `DeliveryCounterCanvas.cs:31` | K |
| 100 | Wrong Plate | `SFX_delivery_fail02` | 3D | `DeliveryCounterCanvas.cs:37` | K |
| 101 | Order delivered | random of `SFX_delivery_success01`, `02` | 2D | `OrderTicketGroup.cs:60` | K |
| 102 | New order | `SFX_object_pickup01` | 2D | `OrderTicketGroup.cs:58` | K |
| 103 | Countdown tick; final-seconds tick | `SFX_warning01` | 2D | `CountDown.cs:45`, `Timer.cs:74` | K |
| 104 | Countdown end | `SFX_countdown_start` | 2D | `CountDown.cs:51` | K (origin of the clip is an open question, 6.3) |
| 105 | Time up | `SFX_timesup` | 2D | `TimesUp.cs:31` | K (same question) |
| 106 | Tutorial step done | `SFX_delivery_success02` | 2D | `S/UI/TutorialDescription.cs:40` | K |
| 107 | Footsteps while a chef walks (about 6 a second) | random of 4 `SFX_footstep*` | 3D | `_Assets/Animations/Walk.anim` event, `S/Players/PlayerAnimationEventHandler.cs:18` | X |
| 108 | Music | `Music.wav`, 66.8 s loop | 2D | 6 | A |

Never played although present: `SFX_object_drop03`, `SFX_object_pickup03`, `SFX_warning02` (not
referenced by any scene, prefab or asset).

### O. Highlight and markers

| # | Statement | Upstream | Port |
|---|---|---|---|
| 109 | The counter or loose item the active chef faces glows (rim highlight), together with the item lying on that counter; the glow goes when the chef turns away or the item leaves. | `S/Counters/Counter.cs:58-62`; package components on `P/Players/_BasePlayer.prefab` and on every mesh prefab; their earlier source is in git history (4.2) | A |
| 110 | The active chef has a dashed circle under their feet. | `S/Players/Player.cs:29-35`, `P/Players/PlayerModel.prefab` | X |

### P. Chefs, camera, controls (upstream only)

| # | Statement | Upstream | Port |
|---|---|---|---|
| 111 | Two chefs stand in the kitchen (Blue at (−2.75, 0, −4), Green at (3.25, 0, 1.5)); Blue is controlled first; Tab (gamepad shoulders) switches. Each chef keeps what it holds. Red and Yellow chef prefabs exist but are not in any scene. | `Assets/Scenes/Game.unity`, `S/Players/PlayerSettings.cs:24-84`, `T/PlayerSettings.asset:15` | X |
| 112 | Chefs move relative to the camera at 6 m/s (3 during the countdown, 8 in final seconds), stop when anything is within 0.5 m ahead, turn to face their direction, bob while walking and leave a dust trail. The camera is fixed at (0, 27.62, −26.11), pitched about 46°, 20° field of view. | `S/Players/PlayerMotor.cs:33-95`, `P/Players/_BasePlayer.prefab:219-221`, `Assets/Scenes/Game.unity:3303,3308`, `P/MainCamera.prefab:70` | X |

### Q. Tutorial

| # | Statement | Upstream | Port |
|---|---|---|---|
| 113 | The tutorial kitchen has one stove, one cutting counter, one crate each of Meat, Bread and Cheese, one plate counter, the plate stack, the delivery counter, 22 plain counters, no trash, no Cabbage or Tomato. | `Assets/Scenes/Tutorial.unity` | A |
| 114 | At start every counter, the plate and the delivery counter are disabled (E and Q ignore them), the round timer never starts, random ordering is off, and the stove cannot burn. | `S/Tutorials/TutorialManager.cs:53-65,116-122,146-151`, `P/Orders/OrderManager_Tutorial.prefab:49`, `S/Tutorials/Steps/PreparingXBurger/CookingMeatTutorialStep.cs:13` | K |
| 115 | After the countdown, steps run in order with 0.4 s between them. Finishing a step turns its text green, plays a sound and fades the text out at 1.2 per second. | `TutorialManager.cs:22,155-188`, `S/UI/TutorialDescription.cs:15,30-55`, `P/Levels/Tutorials/TutorialManager.prefab:64` | K |
| 116 | Step 1 "Use [move keys] to move the Player." completes after 2 s of movement in total. | `S/Tutorials/Steps/MovePlayerTutorialStep.cs:11-29`, `TutorialManager.prefab:87` | X |
| 117 | Step 2 "Use [Tab] to switch between Players." completes on the first switch. | `S/Tutorials/Steps/SwitchPlayerTutorialStep.cs:8-19` | X |
| 118 | Step 3 "Orders are received on the top left corner." creates one X Burger order that never runs down, and completes after 3 s. | `S/Tutorials/Steps/ShowOrderTutorialStep.cs:18-26`, `TutorialManager.prefab:113` | A |
| 119 | Step 4 "Cooking a Meat" (title "Cooking a Cheese Burger" shown): after 2 s the Meat crate is enabled with a bouncing arrow over it and "Collect a Meat using [E]"; then the stove with "Place the Meat over the Stove using [E]"; then "Start cooking using [Q]"; the step completes when cooking starts. Each sub-goal disables the counter just used. | `CookingMeatTutorialStep.cs:9-77`, `TutorialManager.cs:70-108` | A |
| 120 | Step 5 "Cutting the Cheese": same pattern with the Cheese crate, the board, "Place the Cheese over the Cutting Board using [E]", "Start cutting using [Q]". | `S/Tutorials/Steps/PreparingXBurger/CuttingCheeseTutorialStep.cs:9-75` | A |
| 121 | Step 6 "Plating Ingredients": "Collect a Bread using [E]"; then the plate and its counter are enabled, "Place the Bread over the Plate using [E]"; if the chef is not holding the plate, "Get the Plate using [E]"; then two arrows (stove and board) and "Plate the other Ingredients."; when cooked meat and sliced cheese are both on the plate, the delivery counter is enabled with "Delivery your order!"; delivering completes the tutorial. Chef switching is locked from the bread until the delivery prompt. | `S/Tutorials/Steps/PreparingXBurger/PlatingTutorialStep.cs:19-158` | A |
| 122 | Completing the tutorial opens Results with the tutorial's own score (20 + tip 12 = 32, because the order never ran down), which can become the saved high score. | `TutorialManager.cs:167-174`, `Results.cs:50-59` | A |

### R. Edge cases and quirks (all literal upstream behaviour)

| # | Statement | Upstream | Port |
|---|---|---|---|
| 123 | Cooked meat adds 0 s to an order's waiting time, because the Meat collection lists Cooked before Raw and "previous variant" of the first entry is itself. Raw meat's 6 s is never added. | `T/Ingredients/Meats/_Meats.asset:16-19`, `S/Items/Ingredients/IngredientDataCollection.cs:20-34` | K |
| 124 | Two recipes show the same name: asset `XSalad` (bread, cheese, cabbage, tomato) is named "Salad Burger", the same as `SaladBurger`. | `T/Recipes/XSalad.asset:15`, `SaladBurger.asset:15` | K, see 10.3 item 9 |
| 125 | Matching ignores how often an ingredient appears: bread + cheese + cheese is accepted as an X Burger, meat + meat as a Burger. | `S/Recipes/RecipeData.cs:44-58` | K |
| 126 | A plate takes any number of non-bread ingredients, including repeats. | `S/Items/Plate.cs:24-42` | K |
| 127 | Once a plate has held bread it refuses bread for the rest of its life, even after the bread was removed at the trash. | `Plate.cs:16,56` (never cleared in `RemoveLast`, `:44-52`) | K, see 10.3 item 9 |
| 128 | For 1 s after an order is delivered or expires it is still in the list and can be matched again. A second matching plate in that second is paid again from the same order (an expired one pays tip 0 plus 20); upstream then removes the order twice and its ticket code throws. | `OrderSettings.cs:47-54,95-114,139-143`, `OrderTicketGroup.cs:49-54` | K for the match, the double removal becomes a no-op, see 10.3 item 9 |
| 129 | A second item sent to the trash within its 0.52 s animation makes the first one stay behind undestroyed. | `Trash.cs:44-59`, `S/Items/ItemHolder.cs:22-28` | A (fixed, 10.1) |
| 130 | An expired order costs nothing; only wrong plates reduce the score. | 72, 75 | K |
| 131 | The chained one-second waits of the round clock each overshoot by part of a frame, so an upstream round lasts slightly more than 120 s while "final seconds" start at exactly 100 s. | `S/Matches/TimeDown.cs:26-31`, `TimeLimit.cs:19-20` | A (the port's clock is exact) |
| 132 | The preparation and burn timers, order timers and plate returns all stop while paused (they use scaled time). | `AbstractIngredientPreparator.cs:150`, `Order.cs:79`, `Stove.cs:88` | K |
| 133 | Input actions "Dash" (Shift, gamepad east) and "Chop" exist but nothing listens to them. | `T/Inputs/PlayerInputActions.inputactions`, `S/Players/Inputs/PlayerInputSettings.cs:11,74` | X |
| 134 | When time is up, preparations in progress keep running for the 3 s of "Times Up!" and are then lost with the scene. | `TimesUp.cs:29-34` | A |
| 135 | Holding a plate, facing a loose ingredient on the floor: nothing happens. A loose ingredient can only be picked up with empty hands. | `S/Items/ItemHandler.cs:53-62,80-84` (an ingredient is neither a holder nor a transfer target) | K |
| 136 | Q does not depend on what the chef holds, and Q on anything other than a cutting or stove counter does nothing. | `S/Items/ItemHandler.cs:47-51` | K |
| 137 | A disabled counter, plate or delivery counter is ignored by E and Q as if it were not there, except that it still blocks dropping on the floor in front of it. | package `TryGetEnabledComponent` (4.2), `S/Items/ItemHandler.cs:32` | K |

---

## 3. State and timing

### 3.1 The one structural change: a pausable game clock and deadlines instead of coroutines

Upstream keeps time in coroutines (`WaitForSeconds`, per-frame `Time.deltaTime` sums) on one
machine. None of that survives a referee change, and space state cannot be written every frame (one
20-per-second bucket, plan "Facts"). The port therefore keeps time as numbers in synced state:

- **Game clock** `G`: seconds of scaled game time. `G = serverNow − epoch` while running and a frozen
  value while paused; on resume `epoch` moves forward by the pause length. `serverNow` is
  `Networking.GetServerTimeInSeconds()` (the relay `clock` op). This reproduces `Time.timeScale = 0`
  for everything at once (checklist 86, 132).
- Every upstream wait becomes a **deadline in `G`** stored in the leaf of the behaviour that owns
  it, and the referee's `Update()` (20 Hz) fires whatever is due. A new referee reads the same
  deadlines and carries on.
- Every upstream per-frame sum becomes **(accumulated, rate, since)**: value at time `G` is
  `acc + rate × (G − since)`; the referee rewrites the triple whenever the rate changes (pause,
  resume, the ×1.25 booster starting or ending).
- Each client draws bars, blinks and countdown digits from those numbers locally at its own frame
  rate. Nothing visual is written to state per frame.

Consequence: events land on a 50 ms grid on the referee instead of the first frame after the time
has passed. Upstream itself is frame-rate dependent (checklist 131), so this is within its own
spread.

### 3.2 All game state

"Writer" is who changes it in the port. Chefs never write kitchen state: they send an intent
(one-shot, `SendCustomNetworkEvent` to the referee) and the referee applies the upstream rule and
writes the result. If the acting chef is the referee the intent is handled locally.

| State | Upstream holder | Port leaf (under `pk1.coop-kitchen.<inst>.v.`) | Writer | Synced |
|---|---|---|---|---|
| Phase (lobby, countdown, round, times-up, results, tutorial) | which scene is loaded; `MatchSettings.IsAllowToStartTimeLimit` (`S/Matches/MatchSettings.cs:11`) | `match`: `{phase, mode, t0, len, final, paused, epoch, frozenG}` | referee | yes |
| Countdown and round time | coroutine locals (`S/Matches/TimeDown.cs:22`, `TimeLimit.cs:19`) | derived from `match.t0` and `G` | referee sets `t0` once | derived |
| Open orders | `OrderSettings.orders` (`S/Orders/OrderSettings.cs:31`), each `Order` = recipe + `waitingTime` + cancel token (`S/Orders/Order.cs:31-34`) | `orders`: `{list: [{id, r, born, wait, st, at, left}], next: {armed, at}, plates: [G…], rng: {seed, n}}` | referee | yes |
| Order cadence | `OrderingRoutine` position (`OrderSettings.cs:126-137`) | `orders.next` (`armed` = the 15 s has started, `at` = when it ends) | referee | yes |
| Order removal after 1 s | `RemoveRoutine` (`OrderSettings.cs:139-143`) | `st` and `at` on the order; removed when `G ≥ at + 1` | referee | yes |
| Plate returns after 4 s | `ReturnPlateRoutine` (`OrderSettings.cs:145-149`) | `orders.plates` (list of due times) | referee | yes |
| Score | `ScoreSettings.Tips`, `FailedDeliveries`, `SuccessfulDeliveries`, `Score` (`S/Score/ScoreSettings.cs:15-19`) | `score`: `{tips, ok, bad}`; total derived | referee | yes |
| What every holder holds | `ItemHolder.CurrentItem` (`S/Items/ItemHolder.cs:18`) on 28 counter tops, the trash, each chef | `kitchen.holders`: holder key to item id | referee | yes |
| Items | scene objects: `Ingredient.data` (`S/Items/Ingredients/Ingredient.cs:12`), `Plate.Ingredients` and `hasBread` (`S/Items/Plate.cs:16,20`), plate stack order (`S/Items/ItemHolderStack.cs:15`), transform of loose items | `kitchen.items`: id to `{k, where, pos?, ings?, bread?}`; `kitchen.stack`: ids bottom to top | referee | yes |
| Preparation | `IsPreparing`, `IsPaused`, coroutine-local `currentTime`, `preparationBooster` (`S/Counters/Preparation/AbstractIngredientPreparator.cs:38-54,141`) | `prep.<counter>`: `{st, acc, rate, since, dur}` | referee | yes |
| Burn sequence | `IsBurning`, `IsAbleToBurn`, coroutine position (`S/Counters/Preparation/Stove.cs:14-18,81-99`) | `prep.<counter>.burnFrom` (G at which cooking completed) or null; `canBurn` | referee | yes |
| Enabled flags (tutorial gating) | `IsEnabled` on counters, plate, delivery counter (`S/Counters/Counter.cs:26-30` and others) | `tutorial.enabled` (bit per counter) | referee | yes |
| Tutorial progress | `TutorialManager.currentIndex` (`S/Tutorials/TutorialManager.cs:38`), step flags (`S/Tutorials/Steps/PreparingXBurger/PlatingTutorialStep.cs:16-17`), arrows, text | `tutorial`: `{step, sub, meat, cheese, arrows, text}` | referee | yes |
| Who is cooking | `PlayerSettings.players`, `Current` (`S/Players/PlayerSettings.cs:15-18`) | `roster`: uid to slot (new, no upstream equivalent beyond "a chef exists") | referee, from join and leave intents | yes |
| Which hand shows the held item, hover highlight, volume | not applicable / `HighlighterContainer` state / mixer volumes | not synced | each client | no |
| High score and volumes | `GameData` (`S/Serialization/GameData.cs:9-13`) on disk | `localStorage` `pk1.coop-kitchen.<inst>.<uid>.` | each client | no |
| Best score of this kitchen (new, optional) | none | `match.best` | referee | yes |

All kitchen contents live in **one** leaf (`kitchen`) rather than one leaf per counter, so that a
transfer between two holders is a single write and nobody ever sees an item in two places or in
none. Estimated size with a 48-item pool: under 3 KB of JSON against the 16,384-byte leaf limit.
Total leaves per instance: about 11 (`ref`, `match`, `orders`, `score`, `kitchen`, `prep.*` × 4,
`tutorial`, `roster`), far below the 2,048-key room limit. No networked objects are needed (8.3).

Write rate: one or two leaf writes per player action, one per order event, one per phase change.
Four chefs acting flat out stay well inside 20 writes a second; the runtime's per-tick coalescing
covers bursts.

### 3.3 Every timer

"Synced deadline" means a `G` value in state that a new referee can resume. "Local" means a cosmetic
each client runs for itself from an event.

| Timer | Value | Upstream | Port |
|---|---|---|---|
| Delay before countdown | 0.2 s | `S/Matches/MatchManager.cs:12` | folded into `match.t0` |
| Countdown | 3 ticks of 1 s | `T/MatchSettings.asset:16`, `S/Matches/TimeDown.cs:16,26-31` | derived from `t0` |
| Round | 120 s | `T/MatchSettings.asset:18` | derived; setting `round` |
| Final seconds | last 20 s | `T/MatchSettings.asset:19`, `S/Matches/TimeLimit.cs:19-20` | derived |
| Next order | 15 s after there is room | `T/Orders/OrderSettings.asset:19`, `S/Orders/OrderSettings.cs:128-135` | synced deadline |
| Order waiting time | 60 / 127 / 93 / 130 / 160 s | 5.6 | `born + wait` |
| Order stays after delivery / expiry | 1 s / 1 s | `T/Orders/OrderSettings.asset:20-21` | synced deadline |
| Plate return | 4 s | `T/Orders/OrderSettings.asset:22` | synced deadline |
| Cutting | 3 / 3 / 4 s, ×1.25 in final seconds | 5.6, `AbstractIngredientPreparator.cs:150` | (acc, rate, since) |
| Cooking | 6 s, ×1.25 in final seconds | same | (acc, rate, since) |
| Burn sequence | 2 s, then 3 × (0.8 + 0.2) s, then 5 × (0.2 + 0.2) s = 7 s; blinks at 2, 3, 4, 5, 5.4, 5.8, 6.2, 6.6 s | `S/Counters/Preparation/Stove.cs:88-94,101-113`, `Stove.prefab:265` | `burnFrom`; blinks and beeps local |
| Trash animation | 0.517 s | `P/Items/Trash/Trash@DropItem.anim` | local (item is gone from state at once) |
| Crate door | 0.333 s | `IngredientCounter@Open.anim` | local |
| Chop sounds | every 0.25 s while cutting | `CuttingBoard@Cutting.anim` events | local |
| Need Plate / Wrong Plate / Cannot … | 2 s | the three `.anim` clips | local |
| Tip text / score delta | 2.5 s | `DeliveryCounterCanvas@ShowTipText.anim`, `Score@ShowDelta.anim` | local |
| Times Up | 3 s, then results | `TimesUp@Show.anim`, `S/UI/TimesUp.cs:29-34` | synced (phase change 3 s after time is up) |
| Tutorial: between steps / lead-in / read / fade | 0.4 s / 2 s / 3 s / about 0.83 s | `TutorialManager.prefab:64,113`, `Invoke(…, 2F)` in the three step files, `S/UI/TutorialDescription.cs:15,50` | synced deadlines |
| Loader wait, scene fade, saving panel, button delay | 4 s, 0.2 + 0.5 s, 2 s, 0.2 s | checklist 2, 5, 91, 89 | not ported |

### 3.4 Random numbers

There is exactly one gameplay roll: the recipe of each new order (`S/Utils/RandomUtils.cs:22`,
`Random.value`, inclusive 0 to 1). `WeightedRandom` builds the running totals 0, 35, 50, 75, 90, 100
as floats, multiplies the roll by 100 and binary-searches the first five totals; the result is
Burger for [0, 35), Salad Burger for [35, 50), X Burger for [50, 75), XSalad for [75, 90) and
X Salad Burger for [90, 100] (`RandomUtils.cs:14-47`).

In the port the **referee rolls**, from a small seeded generator whose seed and draw count are in
the `orders` leaf (`rng`), so a new referee continues the same sequence and Node tests are
repeatable. Nothing is hidden from players, so no commit-and-reveal is needed.

The "random of N" sound picks (`AudioSourceDictionary.PlayRandom`, seven call sites) are cosmetic:
each client picks for itself.

### 3.5 Saved data

Upstream saves one object through the persistence package: `GameData {Language, HighScore, Audio,
CreationTime, LastUpdateTime}` (`S/Serialization/GameData.cs:9-13`), file name "GameData"
(`S/Serialization/GameDataSettings.cs:19`), settings in `T/Serialization/PersistenceSettings.asset:15-21`
(serializer 1, compressor 0, cryptographer 0, slot "SaveSlot", raw file on). It is written when a
new high score is reached (`S/UI/Results.cs:57-58`) and when the Sounds panel is closed
(`S/UI/Menus/SoundPopup.cs:28-34`). `Language` is never set to anything but the empty string.
That settings asset also contains a hard-coded `cryptographerKey` (`:18`). With `cryptographer: 0`
I read it as unused (not confirmed against the package source). It is not copied into the port or
this file.

Port: high score and the two volumes go to `localStorage` under `pk1.coop-kitchen.<inst>.<uid>.`
(README "Persistence"), so they are per device and per world, not per account. A co-op score is a
team result, so the results board also shows the kitchen's best since it was last reset (`match.best`,
kept in room state for 24 h).

---

## 4. Dependency census

### 4.1 Unity and .NET API used by the 100 handwritten files

Counts are occurrences in `Assets/Scripts` without the generated `PlayerInputActions.cs`.
"Gap" means the README contract has no equivalent today.

| API | Count | Files | Port equivalent |
|---|---|---|---|
| `StartCoroutine` / `StopCoroutine` / `StopAllCoroutines` | 16 / 2 / 1 | AbstractIngredientPreparator, Stove, Trash, MatchSettings, OrderSettings, Loader, AbstractTutorialStep, MovePlayerTutorialStep, TutorialManager, TimesUp | deadlines in synced state fired from `Update()` (3.1); `SendCustomEventDelayedSeconds` only for local cosmetics |
| `new WaitForSeconds` / `WaitUntil` / `WaitWhile` / `yield return null` loops | 10 / 1 / 1 / 5 | Stove, TimeDown, TimeLimit, OrderSettings, Loader, TutorialManager, Trash, AbstractIngredientPreparator, Order, MovePlayerTutorialStep, TutorialDescription, AnimationExtension | same |
| `Invoke(nameof(…), t)` | 5 | MatchManager, ShowOrderTutorialStep, CookingMeatTutorialStep, CuttingCheeseTutorialStep, PlatingTutorialStep | same |
| `Time.deltaTime` | 5 | AbstractIngredientPreparator, Order, PlayerMotor, MovePlayerTutorialStep, TutorialDescription | game clock `G` (3.1); PlayerMotor and MovePlayer not ported |
| `Time.timeScale` | 2 (plus the pause package) | PauseCanvas | game clock pause; a snippet cannot stop world time |
| `Random.value` | 1 | RandomUtils | referee generator (3.4) |
| `Instantiate` | 6 | IngredientData, IngredientDataNew, ItemHolderStack, IngredientIcons, OrderTicket, OrderTicketGroup | pooled kit objects shown with relay `active` (8.3); three fixed ticket slots; icons as TextMeshPro sprite tags |
| `Destroy` / `DestroyImmediate` / `DontDestroyOnLoad` | 9 / 2 / 2 | DeliveryCounter, AbstractItem, ItemHolder, TutorialManager, IngredientIcons, OrderTicketGroup, BackgroundMusic, GameDataManager | return to pool; the rest is not needed in one kit |
| `FindObjectOfType` / `FindObjectsOfType` / `FindObjectsByType` | 5 / 1 / 2 | TutorialManager, ShowOrderTutorialStep, PlayerSettings, TutorialIngredientCounters | `bindings.json` `$beh` references written by the kit builder |
| `GetComponent`, `GetComponentInChildren`, `GetComponentInParent`, `GetComponentsInChildren` | 44 / 29 / 2 / 1 | almost every component, nearly all inside the 36 editor `Reset()` hooks | `bindings.json` fields; three runtime uses need explicit bindings: `AbstractIngredientPreparator.cs:65`, `S/UI/PreparationWorldSpaceCanvas.cs:24`, `S/Items/ItemHolder.cs:109` |
| `Camera.main` | 2 | PlayerMotor, RotateTowardsCamera | billboards use the local head position, or are fixed |
| `Physics.Raycast`, `Rigidbody.MovePosition`, `isKinematic`, `detectCollisions` | 1 / 1 / 1 / 1 | PlayerMotor, CollectableBody | platform locomotion; items are state, not rigid bodies |
| `Transform.SetParent` / `SetPositionAndRotation` / `SetLocalPositionAndRotation` / `LookAt` / `Rotate` | 3 / 1 / 2 / 2 / 1 | CollectableBody, IngredientIcons, PlatedIngredient, PlayerMotor, RotateTowardsCamera, RotateTowardsBack | `BS.GameObject` transform and hierarchy methods (SDK `Docs/javascript-api/gameobject-api.md`); `RotateTowardsBack` is baked by the kit builder |
| Legacy `Animation`: `Play` / `Stop` / `isPlaying` / `animation[name].speed` | 18 / 4 / 2 / 1 | IngredientCounter, AbstractIngredientPreparator, Stove, Trash, CountDown, DeliveryCounterCanvas, OrderTicket, PreparationWorldSpaceCanvas, Score, Timer, TimesUp, AnimationExtension | **Gap.** The relay has Animator ops only. All 22 gameplay clips are legacy (`m_Legacy: 1`). See 5.4 |
| Animation events | 13 in 2 clips | `CuttingBoard@Cutting.anim` (12 × `PlayCutSound`), `Walk.anim` (`PlayFootstepSound`) | script timer (0.25 s chop); footsteps not ported |
| `Animator.SetBool` | 1 | PlayerAnimator | relay `animBool`; the chef model is not ported |
| `AudioSource.Play` / `PlayOneShot` / `Stop` / `pitch` | 9 / 2 / 1 / 2 | FryingPan, PreparationWarning, CountDown, DeliveryCounterCanvas, OrderTicketGroup, PreparationWorldSpaceCanvas, Timer, TimesUp, TutorialDescription, BackgroundMusic | `BS.AudioSource` `Play()`, `PlayOneShot(index)` with `{"$clip": n}`, `pitch` property (SDK `Docs/components/audio.md`). **`Stop` is not documented** for `BS.AudioSource`: stop the sizzle loop by toggling a play-on-enable child with relay `active` |
| `ParticleSystem.Play` / `Stop` | 4 | FryingPan | relay `particles` |
| `GameObject.SetActive` | 15 | CounterKnife, Player, PlayerMatchController, PlayerSettings, TutorialManager, CountDown, Results | relay `active` |
| `Canvas.enabled`, `CanvasGroup.alpha`, `.interactable` | 6 / 6 | PreparationTimer, Score, Timer, TutorialDescription, SoundPopup | relay `active`; the fade needs a tween (gap below) |
| `TMP_Text.text` / `.color` | 14 / 5 | CountDown, DeliveryCounterCanvas, OrderTicket, Results, Score, Timer, TutorialDescription | relay `text`, colours as rich-text tags inside the string |
| `Slider.value` / `minValue` / `maxValue` | 7 | OrderTicket, PreparationTimer, Timer | **Gap.** Up to eight bars run at once (3 orders, 4 preparations, the round timer). Needs a bar or tween op in the generated per-frame graph, or the SDK's `KitProgressBar` on a `UIPanel` (SDK `Docs/components/ui-kit.md`) |
| `Image.sprite`, `SpriteRenderer.sprite` / `.enabled`, `RectTransform.sizeDelta` | 3 / 3 / 2 | IngredientIcon, IngredientCounter, PreparationWarning, OrderTicket | sprite tags in text; relay `active` for the warning icon; ticket width fixed |
| `Button.onClick.AddListener` / `RemoveListener` | 20 | MainMenuOptions, PauseOptions, SoundPopup, Results | `bindings.events` kind `uiButton` or `click` |
| Input System (`InputAction`, `Gamepad.current`, generated wrapper) | 10 uses + 638 generated lines | PlayerInputSettings, PlayerInputActions | `click`, `grab`, `drop`, `trigger-enter` events (SDK `Docs/javascript-api/gameobject-api.md:181-237`) |
| `Mathf.Abs` / `Approximately` / `CeilToInt` / `Max` / `Sign` | 2 / 2 / 1 / 2 / 1 | PlayerMotor, RotateTowardsBack, Order, ScoreSettings, IngredientDataCollection | `Math.*`, with `Math.fround` where C# works in 32-bit floats (7, hard part of `Order.ts`) |
| `string.Format`, `ToString("D2")`, `TimeSpan.ToString(@"mm\:ss")` | 3 / 1 / 1 | DeliveryCounterCanvas, Results, CountDown, Timer | small formatter |
| `DateTime.Now` | 2 | GameData, GameDataSettings | `Date` (only stored, never shown) |
| `async` / `await` | 2 methods | GameDataSettings | plain `localStorage` calls |
| `CancellationTokenSource` | 2 | Order | a state value on the order |
| C# `event` declarations / `?.Invoke` | 42 / 43 | 20 files | plain callbacks inside one client; they are not network events |
| `ScriptableObject` types (`CreateAssetMenu`) and their assets | 12 types, 27 assets | `T/**` | data in `bindings.json` (`behaviours[].fields`) |
| `DefaultExecutionOrder(-1)` | 7 | the seven `*Manager` components | explicit start order in the bootstrap |
| `Debug.LogError` | 3 | IngredientSettings, RecipeSettings | `console.error` |
| `System.Linq.ElementAt` | 1 | PlayerSettings | not ported |
| `Dictionary<IngredientData, …>` keyed by asset | 2 | RecipeData | key by index 0 to 9; upstream's `Equals` is name + status and the default hash is per asset, so identity and (name, status) coincide for the ten assets |

Not used anywhere in game code: `PlayerPrefs`, `Resources.Load`, `UnityEngine.SceneManagement`
(scene loads go through the package), Addressables, Timeline, Newtonsoft JSON, networking of any
kind. No UnityEvent is wired in the editor: there is not one persistent call in any prefab or scene
(searched for `m_MethodName`), so every event link is in code.

### 4.2 The `com.actioncode.*` packages (point b)

**What is available.** The registry is offline and no package copy is in the working tree. Two
sources of truth exist all the same:

1. **This repo's history.** Commit `773181e` (2023-06-15, "Move Scripts into Packages: Visual
   Effects and Physics scripts were moved into its dedicated packages") deleted six scripts and a
   shader graph from the game and replaced them with package references. Their source is readable
   at the parent commit, for example `git show 773181e^:Assets/Scripts/Physics/BoxDetector.cs`.
   The four component GUIDs did not change in the move (`BoxDetector` to `BoxCaster` is still
   `2e8761bdaf275ed41a517c7785096874` in `P/Players/_BasePlayer.prefab`), so the prefabs still
   describe the same components.
2. **The author's GitHub account.** On 2026-11-24 `github.com/HyagoOliveira` listed public MIT
   repositories `Physics`, `PauseSystem`, `AudioSystem`, `Persistence`, `SceneManagement`, `UI`,
   `UISystem`, `VisualEffects`, `Shapes`, `ColliderAdapter`, `Cryptography`, `Async-IO`,
   `Attributes`, `ScriptableSettingsProvider`, `AwaitableSystem`. Refs named after the pinned versions
   exist where I looked: `Physics` 0.2.0, `PauseSystem` 1.1.0, `AudioSystem` 3.0.0. I read three
   files there to confirm behaviour (marked "confirmed on GitHub" below). I did not check the other
   repositories or tags. **Not determined:** whether `UI` or `UISystem` is `com.actioncode.ui`
   4.1.1, and whether `AwaitableSystem` is the renamed `awaitable-coroutines`.

So the behaviour need not be guessed. None of it can be shipped as C# anyway; the table says what
the port re-implements in TypeScript or in the kit.

| Package | What game code calls | Behaviour | Port |
|---|---|---|---|
| **audio** 3.0.0 (`ActionCode.Audio`) | `AudioSourceDictionary.PlayRandom()` at `S/Counters/Preparation/CounterKnife.cs:20`, `S/Items/ItemHandler.cs:37,43`, `S/Items/Trash.cs:52`, `S/Players/PlayerAnimationEventHandler.cs:18`, `S/UI/Orders/OrderTicketGroup.cs:59,60`. Seven component instances in five prefabs, each with a `source` and a clip list (5.5) | Confirmed on GitHub (`AudioSystem` 3.0.0, `Runtime/Gameplay/AudioSourceDictionary.cs`): `source.PlayOneShot(Dictionary.GetRandomClip())`, so sounds overlap rather than cut each other off. How the random clip is picked was not visible | `playRandom(clips)`: local random index, `PlayOneShot(index)` |
| | `AudioSettings.Write(ref AudioData)`, `.Load(AudioData)`, `.ResetVolumes()` at `S/Serialization/GameDataSettings.cs:24,41`, `S/UI/Menus/SoundPopup.cs:36`; type `AudioData` in `S/Serialization/GameData.cs:11,15` | Holds and applies the two channel volumes. The settings assets (GUIDs `10b85219…`, `425e57fe…`, `285733a3…`) and the AudioMixer (GUID `0022ba32…`, two groups: one used by every effect source, one by the music) live in the package. **Not determined:** default volumes | Two local volume values in `localStorage`, applied to the kit's audio sources |
| | Prefab-only components: a volume slider binder and a volume label on `P/UI/Menus/Sound/BackgroundGroup.prefab` (`settings`, `slider`; `settings`, `text`, `multiplier: 100`, `format: D2`) | UI glue | Board buttons, see 8.5 |
| | `audioSource.SetSpatialBlendTo2D()` at `S/Musics/BackgroundMusic.cs:23` | editor `Reset()` only | none |
| **pause-system** 1.1.0 (`ActionCode.PauseSystem`) | `PauseSettings.Pause()` (`S/Players/PlayerManager.cs:68`), `.Resume()` (`S/UI/Menus/PauseCanvas.cs:62`), events `OnPaused` / `OnResumed` (`PlayerManager.cs:35-36`, `S/UI/Menus/PauseHandler.cs:14-15`). The settings asset is in the package (GUID `6e6d477e…`) | Confirmed on GitHub (`Runtime/Settings/PauseSettings.cs` at 1.1.0): `Pause()` raises `OnPaused`, sets `IsPaused`, and sets `Time.timeScale = 0` when `StopTimeScale` (default true); `Resume()` restores 1 and raises `OnResumed` after the next fixed update. The value of `StopTimeScale` in the shipped asset is not visible, but `PauseCanvas.cs:84,90` resets the scale to 1 before leaving, which agrees | Game clock pause (3.1) |
| **persistence** 2.2.0 (`ActionCode.Persistence`) | `PersistenceSettings.Save(data, name)` and `.Load<T>(name)`, both awaited (`S/Serialization/GameDataSettings.cs:29,36`); asset `T/Serialization/PersistenceSettings.asset`; a prefab-only "saving" indicator on `P/UI/Canvases/SavingCanvas.prefab` | Serialises one object to a slot file with optional compression and encryption (both off here). **Not determined:** file format and location | `localStorage` (3.5); no saving indicator |
| **physics** 0.2.0 (`ActionCode.Physics`) | `BoxCaster.HasHit` and `BoxCaster.TryGetEnabledComponent<T>(out T)` at `S/Items/ItemHandler.cs:32,49,68,76,82,88,91`; interface `IEnable` (`bool IsEnabled`) as the base of `IItemCollectable`, `IItemCollector`, `IItemDisposer`, `IItemTransfer`, `IInteractable` (`S/Items/Interfaces/*.cs`, `S/_Globals/Interfaces/IInteractable.cs:9`) | Confirmed on GitHub (`Runtime/Casters/AbstractCaster.cs`, `BoxCaster.cs` at 0.2.0) and identical in substance to the pre-package `BoxDetector.cs`: every frame, `Physics.BoxCast` from the object's position along its forward, half extents `size / 2`, `distance`, layer mask `collisions`; `TryGetEnabledComponent` is `HasHit && currentHit.transform.TryGetComponent(out component)` then `return component.IsEnabled`. The lookup is on the hit object only (for an item, the object carrying its Rigidbody), not its parents or children. Serialized on the chef: mask 704 (layers 6, 7, 9), distance 0.8, size 0.5 (`_BasePlayer.prefab:50-52`) | "What am I facing" is replaced by an explicit target chosen by click, grab or touch (8.4). The enabled test stays, as a flag per target |
| **scene-management** 2.0.1 (`ActionCode.SceneManagement`) | `SceneManager.LoadScene(name)` (`S/Scenes/SceneSettings.cs:17-20`), `[Scene]` attribute (`:12-15`); assets `T/Scenes/SceneManager.asset`, `T/Scenes/DefaultSceneTransition.asset` (0.2 s before, 0.5 s after, a fader prefab that lives in the package) | Loads a scene with a fade | Phase changes inside one kit; no fade |
| **shapes** 1.2.0 | Nothing at this commit. Before `773181e` only an editor gizmo used it (`ShapeDebug.DrawCuboid` in `BoxDetector.cs`) | none | none |
| **ui** 4.1.1 (`ActionCode.UI`) | `DelayedButton` (`S/UI/Menus/MainMenuOptions.cs:14-17`, `PauseOptions.cs:11-14`, `SoundPopup.cs:12`, `S/UI/Results.cs:17`; 15 instances, `delay: 0.2`); `Popup` (`MainMenu.cs:11`; base of `SoundPopup`, `SoundPopup.cs:9`, with `Show`, `Hide`, `OnHidden`, virtual `HandleCloseButtonClick`); `ConfirmationPopup` (`PauseCanvas.cs:18-19`, `OnConfirmed`, `OnHidden`, `Show`); `CanvasViewer` (base of `PauseCanvas` and `PauseOptions`, `Show`, `Hide`); `AbstractMenu` (base of `MainMenuOptions`, `BindButtonsEvents`, `UnBindButtonsEvents`). Prefab-only: menu sound players reading `T/UI/MenuData.asset`, a "first selected" helper, a gradient slider on `P/UI/Timers/Timer.prefab` | Show and hide panels, a button whose click fires after a delay, navigation sounds, a slider whose fill colour follows a gradient. Source not read | Board panels toggled with relay `active`; the 0.2 s delay and navigation sounds are dropped (checklist 89); gradient as a colour picked by the script |
| **visual-effects** 1.0.0 (`ActionCode.VisualEffects`) | `HighlighterContainer.Add` / `.Remove` (`S/Counters/Counter.cs:58-62`), `IHighlightable` (`S/Items/Interfaces/IItemCollectable.cs:13`, `S/Items/AbstractItem.cs:30`), `[RequireComponent(typeof(AbstractMaterialController))]` (`S/Counters/Preparation/FryingPan.cs:8`). Prefab-only: a per-renderer highlighter (48 instances in 37 prefabs), a highlighter container (8), and a detector on the chef bound to the box caster. Shader `Lit Highlighter` (GUID `082d22da…`) on 12 materials | From history (`773181e^`): the detector un-highlights the last hit and highlights the new one when the cast's hit changes; the container forwards to its renderers plus any item added to it; the per-renderer component sets float `_Highlight` to 1 or 0 on a shader graph with `_MainTexture`, `_NormalMap`, `_SpecularMap`, `_Highlight`, `_HighlightColor`, `_HighlightPower` (a Fresnel rim added to emission) | Remake the shader (6.4); highlight locally whatever the local chef's hand or pointer targets, with relay `color` |
| **awaitable-coroutines** 1.0.0 (transitive, called directly) | `AwaitableCoroutine.Run(IEnumerator, CancellationToken)` at `S/Orders/Order.cs:54` | Runs a coroutine without a MonoBehaviour and stops it when the token is cancelled | Order waiting time is `born + wait` on the game clock; cancelling freezes `left` |
| async-io, attributes, collider-adapter, cryptography, scriptable-settings-provider (transitive) | Not called by game code | | none |

Importer note: prefabs and assets reference 23 script GUIDs that are neither in the repo nor Unity's
own (21 identified from their serialized fields as ActionCode components or settings, 2 with only an
empty `m_Delegates` list on `P/UI/Menus/Sound/BackgroundGroup.prefab` not identified). The
gameplay-relevant ones are the four whose GUIDs survive from history (`BoxCaster` `2e8761bd…`, the
highlight detector `8a99941e…`, `HighlighterContainer` `06871582…`, the per-renderer highlighter
`fbc7acb0…`) plus `AudioSourceDictionary` `f044027a…`. The importer must write stand-ins for these
too, or the upstream prefabs load with missing scripts and the clip lists are lost.

### 4.3 Other third-party code in the repo

| What | Where | Used by the game | Port |
|---|---|---|---|
| "Code Assist" editor plugin (Merry Yellow), with NetMQ, AsyncIO, NaCl and Serilog DLLs | `Assets/Plugins/CodeAssist/**` (37 files, 0.8 MB) | No (editor only) | never imported; see 6.3 |
| TextMesh Pro essentials (shaders, LiberationSans, EmojiOne sample) | `Assets/TextMesh Pro/**` | fonts and text shaders | use the template project's TextMesh Pro |
| GameCI workflows | `.github/workflows/main.yml`, `activation.yml` | build only | not relevant |

---

## 5. Object model

### 5.1 `Assets/Scenes/Game.unity`

The scene is 50 prefab instances and one empty parent. No instance carries an override other than
its name and transform, so the prefabs below describe everything.

| Root object | Prefab | Position, yaw | Role |
|---|---|---|---|
| `Counters` | (empty object) | origin | parent of `Boundries` and the 34 counter cells |
| `Player_Blue` | `P/Players/Player_Blue.prefab` | (−2.75, 0, −4), 180° | first chef |
| `Player_Green` | `P/Players/Player_Green.prefab` | (3.25, 0, 1.5), 180° | second chef |
| `MainCamera` | `P/MainCamera.prefab` | (0, 27.62, −26.11), pitch about 46°, field of view 20° | fixed camera, audio listener |
| `Floor` | `P/Levels/LevelFloor.prefab` | origin, scale 5 | built-in plane 50 m square, mesh collider, layer Level |
| `Light`, `GlobalVolume` | `P/Levels/LevelLight.prefab`, `LevelGlobalVolume.prefab` | (0, 30, 0) | directional light intensity 2; post-processing (bloom, vignette, tonemapping, colour adjustments) |
| `GameCanvas` | `P/UI/Canvases/GameCanvas.prefab` | screen space | HUD, 5.7 |
| `MatchManager`, `OrderManager`, `ScoreManager`, `RecipeManager`, `IngredientManager`, `PlayerManager`, `GameDataManager` | `P/Levels/*.prefab`, `P/Orders/OrderManager.prefab`, `P/Recipes/RecipeManager.prefab`, `P/Items/Ingredients/IngredientManager.prefab`, `P/Players/PlayerManager.prefab`, `P/GameDataManager.prefab` | origin | one script each, pointing at a settings asset |
| `SavingCanvas` | `P/UI/Canvases/SavingCanvas.prefab` | screen space | "Saving" indicator |

The wall prefabs (`P/Levels/Walls.prefab`, `Walls_Tutorial.prefab`) are in no scene. Baked lightmaps
exist for Game and Tutorial (`Assets/Scenes/Game/`, `Assets/Scenes/Tutorial/`); a kit cannot carry
them.

Counter cells (x right, z away from the camera; cell pitch 1.5 m; "yaw" is rotation about Y; with
these yaws every counter's local +Z side faces the kitchen interior, except the trash, which is
symmetric):

| Side | Cells in order |
|---|---|
| Far row, z = 4, yaw 180°, x from −7.25 to 7.75 | corner `Counter_Corner_01`, `CutCounter_00`, `Counter_Plate_01`, `StoveCounter_00`, `Counter_Normal_05`, `CabbageCounter_00`, `BreadCounter_00`, `TomatoCounter_00`, `MeatCounter_00`, `CheeseCounter_00`, corner `Counter_Corner_00` |
| Near row, z = −6.5, yaw 0°, x from −7.25 to 7.75 | corner `_02`, `CabbageCounter_01`, `BreadCounter_01`, `TomatoCounter_01`, `MeatCounter_01`, `CheeseCounter_01`, `CutCounter_01`, `Counter_Plate_00`, `StoveCounter_01`, `Counter_Normal_01`, corner `_03` |
| Left column, x = −7.25, yaw 90°, z from −5 to 2.5 | `Counter_Normal_08`, `_03`, `_09`, `_10`, `_11`, `_00` |
| Right column, x = 7.75, yaw −90°, z from −5 to 2.5 | `Counter_Normal_02`, `_07`, `TrashCounter` (yaw 0°), `Counter_Normal_06`, `Counter_PlateStack`, `Counter_Delivery` |

`Boundries` (`P/Levels/Boundries.prefab`, layer Boundaries): four box colliders, Left at x −7.5 and
Right at x 8 (2 × 8 × 12 m, z centre −1.25), Forward at z 4.25 and Backwards at z −6.75
(18 × 8 × 2 m). The outer footprint including these walls is 17.5 m by 13 m.

`Assets/Scenes/Tutorial.unity` uses the same ring with: `StoveCounter_00` (−2.75, 4), `CutCounter_00`
(−5.75, 4), `BreadCounter` (1.75, 4), `MeatCounter` (3.25, 4), `CheeseCounter` (4.75, 4),
`Counter_Delivery_Tutorial` (7.75, 2.5), `Counter_PlateStack` (7.75, 1), `Counter_Plate` (6.25, −6.5),
22 plain counters, chefs at (±4, 0, −2), plus `OrderManager_Tutorial`, `PlayerManager_Tutorial`,
`TutorialCanvas` (no timer, no pause, no "Times Up") and `TutorialManager`.

### 5.2 Prefab families (variants inherit downwards)

```
Counter_Base            BoxCollider 1.5 x 1.4 x 1.5 at y 0.7, layer Counters     P/Counters/Counter_Base.prefab:46
  Counter_Corner        + CounterMesh (ClearCounter.fbx)                         no script
    Counter_Normal      + child ItemHolder at y 1.4, HighlighterContainer, Counter
      Counter_Plate     + a Plate_Normal under the ItemHolder
      Counter_PlateStack+ dashed circle sprite, ItemHolderStack on the ItemHolder object
  _BaseIngredientCounter+ child ItemHolder at y 1.4, door / hole / black meshes, door icon sprite,
                          Animation (IngredientCounter@Open), HighlighterContainer, IngredientCounter
    BreadCounter, CabbageCounter, CheeseCounter, MeatCounter, TomatoCounter   (data + icon overrides)
  _BasePreparationCounter + CounterMesh, HighlighterContainer, PreparationCounter
    CutCounter          + CuttingBoard at y 1.4
    StoveCounter        + Stove at y 1.6
  Counter_Delivery      + Arrows quad (SpriteUVSpeed.mat), CounterMesh_Blue, DeliveryCounterUIPivot,
                          DeliveryCounter, HighlighterContainer
    Counter_Delivery_Tutorial
  Trash                 + child ItemHolder at y 1.6, TrashMesh, Animation (Trash@DropItem),
                          AudioSource, AudioSourceDictionary, HighlighterContainer, Trash
_BaseIngredientPreparator  Animation, child ItemHolder, PreparationCounterUIPivot -> PreparationWorldSpaceCanvas
  CuttingBoard          + KnifePivot/CounterKnife (KnifeModel), BoardModel, CuttingBoard
  Stove                 + Warning (StoveWarning), FryingPan (+ two particle systems), StoveMesh (+ StoveHeater), Stove
_BaseItem               Rigidbody (mass 1, gravity), HighlighterContainer, CollectableBody, layer Items
  _BaseIngredient       + Ingredient, layer Ingredients
    Bread, Cabbage, Cabbage_Sliced, Cheese, Cheese_Sliced, Meat, Meat_Cooked, Meat_Burned, Tomato, Tomato_Sliced
  Plate_Normal          + WorldCanvas/IngredientIcons, PlateMesh, BoxCollider 1 x 0.16 x 1, Plate
_BasePlayer             CapsuleCollider r 0.5 h 2, Rigidbody (Y and all rotations frozen), Player, PlayerMotor,
                        PlayerInputHandler, ItemHandler, PlayerMatchController, AudioSource, 2 x AudioSourceDictionary,
                        PlayerModel, Detectors (BoxCaster + highlight detector at y 0.25), ItemHolder at (0, 1.65, 1)
  Player_Blue, Player_Green, Player_Red, Player_Yellow   (type, colour, body material)
```

Item colliders (all on the item root, non-trigger): Bread, Cabbage box 1 × 0.5 × 1; Cabbage_Sliced
1 × 0.1 × 1; Cheese 1 × 0.24 × 0.6; Cheese_Sliced 1 × 0.2 × 1; the three Meats 0.75 × 0.2 × 0.75;
Tomato sphere radius 0.4; Tomato_Sliced 0.8 × 0.2 × 0.8; Plate 1 × 0.16 × 1. Item models are built
for a 1.5 m counter cell: a plate is 1 m across. See the scale note in 8.1.

Stale serialized fields that no script reads any more (to be ignored by the importer):
`orderSettings` on `ItemHolderStack` and `DeliveryCounter` (the tutorial override points at a
deleted asset, GUID `6b182537…`), `ingredientPreparator` on `IngredientCounter`,
`<Name>`/`<Status>`/`<PreparationTime>` backing fields on `Ingredient` (their values disagree with
the data assets, for example Meat 8 and Tomato 6; the code reads the data assets), `dashSpeed` /
`dashTime` (removed), `mainMenu` on `PauseCanvas`, `volumeParamName` on the sound sliders.

### 5.3 Behaviours and what their serialized fields reference

Only gameplay behaviours are listed; menu and save components are in 5.7. "(pkg)" marks an
ActionCode component.

| Behaviour (script) | On | Fields and what they point at |
|---|---|---|
| `Counter` (`S/Counters/Counter.cs:15-16`) | `Counter_Normal` root | `holder` = child `ItemHolder`; `highlightableContainer` = own (pkg) container |
| `IngredientCounter` (`S/Counters/IngredientCounter.cs:11-13`) | crate root | `holder`, `highlightableContainer` as above; `animation` = own `Animation`; `icon` = sprite on the door; `data` = one of `T/Ingredients/Breads/Bread.asset`, `Cabbages/Cabbage.asset`, `Cheeses/Cheese.asset`, `Meats/Meat.asset`, `Tomatos/Tomato.asset` |
| `PreparationCounter` (`S/Counters/Preparation/PreparationCounter.cs:10`) | cut / stove counter root | `holder` = the **board's or stove's** `ItemHolder` (not one of its own); `preparator` = the `CuttingBoard` or `Stove` |
| `CuttingBoard` (`AbstractIngredientPreparator.cs:12-18`, `CuttingBoard.cs:9`) | board root | `matchSettings` = `T/MatchSettings.asset`; `holder` = child `ItemHolder`; `animation` = own (clips Idle, Cutting); `allowedStatus` 4 (Cuttable); `preparatedStatus` 2 (Ready); `ingredientSettings` = `T/Ingredients/IngredientSettings.asset`; `finalSecondsBooster` 1.25; `knife` = `CounterKnife` |
| `Stove` (`Stove.cs:10-12`) | stove root | same base fields with `allowedStatus` 1 (Raw), clips Idle, Heatting, Burning, WaitBurning; `fryingPan`; `warning` = `PreparationWarning`; `timeBeforeBurn` 2 |
| `CounterKnife` (`CounterKnife.cs:10`) | knife model | `audioDictionary` (pkg, chop01 to 03) |
| `FryingPan` (`FryingPan.cs:11-13`) | pan model | `audioSource` (sizzle loop); `sizzlingParticles`; `burnedParticles` |
| `PreparationWarning` (`PreparationWarning.cs:10-11`) | warning sprite | `audioSource` (warning01); `spriteRenderer` (disabled at start) |
| `DeliveryCounter` (`S/Counters/DeliveryCounter.cs:17-19`) | delivery root | `scoreSettings` = `T/ScoreSettings.asset`; `canvas` = `DeliveryCounterCanvas`; `highlightableContainer` |
| `Trash` (`S/Items/Trash.cs:15-17`) | trash root | `holder` = child `ItemHolder`; `animation`; `sourceDictionary` (pkg, trash01 and 02) |
| `ItemHolder` (`S/Items/ItemHolder.cs`) | 10 prefab objects | no serialized fields; takes a child item at `Awake` |
| `ItemHolderStack` (`S/Items/ItemHolderStack.cs:11-12`) | plate-stack holder | `platePrefab` = `P/Items/Plates/Plate_Normal.prefab`; `holder` = same object |
| `Ingredient` (`S/Items/Ingredients/Ingredient.cs:12`, base `S/Items/AbstractItem.cs:14-15`) | each ingredient prefab | `data` = its asset; `collectibleBody`; `highlighterContainer` |
| `Plate` (`S/Items/Plate.cs:13-14`) | `Plate_Normal` | `recipeSettings` = `T/Recipes/RecipeSettings.asset`; `icons` = `IngredientIcons` on its world canvas |
| `CollectableBody` (`S/Physics/CollectableBody.cs:12`) | every item | `body` = its Rigidbody |
| `ItemHandler` (`S/Items/ItemHandler.cs:10-15`) | chef | `holder` = hand `ItemHolder`; `detector` = (pkg) `BoxCaster`; `dropSource`, `pickupSource` (pkg dictionaries) |
| `PlayerMatchController` (`S/Players/PlayerMatchController.cs:10-16`) | chef | speeds 3 / 6 / 8, two particle objects |
| `OrderManager` (`S/Orders/OrderManager.cs:10-13`) | scene | `Settings` = `T/Orders/OrderSettings.asset`; `StartOrderingAfterCountDown` true (false in the tutorial prefab); `matchSettings` |
| `MatchManager`, `ScoreManager`, `RecipeManager`, `IngredientManager` | scene | one `settings` field each: `T/MatchSettings.asset`, `T/ScoreSettings.asset`, `T/Recipes/RecipeSettings.asset`, `T/Ingredients/IngredientSettings.asset` |
| `PlayerManager` (`S/Players/PlayerManager.cs:11-15`) | scene | `T/PlayerSettings.asset`, `T/MatchSettings.asset`, (pkg) pause settings, `T/Inputs/PlayerInputSettings.asset`, `canPause` true |
| `TutorialManager` (`S/Tutorials/TutorialManager.cs:15-24`) | tutorial scene | player and input settings, match and scene settings, title object, `description`, `timeBetweenSteps` 0.4, two arrows, six steps in order (Move, Switch, ShowOrder with `recipe` = `T/Recipes/XBurger.asset` and `timeToRead` 3, CookingMeat, CuttingCheese, Plating) |
| `PreparationWorldSpaceCanvas`, `PreparationTimer` | over each board and stove | `timer`, `animation` (rejected text), `audioSource` (fail01); `slider`, `canvas` |
| `DeliveryCounterCanvas` (`S/UI/Counters/DeliveryCounterCanvas.cs:11-15`) | over the delivery counter | `animation` (three clips), `audioSource` (fail01), `failClip` fail02, `tip` text, `tipFormat` "+{0:D2} Tip!" |
| `RotateTowardsBack` (`S/Utils/RotateTowardsBack.cs`) | UI pivots of board, stove, delivery | none: at start turns the pivot so the text faces the camera side whatever the counter's yaw |
| `RotateTowardsCamera` (`S/Utils/RotateTowardsCamera.cs`) | plate icons | none |

No behaviour has a UnityEvent field. Every link between behaviours is a C# event subscribed in code
(42 event declarations, for example `ItemHolder.OnItemPlaced` / `OnItemReleased`,
`AbstractIngredientPreparator.OnPreparationStarted` / `Updated` / `Completed` / `OnIngredientRejected`,
`TimeDown.OnStarted` / `OnUpdated` / `OnFinished`, `TimeLimit.OnFinalSecondsStarted`,
`OrderSettings.OnOrderCreated` / `Removed` / `Delivered` / `Failed` / `OnPlateReturned`,
`ScoreSettings.OnScoreIncreased` / `Decreased`, `Plate.OnIngredientPlated`,
`IngredientCounter.OnItemCollectedFromInside`).

### 5.4 Animations

One Animator in the game: `Assets/_Assets/Animations/PlayerModel.controller` on the chef model,
states `Idle` (default) and `Walk`, one bool parameter `IsWalking`, transitions both ways in 0.1 s
without exit time. It is not ported.

Everything else is the **legacy `Animation` component** with legacy clips:

| Object | Clips (length, wrap) | Animates | Events |
|---|---|---|---|
| Cutting board | `CuttingBoard@Idle` (pose), `CuttingBoard@Cutting` (2.75 s, ping-pong, 572 KB) | `ItemHolder`, `KnifePivot`, `KnifePivot/CounterKnife` transforms | 12 × `PlayCutSound` at 0, 0.25 … 2.75 s |
| Stove | `Stove@Idle` (pose), `Stove@Heatting` (0.5 s, once), `Stove@WaitBurning` (0.33 s, ping-pong), `Stove@Burning` (0.17 s, ping-pong; speed set to 2 by code) | `FryingPan`, `ItemHolder` transforms, `StoveMesh/StoveHeater` active flag and material `_BaseColor` | none |
| Crate | `IngredientCounter@Open` (0.33 s, once) | `SingleDoor` rotation | none |
| Trash | `Trash@DropItem` (0.52 s, once) | `ItemHolder` position and scale (the item sinks and shrinks) | none |
| Delivery counter text | `…@ShowNeedPlateText` (2 s), `…@ShowTipText` (2.5 s), `…@ShowWrongPlateText` (2 s) | text position and alpha | none |
| Board / stove text | `PreparationWorldSpaceCanvas@ShowIngredientRejectedText` (2 s) | text position and alpha | none |
| Tutorial arrow | `TutorialArrow@Idle` (0.33 s, ping-pong, plays automatically) | sprite position and scale | none |
| HUD | `CountDown@CountDown` (0.98 s), `Score@ShowDelta` (2.5 s), `Timer@FinalSecondsCountDown` (0.5 s), `TimesUp@Show` (3 s), `OrderTicket@Delivered` and `@Failed` (0.5 s, loop), `NewScore@Idle`, `MainMenuLogo@Idle` (6 s), `SavingPanel@Idle` | UI transforms, colours, alpha | none |

The relay's Animator ops cannot drive a legacy `Animation`. Two ways out, to be decided in the kit
builder: (1) convert each legacy clip to a non-legacy copy and generate one Animator Controller per
object with a state per clip and a trigger per state (speed as a float parameter for
`Stove@Burning`), so the existing `animTrigger` / `animFloat` ops are enough; or (2) add relay ops
for `Animation.Play(name)`, `Stop` and state speed, if those members are on the allow-list. Either
way the contract's op table changes or the builder grows a converter. Option 1 keeps the contract
as it is.

### 5.5 Audio sources

Every effect source routes to one mixer group and the music to another; the mixer asset is in the
audio package, so the routing is lost on import and volume has to be applied per source.

| Object | Clip or list | Loop | Space | Min distance |
|---|---|---|---|---|
| Knife (`KnifeModel.prefab`) | list: chop01, chop02, chop03 | no | 3D | 10 |
| Frying pan (`FryingPan.prefab`) | `SFX_pan_sizzle_loop` | yes | 3D | 10 |
| Stove warning (`StoveWarning.prefab`) | `SFX_warning01` | no | 3D | 10 |
| Board / stove text canvas | `SFX_delivery_fail01` | no | 3D | 10 |
| Delivery text canvas | `SFX_delivery_fail01`, one-shot `SFX_delivery_fail02` | no | 3D | 10 |
| Trash | list: trash01, trash02 | no | 3D | 10 |
| Chef (`_BasePlayer.prefab`) | lists: drop01, drop02 and pickup01, pickup02 | no | 3D | 20 |
| Chef model | list: four footsteps | no | 3D | 10 |
| Order ticket group | `SFX_object_pickup01`; lists: success01, success02 and fail01, fail02 (the fail list is never played) | no | 2D | |
| Countdown | `SFX_warning01`, one-shot `SFX_countdown_start` | no | 2D | |
| Timer | `SFX_warning01` | no | 2D | |
| Times Up | `SFX_timesup` | no | 2D | |
| Tutorial text | `SFX_delivery_success02` | no | 2D | |
| Background music | `Music.wav`, plays on awake | yes | 2D | |

With a minimum distance of 10 m and a kitchen 15 m across, the "3D" effects are effectively heard
at full volume everywhere in the upstream kitchen. In a shared world they need a real fall-off
(8.1).

### 5.6 Data assets as tables (point d)

Enums: `IngredientName` None 0, Bread 1, Cabbage 2, Cheese 3, Tomato 4, Meat 5
(`S/Items/Ingredients/IngredientName.cs:3-11`); `IngredientStatus` None 0, Raw 1, Ready 2, Burned 3,
Cuttable 4 (`IngredientStatus.cs:3-10`).

**Ingredient variants** (`T/Ingredients/<folder>/<asset>.asset:15-21`):

| # | Asset | Name | Status | PreparationTime | Icon (`Assets/_Assets/Textures/Icons/`) | Prefab (`P/Items/Ingredients/`) |
|---|---|---|---|---|---|---|
| 0 | `Breads/Bread` | Bread | Ready | 0 | `Bread.png` | `Breads/Bread.prefab` |
| 1 | `Cabbages/Cabbage` | Cabbage | Cuttable | 3 | `Cabbage.png` | `Cabbages/Cabbage.prefab` |
| 2 | `Cabbages/Cabbage_Sliced` | Cabbage | Ready | 0 | `CabbageSlices.png` | `Cabbages/Cabbage_Sliced.prefab` |
| 3 | `Cheeses/Cheese` | Cheese | Cuttable | 3 | `CheeseBlock.png` | `Cheeses/Cheese.prefab` |
| 4 | `Cheeses/Cheese_Sliced` | Cheese | Ready | 1 (never used) | `CheeseSlice.png` | `Cheeses/Cheese_Sliced.prefab` |
| 5 | `Meats/Meat` | Meat | Raw | 6 | `MeatPattyUncooked.png` | `Meats/Meat.prefab` |
| 6 | `Meats/Meat_Cooked` | Meat | Ready | 0 | `MeatPattyCooked.png` | `Meats/Meat_Cooked.prefab` |
| 7 | `Meats/Meat_Burned` | Meat | Burned | 0 | `MeatPattyBurned.png` | `Meats/Meat_Burned.prefab` |
| 8 | `Tomatos/Tomato` | Tomato | Cuttable | 4 | `Tomato.png` | `Tomatos/Tomato.prefab` |
| 9 | `Tomatos/Tomato_Sliced` | Tomato | Ready | 0 | `TomatoSlice.png` | `Tomatos/Tomato_Sliced.prefab` |

**Collections** (`T/Ingredients/<folder>/_*.asset:15-19`), in the order held by
`T/Ingredients/IngredientSettings.asset:15-20`. The order inside a collection matters for the
waiting-time rule ("previous entry", clamped to the first):

| Collection | Name | Entries in order | "Time to prepare" a Ready entry as the code computes it |
|---|---|---|---|
| `_Tomatos` | Tomato | Tomato, Tomato_Sliced | sliced: 4 |
| `_Cheeses` | Cheese | Cheese, Cheese_Sliced | sliced: 3 |
| `_Meats` | Meat | **Meat_Cooked, Meat, Meat_Burned** | cooked: 0 (its own value, it is first) |
| `_Breads` | Bread | Bread | 0 |
| `_Cabbages` | Cabbage | Cabbage, Cabbage_Sliced | sliced: 3 |

**Transitions** (from the status fields of the two preparators and the stove's burn step):

| From | Where | Time | To |
|---|---|---|---|
| Cabbage (Cuttable) | cutting board | 3 s | Cabbage_Sliced |
| Cheese (Cuttable) | cutting board | 3 s | Cheese_Sliced |
| Tomato (Cuttable) | cutting board | 4 s | Tomato_Sliced |
| Meat (Raw) | stove | 6 s | Meat_Cooked |
| Meat_Cooked left on the stove | stove | 7 s after cooking ends | Meat_Burned |

**Recipes** (`T/Recipes/*.asset`), in the order of `T/Recipes/RecipeSettings.asset:15-20`. Position
is the ingredient's local position on the plate in metres at upstream scale, rotation in degrees
about Y:

| # | Asset (lines) | Shown name | Chance | Tip multiplier | Ingredients in asset order, with plate position | Waiting time | Largest tip |
|---|---|---|---|---|---|---|---|
| 0 | `Burger.asset:15-24` | "Burger" | 35 | 0.10 | Bread (0, 0.026, 0); Meat_Cooked (0.048, 0.296, 0) | 2 × 30 + 0 + 0 = 60 s | 6 |
| 1 | `SaladBurger.asset:15-30` | "Salad Burger" | 15 | 0.15 | Bread (0, 0.026, 0); Meat_Cooked (0.048, 0.296, 0); Cabbage_Sliced (0.085, 0.366, −0.173); Tomato_Sliced (0.146, 0.369, 0.117) | 4 × 30 + 0 + 0 + 3 + 4 = 127 s | 20 |
| 2 | `XBurger.asset:15-27` | "X Burger" | 25 | 0.12 | Bread (0, 0.026, 0); Cheese_Sliced (−0.008, 0.22, 0.052) turned 49.18°; Meat_Cooked (0.048, 0.296, 0) | 3 × 30 + 0 + 3 + 0 = 93 s | 12 |
| 3 | `XSalad.asset:15-30` | "Salad Burger" (same text as #1) | 15 | 0.18 | Bread (0, 0.026, 0); Cheese_Sliced (−0.008, 0.22, 0.052) turned 49.18°; Cabbage_Sliced (0.085, 0.28, −0.173); Tomato_Sliced (0.146, 0.32, 0.117) | 4 × 30 + 0 + 3 + 3 + 4 = 130 s | 24 |
| 4 | `XSaladBurger.asset:15-33` | "X Salad Burger" | 10 | 0.20 | Bread (0, 0.026, 0); Cheese_Sliced (−0.008, 0.22, 0.052) turned 49.18°; Meat_Cooked (0.048, 0.296, 0); Cabbage_Sliced (0.085, 0.366, −0.173); Tomato_Sliced (0.146, 0.369, 0.117) | 5 × 30 + 0 + 3 + 0 + 3 + 4 = 160 s | 32 |

`T/Recipes/RecipeSettings_Tutorial.asset` (X Burger only) is referenced by nothing; the tutorial
plate uses the full list.

Which recipe's layout a plate uses (checklist 36), for reference: bread alone, meat alone, or bread
+ meat use #0; anything with cabbage or tomato but no cheese uses #1; cheese with bread and/or meat
uses #2; cheese with cabbage or tomato and no meat uses #3; cheese + meat + (cabbage or tomato)
uses #4.

**Order settings** (`T/Orders/OrderSettings.asset:15-22`; code defaults in
`S/Orders/OrderSettings.cs:16-21` differ where noted):

| Field | Value | Meaning |
|---|---|---|
| `recipeSettings` | `T/Recipes/RecipeSettings.asset` | the five recipes |
| `ingredientSettings` | `T/Ingredients/IngredientSettings.asset` | for waiting times |
| `maxOrders` | 3 | |
| `additionalTimePerIngredient` | 30 (code default 10) | seconds of patience per ingredient |
| `timeByNewOrder` | 15 | seconds between orders once there is room |
| `timeToRemoveAfterFail` | 1 | |
| `timeToRemoveAfterDelivery` | 1 | |
| `timeToReturnPlate` | 4 | |

**Match settings** (`T/MatchSettings.asset:15-19`): countdown 3, time limit 120, final seconds 20.
**Score settings** (`T/ScoreSettings.asset:15-16`): 20 per delivered order, 10 per wrong plate.
**Player settings** (`T/PlayerSettings.asset:15`): first chef Blue.

### 5.7 HUD and menu prefabs

`P/UI/Canvases/GameCanvas.prefab` (screen-space overlay, scaler matches height) holds:
`OrderTicketGroup` (row of `OrderTicket` instances, top left), `Score`, `Timer` (both start with
their canvas disabled), `CountDown`, `TimesUp`, `PauseCanvas` (inactive: `PauseOptions`,
`RestartPopup`, `ExitPopup`, `SoundPopup`, its own `EventSystem`), and the `PauseHandler` script.

Fixed texts found in the prefabs: "Need Plate!", "+{0} Tip!", "Wrong Plate!", "Cannot \nCut",
"Cannot \nCook", "Times Up!", "Pause", "Resume", "Restart", "Sounds", "Exit", "Attention",
"You will lose your progress. \nAre you sure?", "Yes", "No", "Background Music", "Sound Effects",
"Reset", "Back", "Results", "Delivered Orders x {0}", "Failed Orders x {0}", "Tips", "Total:",
"New High Score!", "Continue", "PLAY", "TUTORIAL", "SOUNDS", "CREDITS", "Close", "Saving",
"Cooking a Cheese Burger". Tutorial prompts are built in code (checklist 116 to 121) and embed
TextMeshPro sprite tags for key and button glyphs from `Assets/TextMesh Pro/Resources/Sprite Assets/Buttons.asset`.

A snippet has no screen-space overlay, and VR needs world-space panels anyway. The HUD becomes
boards in the kit (8.5).

---

## 6. Assets

### 6.1 Counts and sizes (everything in the repo)

| Kind | Files | Bytes | Largest | Note |
|---|---|---|---|---|
| Kitchen models `Assets/Meshes/*.fbx` | 23 | 0.8 MB | `Cabbage.fbx` 89,740 B, 1,530 triangles | 9,770 triangles in total; exported from Blender 3.2.1; 3 unused (`CabbageSlice_Flat`, `CounterSolid`, `Counter_Doors`) |
| Kitchen textures `Assets/Meshes/Textures/*.png` | 37 | 35.3 MB | `Meat_Normal.png` 6.0 MB | every one is 2048 × 2048; albedo, metallic-smoothness and normal per material |
| Kitchen materials `Assets/Meshes/Materials/*.mat` | 13 | | | 12 use the highlighter shader, `Knife.mat` uses URP Lit |
| Icons `Assets/_Assets/Textures/Icons/*.png` | 11 | 0.4 MB | `Bread.png` 256 × 234 | `Plate.png` unused |
| UI sprites `Assets/_Assets/Textures/UI/*.png` | 12 | 0.5 MB | `KitchenChaosLogo.png` 1280 × 720, 0.4 MB | `Arrow`, `Cross`, `Tick_Border` unused |
| Sound effects `Assets/_Assets/Sounds/SFX/*.wav` | 24 | 3.2 MB | `SFX_pan_sizzle_loop.wav` 1.3 MB, 7.5 s | 44.1 kHz 16-bit stereo; 3 unused |
| Music `Assets/_Assets/Sounds/Music/Music.wav` | 1 | 18.4 MB | | 48 kHz 24-bit stereo, 66.8 s |
| Other materials `Assets/_Assets/Materials`, `Assets/Materials` | 16 | | | chef colours, floor, walls, particles, glow, trail |
| Animation clips under `P/` (legacy) | 22 | 0.9 MB | `CuttingBoard@Cutting.anim` 0.57 MB | 5.4 |
| Mecanim clips and controller `Assets/_Assets/Animations` | 4 | | | chef idle and walk; `CuttingCounterIdle.anim` unused |
| Shader graphs | 1 in repo, 1 in a package | | | 6.4 |
| Fonts | `LiberationSans.ttf` 0.35 MB, `LiberationSans SDF.asset` 2.3 MB (atlas inside), fallback asset, two material presets (Outline, Drop Shadow) | | | TextMesh Pro essentials |
| Baked lighting | 6 | 5.8 MB | | not usable in a kit |
| Prefabs | 128 | 1.7 MB | | |
| **Unused chef set** `P/Players/Models/**` | 135 (1 FBX, 46 clips, 41 materials, 45 textures, 2 prefabs) | 52.7 MB | `ChefModelTemplate.fbx` 13.2 MB, 162 meshes, 215,619 triangles | referenced by no scene; 6.3 |
| Editor plugin `Assets/Plugins/CodeAssist/**` | 37 | 0.8 MB | | 6.3 |

No texture is larger than 2048 pixels on a side (the unused chef set has 28 more at 2048 × 2048 and
12 at 1024 × 1024, none larger).

What the five build scenes actually reach: 20 of the 23 models, all 37 kitchen textures, 10 icons,
9 UI sprites, 21 sound effects and the music.

### 6.2 What the kit needs and what to do to it for Quest

| Asset | Action |
|---|---|
| 20 models, 9,770 triangles before pooling | use as they are; with a 48-item pool the worst case on screen stays under about 60,000 triangles |
| 37 textures at 2048² | reduce to 512² (models are at most 1.5 m across); several metallic and normal maps are under 30 KB as PNG at 2048², so are nearly constant and can become material constants. **Not determined** without opening them: which exactly |
| Icons | pack the 10 used icons into one TextMeshPro sprite asset (order tickets and plate icons become sprite tags in text) |
| Music | compress to Vorbis; a 67 s stereo loop at quality 0.4 is about 1 MB |
| Sound effects | compress; force mono for the 3D ones |
| Fonts | use the template project's TextMesh Pro font; the outline material preset is needed for the floating texts |

### 6.3 Whose art is it (point c)

The repo makes one blanket statement and one credits screen, both quoted in section 1 (`README.md:14`,
`P/UI/Menus/CreditsPopup.prefab:69-70`). There is no per-file attribution and no licence text from
Code Monkey. The table sorts every art file by what the repo itself supports.

| Group | Files | What the repo says | My reading |
|---|---|---|---|
| **A. Code Monkey's, by the repo's statement** | `Assets/Meshes/**` (23 FBX, 13 materials, 37 textures); `Assets/_Assets/Sounds/**` except the two clips in group C (22 effects and `Music.wav`); `Assets/_Assets/Textures/Icons/*` (11); `Assets/_Assets/Textures/UI/*` except `TutorialArrow.png` (11); `Assets/_Assets/Animations/*` (chef idle and walk, controller, `CuttingCounterIdle`); `Assets/_Assets/Materials/*` (colour, floor, wall, particle materials) | `README.md:14` "All art assets like Textures, models, audio clips etc where created by … Code Monkey"; credits "Audio, 3D Models, Textures: Code Monkey" | All of it arrived in the first commit `bdd346d` ("Import project", 2023-03-15) in a folder named `_Assets`. Consistent with the statement. The repo does not say which of the small UI sprites or colour materials the author made himself |
| **B. The author's own** | all 100 scripts; all prefabs, scenes, settings assets; the 22 legacy clips under `P/`; `Assets/Shaders/SpriteUVSpeed.shadergraph` and `Assets/_Assets/Materials/SpriteUVSpeed.mat`; `Assets/_Assets/Materials/Wall_Blue.mat` (added later, `d8129fe`); `Assets/_Assets/Textures/Textures.spriteatlas`; `WebStores/Logo.png`, `.psd`; `Wiki/*.png` | `README.md:16` "the game structure and the source-code were created by me"; `LICENSE` | MIT. The logo images contain the upstream title and are not used by the port |
| **C. Added after the first import, origin not stated** | `Assets/_Assets/Sounds/SFX/SFX_countdown_start.wav` (`df66873`, 2023-03-16, "Add SFX_countdown_start audio clip"); `Assets/_Assets/Sounds/SFX/SFX_timesup.wav` (`1f03b22`, 2023-03-18); `Assets/_Assets/Textures/UI/TutorialArrow.png` (`3706971`, 2023-03-22); `Assets/TextMesh Pro/Sprites/Buttons.psd` (key and gamepad glyphs; `87ac9bd` "Add Button Sprites", moved by `fabb928`) | Only the blanket statement, which was written about "all art" | **Not determined.** They may be from the course, self-made, or from elsewhere. Treat as unlicensed until known: the two clips and the arrow are easy to replace; the glyph sheet is not needed |
| **D. An unused chef character set that is very unlikely to be Code Monkey's** | `P/Players/Models/**`: `ChefModelTemplate.fbx`, 46 `New_Chef@*.anim`, 41 `mat_chef_*` materials, 45 textures | Nothing specific | The FBX (FBX SDK 2020 export, unlike the Blender exports of group A) contains meshes named `Chef_Mike`, `Chef_Gertie`, `Chef_Buck`, `Chef_Alien_Green`, `Chef_Platypus`, `Chef_Unicorn`, `Chef_Walrus` and so on, animations `PetKevin`, `Cannon_Fire_*`, `Bellows_Use`, `Wash`, `CarDeath`, and textures named `t_dlc3_chef_hat_Santa_d`, `t_dlc5_baseballcap_01_d`. These names match the commercial game the README calls its "study case" (`README.md:12`). I cannot prove where the files came from, but nothing in the repo licenses them and the course's chef is the capsule model in `P/Players/PlayerModel.prefab` (built from Unity primitives). **Never import any of it.** It is in the first commit and no scene, prefab in use or asset references it |
| **E. Third-party with its own terms** | `Assets/Plugins/CodeAssist/**` (Unity Asset Store asset, "governed by the Asset Store EULA", `THIRD-PARTY-NOTICES.TXT:1`); `Assets/TextMesh Pro/**` (Unity package content; LiberationSans under SIL OFL; EmojiOne sample with its own terms) | Their own notices | Not imported. The plugin is editor tooling that should not have been in a public MIT repo; a public fork carries it in its history whatever the port does |
| **F. Not in the repo** | the audio mixer, the highlighter shader, the screen fader prefab, the audio and pause settings assets | README says the packages are MIT | Not needed: each is replaced (4.2, 6.4) |
| Unity built-ins | primitive meshes for the chef capsule, floor, walls, glow and arrow quads; default particle texture | | free to use |

Outside the repo: on 2026-11-24 the course page `unitycodemonkey.com/kitchenchaoscourse.php`, read
through a page summariser, showed **no licence or permitted-use statement** for the project files;
it says the assets include "Meshes for all the Counters, a bunch of Textures, Animations, Sound
Effects and Music" and carries a copyright notice. So the plan's gate ("read his published terms
before any Code Monkey asset goes into a bundle") is not satisfied by that page. Terms may exist
elsewhere (the download itself, the video description, an FAQ); someone has to find them or ask.
The music deserves its own check, since music is often licensed separately from models.

### 6.4 Shaders: what must be remade for URP 17 and Quest

| Shader | Used by | State | Action |
|---|---|---|---|
| `Shader Graphs/Lit Highlighter` (GUID `082d22da…`) | 12 materials: Bread, Cabbage, Cheese, Chopping board, ClearCounter, ClearCounter_Blue, FryingPan, Meat, Plate, Stove, Tomato, Trash bin | **Missing**: it moved into the visual-effects package at `773181e`. The last in-repo copy is `git show 773181e^:"Assets/Shaders/Lit Highlighter.shadergraph"` (URP Lit graph; textures `_MainTexture`, `_NormalMap`, `_SpecularMap`; `_Highlight` switch; `_HighlightColor`, `_HighlightPower`; Fresnel rim into emission) | **Remake.** The 12 materials still hold filled URP Lit slots (`_BaseMap`, `_BumpMap`, `_MetallicGlossMap`, read in `Assets/Meshes/Materials/Meat.mat:29-68`; all 12 have the same seven filled texture slots) beside the graph's own (`_MainTexture`, `_NormalMap`, `_SpecularMap`), so the kit builder can point them at URP Lit (or Simple Lit for Quest) and keep the textures. The highlight becomes an emission colour set with relay `color`. Without that step the materials import pink |
| `Assets/Shaders/SpriteUVSpeed.shadergraph` | `SpriteUVSpeed.mat` on the delivery counter's arrows (scrolls `_MainTex` by `_Speed` = −0.5 per second) | URP 12 Unlit graph, in repo | Re-import under URP 17 and check on Quest; if it will not upgrade, a two-line unlit scroll shader replaces it |
| URP Lit | Knife, Black, BlackOutline, Floor, 5 chef colours, Wall_Blue, Wall_Orange | standard | upgrade in place; only Knife, Black and Floor are needed |
| URP Unlit | StoveRedGlow (colour animated by `Stove@WaitBurning`) | standard | upgrade; the clip animates `material._BaseColor`, keep the property name |
| URP Particles/Unlit | StoveSizzlingParticles, PlayerMovingParticles, two Trail materials | standard | upgrade; only the stove one is needed |
| URP Simple Lit | 41 chef materials | unused | none |
| TextMesh Pro SDF (Mobile) | two font material presets | package | use the template's |

Post-processing (bloom, vignette, tonemapping, colour adjustments in
`T/Rendering/PostProcessing/GameProfile.asset`) and the baked lightmaps belong to the scene, not to
a kit, and are dropped: the kitchen will look flatter than upstream under a world's own lighting.

---

## 7. Translation map

One TypeScript file per upstream file, `ts/src/<UpstreamFileName>.ts`, in this order. Lines are
upstream line counts. 77 files (3,853 lines) are translated; 23 files (782 lines) are replaced or
dropped; the generated input wrapper (638 lines) is ignored. Four new files have no upstream
counterpart and come first.

| Step | Upstream file (lines) | TypeScript | Hard part |
|---|---|---|---|
| 0 | none | `GameClock.ts` | pausable game time `G` from the relay clock; (acc, rate, since) helper; deadline helper that fires each deadline exactly once per referee term |
| 0 | none (package behaviour, 4.2) | `ActionCode.ts` | `IEnable`, `playRandom`, highlight container, pause settings, panel show/hide, the "target" object that replaces `BoxCaster` (`hasHit`, `tryGetEnabledComponent(kind)` with the same hit-object-only lookup) |
| 0 | none | `Kitchen.ts` | bootstrap from `bindings.json`: build behaviours in upstream execution order (managers at −1 first), item pool, single `kitchen` leaf, render state diffs into kit objects |
| 0 | none (replaces the ten `Player*` files) | `Chef.ts` | roster slot, one logical hand holder per chef, turning `click` / `grab` / `drop` / `trigger-enter` into E and Q intents with a target, held-item display for self and others |
| 1 | `Items/Ingredients/IngredientName.cs` (11), `IngredientStatus.cs` (10) | same names | enum numbers must equal the asset values (Cuttable is 4, not 3) |
| 2 | `_Globals/Interfaces/IChanceable.cs` (9), `Utils/RandomUtils.cs` (48) | same | 32-bit float products and comparisons; roll is injected; the search covers only the first five totals and treats an exact hit differently from a miss (3.4) |
| 3 | `Items/Ingredients/IngredientData.cs` (22) | same | `Spawn()` becomes "take a pooled item of variant n"; equality is name + status |
| 4 | `Items/Ingredients/IngredientDataCollection.cs` (45), `IngredientSettings.cs` (72) | same | keep collection order exactly as in the assets, including Meat (checklist 123); the clamp to index 0 |
| 5 | `Recipes/PlatedIngredient.cs` (30), `RecipeData.cs` (59), `RecipeSettings.cs` (60) | same | `ContainsOnly` is count + membership, not a multiset test (125); first-fit layout recipe; positions scaled by the kit scale |
| 6 | `Score/ScoreSettings.cs` (64), `ScoreManager.cs` (12) | same | three synced counters; the increase / decrease events must fire on every client from the state change, once |
| 7 | `Matches/TimeDown.cs` (36), `TimeLimit.cs` (23), `MatchSettings.cs` (28), `MatchManager.cs` (20) | same | per-second `OnUpdated` ticks derived from `t0` instead of waited for; a late joiner must not replay past ticks; `OnFinished` and `OnFinalSecondsStarted` exactly once per client |
| 8 | `Orders/Order.cs` (85), `OrderSettings.cs` (150), `OrderManager.cs` (39) | same | the ordering loop as a two-state machine ("wait for room", "wait 15 s"); orders that linger 1 s and still match (128); plate-return list; tip in 32-bit floats: `Math.ceil(Math.fround(Math.fround(left) * Math.fround(mult)))`. In doubles 60 × 0.1f gives 6.00000009 and a tip of 7 where C# gives 6, and 160 × 0.2f gives 33 instead of 32 |
| 9 | `_Globals/Interfaces/ICollectable.cs` (8), `IDroppable.cs` (9), `IPickable.cs` (11), `IInteractable.cs` (14), `Items/Interfaces/IItemCollectable.cs` (17), `IItemCollector.cs` (11), `IItemDisposer.cs` (11), `IItemHolder.cs` (11), `IItemTransfer.cs` (11), `IItemCollectableExtension.cs` (10) | same | the interface a class implements decides what `ItemHandler` finds on a target; keep the exact sets (for example the trash is a disposer and a transfer but not a holder; a plate is a transfer) |
| 10 | `Items/AbstractItem.cs` (34), `Items/Ingredients/Ingredient.cs` (19), `Physics/CollectableBody.cs` (38) | same | an item is a record in the `kitchen` leaf plus a pooled visual; `PickUp` / `Drop` re-parent the visual |
| 11 | `Items/ItemHolder.cs` (112), `Items/ItemHolderStack.cs` (59) | same | `CurrentItem` reads and writes the shared table; `OnItemPlaced` / `OnItemReleased` must also fire on clients that did not make the change (knife, highlight, stack height, tutorial hooks listen to them); `ReplaceItem` fires release then place, in that order |
| 12 | `Items/Plate.cs` (67) | same | ingredient stack and the sticky `hasBread` flag live in the item record (127) |
| 13 | `Counters/Counter.cs` (63), `IngredientCounter.cs` (48), `DeliveryCounter.cs` (62), `Items/Trash.cs` (60) | same | delivery destroys the plate and its ingredients in one write; trash removes at once and animates locally |
| 14 | `Counters/Preparation/AbstractIngredientPreparator.cs` (175), `CuttingBoard.cs` (56), `CounterKnife.cs` (21), `PreparationCounter.cs` (41) | same | toggle semantics (start, pause, resume) on shared state; `IsPreparing` stays true while paused; re-basing (acc, rate, since) when final seconds start and end; completion on the referee tick |
| 15 | `Counters/Preparation/Stove.cs` (146), `FryingPan.cs` (31), `PreparationWarning.cs` (34) | same | burn sequence as one start time; three ways out (item removed, Q, burned); upstream's coroutine stops itself through the item-released handler and still runs its last two statements, so the end state is "idle animation, not burning, smoke on": reproduce the end state, not the call order |
| 16 | `Items/ItemHandler.cs` (93) | same | a pure function of (hand contents, target, enabled flags); the floor branch depends on "nothing targeted" |
| 17 | `UI/Orders/OrderTicket.cs` (95), `OrderTicketGroup.cs` (61), `UI/Ingredients/IngredientIcon.cs` (18), `IngredientIcons.cs` (39) | same | three fixed ticket slots instead of instantiated tickets; icons as sprite tags; bar driven by (born, wait) |
| 18 | `UI/Score.cs` (69), `UI/Timer.cs` (76), `UI/CountDown.cs` (54), `UI/TimesUp.cs` (35), `UI/Results.cs` (62) | same | world board instead of overlay; C# number formats ("D2", `mm\:ss`, float `ToString`) |
| 19 | `UI/Counters/DeliveryCounterCanvas.cs` (58), `UI/PreparationWorldSpaceCanvas.cs` (53), `UI/PreparationTimer.cs` (28) | same | "play only this text animation" (stop the others first) |
| 20 | `Musics/BackgroundMusic.cs` (56) | same | one source per instance; pitch 1.25 through `BS.AudioSource.pitch` |
| 21 | `UI/Menus/MainMenu.cs` (52), `MainMenuOptions.cs` (42), `PauseCanvas.cs` (93), `PauseHandler.cs` (26), `PauseOptions.cs` (41), `SoundPopup.cs` (45) | same | reshaped into board panels (8.5); shared pause |
| 22 | `Serialization/GameData.cs` (31), `GameDataSettings.cs` (44), `GameDataManager.cs` (26) | same | `localStorage` instead of the persistence package |
| 23 | `Tutorials/TutorialManager.cs` (189), `Steps/AbstractTutorialStep.cs` (38), `Steps/TutorialIngredientCounters.cs` (28), `Steps/ShowOrderTutorialStep.cs` (27), `Steps/PreparingXBurger/CookingMeatTutorialStep.cs` (78), `CuttingCheeseTutorialStep.cs` (76), `PlatingTutorialStep.cs` (159), `UI/TutorialDescription.cs` (59) | same | steps are chains of one-shot event subscriptions; in the port each sub-goal is a value in the `tutorial` leaf and the referee advances it when the same events fire; the counter lookup by ingredient name throws upstream if two crates of a kind exist, so the port picks the `_00` one |

Replaced or dropped, with the reason in 10: `Players/Player.cs` (36), `PlayerType.cs` (10),
`PlayerMotor.cs` (96), `PlayerAnimator.cs` (16), `PlayerAnimationEventHandler.cs` (19),
`PlayerManager.cs` (72), `PlayerMatchController.cs` (49), `PlayerSettings.cs` (85),
`Players/Inputs/PlayerInputHandler.cs` (35), `PlayerInputSettings.cs` (93) (all into `Chef.ts`);
`Scenes/SceneSettings.cs` (21, phases); `Serialization/Loader.cs` (24);
`Tutorials/Steps/MovePlayerTutorialStep.cs` (30), `SwitchPlayerTutorialStep.cs` (20);
`Recipes/PrefabToRecipe.cs` (41, editor tool); `Items/Ingredients/IngredientDataNew.cs` (20, unused);
`Items/Ingredients/IngredientManager.cs` (12), `Recipes/RecipeManager.cs` (12) (one line each, into
the bootstrap); `Utils/RotateTowardsBack.cs` (25, baked by the kit builder),
`RotateTowardsCamera.cs` (17), `AnimationExtension.cs` (24); `_Globals/EditorPaths.cs` (19),
`Managers.cs` (6).

---

## 8. Snippet design

### 8.1 Shape of the snippet

| Item | Proposal |
|---|---|
| Slug | `coop-kitchen` (plan). Not registered until the owner says so |
| Title | must not be "Kitchen Chaos". Working title "Co-op Kitchen"; the owner picks the real one (10.3 item 11) |
| `single` | **false**. It does not take over the world; several kitchens can stand in one world |
| Players | 1 to 4 chefs by default (setting `chefs`, up to 8); everyone else watches. One chef alone can play, as upstream |
| Scale | kit built at **0.64** of upstream so that `scale="1"` is human size: counter top 1.4 m becomes 0.90 m, a cell 1.5 m becomes 0.96 m, walkable area 8.6 m by 5.8 m. A plate is then 0.64 m across: cartoon-sized, as upstream |
| Origin | the kitchen centre on the floor (upstream ring centre is (0.25, 0, −1.25); the kit builder recentres) |
| Way in | upstream is a closed ring with the chefs inside. The kit leaves out one plain counter as a doorway (setting `door`) |
| Layers | counter bodies on one of UserLayer9 to 15 (body and hands bump, no teleport or standing on counters); every click target on UI (5); grab proxies on Grabbable (20). Source: SDK `Docs/building-in-unity/layers.md` |
| Sound | effects stay 3D but with a fall-off that ends a little beyond the kitchen; board sounds (new order, ticks, time up) play 3D from the board; music plays for clients whose head is inside the footprint |

### 8.2 Settings (flat attributes)

Defaults reproduce upstream. Standard attributes `room`, `position`, `rotation`, `scale` as in the
contract.

| Attribute | Default | Values | Maps to |
|---|---|---|---|
| `round` | `120` | 30 to 600 | round length in seconds (`T/MatchSettings.asset:18`); final seconds stay the last 20 |
| `difficulty` | `normal` | `easy`, `normal`, `hard` | preset for (max orders, seconds between orders, patience per ingredient, seconds before burning starts): easy (2, 20, 40, 4), **normal (3, 15, 30, 2) = upstream**, hard (4, 10, 20, 1). Only `normal` is covered by the checklist |
| `chefs` | `4` | 1 to 8 | most players who can cook at once |
| `door` | `west` | `west`, `east`, `none` | which plain counter is left out: `Counter_Normal_10` at (−7.25, −0.5) or `Counter_Normal_06` at (7.75, −0.5); `none` keeps the closed ring for worlds that bring players in another way |
| `music` | `on` | `on`, `off` | background music |
| `tutorial` | `on` | `on`, `off` | show the TUTORIAL button on the board |
| `layout` | `classic` | `classic` only at first | the Game scene's ring. The cell list comes from the scene YAML through `bindings.json`, so a second layout (the tutorial scene's simpler kitchen) is data, not code; whether to ship one is 10.3 item 10 |

Gizmos (`<bs-gizmo>` children): a box 10.6 m × 2.6 m × 7.7 m for the ring (grows to 11.2 × 8.3 m
with a margin for the outside of the counters and the board), an arrow at the doorway, a small box
where the board hangs. Sizes follow `scale`.

Per instance, never shared: every state key (`pk1.coop-kitchen.<inst>.`), the referee, the roster,
the item pool and its object keys, boards, audio sources, the `localStorage` keys.

### 8.3 Kit contents and why there are no networked objects

Upstream creates and destroys items freely and drops them as rigid bodies. In the port an item is a
row in the `kitchen` leaf, and each client shows it with a pooled object from its own copy of the
kit. So the kit needs **no synced transforms and no network ids for items**: every
`bindings.objects[*].sync` is `"none"`, the 1,024-object room limit is not touched, and item moves
cost space-state writes only. (If `AttachedObject` with `autoSync` is used to show held items on
avatars, 8.4, those pooled objects do need ids; that is at most 48 per kitchen.)

- **Pool:** 48 item slots, each with the ten ingredient variants as children (one active), plus the
  2 plates with their icon text. 48 covers 28 counter tops, 8 hands and 12 loose or plated items.
  When all slots are in use a crate refuses to dispense (10.1 C10). Upstream has no limit.
- **Counters:** the 34 cells (33 with a doorway) from the upstream prefabs, colliders rebuilt on the
  layers above, one click collider per interactive counter, a second one on each knife and each pan
  for Q.
- **Animations:** per 5.4.
- **Boards:** 8.5.
- **Relay additions this game needs** (the README says to extend the table as games need): a bar or
  tween op for eight progress bars; either legacy-animation ops or the converter of 5.4; a way to
  stop a looping source (or the toggle workaround in 4.1).

### 8.4 Every player action, in VR and on desktop

Both input styles end in the same two intents sent to the referee, `E(target)` and `Q(target)`,
where the target replaces upstream's "what the chef faces". The rule that runs is the upstream one
(`S/Items/ItemHandler.cs:25-51`), unchanged. A click works in VR too (laser pointer on UI-layer
colliders), so VR players always have the desktop method as a fallback.

| Action (checklist) | Desktop | VR |
|---|---|---|
| Take a new ingredient from a crate (16) | click the crate | grab the ingredient sitting in the crate's hatch; it comes away in the hand and the hatch shows the next one |
| Take the item on a counter, board, stove, crate top or plate stack (17, 26, 27) | click the counter | grab the item |
| Put the held item on an empty counter (20) | click the counter | hold it over the counter top and let go; it snaps to the holder position |
| Put a held ingredient on a plate that is on a counter or on the floor (25, 33) | click that counter or plate | let go over the plate |
| Take an ingredient from a counter onto the held plate (34) | click the counter while holding the plate | first version: point and click the counter while holding the plate. The natural gesture (bring the plate to the item) has no event of its own and **needs a spike** (a trigger volume on the plate is the candidate). **As built: point and click; no trigger volume** |
| Throw an ingredient away (56) | click the trash | let go over the trash |
| Scrape the last ingredient off a held plate (57) | click the trash while holding the plate | point and click the trash, or touch the trash rim with the plate (trigger volume). **As built: point and click (or let go over the trash); no trigger volume** |
| Deliver (59 to 63) | click the delivery counter | let go of the plate over the delivery counter |
| Drop on the floor (23) | click the floor inside the kitchen | let go anywhere that is not over a counter, plate or trash |
| Pick up from the floor (24) | click the loose item | grab it |
| Start, pause, resume cutting (38, 41) | click the knife | push the knife (touch trigger, `trigger-enter` with the local player's hand) or click it. **As built: click only** (laser or desktop); the push triggers were not built |
| Start, pause, resume cooking; cancel burning (46, 48, 52) | click the pan handle or stove knob | push the knob or click it. **As built: click the knob only**; no push trigger |
| Something the rules refuse (22, 19, 21, 31, 32, 58, 59) | nothing happens, the item stays in hand, plus the upstream cue where there is one | the same cue; because the hand has already let go, the item falls to the floor at the foot of that counter as a loose item (10.1 C9) |
| Switch chef (111) | removed | removed |
| Pause, restart, end round (86, 87) | click the board buttons | click or push the board buttons. **As built: click** |
| Join or leave the kitchen | click "Cook" on the board | the same |

Holding: a chef holds at most one item, in whichever hand took it. A second grab while holding is
refused (the grab is released at once with `ReleaseGrab()`, SDK `Docs/components/vr-interaction.md`).
An item in a chef's hand cannot be taken by another chef, as upstream (chefs pass things by putting
them on counters).

How other players see a held item: preferred, `BS.AttachedObject` on the hand bone with `autoSync`
(SDK `Docs/javascript-api/user-multiplayer.md:26-67`); fallback, every client places it in front of
that player's head, which is the only remote pose a page can read (plan "Facts"). Which one works
together with a physical grab is a spike (10.3 item 3).

Highlight (109): each client highlights, for itself only, the counter or loose item its pointer or
nearest hand is on.

### 8.5 Boards instead of the HUD and menus

One board in the kit, hung over the delivery counter and facing the kitchen (a second copy on the
opposite row if testing shows people cannot see it):

| Upstream | On the board |
|---|---|
| Order tickets (70) | three fixed slots: name, a row of ingredient icons (sprite tags), a patience bar; delivered and expired flashes kept |
| Score and delta (76) | number and the rising "+ N" / "- N" |
| Timer (80, 81) | mm:ss and bar; red and pulsing in final seconds |
| Countdown, "Times Up!" (78, 82) | large text in the middle of the board |
| Main menu (3) | lobby panel: PLAY, TUTORIAL, CREDITS, "Cook" (join or leave), music on or off |
| Pause (86, 87) | PAUSE button during a round; panel with Resume, Restart, End round; the two confirmations kept |
| Sounds (88) | two local volume controls (music, effects) with minus and plus buttons in steps of 0.1 and Reset; saved per device |
| Results (83 to 85) | results panel with the four lines, "New High Score!" for each chef whose own saved best was beaten, the kitchen's best, Continue (back to the lobby panel) |
| Credits (4) | credits panel (as built, `MainMenu.CREDITS`): "Based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos (MIT)" with the copyright line, KayKit Restaurant Bits (CC0), Kenney's sounds (CC0), Liberation Sans (OFL, its copyright line), "not affiliated", port credits. No upstream art is used, so the course art is not credited |

The floating texts over the delivery counter, boards and stoves are already world-space in upstream
and stay where they are. Plate icons (37) become one text object per plate.

### 8.6 Chefs, referee, joining and leaving

- **Roster.** A player becomes a chef with "Cook" (up to `chefs`). Slots take upstream's colour
  order Blue, Green, Red, Yellow (`S/Players/PlayerType.cs:3-9`). Only chefs' intents are accepted.
  A round starts when a chef presses PLAY; chefs may join or leave during a round.
- **Referee.** As in the contract. It owns `match`, `orders`, `score`, `kitchen`, `prep.*`,
  `tutorial`, `roster`, rolls the orders and fires every deadline. Intents are processed in arrival
  order, so when two chefs go for the same item the second intent meets the new state and the
  upstream rule answers it (usually "nothing happens").
- **Referee leaves.** The next referee resumes from the leaves; nothing in a round depends on memory
  outside them (3.1). Intents in flight are lost; the chef repeats the action.
- **A chef leaves while holding something.** The referee drops the item on the floor where the
  chef's head last was and frees the slot (no upstream equivalent).
- **Late join.** The client waits for the full snapshot, shows the kitchen as it is, and derives all
  clocks. It does not replay past sounds.
- **Lobby.** Between rounds the kitchen is reset to its start state (two plates on their counters,
  nothing else) and E and Q are ignored, which matches "the Game scene is not loaded".

### 8.7 The tutorial (point e)

What it teaches, in order: moving; switching chefs; where orders appear; taking an ingredient (E);
putting it on an appliance (E); starting the appliance (Q); plating on a plate, picking the plate
up, plating from appliances; delivering. It does so by disabling every counter and enabling only the
one the current prompt needs, with a bouncing arrow over it (checklist 113 to 122).

Does it port: **yes, in substance**, because the mechanism is the same `IsEnabled` flags and events
the round already uses.

| Part | Port |
|---|---|
| Steps 1 and 2 (move, switch) | dropped: movement is the platform's, switching does not exist |
| Step 3 (the order) | kept; the text says where the board is |
| Steps 4 to 6 | kept one for one, with prompts reworded per input ("Take a Meat from the crate", "Put the Meat on the Stove", "Start cooking: push the knob") and no key glyphs |
| Gating and arrows | kept; state in the `tutorial` leaf so every chef sees the same step and any chef can do it |
| Stove cannot burn, no round timer, no random orders, no pause | kept |
| "Chef switching locked so the other chef cannot take the plate" (121) | not applicable; with several chefs anyone may carry the plate, and the step logic already accepts that (it only checks what is on the plate) |
| Layout | upstream uses a separate, simpler kitchen. The port runs it in the classic kitchen with everything disabled except the `_00` stove, board, Meat, Bread and Cheese crates, the first plate counter and the delivery counter |
| End | results panel with the tutorial's score, as upstream (122); it does not touch the saved high score in the port |

---

## 9. Test plan

### 9.1 Golden vectors (rung 1; upstream C# built with `dotnet` against stubs)

The stubs are small: `MonoBehaviour` and `ScriptableObject` that can be constructed with `new`,
attributes as empty classes, `Mathf`, `Vector3`, `Quaternion`, `Debug`, `Time` with a settable
`deltaTime`, `Random` with a settable `value`, a coroutine runner that steps `IEnumerator`s with
`WaitForSeconds` / `WaitUntil` / `WaitWhile` on a fixed step, no-op `Animation`, `AudioSource`,
`ParticleSystem`, `Transform`; and for the packages a `BoxCaster` whose hit is set by the test,
no-op highlighters and audio dictionaries, `AwaitableCoroutine.Run` on the same runner. Private
serialized fields are filled by reflection from the same data the kit builder writes to
`bindings.json`. Menu, input, save and scene files are not compiled.

| Vector set | Upstream entry point | Cases |
|---|---|---|
| V1 weighted pick | `RandomUtils.WeightedRandom` | rolls 0, 0.3499, 0.35, 0.3501, 0.4999, 0.5, 0.7499, 0.75, 0.8999, 0.9, 0.9999, 1 and 1,000 random rolls: recipe index |
| V2 waiting time | `RecipeData.GetWaitingTime` | the five recipes: 60, 127, 93, 130, 160 |
| V3 tip | `Order.GetTip` | five recipes × remaining times (full, full − 1/60, every 0.5 s down to 0, values just either side of each integer product) |
| V4 can plate | `RecipeSettings.CanPlate` | the ten variants |
| V5 matching and layout | `RecipeData.ContainsOnly`, `RecipeSettings.Plate` | every sequence of up to 5 plateable ingredients (3,905) against the five recipes: match or not, and which recipe lays the plate out |
| V6 plate | `Plate.TryTransferItem`, `RemoveLast` | random offer and scrape sequences: accepted or not, contents, bread flag |
| V7 score | `ScoreSettings` | random sequences of deliveries with tips and wrong plates: counters, score, the delta events |
| V8 interaction matrix | `ItemHandler.TryInteractWithItem`, `TryInteractWithEnvironment` | hand (empty, each of 10 variants, empty plate, plates with contents) × target (none, loose item, loose plate, plain counter empty / with each kind / with a plate, crate, board idle / preparing / paused, stove idle / cooking / in burn sequence / burned, plate stack, trash, delivery, corner) × enabled or not: resulting holders, items, events and sounds |
| V9 timelines | preparators, stove, `OrderSettings`, `TimeDown`, `TimeLimit` on the stub runner with a 0.05 s step | event logs with times: cut with pauses and the booster switching on and off; cook, burn, each way of stopping the burn; order cadence with the cap, expiry, delivery, the 1 s linger, double delivery inside it; plate returns; countdown and round ticks |

V1 to V8 must match exactly. V9 is compared event by event with a tolerance of one referee tick.

### 9.2 Node scenarios on the fake room (rung 1, virtual time, several clients)

1. One chef plays a scripted full round (every recipe delivered once, one wrong plate, one expiry):
   final score and counters equal the C# run of the same script.
2. Two chefs send E on the same counter in the same tick: exactly one ends up holding the item;
   state digest equal on all clients.
3. Four chefs, 500 random legal and illegal intents: invariants hold after each (one item per
   holder, every item in exactly one place, exactly two plates including pending returns, at most
   three orders, pool never over 48).
4. The referee leaves while meat is cooking, while a burn sequence runs, during the 15 s order
   wait, during a plate return and during the 1 s removal: the new referee finishes each at the
   right game time, once.
5. A client joins mid-round: same digest as the others; derived clock within one tick; no past
   one-shot effects replayed.
6. Pause for 30 s mid-round with a preparation, a burn sequence, three orders and a plate return
   pending: every deadline moves by exactly 30 s.
7. Time up: orders freeze, intents are ignored, results values are right, the lobby reset restores
   the start state.
8. A chef disconnects holding a plate with ingredients: the plate is on the floor, the slot is free.
9. Pool exhaustion: the 49th item is refused with the cue and nothing else changes.
10. Tutorial script start to finish with two chefs sharing the steps; and with a wrong action at
    each step (disabled counters ignore it).
11. Two kitchens and one other game in the same room: no key, id or one-shot crosses instances.
12. Join, leave and referee loss in random order for 10 minutes of virtual time (the contract's
    standard soak).

As built (`test/scenarios.test.ts`, `test/review.test.ts`): 1 as "three chefs deliver" (no C# run of the same script;
the golden V9 orders compare the order logic event for event), 2 as two tests (two Q presses and two E presses on one
counter in the same tick, and two VR grabs of one item), 3 (500 random intents by four chefs, a third of them in the
same tick as the one before; invariants every 10 intents), 4 (the referee leaves while cooking, during a plate return
and the order wait), 5, 6, 7, 8, 10, 11 (two kitchens; no other game in the room), 12 (ten minutes of virtual time:
players join, leave and the referee leaves, while chefs act at random). Not built: 9 (the pool's limit is in the rules
tests: `rules.test.ts`).

### 9.3 Edit mode (rung 2)

Bundle check, allow-list check, all bindings resolve, no missing scripts (the package stand-ins are
stripped), no object from `P/Players/Models` or `Assets/Plugins` in the dependency list of the kit,
texture sizes at most 512, a THIRD-PARTY-NOTICES entry for every imported asset folder.

### 9.4 Play mode, one player (rung 3)

A scenario bot injects click events on the kit's click targets and reads PASS or FAIL lines:
lobby to countdown to round; make and deliver a Burger and an X Salad Burger; wrong plate; burn a
meat; cancel a burn with the knob; pause and resume a cut; scrape a plate into the trash; drop and
pick up from the floor; let an order expire; time up; results; back to lobby; then the tutorial.
Checks after each step: the visible object under each holder matches the state, texts on the board
match, the right clip index was played.

### 9.5 Local Multiplayer, two players (rung 4)

Both pages reach the same state digest after: a round played by both; both clicking the same item;
one page reloading mid-round (late join); the referee's page closing mid-cook. As built (`playtest/multi.json`): a
round played by both, both pressing Q on one board at the same moment and then E on it at the same moment, one page
reloading mid-round; the referee's page closing is covered in Node only (scenarios: the referee leaves), since Play mode
cannot close the main editor's page and keep testing. Grab-based input is
exercised here as far as Play mode allows (only the Grabbable layer can be grabbed in Play mode,
SDK `Docs/building-in-unity/layers.md`).

### 9.6 Only in the app (rung 5, not run until the owner allows)

Hand grabs and releases over counters, the push triggers, how held items look on other avatars,
intent round-trip time on Quest, frame time with a full pool, audio fall-off.

---

## 10. Changed, left out, risks and questions

### 10.1 Changed (rule kept, form different)

| # | Change | Reason | Checklist |
|---|---|---|---|
| C1 | Every player is a chef with their own hands; the two capsule chefs and Tab switching are gone | owner's decision; Altspace players are their avatars | 110 to 112 |
| C2 | "Facing" is replaced by an explicit target chosen by click, grab or release (touch: not built). **Reach:** a click counts within **2 m** of the nearest of the chef's head and hands (`Counter.REACH`: `Counter.interactReach` for counters, knives and knobs; `Kitchen.Reaches` for the floor, corners and loose items). Upstream's box cast reaches about 1 m ahead of the chef's centre (0.8 m plus half the 0.5 m box), 0.67 m at kit scale; 2 m from the head reaches the far edge of a counter top from where one stands at it and the floor about 1 m ahead. Board buttons have no reach (the board is the HUD). Each intent also carries what the chef saw of the target (`Kitchen.Seen`); if another chef changed it first, nothing happens (upstream one chef acts at a time) | there is no chef object to cast from, and hands are better pointers | all of C to H |
| C3 | All rules run on one referee from chef intents; kitchen contents are one shared leaf | no host, shared state readable by all, no private ownership events (plan "Facts") | all |
| C4 | Coroutines become deadlines on a pausable game clock; events land on a 50 ms grid; a round is exactly `round` seconds | a referee change must be able to resume; state cannot be written per frame | 131, 132 |
| C5 | Pause stops the kitchen's game clock for everyone in it, not the world | a snippet cannot stop world time | 86 |
| C6 | Five scenes become phases of one kit (lobby, countdown, round, times up, results, tutorial) | a kit cannot hold scenes | 1, 3, 83 to 85 |
| C7 | The HUD and menus become a world-space board; tickets are three fixed slots; ingredient icons are sprite text | no screen overlay in a snippet; VR | 37, 70, 76, 77, 80 to 85 |
| C8 | A dropped item rests where it was dropped (clicked floor point, or on the floor under the releasing hand) without physics; the point is kept inside the kitchen's floor | items are state, not synced rigid bodies | 23 to 25 |
| C9 | In VR, an item let go over a place that refuses it falls to the floor there | the hand has already let go; upstream would keep it in hand | 22 and the other refusals |
| C10 | At most 48 items exist; crates refuse when the pool is full | pooled kit objects | 16 |
| C11 | Trashing removes the item from state at once; the shrink is cosmetic | fixes the leak in 129 and avoids a half-trashed state on referee change | 56, 129 |
| C12 | Removing an order twice is a no-op instead of an exception | 128 would crash the ticket code upstream | 128 |
| C13 | Kitchen built at 0.64 scale; one plain counter left out as a doorway (10 plain counters instead of 11); the four 8 m invisible walls are not needed because the counters themselves bound the room | human scale; players must be able to walk in | 9, 10, 15 |
| C14 | Chef speed does not change in the countdown or the final seconds | a snippet must not change world or player settings (README) | 79, 81 |
| C15 | Effects get a real distance fall-off; HUD sounds play from the board; pick-up and drop sounds play from the counter acted on (or the one nearest the spot on the floor), since a player's own position has no speaker; music: none ships (11.7) | several kitchens and other content share the world | N |
| C16 | High score is per device and per world (`localStorage`), plus a kitchen best in room state; a device compares each round (named by its start time) once | no per-player saved data on the platform | 84 |
| C17 | At time up the kitchen freezes (preparations stop) and is reset when the lobby returns | there is no scene unload to throw things away | 134 |
| C18 | Tutorial: steps 1 and 2 dropped, prompts reworded, run in the classic kitchen, shared by all chefs, does not write the high score | see 8.7 | 113 to 122 |
| C19 | Highlight is local and follows pointer or hand | C2 | 109 |
| C20 | Name, logo and credits text are new; "Kitchen Chaos" appears nowhere (the upstream logo `KitchenChaosLogo.png`, product name and `EditorPaths.SO` string are not used) | owner's decision | 3, 4 |
| C21 | Sounds panel reduced to two stepped volume controls, local only | no mixer; simpler board | 88 |

### 10.2 Left out

| What | Reason | Checklist |
|---|---|---|
| Loader scene, "saves automatically" notice, "Saving" indicator | nothing to load or wait for | 2, 91 |
| Scene fades | no scenes | 5 |
| Button click delay and menu navigation sounds | package behaviour of no gameplay value; board buttons are clicked or pushed directly | 89 |
| Chef movement, fixed camera, walk animation, footsteps, dust trail, circle marker | players are avatars | 107, 110 to 112 |
| "Dash" and "Chop" inputs | dead upstream | 133 |
| Tutorial steps "move" and "switch" | not applicable | 116, 117 |
| Post-processing and baked lighting | belong to a scene, not a kit | 6.4 |
| `Language` in the save data | never set upstream | 3.5 |
| Key and gamepad glyphs in prompts | prompts are reworded; the glyph sheet's origin is unknown | 6.3 C |
| The unused chef character set, the editor plugin, the unused models, sprites and clips | not used by the game; the first two must not be redistributed by the port | 6.3 D, E |
| The two wall prefabs | in no scene upstream | 5.1 |

### 10.3 Open risks and questions, most important first

1. **No permission on record for Code Monkey's art.** The repo only credits him; the course page
   read on 2026-11-24 states no terms (6.3). Nothing of group A can go into a bundle until terms are
   found or he is asked. Fallback if the answer is no: a CC0 kitchen set, which changes the look but
   none of the rules. The music needs its own answer.
2. **What a public fork republishes.** The repo's first commit contains a 52.7 MB chef character set
   whose names match a commercial game (6.3 D) and an Asset Store plugin (6.3 E). The kit will not
   touch them, but a fork carries them in its history and tree. Question for the owner: fork as it
   is, fork and delete them on the `altspace` branch (history still has them), or publish the port
   in a fresh repository with an MIT notice instead of a fork.
3. **VR grabbing against rule-driven state** is unproven: grab and drop events on pooled,
   non-networked kit objects; releasing a refused grab from script; showing a held item on other
   avatars; "plate takes ingredient from counter" has no natural gesture. A spike should settle this
   before the kit builder is written. The click path works regardless and is the first milestone.
4. **Contract gaps** (need a README change): no relay op for the legacy `Animation` component, which
   is the only animation system the gameplay objects use (5.4); no op for bars or tweens (eight
   bars); no documented `Stop` on `BS.AudioSource`.
5. **Intent latency.** Every action is chef to referee to state to chef. If that is over about
   150 ms on Quest the game will feel sticky, and local prediction with rollback has to be added to
   `Chef.ts`.
6. **Deadlines across a referee change** are the main correctness risk in the rules; scenarios 4 and
   6 in 9.2 exist for it.
7. **Two sound effects, the tutorial arrow and the glyph sheet have no stated origin** (6.3 C).
   Replace `SFX_countdown_start`, `SFX_timesup` and `TutorialArrow.png`, or get an answer from the
   upstream author.
8. **Scale and doorway** (C13) change the look and remove one counter. Alternative: closed ring and
   a teleport pad, if the SDK lets a snippet move the local player (not checked).
9. **Upstream quirks: keep or fix?** Recommended: keep 123 (meat time), 125 and 126 (duplicates), 127
   (bread flag) and 128's matching exactly as they are, because the port is judged against upstream,
   and only make 128's double removal harmless. The owner may prefer to fix 127 and 128 and to
   rename recipe #3 so two different tickets do not both read "Salad Burger" (124).
10. **Tutorial as a shared mode** (8.7) or just a how-to panel? And is a second `layout` wanted?
11. **Name.** A title and board logo that are not "Kitchen Chaos"; also avoid the README's
    reference to the commercial game in any public text.
12. **Shared pause.** Proposed: any chef can pause and resume. Alternative: no pause at all, as in
    most online co-op games; Restart and End round stay.
13. **Pool cap of 48** is a new rule (C10). It is far above normal play; raise it if testing ever
    hits it.
14. **Package details not read**: default volumes, the `ui` package source, how
    `AudioDictionary.GetRandomClip` picks. None affects rules. The sources are on the author's
    GitHub at the pinned tags (4.2).
15. **Float and frame differences**: tips are computed in 32-bit floats (handled, step 8 in 7);
    upstream's own results vary with frame rate by up to a frame per event.

### 10.4 Where this analysis differs from the plan or the README contract

- Plan: "His eight private-registry packages are offline, so what they did is re-implemented."
  There are fourteen, game code calls a transitive one directly, and their behaviour does not have
  to be inferred: part is in this repo's history and the sources are public on the author's GitHub
  (4.2). Re-implementation in TypeScript is still required.
- Plan gate: "I read his published terms for the course assets." No terms were found where one
  would expect them (10.3 item 1).
- README relay table: this game needs ops it does not list (10.3 item 4).
- README names: "the prefab carries no `BSSyncedObject`" holds trivially here, since the design
  needs no synced objects at all (8.3), unless held items are attached to avatars.
- README layout: `ts/src/<UpstreamFileName>.ts` "one file per upstream gameplay file" is followed,
  with four extra files that have no upstream counterpart (7).


---

## 11. Port status (2026-11-24: rules in TypeScript, kit built, rungs 0 to 4 pass in the editor)

The rules are ported to TypeScript on the portkit runtime under `ts/` and tested in Node on the fake room. The kit is
built from data by `Assets/Kit/Editor/CoopKitchenKitBuilder.cs` (11.7) and `ts/bindings.json` is now the kit builder's
(hash `f93517c85d18ae6ae3c5a1b53c97a9905ba8f23b`); `ts/tools/gen-bindings.ts` writes the contract it follows. Rungs 0
to 4 pass in the Unity editor (`TESTS.md`: Node 29/29, kit check PASS, Play mode one player 32/0, two players 41/0). Commands, from
`altspace/ts`: `npm test` (typecheck, lint, 29 tests), `npm run build`, `npm run golden` (dotnet 8, needs the upstream
clone), `npm run data` (regenerates `data/kitchen-data.json` from the upstream YAML), `npm run bindings`.

The translation map (7) is followed: 77 upstream files have a TypeScript file of the same name in `ts/src/`, plus the
four new ones (`GameClock.ts`, `ActionCode.ts`, `Kitchen.ts`, `Chef.ts`) and `index.ts`.

### 11.1 Name

The game needs its own name (not "Kitchen Chaos", nothing from the commercial game the upstream README names). Three
neutral proposals for the owner to pick from; the slug stays `coop-kitchen`:

1. **Prep & Plate**
2. **Burger Brigade**
3. **Short Order Shift**

None was checked against trademark registers; that check belongs with the owner's pick. The board's credits name the
upstream author and licence.

### 11.2 Decisions taken (coordinator's and this port's)

| Decision | Where |
|---|---|
| Every player who joins the kitchen is a chef with their own hand (one item at most); there are no chefs to switch. COOK joins or leaves; PLAY and TUTORIAL enrol whoever presses them; at most `chefs` (default 4, up to 8); others watch | `Chef.ts`, `Kitchen.Enrol` |
| Counters, boards, stoves, crates and plates are shared; chefs pass items by putting them down, as upstream | `Kitchen.ts` |
| The referee owns match, orders, score, kitchen and tutorial; every timer is a deadline on a pausable shared game clock kept in the match leaf; a new referee resumes from the same numbers | `GameClock.ts`, `MatchManager.ts` |
| Pause is shared: any chef pauses (a round and its countdown; the tutorial cannot be paused, 90). **Resuming needs the chef who paused or the referee** (the coordinator's rule), and, added here, any chef once the one who paused has left the room, so a kitchen cannot stay stuck. Chosen over 10.3 item 12 ("any chef resumes") because it stops one player undoing another's pause | `MatchManager.RequestResume` |
| Quirks kept literally: cooked meat adds 0 s (123), duplicate-ignoring matching (125), repeats on a plate (126), the sticky bread flag (127), two recipes shown as "Salad Burger" (124), an expired order costs nothing (130) | |
| Plain bug fixed: an order being removed (delivered or expired, its last second) is no longer delivered again; upstream pays it twice and then throws on the double removal (128). The golden test asserts the difference against the upstream's own run | `Order.TryDelivery`, `test/golden.test.ts` |
| The tutorial is ported (8.7): steps 1 and 2 dropped, the rest one for one in the classic kitchen, shared by all chefs, its progress in synced state | `TutorialManager.ts` and the four step files |
| The recipe roll comes from a seeded generator in the orders leaf (the `seed` setting fixes it, for tests) | `OrderSettings.RollOf` |
| The doorway: `door` setting, default `west` (Counter_Normal_10 left out, C13) | `Kitchen.Start` |
| Cosmetic one-shots (sounds, "Need Plate!", "+NN Tip!", score deltas, "Cannot Cut") are network events from the referee: played once where they happen, never replayed to a late joiner | `Kitchen.Fx` |
| Items are records in one leaf, drawn with a pool of 48 kit objects; a crate refuses at 48 (C10) | `Kitchen.ts`, `IngredientCounter.ts` |

### 11.3 Checklist status

T: implemented and asserted by a Node test (rung 1). I: implemented in the script, but what it does is drawing or
sound that only a kit can show (rungs 2 to 4). C: changed by design (10.1). X: left out (10.2). O: open.

**Counts: T 89, I 29, C 6, X 13, O 1 (138).** (Until the review: 137 items, with 6 and 108 marked I although no music
ships; 138, the crate's icon, was missing.)

| # | Status | Evidence or note |
|---|---|---|
| 1 | T | phases lobby/countdown/round/timesup/results/tutorial: scenarios.test.ts |
| 2 | X |  |
| 3 | T | PLAY, TUTORIAL, COOK buttons: scenarios.test.ts |
| 4 | I | credits panel (MainMenu.ts) |
| 5 | X |  |
| 6 | X | no music ships (none with a licence we could verify, 11.7); BackgroundMusic.ts and the `music` setting stay for a licensed track, acting on a silent source |
| 7 | T | helpers.play: 0.2 s + 3 s |
| 8 | T | restart and lobby reset: scenarios.test.ts |
| 9 | I | layout from the scene (data/kitchen-data.json); doorway C13 |
| 10 | T | counter kinds from the scene: scenarios.test.ts, rules.test.ts |
| 11 | T | corner: rules.test.ts |
| 12 | T | two plates at the start: scenarios.test.ts |
| 13 | T | one item per holder: scenarios.test.ts |
| 14 | T | V1-V6: golden.test.ts |
| 15 | C | C13: the counters bound the room |
| 16 | T | scenarios.test.ts |
| 17 | T | scenarios.test.ts |
| 18 | I | pickup sound (effect 'hand') |
| 19 | T | scenarios.test.ts |
| 20 | T | scenarios.test.ts |
| 21 | I | PreparationCounter.TryTransferItem |
| 22 | T | scenarios.test.ts |
| 23 | T | floor drop at the clicked point (C8): scenarios.test.ts |
| 24 | T | grab from the floor: scenarios.test.ts |
| 25 | T | rules.test.ts |
| 26 | T | rules.test.ts |
| 27 | T | rules.test.ts |
| 28 | T | rules.test.ts |
| 29 | T | rules.test.ts |
| 30 | T | scenarios.test.ts, golden.test.ts V4-V6 |
| 31 | T | scenarios.test.ts, golden.test.ts V4-V6 |
| 32 | T | scenarios.test.ts, golden.test.ts V4-V6 |
| 33 | T | scenarios.test.ts, golden.test.ts V4-V6 |
| 34 | T | scenarios.test.ts, golden.test.ts V4-V6 |
| 35 | T | scenarios.test.ts, golden.test.ts V4-V6 |
| 36 | T | layout pose and V5 layout recipe: scenarios.test.ts, golden.test.ts |
| 37 | I | plate icon text (Kitchen.Render) |
| 38 | T | scenarios.test.ts |
| 39 | T | V9: golden.test.ts |
| 40 | T | bar shown while paused: scenarios.test.ts |
| 41 | T | scenarios.test.ts, V9 |
| 42 | T | scenarios.test.ts |
| 43 | T | scenarios.test.ts |
| 44 | I | chop every 0.25 s while cutting (CuttingBoard.Render) |
| 45 | T | knife hidden under an item: scenarios.test.ts |
| 46 | T | scenarios.test.ts, V9 |
| 47 | I | sizzle, particles, pan animation (Stove.Render) |
| 48 | T | V9 pause |
| 49 | T | scenarios.test.ts, V9 (8 beeps) |
| 50 | T | scenarios.test.ts, V9 (8 beeps) |
| 51 | T | scenarios.test.ts, V9 (8 beeps) |
| 52 | T | scenarios.test.ts, V9 (8 beeps) |
| 53 | T | scenarios.test.ts, V9 (8 beeps) |
| 54 | T | scenarios.test.ts, V9 (8 beeps) |
| 55 | T | booster, V9 and the time-up scenario |
| 56 | T | scenarios.test.ts |
| 57 | T | scenarios.test.ts |
| 58 | T | scenarios.test.ts |
| 59 | T | scenarios.test.ts, V9 orders |
| 60 | T | scenarios.test.ts, V9 orders |
| 61 | T | scenarios.test.ts, V9 orders |
| 62 | T | scenarios.test.ts, V9 orders |
| 63 | T | scenarios.test.ts, V9 orders |
| 64 | T | scenarios.test.ts, V9 orders |
| 65 | I | kit |
| 66 | T | scenarios.test.ts, V9 orders |
| 67 | T | scenarios.test.ts, V9 orders |
| 68 | T | V1 |
| 69 | T | V2 |
| 70 | I | three ticket slots (OrderTicketGroup) |
| 71 | I | new-order sound |
| 72 | T | scenarios.test.ts, V9 orders |
| 73 | I | StopOrdering at time up (OrderManager) |
| 74 | T | V3 |
| 75 | T | V7, scenarios.test.ts |
| 76 | T | score text and deltas: scenarios.test.ts, V7 |
| 77 | I | Score panel by phase |
| 78 | I | CountDown (late joiner hears none: scenarios.test.ts) |
| 79 | T | E during the countdown: rules.test.ts |
| 80 | I | Timer mm:ss and bar |
| 81 | T | booster: scenarios.test.ts; red text and beeps drawn (I); the music pitch is left out with the music (6) |
| 82 | T | Times Up, no E, results: scenarios.test.ts |
| 83 | T | results lines: scenarios.test.ts |
| 84 | I | per-device high score (Results.ts, C16) |
| 85 | T | Continue: scenarios.test.ts |
| 86 | T | shared pause: scenarios.test.ts |
| 87 | T | Restart with Yes: scenarios.test.ts |
| 88 | I | two stepped volumes (C21) |
| 89 | X |  |
| 90 | I | RequestPause refuses in the tutorial |
| 91 | X |  |
| 92 | I | effects through the sfx clip list |
| 93 | I | effects through the sfx clip list |
| 94 | I | effects through the sfx clip list |
| 95 | I | effects through the sfx clip list |
| 96 | T | 8 warning beeps: scenarios.test.ts |
| 97 | T | Cannot Cut / Cook shown: scenarios.test.ts |
| 98 | I | trash sound |
| 99 | T | Need Plate / Wrong Plate shown: scenarios.test.ts |
| 100 | T | Need Plate / Wrong Plate shown: scenarios.test.ts |
| 101 | I | board sounds |
| 102 | I | board sounds |
| 103 | I | board sounds |
| 104 | I | board sounds |
| 105 | I | board sounds |
| 106 | I | board sounds |
| 107 | X |  |
| 108 | X | no music ships (6) |
| 109 | O | no hover event reaches the page (portkit GAPS: hover open); nothing highlights |
| 110 | X |  |
| 111 | X |  |
| 112 | X |  |
| 113 | C | classic kitchen, _00 appliances (C18) |
| 114 | T | tutorial: scenarios.test.ts |
| 115 | T | tutorial: scenarios.test.ts |
| 116 | X |  |
| 117 | X |  |
| 118 | T | tutorial: scenarios.test.ts |
| 119 | T | tutorial: scenarios.test.ts |
| 120 | T | tutorial: scenarios.test.ts |
| 121 | T | tutorial: scenarios.test.ts |
| 122 | T | 32 points: scenarios.test.ts |
| 123 | T | V2 |
| 124 | T | data |
| 125 | T | V5 |
| 126 | T | V6 |
| 127 | T | scenarios.test.ts, V6 |
| 128 | C | fixed: only an open order is delivered (coordinator); V9 orders asserts the difference |
| 129 | C | C11 |
| 130 | T | scenarios.test.ts |
| 131 | C | exact round (C4) |
| 132 | T | pause: scenarios.test.ts |
| 133 | X |  |
| 134 | C | C17: the kitchen freezes at time up |
| 135 | T | rules.test.ts |
| 136 | T | rules.test.ts |
| 137 | T | rules.test.ts |
| 138 | I | the crate counter's front shows its ingredient's icon (sprite text from the board's icon sprites, `CoopKitchenKitBuilder.CrateIcon`); Play mode reads it (rung 3) |

### 11.4 Tests (`npm test`: 47 tests, all passing on portkit c971100; the kit's own 110 pass in the game's copy)

- `test/golden.test.ts` (8): the upstream C# compiled unchanged with dotnet 8 against `golden/UnityStubs.cs`, driven by
  `golden/Harness.cs`, written to `vectors/upstream.json`. V1 weighted pick (1,012 rolls), V2 waiting times, V3 tips
  (every value either side of each whole product), V4 can-plate, V5 matching and layout (all 3,905 sequences), V6
  plates (200 random sequences), V7 score (100 sequences): exact. V9 preparations (13 timelines: cut, pause, booster
  windows, cook, burn, cancel, take off, warnings) and V9 orders (cadence, cap, expiry, removal, plate returns, tips):
  event for event, within the upstream's own frame drift (each chained `WaitForSeconds` ends on the first frame past
  it). The two orders scenarios with deliveries are compared event for event too (since the review; before, only the
  deliveries and tips): the upstream's log with the 128 fix applied to it as the test writes it out, every order's
  creation, recipe and waiting time, every delivery, expiry, removal and plate return.
- `test/scenarios.test.ts` (13): three chefs deliver three orders; cutting with pause; the stove's burn sequence, its
  cancel and its stop; plating rules, trash, Need Plate, Wrong Plate, plate return, floor drop and grab; an order
  expires; pause and resume (who may resume, deadlines unmoved in game time, restart); the referee leaves mid-round
  (cooking, plate return and next order on time); a chef leaves holding a plate; a late joiner; two kitchens in one
  room; time up with the x1.25 booster, results and lobby; the tutorial with two chefs; a forged command refused.
- `test/rules.test.ts` (8): the E and Q cases the scenarios do not reach, on a RulesBench, and the key budget.
- `test/review.test.ts` (14), one or more per review finding, each failing on the code before its fix (11.8): credits
  and notices; reach; a later session's high score; a departing chef's item; VR releases to the floor; drops kept on
  the floor; forged effects; two Q presses and two E presses on one counter; two grabs of one item; pick-up and drop
  sounds where they happen; the pause panel; and PORT.md 9.2 #3 (500 random intents) and #12 (ten minutes of joins,
  leaves and referee losses).
- `test/reach.test.ts` (4), the referee's reach check (11.5, trust), each failing on the code before it: a far intent a
  modified client sends past its own check is refused (20 m, 4.9 m with a hand within 2 m, a far floor drop); an
  honest intent with the head 4.0 m away and a hand 1.9 m away counts, measured from the referee's head reading, and a
  Q whose chef walks off before it arrives is judged by where they were (an earlier reading); an
  unknown head, a reading that never comes and too many waiting intents are refused (at most 8 of one chef wait); a page
  that knows no position for its player sends nothing. Every chef in the Node tests now stands somewhere
  (`helpers.STAND`, 1.7 m from the kit's objects, which the fake room puts at the origin), and three older tests stand
  their chef by the floor spot they click (before, with no position known, every click counted)

### 11.5 Gaps and local workarounds (portkit not edited)

| Gap | Local workaround |
|---|---|
| The page cannot read remote players' heads every frame (portkit c971100 has `Networking.HeadOf`, a one-off reading the referee now uses for reach) | `Chef` (a per-player behaviour) publishes its player's head, rounded, only while they hold an item; others draw the held item there; a chef who leaves drops it there. It is the chef's own word, used only for drawing and for where a departing chef's item falls |
| No relay op for a slider or bar (8 bars) | the fill object's `localScale.x`, set by the page (rounded to 1 %) |
| The relay drives Animators only; every gameplay clip upstream is a legacy `Animation` (5.4) | the script sends `animPlay` with the clip's name; the kit builder must convert each legacy clip to an Animator state of that name (5.4, option 1) |
| No `Stop` for a looping AudioSource | the sizzle is a play-on-enable child switched by path |
| No op for a CanvasGroup's alpha (the tutorial text's fade) | the text hides when its fade would have ended |
| No hover event reaches the page | the highlight (109) is not done: open |
| portkit's new generic `ts/golden/UnityStubs.cs` returns the original from `Instantiate` and has no ActionCode, AwaitableCoroutine or nested-coroutine runner | the game keeps its own `golden/UnityStubs.cs` |
| `RulesBench` has no calling player and its `Storage` throws | `Kitchen.IntentFor(uid, ...)` beside `Intent`; `GameDataManager` falls back to an in-memory save |
| (closed) No kit yet | the kit is built (11.7); `tools/gen-bindings.ts` writes the contract the kit builder follows |
| (closed by portkit 812f285) `KitStage.Behaviour` took no id or per-player flag | the builder passes each behaviour's id and `perPlayer` from the contract (`Behaviour(go, type, fields, perPlayer, id)`); `gen-bindings.ts` no longer seeds the lock. `Chef` keeps `static perPlayer` too |
| Found in Play mode: the local chef's held item is drawn in front of their head, in the way of every desktop click (a click on it grabbed its pool slot and dropped the item) | `Kitchen.ts`: the slot of the item the local chef holds by a click, and of the ingredients on a plate they hold, goes to the Default layer (0) while held; a physical grab keeps its layer |
| (closed, portkit c971100) The referee took every chef's intent on its word: reach was checked on the clicking page only (trust, 11.8) | the referee asks its own app where a remote chef's head is (`Networking.HeadOf`, relay op `pkHead`) before it runs their intent, and refuses it unless the target was within `REACH` + `REFEREE_REACH_SLACK` (2 + 2.5 m) of that head at the nearest in the last `HEAD_HISTORY` = 3 s: that reading and the ones the referee takes of every remote chef 4 times a second (`PollHeads`; a query of its own app, no network message). The history is there because an intent can reach the referee a second or two after the click (it waits for the chef's earlier writes): the first Play-mode run refused an honest Q on a board, read 6.8 m away after the chef had moved on to the meat crate (`Kitchen.Intent`, `OnHead`, `TargetPoint`, `PollHeads`). It fails closed (no head reading in the last 3 s, none within `HEAD_SECONDS` = 2 s), keeps each chef's intents in order (one reading serves all of a chef's waiting intents), and lets at most 32 wait (8 of one chef). The clicking page fails closed too (`reachWhenUnknown: false`, `Input.InReach(p, 2, false)` in `Kitchen.Reaches`). `Chef`'s own head publishing stays: the others draw a held item at it and a departing chef's item falls there, which no head reading serves (it is not used for the check). Node: `test/reach.test.ts`; Play mode: rung 4's forced far intent |
| (portkit c971100, rebuild) | no game change needed and no workaround removed: the item a chef holds by a click still leaves the pointer layers, so the kit's new click events on grabbables (`BSPlayerEvents`) cannot reach it either (rungs 3 and 4 click past it as before) |
| Closed by the portkit re-sync (c7abead..1118ef0) | `networkCallable` lists on Kitchen and MatchManager; music pitch and volume through `audioPitch` / `audioVolume`; the effects volume through `PlayOneShot`'s volume scale; `GameObject.ReleaseGrab()` |

Unproven until the app (rung 5): grab and release on pooled kit objects, intent latency on Quest, how a held item
looks to the others.

### 11.6 Licence and where this goes

Port code is MIT and credits Hyago Oliveira's MIT code. It is published from a fresh repository (`coop-kitchen-port`,
not a fork) because the upstream repository carries assets that must not be republished (6.3 D, E). Nothing of the
upstream's art, models, sounds, textures, fonts or plugins is in `altspace/`; `data/kitchen-data.json` holds data
values from the upstream's ScriptableObject YAML (numbers, names, icon names) only. The art is KayKit (CC0), 11.7.

Attribution, as decided by the owner: "based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos (MIT)",
with the copyright line, on the credits panel, in the manifest's description, the kit's notices and the script's
banner. The MIT licence's own condition (the copyright and permission notice in copies) is met by the full text: in the
script's banner (`ts/script-header.txt`), in the bundles (`Assets/Kit/Licenses/KitchenChaos-LICENSE.txt`) and at the
repository root. The bundles also carry portkit's MIT text, the CC0 1.0 legal code (downloaded 2026-11-25 from
https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt, plain text checked), the KayKit and Kenney licence
files and Liberation Sans's OFL (added by the kit build). No shipped text names the upstream's title in bold or the
course whose art the upstream credits; this analysis (sections 1 to 10) keeps those names.

### 11.7 The kit (Unity phase, 2026-11-24)

The Unity project is `altspace/` itself (made with `portkit/tools/new_project.sh coop-kitchen <this folder>`, Play-mode
page port 43600). No upstream asset is imported and the portkit importer is not used: the kit is **built from data**
by `Assets/Kit/Editor/CoopKitchenKitBuilder.cs`.

- **The contract.** `ts/tools/gen-bindings.ts` (`npm run bindings`) writes `Assets/Kit/Editor/kit-contract.json`: every
  object key and path, the refs, the 60 behaviours with their fields and the 54 events the TypeScript expects. It also
  seeds `Assets/Kit/Editor/bindings.lock.json` with the behaviour ids the code and tests use (`kitchen`, `ct_<cell>`,
  ...), so the kit builder's ids are those and not `b1`, `b2`. The builder makes the art at those paths and hands the
  contract to portkit's `KitStage`; the real `ts/bindings.json` it writes therefore has the same keys, paths and
  fields as the provisional one, plus its hash. Behaviours without an object of their own (the managers, the
  per-player `Chef`) sit on one empty object, `Logic`.
- **Layout.** Every counter cell of the upstream Game scene (`data/kitchen-data.json`, `layouts.game`, 34 cells) at
  0.64 scale around the ring's centre (0.25, -1.25): a cell is 0.96 m, a counter top 0.90 m. `door` (default west)
  switches `Counter_Normal_10` off at run time, as `Kitchen.Start` already did.
- **Gaps worked around in TypeScript (11.5), the Unity side they assume:** held items are drawn at the holder's
  published head position (nothing in the kit; the pool slots are moved by the page); progress bars are a `Bar/Fill`
  object whose pivot is the bar's left edge with a `Quad` child half a bar to the right, so scaling `Fill` along x
  fills from the left (8 bars: 2 boards, 2 stoves, 3 tickets, the timer); the sizzle is `Stove/Pan/SizzleAudio`, an
  AudioSource with the loop clip, play-on-awake, saved switched off; the tutorial text has no fade (it hides); the
  highlight (109) stays open.
- **A change to the TypeScript:** the knife is Q's click target (`q_<cell>` = `CuttingBoard/Knife`) and was also what
  the board switched on and off, so a cut could not be started once the knife hid under an item. The board now
  switches `CuttingBoard/Knife/Model`; the object with the click collider stays.

**Art (owner's decision: KayKit).** Models from KayKit Restaurant Bits (Kay Lousberg, CC0), downloaded into
`C:\workspace\AltspaceGames\_downloads\coop-kitchen\` first (OBJ, MTL and PNG checked by type), and only the 27 used
copied to `Assets/Kit/Art/KayKit/`. One URP Simple Lit material with the pack's atlas (256 px).

| Upstream | KayKit model | Note |
|---|---|---|
| plain counter, plate counter | `kitchencounter_straight_A` | stretched to 0.96 x 0.90 x 0.96 m |
| plate stack | `kitchencounter_straight_B` + a dark ring | |
| corner | `kitchencounter_outercorner` | |
| crate counters (5) | counter + `crate_buns`, `crate_lettuce`, `crate_cheese`, `crate_steak`, `crate_tomatoes` + `crate_lid` | the lid is the upstream door: it opens and closes |
| cutting board, knife | `cuttingboard`, `knife` | |
| stove | counter + `stove_single_countertop` + `pan_A`, a red knob (Unity cylinder) on the front for Q | |
| trash | `jar_C_large`, widened | **closest match**: Restaurant Bits has no bin |
| delivery counter | `kitchencounter_straight_B` tinted blue, `menu`, a DELIVER sign | |
| floor | `floor_kitchen` tiles | |
| Bread | `food_ingredient_bun_bottom` | **closest**: a bottom bun (upstream: a bun that the rest sits on) |
| Cabbage, Cabbage_Sliced | `food_ingredient_lettuce`, `food_ingredient_lettuce_slice` | **closest**: lettuce for cabbage |
| Cheese, Cheese_Sliced | `food_ingredient_cheese`, `food_ingredient_cheese_slice` | |
| Meat, Meat_Cooked, Meat_Burned | `food_ingredient_burger_uncooked`, `_cooked`, `_trash` | |
| Tomato, Tomato_Sliced | `food_ingredient_tomato`, `food_ingredient_tomato_slice` | |
| Plate | `plate` | items at 0.674 m per KayKit unit: a plate is 0.64 m, upstream's 1 m at kit scale, so the recipe layouts (`lp`) fit |
| ingredient icons (sprite tags) | pictures of the ten models above, rendered by the builder into a TextMesh Pro sprite asset (`Assets/Kit/Icons/`), names as upstream's icon files | upstream's icons are not used |

Sounds: Kenney Interface Sounds and Impact Sounds (CC0), the sizzle loop made here; no music (THIRD-PARTY-NOTICES.md).
Font: Liberation Sans (OFL), TextMesh Pro's default.

**Animations made (the 22 upstream legacy clips are not imported).** Animator controllers written by the builder, one
state per name the TypeScript sends with `animPlay`, the first state the default; every state's speed follows the
float parameter `Speed` (1), which `Stove@Burning` sets to 2 (`animFloat`).

| On | States | Motion |
|---|---|---|
| each crate counter | `Idle`, `IngredientCounter@Open` (0.5 s) | the lid swings 75 degrees open about its back edge and closes |
| each cutting board | `CuttingBoard@Idle`, `CuttingBoard@Cutting` (loop, 0.25 s) | the knife model chops (35 degrees up and down) |
| each stove | `Stove@Idle`, `Stove@Heatting` (0.5 s), `Stove@WaitBurning` (loop 0.33 s), `Stove@Burning` (loop 0.17 s) | the pan jiggles, harder when burning |
| trash | `Idle`, `Trash@DropItem` (0.52 s) | the bin squashes and springs back |
| board: countdown, timer, times up, tickets | `CountDown@CountDown`, `Timer@FinalSecondsCountDown`, `TimesUp@Show`, `OrderTicket@Delivered` / `@Failed` (loop) | scale pulses |
| tutorial arrows | `TutorialArrow@Idle` (loop) | bounces |

The delivery and preparation floating texts ("Need Plate!", "+NN Tip!", "Wrong Plate!", "Cannot Cut") are shown and
hidden by the page (`Kitchen.Flash`), as before; they have no animation.

**Play mode (rungs 3 and 4) showed in Unity, beyond the Node tests:** 3 (COOK, PLAY on the board), 16, 17, 20 (crates
and counters by real clicks), 30 to 34 and 36 (plating an X Burger; the plate drawn with its three ingredients), 37
(plate icons as sprite text), 38 and 40 (Q on the knife; the knife chops, the bar shows), 46 and 47 (Q on the knob;
the sizzle loop switched on), 59 and 75 (a delivery and its tip), 70 (the ticket's name and icons), 76 (the score on
the board), 86 (the pause panel, and a pause by one chef on the other's board), and late join by reload. Since the
review (2026-11-25, rung 3 37/0 and rung 4 51/0, each twice): 138 (the crate's icon), the credits text, the 2 m reach
(a click from 3 m does nothing), a floor drop lying on the floor, and two chefs pressing Q, then E, on one board at the
same moment (C2's stale intents). Counts in 11.3: T 89, I 29, C 6, X 13, O 1; 12 of the 29 I items are seen in Play
mode (4 of them only in part: no test reads an Animator state or hears a sound).

**Still unverified** (only the app or a headset can show them, rung 5): hand grabs and releases on the pool slots,
laser clicks, held items as others see them, latency on Quest, frame time with 48 items, the sounds, the Animator
motions as seen, the reach as people feel it; and in Play mode the burn sequence, tutorial, expiry, time up, results,
trash, Sounds panel and a chef or referee leaving, which only the Node tests cover.

**Cosmetic, known:** the board's panels all stand switched on in the prefab (the script shows one at a time), so the
kit photo shows them overlapping; the score label touches the first ticket's bar; plate icons face one way (a
billboard needs the camera, which the graph allow list does not reach).

### 11.8 The review (2026-11-25): what was fixed, and trust

The independent review (`REVIEW-FINDINGS.md`, coop-kitchen) and how each finding ended. Node tests are in
`test/review.test.ts` unless named otherwise; each failed on the code before its fix.

| # | Finding | Now |
|---|---|---|
| 1 | Shipped texts named the course art's author and showed the upstream title in bold | Fixed: credits, notices in the kit, script banner and manifest description use "based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos (MIT)"; no bold title, no course-art credit (test "credits and notices") |
| 2 | No reach: chefs clicked anything from anywhere | Fixed: 2 m from the head or hands (C2); Node test "reaches", Play mode (rung 3) "a click on a crate 3 m away does nothing" |
| 3 | High scores stopped saving in later sessions (rounds checked by number, which starts at 1 again) | Fixed: rounds are named by their start time (`MatchRec.id`) |
| 4 | A leaving chef's item fell at the world's origin | Fixed: the last position seen is kept (`Kitchen.lastHead`); with none, the kitchen's floor centre. The test puts the chef away from the origin, where the kit's objects stand in the fake room, so the two cannot be confused |
| 5 | VR releases floated at hand height | Fixed: drops land on the floor below the point (`Kitchen.OnFloor`); Play mode checks a floor drop's height |
| 6 | Two chefs at one counter: two Q presses started and paused a board; intents named a counter, not what was on it; lost VR grabs were never released | Fixed: intents carry what the chef saw (`Kitchen.Seen`) and a stale one does nothing; a grab the referee gave elsewhere is let go (`Kitchen.CheckGrabs`); PORT.md 9.2 #2, #3, #12 built; 9.5's "both clicking the same item" run in Play mode (rung 4) |
| 7 | Music items 6, 81, 108 marked implemented though no music ships | Fixed in 11.3: 6 and 108 are X, 81's note says the pitch is left out |
| 8 | MIT permission notice and Liberation Sans's OFL not shipped | Fixed: `Assets/Kit/Licenses/` (upstream MIT, portkit MIT, CC0 legal code), the OFL added by the kit build, the MIT text in the script's banner (11.6) |
| 9 | `MainMenu.ts` overwrote the builder's fuller credits | Fixed: one text, `MainMenu.CREDITS`, carried to the builder by `kit-contract.json` |
| 10 | `OnFx` callable by anyone; drop coordinates unchecked | Fixed: only the current referee's effects play; drops are kept inside the kitchen's floor. What stays open is below (trust) |
| 11 | Any chef could Restart or End during another's pause | Fixed: the resume rule (the chef who paused, the referee, or any chef once the one who paused has left) |
| 12 | Golden orders scenarios compared only deliveries and tips | Fixed: event for event (11.4); a plate return moved by 0.5 s now fails it (checked), and passed before |
| 13 | PORT.md stale: course art (top, 8.5), VR push triggers, the crate's icon, sounds at the kitchen's centre | Fixed: the text (top, 8.4, 8.5, C2, C15); the crate's icon built (138); pick-up and drop sounds now play at the counter acted on or nearest the spot (test "pick-up sounds"; before, every one from the floor's speaker in the middle) |
| 14 | Kit copy at 6c2033b | Re-synced to portkit 812f285, then to c971100 (rebuilt, rungs 0 to 4 passed again) |

**Trust: what a modified client can still do, compared with upstream.** Upstream is one program on one machine; every
rule runs where the player is, and nothing is shared. Here the referee's client runs the rules for everyone (C3), and
the runtime's trust rules apply (portkit README, "Trust" and "Referee"):

- **Reach is checked by the referee too, with some slack.** Since portkit c971100 the referee asks its own app where a
  remote chef's avatar is (`Networking.HeadOf`: the app's placing of the avatar, not the chef's word) and refuses an
  intent whose target is more than 4.5 m from that head (2 m reach + 2.5 m for an arm, a counter's size and a remote
  avatar's lag; `REFEREE_REACH_SLACK`) at the nearest that head came to it in the last 3 s, or when its app knows no
  head for the chef. A modified client therefore gains up to 2.5 m of arm and 3 s of memory: from the middle of the
  kitchen it can still reach the counters near the middle of the long sides, and it can act on a counter for 3 s
  after walking past it, but not on the kitchen's ends or anything from outside it. A forged head does not help: the chef's
  published head (`Chef`) is only used for drawing. It cannot act outside the rules (intents run the upstream rule on
  the referee), nor drop an item outside the kitchen's floor or far from where it stands. An honest chef who clicks
  within a moment of a long teleport can be refused (the referee's app has not placed the avatar there yet); clicking
  again works.
- **Synced state is public space state.** As with VRChat's synced variables, a modified client can overwrite the
  kitchen's leaves (items, orders, score, the match and the kitchen's best) directly; everyone then sees it until the
  referee writes that leaf again. The referee does not re-check its own leaves against tampering.
- **The referee seat.** Under the default election a modified client can take the seat (no server decides it) and then
  run the kitchen as it likes: a modified referee can change any rule, play any effect and drop anything anywhere.
- **Its own device.** The high score is in the device's own storage; a modified client can set its own, as upstream's
  save file can be edited.
- What it can no longer do (since this review): make others hear or see effects (only the referee's play), drop items
  outside the kitchen, or restart or end a round another chef paused.
