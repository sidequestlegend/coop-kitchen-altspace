# coop-kitchen ("Co-op Kitchen", working title): test evidence

Everything here ran on Windows, Unity 6000.3.21f1, Creator SDK 4.0.29, in the Unity editor: first on 2026-11-24, and
again on 2026-11-25 after the re-sync to portkit 812f285 and the review's fixes (PORT.md 11.8), and a third time on
2026-11-25 after the re-sync to portkit c971100 (no game code changed: rebuild only); the numbers below are from the
third pass. Nothing ran in the Altspace app, on a Quest, or with controllers (rung 5: not run; worlds stay
Private).

How to run each rung again (from `C:\workspace\AltspaceGames`, with an editor slot and the editor open):

```
cd coop-kitchen-port/altspace/ts && npm test                                       rungs 0 and 1
cd coop-kitchen-port/altspace/ts && npm run bindings                               the kit contract (only after changing the layout or behaviours)
portkit/tools/remote.sh coop-kitchen-port/altspace menu "PortKit/Kit/Build Prefabs"  then npm run build, Build Bundles, touch a script, compile
portkit/tools/remote.sh coop-kitchen-port/altspace menu "PortKit/Kit/Check"          rung 2 (Logs/portkit_check.txt)
portkit/tools/playtest.sh coop-kitchen-port/altspace coop-kitchen-port/altspace/playtest/single.json coop-kitchen   rung 3
portkit/tools/remote.sh coop-kitchen-port/altspace menu "PortKit/Multiplayer/Activate Player 2"
portkit/tools/playtest.sh coop-kitchen-port/altspace coop-kitchen-port/altspace/playtest/multi.json coop-kitchen    rung 4
```

## Page script on portkit 552622c, 2026-11-25 evening

Re-synced `ts/portkit` and the package to portkit `552622c`. That commit includes `425bd55`: the page loads kit
items one at a time, because overlapping loads lost relay graphs and Variables in the app. It also includes
`0880bf5`: a referee claimant starts only once its claim has stood for 1.5 s, which fixes the equal-term double
claim, and user-state flushes go one at a time. The bundles are unchanged from the rebuild below. `npm test`:
**48 of 48** (0 failed). `npm run build`: 564899 bytes. Export Artifacts -> `dist/`: 12 files (7 licence texts), footprint 10.93 x 3.19 x 7.68 m, bindings 4cbdd4350c00ecc46b2e12f2ae74ebebc947ac55.

## Held items and pushing, 2026-11-25 evening (portkit 476075d)

A held item is drawn 0.45 m in front of the holder's head and 0.3 m below it (`Kitchen.HandPosition`), and it moves
there every frame. While it is held, the holder's copy is on the Default layer (`SetHeldSlots`), and a remote holder's
item sits 0.3 m under their head. Its 0.5 x 0.28 x 0.5 box was solid, so it could shove the holder, and anyone near a
remote holder. This is the same kind of fault as world 9d7311's moving solid colliders: hidden-role's panel and
rp-toolkit's head label. The kit now makes every item slot's box a **trigger** (`CoopKitchenKitBuilder.Items`).
Clicks and grabs still find it: the SDK's click rays and the desktop grab both take triggers on layers 5 and 20, and
the app's hand grab uses `OverlapSphere(..., QueryTriggerInteraction.Collide)`. Physics never holds an item up,
because the page places every item and drops snap to a counter or the floor. Re-synced to portkit `476075d`, which
also gives any world-space canvas a trigger box of its own.

- rung 0/1: `npm test` **48 of 48** (47 before). New: `test/push.test.ts`, which checks that all 48 item slot colliders
  in the built prefab are triggers. It failed on the kit built before.
- rung 2: Check all PASS (graphs, 186 bindings `4cbdd435`, the new canvas colliders line, both bundles). Android
  1,620 KiB, Windows 2,236 KiB. Script 562,082 bytes.
- rung 3: **38 passed, 0 failed** (37 before). New push check with a cheese in hand: `standstill 5` returned "ok still:
  body moved 0.000 m, player moved 0.000 m, touched none". All the click and E/Q steps still work on the trigger items.
