# coop-kitchen ("Co-op Kitchen", working title): test evidence

Everything here ran on 2026-11-24 on Windows, Unity 6000.3.21f1, Creator SDK 4.0.29, in the Unity editor. Nothing ran
in the Altspace app, on a Quest, or with controllers (rung 5: not run; worlds stay Private).

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

## Rung 0: static

`npm run typecheck` (tsc, strict) and `npm run lint`: clean (`lint: src, portkit/src clean (page and clock rules)`).

## Rung 1: Node (no Unity)

`npm test` in `altspace/ts`, on the kit builder's real `bindings.json` (hash `f93517c85d18ae6ae3c5a1b53c97a9905ba8f23b`):
**29 tests, 29 pass, 0 fail**. 8 golden-vector tests against the upstream C# compiled with dotnet 8 (V1 to V7 exact,
V9 timelines within the upstream's own frame drift, the fix of checklist 128 asserted as a difference), 8 rules tests
on a RulesBench, 13 multi-client scenarios on the fake room (three chefs deliver; cutting and its pause; the burn
sequence; plating rules; expiry; shared pause; referee loss mid-round; a chef leaving with a plate; a late joiner;
two kitchens in one room; time up and results; the tutorial with two chefs; a forged command refused). Details in
PORT.md 11.4.

## Rung 2: the kit in edit mode (`PortKit/Kit/Check`)

```
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS coop-kitchen bindings: 186 objects resolve by path; hash matches (f93517c85d18ae6ae3c5a1b53c97a9905ba8f23b)
PASS coop-kitchen android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 417/6834, behaviours 382, scripts 9, ...
PASS coop-kitchen windows bundle: PASS Kind=Pass Reasons=[] Reports=[] ...
DONE
```

The kit (`Logs/portkit_kits.txt`): 2,275 objects, 186 bound (48 grabbable pool slots, 59 clickable), 92 refs, 60
behaviours, 54 events; relay graph 519 units, 49 distinct members, all on the SDK allow list of 29,061. Bundles:
Android 1,586 KiB, Windows 2,215 KiB, each with the third-party notices inside.

Artifacts (`PortKit/Kit/Export Artifacts`, `altspace/dist/`, not committed): `android/coop-kitchen`,
`windows/coop-kitchen`, `pk-coop-kitchen.js`, `coop-kitchen.jpg`, `coop-kitchen.snippet.html` (the game's settings,
`position="0 0 0"`, a box gizmo 11.3 x 7.7 m), `manifest.json` (checks android PASS, windows PASS).

## Rung 3: Play mode, one player (`playtest/single.json`)

A hand-written `<bs-snippet name="coop-kitchen" ... seed="1">` (the seed makes the first order an X Burger) with the
built script and the bundles from the test's local server, and `Assets/WebRoot/playtest/kitchen-playtest.js`, which
drives the kitchen through the SDK's desktop player with portkit's InputSim (the SDK casts its own rays and raises
the clicks) and reads Unity back with the `probe` command (`Logs/portkit_playtest_kitchen-single.txt`, copied to
`playtest/evidence_single.txt`). **RESULT 32 passed, 0 failed; 0 console error lines.** Pictures:
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
PASS the score shows the delivery and its tip (20 + tip), on the board in Unity: score 31, board '31'
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
digests as one-shots (which the runtime ignores). **RESULT 41 passed, 0 failed; 0 console error lines**
(`playtest/evidence_multi.txt`).

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
[vp] PASS both pages reach the same state digest after the reload: 28a63673
```

## What remains unverified

- **Everything in the app and in a headset (rung 5):** grabbing items with a hand and letting go over counters, the
  plate and the trash (`Kitchen.GrabSlot` / `DropSlot`; covered in Node only); laser clicks; how a held item looks to
  the others (drawn at the holder's published head position: in Play mode only the local view was seen); intent
  latency on Quest; frame time with a full pool of 48 items; audio fall-off and the relay `audio` op (records checked
  in the fake room; nobody listened in Play mode); the Animator states (they are in the bundles and the relay sends
  `animPlay`, but no test reads an Animator's state).
- **In Play mode, not run:** the burn sequence, the tutorial, an order expiring, time up and the results panel,
  trash, wrong plate, the floor, the Sounds and Credits panels, `door="east"`, two kitchens in one page, a referee
  leaving (all covered by the Node scenarios on the fake room).
- **The highlight (checklist 109)** is not done: no hover event reaches the page.
