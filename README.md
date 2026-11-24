# coop-kitchen (port)

A co-op cooking game for Altspace, delivered as a snippet (`coop-kitchen`): the rules of **KitchenChaos** by
**Hyago Oliveira** (https://github.com/HyagoOliveira/KitchenChaos, commit `4a73a26`), ported to TypeScript on the
portkit runtime and made multiplayer: every player who joins the kitchen is a chef, counters and appliances are
shared, a referee client runs the rules and keeps the timers on a pausable shared clock.

The game's own name is still to be chosen (proposals in `altspace/PORT.md`, section 11.1); it is not "Kitchen Chaos".

## Licence and credits

- The upstream code is **MIT**, Copyright (c) 2023 Hyago Oliveira. Its licence text is `LICENSE` in this repository,
  and this port is distributed under the same MIT terms.
- The portkit runtime copied into `altspace/ts/portkit/` is MIT (`altspace/ts/portkit/LICENSE`).
- This is a fresh repository, not a fork: the upstream repository carries art, models, sounds and an editor plugin
  that are not the author's to license and must not be republished. **None of the upstream's art, models, sounds,
  textures, fonts or plugins is in this repository.** `altspace/ts/data/kitchen-data.json` holds data values read
  from the upstream's ScriptableObject YAML (ingredient, recipe, order and timing values, counter positions, icon
  names) with `altspace/ts/tools/gen-data.ts`.
- The kit's art is to be KayKit by Kay Lousberg (CC0).

## Layout

```
altspace/PORT.md          the upstream analysis (137-item checklist), and section 11: status, decisions, names, gaps
altspace/ts/src/          one TypeScript file per upstream gameplay file, plus GameClock, ActionCode, Kitchen, Chef
altspace/ts/test/         Node tests on portkit's fake room, and the golden-vector comparison
altspace/ts/golden/       the upstream C# harness (dotnet 8) that wrote vectors/upstream.json; needs the upstream
                          clone to run again (MSBuild property Upstream, default ../../../Assets/Scripts)
altspace/ts/bindings.json PROVISIONAL (written by tools/gen-bindings.ts; no kit exists yet)
```

```
cd altspace/ts
npm install
npm test          # typecheck, lint, 29 tests
npm run build     # pk-coop-kitchen.js
```