- rung 4: **57 passed, 0 failed**, 0 console errors.
- `dist/` exported (12 files, footprint 10.93 x 3.19 x 7.68 m).

## Rung 0: static

`npm run typecheck` (tsc, strict) and `npm run lint`: clean (`lint: src, portkit/src clean (page and clock rules)`).

## Rung 1: Node (no Unity)

`npm test` in `altspace/ts`, on the kit builder's real `bindings.json` (hash `4cbdd4350c00ecc46b2e12f2ae74ebebc947ac55`):
**47 tests, 47 pass, 0 fail** (about 20 s). 8 golden-vector tests against the upstream C# compiled with dotnet 8 (V1 to
V7 exact, V9 timelines within the upstream's own frame drift; the orders scenarios with deliveries now event for event,
the fix of checklist 128 applied to the upstream's log as written in the test), 8 rules tests on a RulesBench, 13
multi-client scenarios on the fake room (three chefs deliver; cutting and its pause; the burn sequence; plating rules;
expiry; shared pause; referee loss mid-round; a chef leaving with a plate; a late joiner; two kitchens in one room; time
up and results; the tutorial with two chefs; a forged command refused), 4 reach tests (`test/reach.test.ts`, below), and
14 review tests (`test/review.test.ts`, each
failing on the code before its fix: run with the fixed sources stashed, 12 of the 14 failed, the other two being the new
soak tests of PORT.md 9.2 #3 and #12, which pass on both). Details in PORT.md 11.4 and 11.8. On portkit c971100 the 43
passed unchanged, and the kit's own tests in the game's copy (`node --test "portkit/test/*.test.ts"`) give 110 pass,
0 fail.

**The referee's reach check (2026-11-25, PORT.md 11.5 and the trust note in 11.8):** `test/reach.test.ts`, 4 tests,
each failing on the code before the check (run against the old `Kitchen.ts` and `index.ts` with only the new names
added, so that the tests load: all 4 fail on their assertions, a far intent taking the cheese, or on the missing check
record). A modified client's far intent, sent past its own page's check, is refused (20 m; 4.9 m from the head with a
hand within 2 m; a far floor drop); an honest intent with the head 4.0 m away and a hand 1.9 m away counts, measured
from the referee's head reading, and a Q whose chef walks off before it arrives is judged by an earlier reading; an
unknown head, a reading that never comes and too many waiting intents are refused (at most 8 of one chef wait); a page
that knows no position for its player sends nothing. Every chef in the Node tests now stands somewhere
(`test/helpers.ts`, `STAND`), and three older tests (review "never lands outside the floor" and "a pick-up sounds",
scenario "plating rules") stand their chef by the floor spot they click: with no position known, every click used to
count, and now none does.

## Rung 2: the kit in edit mode (`PortKit/Kit/Check`)

```
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS coop-kitchen bindings: 186 objects resolve by path; hash matches (4cbdd4350c00ecc46b2e12f2ae74ebebc947ac55)
PASS coop-kitchen android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 524/6978, behaviours 488, scripts 10, ...
PASS coop-kitchen windows bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 524/6978, ...
DONE
```

The kit (`Logs/portkit_kits.txt`): 2,285 objects (2,275 before; the ten crate icons are new), 186 bound (48 grabbable
pool slots, 59 clickable), 92 refs, 60 behaviours (ids and `perPlayer` now passed to portkit's `KitStage`), 54 events;
relay graph 620 units (565 on 812f285; the kit's new `pkHead` op), 52 distinct members (49), all on the SDK allow list
of 29,061. The bindings hash is unchanged by the c971100 rebuild. The bundles gain 97 objects and 96 behaviours, two
new components on each of the 48 grabbable pool slots (the kit's `BSPlayerEvents` for clicks on grabbables and the
per-target launch variables), one new script type. Bundles: Android 1,620 KiB (1,600 on 812f285, 1,586 before), Windows
2,234 KiB (2,231, 2,215 before), each with the third-party notices and the licence texts inside
(`Logs/portkit_bundles.txt`: `LICENSE-KayKit-Restaurant-Bits.txt`, `LICENSE-Kenney-Impact-Sounds.txt`,
`LICENSE-Kenney-Interface-Sounds.txt`, `CC0-1.0-legalcode.txt`, `KitchenChaos-LICENSE.txt`, `portkit-LICENSE.txt`,
`LiberationSans - OFL.txt`).

Artifacts (`PortKit/Kit/Export Artifacts`, `altspace/dist/`, not committed): `android/coop-kitchen`,
`windows/coop-kitchen`, `pk-coop-kitchen.js`, `coop-kitchen.jpg`, `coop-kitchen.snippet.html` (the game's settings,
`position="0 0 0"`, a box gizmo 11.3 x 7.7 m), `manifest.json` (checks android PASS, windows PASS; footprint
10.93 x 3.19 x 7.68 m, now counting world-space uGUI), and since c971100 `licenses/coop-kitchen/` with the seven licence
texts.

## Rung 3: Play mode, one player (`playtest/single.json`)

A hand-written `<bs-snippet name="coop-kitchen" ... seed="1">` (the seed makes the first order an X Burger) with the
built script and the bundles from the test's local server, and `Assets/WebRoot/playtest/kitchen-playtest.js`, which
drives the kitchen through the SDK's desktop player with portkit's InputSim (the SDK casts its own rays and raises
the clicks) and reads Unity back with the `probe` command (`Logs/portkit_playtest_kitchen-single.txt`, copied to
`playtest/evidence_single.txt`). **RESULT 37 passed, 0 failed; 0 console error lines, twice in a row** with the
referee's reach check and the fail-closed page (2026-11-25), and before them on the bundles
rebuilt on portkit c971100 (2026-11-25, `--keep-play` between the runs; the same 37 on 812f285; the first pass on
2026-11-24 had 32 checks). Since the review a chef's reach is 2 m, so the test
stands the desktop player at each counter before clicking it (InputSim `place`, and the page's own `TeleportTo`, which
the runtime hears as `player-teleported`). Pictures (from the first pass):
`playtest/evidence_single_plated.jpg` (the X Burger on its plate beside the board and stove),
`playtest/evidence_single_delivered.jpg` (the board after the delivery: score 31, "+11 Tip!").

```
PASS the kit loads from a hand-written bs-snippet and the instance starts
PASS the kitchen is in the scene: pool slots off, the west doorway open: holder True, slot 47 active False, doorway counter active False, stove True
PASS a fresh kitchen is in the lobby with two plates on their counters: lobby, plates [-1,-1]
PASS both plates are drawn in Unity (pool slots on, their Plate child on): ["ok","ok"]
PASS the board shows the lobby: True
PASS COOK takes a chef's place (board button, real mouse)
PASS the roster text reached Unity: Blue: Main Editor
PASS PLAY starts the countdown
PASS the round starts after the countdown: round
PASS the first order is an X Burger (seed 1) and its ticket shows: {"id":1,"r":2,...,"wait":93,...}, ticket 'X Burger'
PASS the ticket's ingredient icons reached Unity: <sprite name="Bread"><sprite name="CheeseSlice"><sprite name="MeatPattyCooked">
PASS the cheese crate shows its ingredient's icon (checklist 138): <sprite name="CheeseBlock">
PASS the credits panel carries the script's text: the MIT attribution, KayKit, Kenney, the font: <b>Co-op Kitchen</b> (working title) ...
PASS a click on a crate 3 m away does nothing (a chef reaches 2 m): hand null
PASS take a cheese from its crate
PASS put the cheese on the cutting board
PASS Q on the knife starts cutting: the knife shows and chops, the bar shows: knife before False, while cutting True, bar True
PASS take a meat from its crate
PASS put the meat on the stove
PASS cooking starts: the stove's sizzle loop is switched on (Q on the knob): True
PASS the cheese is cut into a slice: {"id":"i5","k":4}
PASS take the slice / plate the slice / take bread / plate the bread
PASS the meat is cooked: {"id":"i7","k":6}
PASS take the cooked meat off the stove / plate the meat: an X Burger
PASS the plate is drawn on its counter with three ingredient icons (pool slot 1): plate True, icons '<sprite name="CheeseSlice"><sprite name="Bread"><sprite name="MeatPattyCooked">', slot -2.880 1.040 3.360, top -2.880 0.900 3.360
PASS pick up the plate
PASS deliver it at the delivery counter
PASS the score shows the delivery and its tip (20 + tip), on the board in Unity: score 30, board '30'
PASS take bread for the floor
PASS a floor click drops the held item on the floor where clicked (state and Unity): clicked 0.96 0.00 1.89, state [0.96,0,1.89], drawn at 0.960 0.140 1.890
PASS Pause pauses the round / the pause panel shows: True / Resume carries on
```

**Found by Play mode and fixed (TypeScript, `Kitchen.ts`):** the item a chef holds is drawn just in front of their
head, so on a desktop it sat in the path of every click: the first run's "put the cheese on the board" clicked the
held cheese (a grab of its pool slot), which the game read as "let go here" and dropped it on the floor. The local
chef's held item, and the ingredients on a plate they hold, now leave the pointer layers (Default, layer 0) while
held by a click; a physical grab keeps its layer. Also found: checks that read Unity right after the page's state
changed can run a tick ahead of the relay; the test now polls those probes for up to 4 s.

## Rung 4: two Local Multiplayer players (`playtest/multi.json`)

The main editor and a Multiplayer Play Mode clone (`PortKit/Multiplayer/Activate Player 2`) open the same page. Both
press COOK. The player whose session id sorts first ("lead", Player 2 in this run) presses PLAY, puts bread on the
plate and delivers; the other ("second", the main editor) cuts the cheese and cooks the meat and plates both on the
lead's bread, then pauses and resumes, then reloads its page. The pages exchange the score they see and their state
digests as one-shots (which the runtime ignores). Since the review, before the reload, both chefs also act on one
board at the same wall-clock moment named by the lead (both players run on this machine; the clicks landed 47 to 116 ms
after it in the c971100 run kept as evidence): Q on a board holding a cheese, then E on it holding the slice (PORT.md
9.5 "both clicking the same item"). **RESULT 57 passed, 0 failed; 0 console error lines, twice in a row** with the
referee's reach check (2026-11-25, `--keep-play` between the runs; `playtest/evidence_multi.txt`, the second run: the
digests after the reload agree, `c9ac9b6b`). Before the check: 51 passed twice on the c971100 bundles and on 812f285,
41 in the first pass.

The six new checks: after the races, the page that is not the referee (Player 2 in these runs; the main editor is the
referee) stands at the bread crate and, past its own reach check (`debug.forceIntent`, as a modified page would), sends
E on the crate farthest from it (CabbageCounter_01, 7.50 m); its hand stays empty, and the remote referee refuses it
from its own app's reading of Player 2's head (`[0.96,1.6,2.39]`, 7.499 m, "at most 4.5"), the only refusal of the run,
while it let Player 2's 12 logged honest intents through by the same check (for example the E race on CutCounter_01,
1.196 m). The first run with the check (not counted) failed 9: the referee refused an honest Q on a board, read 6.83 m
away, because the intent arrived after the chef had moved on to the meat crate; the referee now judges an intent by
the nearest of its readings of the chef's head over the last 3 s (PORT.md 11.5).

```
[main] PASS two players in the room
[main] PASS both players are chefs, on both pages: {"ea71...":0,"0f2b...":1}
[vp] PASS PLAY starts the round for both            [main] PASS the round runs on this page: round
[vp] PASS lead: take bread / plate the bread         [main] PASS second: take a cheese / put it on the board / take a meat / put it on the stove
[main] PASS second: the cheese is cut / take the slice / plate the slice on the lead's bread
[main] PASS second: the meat is cooked / take the meat / plate the meat
[vp] PASS the other chef's slice and meat arrive on the plate (seen here): [0,4,6]
[vp] PASS lead: pick up the plate / deliver the X Burger
[main] PASS the other chef's delivery shows in the score here (state and board): 30 / 30, board '30'
[vp] PASS the delivery updates the score on the other page too: 30 there, 30 here, their board '30'
[main] PASS second: pause the round                  [vp] PASS a pause by the other chef shows here (pause panel on): paused true, by ea71..., panel True, 'Paused by Main Editor'
[main] PASS second: resume (the chef who paused)     [vp] PASS the other chef's resume arrives here
[main] (the second chef reloads its page)
[main] PASS the kit loads ... / the kitchen is in the scene (again) / two players in the room
[main] PASS after reloading, this page sees the running round and the score (late join): round, score 30
[main] PASS the reloaded page draws the kitchen as it is: score on the board, a plate on its counter: board '30', plate counter {"id":"i1","k":-1}
[vp] PASS after reloading, the other page sees the score (late join): 30 / 30
[vp] PASS both pages reach the same state digest after the reload: de25a7c7
[main] PASS two chefs press Q on one board at once: it cuts, and the second press does not pause it: {"p":1,"ps":0,"burn":false}
[vp] PASS two chefs press Q on one board at once: it cuts, and the second press does not pause it: {"p":1,"ps":0,"burn":false}
[main] PASS two chefs press E on one board at once: exactly one takes the slice: ["hand:ea71..."]
[vp] PASS two chefs press E on one board at once: exactly one takes the slice: ["hand:ea71..."]
[vp] PASS a counter far across the kitchen to aim at: CabbageCounter_01 7.50 m
[vp] PASS a far E sent past this page's own check changes nothing here (no ingredient taken): CabbageCounter_01 at 7.50 m, hand null
[main] PASS the other chef sends a far intent
[main] PASS as the referee, this page refuses the other chef's far intent, from its own app's reading of their head: {"target":"c:CabbageCounter_01","head":[0.96,1.6,2.39],"age":0,"distance":7.499,"ok":false,...}, their hand null
[main] PASS as the referee, this page let the other chef's honest intents through by the same check: 12 passed, e.g. {"target":"c:CutCounter_01","head":[0.96,1.6,-2.39],"distance":1.196,"ok":true}; refused 1
[vp] PASS the remote referee says it refused the far intent
```

Artifacts (`PortKit/Kit/Take Photos`, `PortKit/Kit/Export Artifacts`, 2026-11-25, portkit c971100): `dist/` with the bundles
(Android 1,658,926 bytes, Windows 2,287,945; 1,638,799 and 2,284,148 on 812f285), `pk-coop-kitchen.js` (553,599
bytes, 540,780 on 812f285; the upstream's MIT notice and portkit's in its banner), the photo, the snippet markup,
`licenses/coop-kitchen/` (the seven licence texts, new in c971100) and `manifest.json` (checks android PASS, windows PASS; its description uses
the decided attribution).

## What remains unverified

- **Everything in the app and in a headset (rung 5):** grabbing items with a hand and letting go over counters, the
  plate and the trash (`Kitchen.GrabSlot` / `DropSlot`; covered in Node only); laser clicks; how a held item looks to
  the others (drawn at the holder's published head position: in Play mode only the local view was seen); intent
  latency on Quest; frame time with a full pool of 48 items; audio fall-off and the relay `audio` op (records checked
  in the fake room; nobody listened in Play mode); the Animator states (they are in the bundles and the relay sends
  `animPlay`, but no test reads an Animator's state).
- **In Play mode, not run:** the burn sequence, the tutorial, an order expiring, time up and the results panel,
  trash, wrong plate, the Sounds panel (the Credits panel's text is read, the panel not opened), `door="east"`, two
  kitchens in one page, a referee leaving, a chef leaving with an item, a later session's high score, forged effects
  or intents, VR grabs racing (all covered by the Node tests on the fake room).
- **Reach in VR:** measured from the nearest of head and hands; in Play mode only the desktop head (and teleports) was
  used. The 2 m value is a judgement (PORT.md C2), not tested with people. The referee's 2.5 m slack and 3 s of head
  readings are judgements too: in Play mode both players run on one machine, so the app's placing of a remote avatar
  was barely late; over the internet and on Quest it is later, and an honest chef may be refused more often.
- **Where pick-up and drop sounds play** (the counter acted on): checked as relay records in Node; nobody listened.
- **The highlight (checklist 109)** is not done: no hover event reaches the page.
