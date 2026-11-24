# Co-op Kitchen: third-party notices

Co-op Kitchen (working title; snippet `coop-kitchen`, script `pk-coop-kitchen.js`, kit bundles `coop-kitchen`) is a
co-op cooking game for Altspace, based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos (MIT). Port
source: https://github.com/sidequestlegend/coop-kitchen-altspace (branch `main`, folder `altspace/`). A copy of this
file is inside every kit bundle (`Assets/Kit/THIRD-PARTY-NOTICES.md`), with the full licence texts it names
(`Assets/Kit/Licenses/` and the files named LICENSE beside the models and sounds).

No art, model, texture, animation, sound, music, font or plugin of the upstream repository is used anywhere in this
port. The kitchen is built from data (counter positions and gameplay values read from the upstream's scene and
ScriptableObject YAML) and dressed with the openly licensed files below.

## Upstream code and data: Hyago Oliveira (MIT)

- Based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos (MIT), at commit `4a73a26`.
- Licence: MIT License, Copyright (c) 2023 Hyago Oliveira. Full text: `Licenses/KitchenChaos-LICENSE.txt` (the
  upstream's `LICENSE`, unchanged); also `LICENSE` at this port's repository root, and at the top of the script.
- What of it is here: the gameplay scripts are translated to TypeScript in `altspace/ts/src/` and bundled into
  `pk-coop-kitchen.js`; `altspace/ts/data/kitchen-data.json` holds the data values (counter layout, ingredient,
  recipe, order, match and score settings, icon names). Changes from upstream: `altspace/PORT.md`, sections 10 and 11.
- This port is not affiliated with or endorsed by the upstream author.

## portkit runtime

- `altspace/ts/portkit/` and `altspace/Packages/com.altspacegames.portkit/`: MIT License, Copyright (c) 2026 the
  portkit authors. Full text: `Licenses/portkit-LICENSE.txt`. The runtime is bundled into the script, which carries
  the same notice.

## Models: KayKit Restaurant Bits

- "KayKit : Restaurant Bits (1.0)" by **Kay Lousberg**, www.kaylousberg.com
- Downloaded 2026-11-24 from the official repository https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0
  (branch `main`; also at https://kaylousberg.itch.io/restaurant-bits)
- Licence: Creative Commons Zero, CC0 1.0 (http://creativecommons.org/publicdomain/zero/1.0/), as stated by the
  pack's `LICENSE.txt` (kept as `Assets/Kit/Art/KayKit/LICENSE-KayKit-Restaurant-Bits.txt`) and its README. The CC0
  1.0 legal code: `Licenses/CC0-1.0-legalcode.txt`. Credit is not required; it is given here and on the in-world
  credits panel.
- Files used (OBJ, with the pack's one atlas texture `restaurantbits_texture.png`, reduced to 256 px):
  `kitchencounter_straight_A`, `kitchencounter_straight_B`, `kitchencounter_outercorner`, `stove_single_countertop`,
  `pan_A`, `cuttingboard`, `knife`, `plate`, `crate_lid`, `crate_buns`, `crate_lettuce`, `crate_cheese`, `crate_steak`,
  `crate_tomatoes`, `food_ingredient_bun_bottom`, `food_ingredient_burger_uncooked`, `food_ingredient_burger_cooked`,
  `food_ingredient_burger_trash`, `food_ingredient_cheese`, `food_ingredient_cheese_slice`, `food_ingredient_lettuce`,
  `food_ingredient_lettuce_slice`, `food_ingredient_tomato`, `food_ingredient_tomato_slice`, `floor_kitchen`, `menu`,
  `jar_C_large`. Changed for this port: scaled (counters stretched to a 0.90 m top), re-coloured for the delivery
  counter, a new URP material; the ingredient icons on the board are pictures of these models rendered by the kit
  builder (`Assets/Kit/Icons/`).

## Sounds: Kenney

- "Interface Sounds (1.0)" and "Impact Sounds (1.0)" by **Kenney**, www.kenney.nl, downloaded 2026-11-24 from
  https://kenney.nl/assets/interface-sounds and https://kenney.nl/assets/impact-sounds
- Licence: Creative Commons Zero, CC0 1.0, as stated by each pack's `License.txt` (kept as
  `Assets/Kit/Audio/LICENSE-Kenney-Interface-Sounds.txt` and `LICENSE-Kenney-Impact-Sounds.txt`) and the pages. The
  CC0 1.0 legal code: `Licenses/CC0-1.0-legalcode.txt`.
- Files used, renamed by their part in the game:

| In the kit | From | Replaces upstream's |
|---|---|---|
| `00_pickup01`, `01_pickup02` | Interface `pluck_001`, `pluck_002` | `SFX_object_pickup01`, `02` |
| `02_drop01`, `03_drop02` | Interface `drop_001`, `drop_002` | `SFX_object_drop01`, `02` |
| `04_chop01` .. `06_chop03` | Impact `impactWood_light_000` .. `002` | `SFX_chop01` .. `03` |
| `07_warning` | Interface `bong_001` | `SFX_warning01` |
| `08_fail01`, `09_fail02` | Interface `error_001`, `error_002` | `SFX_delivery_fail01`, `02` |
| `10_trash01`, `11_trash02` | Impact `impactMetal_light_000`, `001` | `SFX_trash01`, `02` |
| `12_success01`, `13_success02` | Interface `confirmation_001`, `confirmation_002` | `SFX_delivery_success01`, `02` |
| `14_countdown_start` | Interface `confirmation_004` | `SFX_countdown_start` (origin not stated upstream) |
| `15_timesup` | Impact `impactBell_heavy_000` | `SFX_timesup` (origin not stated upstream) |

- `16_sizzle_loop.ogg` (replaces `SFX_pan_sizzle_loop`): made for this port from generated noise with FFmpeg
  (filtered white noise and random crackles, 4 s, mono). It is this port's own work, dedicated to the public domain
  (CC0 1.0).

## Music

None. Upstream's `Music.wav` is not used, and no music with a licence that could be verified was added; the `music`
setting and the Sounds panel's music volume stay, acting on a silent source.

## Font

- Liberation Sans (TextMesh Pro's default font asset, `LiberationSans SDF`, imported by the SDK setup from Unity's
  TextMesh Pro essentials): SIL Open Font License 1.1. "Digitized data copyright (c) 2010 Google Corporation with
  Reserved Font Arimo, Tinos and Cousine. Copyright (c) 2012 Red Hat, Inc. with Reserved Font Name Liberation."
  Full text: `LiberationSans - OFL.txt`, which the kit build adds to every bundle (https://openfontlicense.org/).

## Licence texts in the kit

`Licenses/KitchenChaos-LICENSE.txt` (MIT), `Licenses/portkit-LICENSE.txt` (MIT), `Licenses/CC0-1.0-legalcode.txt`
(CC0 1.0), `Art/KayKit/LICENSE-KayKit-Restaurant-Bits.txt`, `Audio/LICENSE-Kenney-Interface-Sounds.txt`,
`Audio/LICENSE-Kenney-Impact-Sounds.txt`, and `LiberationSans - OFL.txt` (OFL 1.1).

## Not used (listed so nobody adds them by mistake)

Upstream's `Assets/Meshes` and `Assets/_Assets` (the course art and sounds the upstream README credits to a third
party; no published reuse terms found), `Assets/Plugins/CodeAssist` (Asset Store), `Assets/Prefabs/Players/Models` (a
chef character set of unknown origin), its 22 legacy animation clips (the kit has its own Animator states with the
same names), `TutorialArrow.png`, the button glyph sheet, the logo.
