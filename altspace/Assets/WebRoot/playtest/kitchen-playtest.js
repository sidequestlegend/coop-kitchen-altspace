// Rungs 3 and 4: the co-op kitchen in editor Play mode, driven through the SDK's desktop player with the port kit's input
// (InputSim: a mouse of the test's own; the SDK casts its own rays and raises the clicks) and checked in Unity with the
// kit's probe command. Not part of the snippet: the test page loads it before the snippet.
//
// window.__kitchenPlan: "single" (one chef takes a place, cuts and cooks, plates an X Burger, delivers it, sees the
// score, pauses) or "multi" (two Local Multiplayer chefs share the work; a delivery and a pause by one show on both;
// the second reloads its page and must see the same kitchen).
// The snippet carries seed="1": the first order of a round is then an X Burger (bread, cheese slice, cooked meat).
(function () {
  "use strict";
  const KEY = "coop-kitchen:0";
  const HOLDER = "pk1:coop-kitchen:0";
  const say = (kind, what, detail) => console.log("PKTEST " + kind + " " + what + (detail !== undefined ? ": " + detail : ""));
  let passed = 0;
  let failed = 0;
  const check = (ok, what, detail) => {
    if (ok) passed++;
    else failed++;
    say(ok ? "PASS" : "FAIL", what, detail);
    return ok;
  };
  const replies = new Map();
  let count = 0;
  window.__pktest = Object.assign(window.__pktest || {}, {
    reply(id, text) {
      const resolve = replies.get(id);
      if (resolve) {
        replies.delete(id);
        resolve(text);
      }
    },
  });
  const cmd = (line, ms) =>
    new Promise((resolve) => {
      const id = "k" + ++count;
      replies.set(id, resolve);
      console.log("PKTEST CMD " + id + " " + line);
      setTimeout(() => {
        if (replies.delete(id)) resolve("error: no reply");
      }, ms || 30000);
    });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(test, ms, step) {
    const end = Date.now() + ms;
    for (;;) {
      let value = false;
      try {
        value = test();
      } catch (e) {
        value = false;
      }
      if (value) return value;
      if (Date.now() > end) return false;
      await sleep(step || 100);
    }
  }
  const debug = () => window.__pk1 && window.__pk1.debug && window.__pk1.debug[KEY];
  const probe = (what, path, extra) => cmd("probe " + HOLDER + " " + what + " " + path.replace(/ /g, "%20") + (extra ? " " + extra : ""));
  /** A probe asked again until it gives what is wanted (state reaches the page a tick before the relay reaches Unity). */
  async function probeUntil(what, path, ok, ms) {
    const end = Date.now() + (ms || 4000);
    for (;;) {
      const value = await probe(what, path);
      if (ok(value) || Date.now() > end) return value;
      await sleep(200);
    }
  }
  /** Is a pool item drawn in Unity: its slot on, the right child on? */
  async function drawn(id) {
    const s = debug().slotOf(id);
    if (s < 0) return "no slot";
    const k = debug().items()[id].k;
    const path = "Items/Slot" + String(s).padStart(2, "0");
    const slotOn = await probeUntil("active", path, (v) => v === "True");
    const childOn = await probeUntil("active", path + (k < 0 ? "/Plate" : "/V" + k), (v) => v === "True");
    return slotOn === "True" && childOn === "True" ? "ok" : `slot ${s} ${slotOn}, child ${childOn}`;
  }

  // ---- the kitchen as the page has it ----
  const V = { Bread: 0, Cheese: 3, CheeseSliced: 4, Meat: 5, MeatCooked: 6 };
  const me = () => debug().me();
  const hand = () => {
    const id = debug().holders()["hand:" + me().uid];
    return id ? Object.assign({ id }, debug().items()[id]) : null;
  };
  const on = (cell) => {
    const id = debug().holders()[cell];
    return id ? Object.assign({ id }, debug().items()[id]) : null;
  };
  const plated = (cell) => {
    const p = on(cell);
    const items = debug().items();
    return p && p.k === -1 ? (p.ings || []).map((i) => items[i].k).sort((a, b) => a - b) : null;
  };
  const show = (x) => JSON.stringify(x);

  /** Points the desktop player's mouse at a kit object (by path) and clicks it. */
  async function clickAt(path, what) {
    const pos = await probe("pos", path);
    if (pos.startsWith("error")) {
      say("INFO", "no position for " + path + ": " + pos);
      return false;
    }
    await cmd("look " + pos);
    await sleep(150);
    const r = await cmd("click " + pos);
    say("INFO", "click " + (what || path), r);
    return r.startsWith("ok");
  }
  const xyz = (text) => text.split(" ").map(Number);
  /**
   * Stands the desktop player in front of a counter, `metres` from its front face (a chef's reach is 2 m from the head
   * or hands: Counter.interactReach). InputSim's `place` moves the player's feet; the page's own TeleportTo tells the
   * runtime where the player now is (player-teleported), whether or not a pose follows.
   */
  async function goTo(cell, metres) {
    const front = xyz(await probe("pos", "Counters/" + cell + "/Front"));
    const root = xyz(await probe("pos", "Counters/" + cell));
    let dx = front[0] - root[0];
    let dz = front[2] - root[2];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const d = metres === undefined ? 0.5 : metres;
    const x = front[0] + dx * d;
    const z = front[2] + dz * d;
    const placed = await cmd("place " + x.toFixed(3) + " 0 " + z.toFixed(3));
    try {
      const BS = window.BS;
      BS.Scene.GetInstance().TeleportTo(new BS.Vector3(x, 0, z), (Math.atan2(-dx, -dz) * 180) / Math.PI, false);
    } catch (e) {
      say("INFO", "TeleportTo: " + e);
    }
    await sleep(400);
    if (!String(placed).startsWith("ok")) say("INFO", "place: " + placed);
    return [x, z];
  }
  /** E on a counter: a click on its front (never under an item), standing at it. */
  const E = async (cell) => {
    await goTo(cell);
    return clickAt("Counters/" + cell + "/Front", "E " + cell);
  };
  const qPath = (cell) => (cell.indexOf("Stove") === 0 ? "Counters/" + cell + "/Knob" : "Counters/" + cell + "/CuttingBoard/Knife");
  /** Q on a cutting board (its knife) or a stove (its knob), standing at it. */
  const Q = async (cell) => {
    await goTo(cell);
    return clickAt(qPath(cell), "Q " + cell);
  };
  /** One action, then wait for what it must lead to. */
  async function act(action, wanted, what, ms) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await action();
      const ok = await until(wanted, ms || 4000, 100);
      if (ok) return check(true, what, "");
      say("INFO", what + ": not yet after try " + (attempt + 1) + "; hand " + show(hand()));
    }
    return check(false, what, "hand " + show(hand()) + ", holders " + show(debug().holders()));
  }

  async function waitStarted(again) {
    const ok = await until(() => debug() && debug().phase, 120000, 250);
    check(!!ok, "the kit loads from a hand-written bs-snippet and the instance starts", ok ? "" : "no debug hooks after 120 s");
    if (!ok) return false;
    await sleep(2500);
    const exists = await probe("exists", ".");
    const slot = await probe("active", "Items/Slot47");
    const stove = await probe("exists", "Counters/StoveCounter_00/Stove/Pan");
    const door = await probe("active", "Counters/Counter_Normal_10");
    check(exists === "True" && slot === "False" && door === "False", "the kitchen is in the scene: pool slots off, the west doorway open" + (again ? " (again)" : ""),
      `holder ${exists}, slot 47 active ${slot}, doorway counter active ${door}, stove ${stove}`);
    return true;
  }

  // ---- one chef ----------------------------------------------------------------------------------------------
  async function single() {
    if (!(await waitStarted())) return;
    check(debug().phase() === "lobby", "a fresh kitchen is in the lobby with two plates on their counters", `${debug().phase()}, plates ${show([on("Counter_Plate_00"), on("Counter_Plate_01")].map((p) => p && p.k))}`);
    const plates = [on("Counter_Plate_00"), on("Counter_Plate_01")];
    const platesDrawn = [];
    for (const p of plates) platesDrawn.push(p ? await drawn(p.id) : "none");
    check(platesDrawn.every((d) => d === "ok"), "both plates are drawn in Unity (pool slots on, their Plate child on)", show(platesDrawn));
    const lobbyShown = await probeUntil("active", "Board/Lobby", (v) => v === "True");
    check(lobbyShown === "True", "the board shows the lobby", lobbyShown);

    await act(() => clickAt("Board/Lobby/Cook", "COOK"), () => debug().roster()[me().uid] !== undefined, "COOK takes a chef's place (board button, real mouse)");
    let roster = "";
    for (let i = 0; i < 20 && roster.indexOf(me().name) < 0; i++) {
      roster = await probe("text", "Board/Lobby/Roster");
      if (roster.indexOf(me().name) < 0) await sleep(250);
    }
    check(roster.indexOf(me().name) >= 0, "the roster text reached Unity", roster);
    await act(() => clickAt("Board/Lobby/Play", "PLAY"), () => debug().phase() === "countdown" || debug().phase() === "round", "PLAY starts the countdown");
    const round = await until(() => debug().phase() === "round", 10000, 200);
    check(!!round, "the round starts after the countdown", debug().phase());
    const first = await until(() => debug().orders().length > 0 && debug().orders()[0], 5000, 200);
    const ticket = await probeUntil("text", "Board/Orders/Ticket0/Name", (v) => v === "X Burger");
    check(!!first && first.r === 2 && ticket === "X Burger", "the first order is an X Burger (seed 1) and its ticket shows", `${show(first)}, ticket '${ticket}'`);
    const icons = await probeUntil("text", "Board/Orders/Ticket0/Icons", (v) => v.indexOf("<sprite") >= 0);
    check(icons.indexOf("<sprite") >= 0, "the ticket's ingredient icons reached Unity", icons);
    const crateIcon = await probe("text", "Counters/CheeseCounter_00/Icons");
    check(crateIcon.indexOf('<sprite name="CheeseBlock">') >= 0, "the cheese crate shows its ingredient's icon (checklist 138)", crateIcon);
    const credits = await probe("text", "Board/Credits/Text");
    check(credits.indexOf("Based on code by") >= 0 && credits.indexOf("HyagoOliveira/KitchenChaos (MIT)") >= 0 && credits.indexOf("Kenney") >= 0 && !/code ?monkey/i.test(credits),
      "the credits panel carries the script's text: the MIT attribution, KayKit, Kenney, the font", credits.slice(0, 120) + "...");

    // reach (C2): from 3 m away a click on the crate does nothing; at the crate it counts
    await goTo("CheeseCounter_00", 3);
    await clickAt("Counters/CheeseCounter_00/Front", "E CheeseCounter_00 from 3 m");
    const tooFar = await until(() => hand(), 3000, 100);
    check(!tooFar, "a click on a crate 3 m away does nothing (a chef reaches 2 m)", "hand " + show(hand()));

    // cut the cheese
    await act(() => E("CheeseCounter_00"), () => hand() && hand().k === V.Cheese, "take a cheese from its crate");
    // the push check (world 9d7311): the held cheese is drawn 0.45 m in front of the face; its box is a trigger, so a
    // body standing still for 5 s with it in hand is not moved
    const still = await cmd("standstill 5", 20000);
    check(/^ok still/.test(still), "a chef standing still for 5 s with an item in hand is not pushed by it", still);
    await act(() => E("CutCounter_00"), () => on("CutCounter_00") && on("CutCounter_00").k === V.Cheese && !hand(), "put the cheese on the cutting board");
    const knifeHidden = await probeUntil("active", "Counters/CutCounter_00/CuttingBoard/Knife/Model", (v) => v === "False");
    await Q("CutCounter_00");
    const bar = await probeUntil("active", "Counters/CutCounter_00/CuttingBoard/Canvas/Bar", (v) => v === "True");
    const knifeCutting = await probeUntil("active", "Counters/CutCounter_00/CuttingBoard/Knife/Model", (v) => v === "True");
    check(knifeHidden === "False" && knifeCutting === "True" && bar === "True", "Q on the knife starts cutting: the knife shows and chops, the bar shows", `knife before ${knifeHidden}, while cutting ${knifeCutting}, bar ${bar}`);
    const fill = await probe("scale", "Counters/CutCounter_00/CuttingBoard/Canvas/Bar/Fill");
    say("INFO", "cutting bar fill scale " + fill);

    // cook the meat meanwhile
    await act(() => E("MeatCounter_00"), () => hand() && hand().k === V.Meat, "take a meat from its crate");
    await act(() => E("StoveCounter_00"), () => on("StoveCounter_00") && on("StoveCounter_00").k === V.Meat && !hand(), "put the meat on the stove");
    await Q("StoveCounter_00");
    const sizzle = await probeUntil("active", "Counters/StoveCounter_00/Stove/Pan/SizzleAudio", (v) => v === "True");
    check(sizzle === "True", "cooking starts: the stove's sizzle loop is switched on (Q on the knob)", sizzle);

    // the slice onto the plate
    const sliced = await until(() => on("CutCounter_00") && on("CutCounter_00").k === V.CheeseSliced, 8000, 200);
    check(!!sliced, "the cheese is cut into a slice", show(on("CutCounter_00")));
    await act(() => E("CutCounter_00"), () => hand() && hand().k === V.CheeseSliced, "take the slice");
    await act(() => E("Counter_Plate_01"), () => show(plated("Counter_Plate_01")) === show([V.CheeseSliced]), "plate the slice");
    await act(() => E("BreadCounter_00"), () => hand() && hand().k === V.Bread, "take bread");
    await act(() => E("Counter_Plate_01"), () => show(plated("Counter_Plate_01")) === show([V.Bread, V.CheeseSliced]), "plate the bread");

    const cooked = await until(() => on("StoveCounter_00") && on("StoveCounter_00").k === V.MeatCooked, 12000, 200);
    check(!!cooked, "the meat is cooked", show(on("StoveCounter_00")));
    await act(() => E("StoveCounter_00"), () => hand() && hand().k === V.MeatCooked, "take the cooked meat off the stove");
    await act(() => E("Counter_Plate_01"), () => show(plated("Counter_Plate_01")) === show([V.Bread, V.CheeseSliced, V.MeatCooked]), "plate the meat: an X Burger");

    // what Unity shows for the plate
    const plate = on("Counter_Plate_01");
    const slot = debug().slotOf(plate.id);
    const slotPath = "Items/Slot" + String(slot).padStart(2, "0");
    let plateShown = "", plateIcons = "";
    for (let i = 0; i < 16; i++) {
      plateShown = await probe("active", slotPath + "/Plate");
      plateIcons = await probe("text", slotPath + "/Plate/Icons");
      if (plateShown === "True" && (plateIcons.match(/<sprite/g) || []).length === 3) break;
      if (i === 0) say("INFO", "plate not drawn yet: " + plateShown + " '" + plateIcons + "', slot active " + (await probe("active", slotPath)));
      await sleep(250);
    }
    const platePos = await probe("pos", slotPath);
    const topPos = await probe("pos", "Counters/Counter_Plate_01/Top");
    const d = platePos.split(" ").map(Number);
    const t = topPos.split(" ").map(Number);
    check(plateShown === "True" && (plateIcons.match(/<sprite/g) || []).length === 3 && Math.hypot(d[0] - t[0], d[2] - t[2]) < 0.05,
      "the plate is drawn on its counter with three ingredient icons (pool slot " + slot + ")", `plate ${plateShown}, icons '${plateIcons}', slot ${platePos}, top ${topPos}`);
    for (const ing of plate.ings || []) {
      const s = debug().slotOf(ing);
      const k = debug().items()[ing].k;
      const v = await probe("active", "Items/Slot" + String(s).padStart(2, "0") + "/V" + k);
      if (v !== "True") check(false, "the plated ingredient " + k + " is drawn", "slot " + s + " V" + k + " " + v);
    }
    await cmd("shot plated -1.2 1.7 1.2 -2.73 1.0 3.36 50");

    // deliver
    const before = debug().score();
    await act(() => E("Counter_Plate_01"), () => hand() && hand().k === -1, "pick up the plate");
    await act(() => E("Counter_Delivery"), () => debug().score() > before, "deliver it at the delivery counter", 5000);
    const score = debug().score();
    const scoreText = await probeUntil("text", "Board/Hud/Score/Current", (v) => v === String(score));
    check(score >= 20 && scoreText === String(score), "the score shows the delivery and its tip (20 + tip), on the board in Unity", `score ${score}, board '${scoreText}'`);
    const tip = await probe("text", "Counters/Counter_Delivery/Canvas/Tip");
    say("INFO", "tip text " + tip);
    await cmd("shot delivered 0 1.7 0 5.6 2.0 0 60");

    // a drop on the floor: the item lies on the floor where clicked (finding 5: never at hand height)
    await act(() => E("BreadCounter_00"), () => hand() && hand().k === V.Bread, "take bread for the floor");
    const front = xyz(await probe("pos", "Counters/BreadCounter_00/Front"));
    const root = xyz(await probe("pos", "Counters/BreadCounter_00"));
    const dir = [front[0] - root[0], front[2] - root[2]];
    const dl = Math.hypot(dir[0], dir[1]) || 1;
    const spot = [front[0] + (dir[0] / dl) * 1.0, 0.0, front[2] + (dir[1] / dl) * 1.0];
    const bread = hand().id;
    await cmd("look " + spot.join(" "));
    await sleep(150);
    say("INFO", "click floor " + (await cmd("click " + spot.join(" "))));
    const dropped = await until(() => !hand() && debug().items()[bread] && debug().items()[bread].pos, 4000, 100);
    const pos = dropped ? debug().items()[bread].pos : null;
    const breadSlot = "Items/Slot" + String(debug().slotOf(bread)).padStart(2, "0");
    // the probe's "pos" is the middle of what the slot draws (where to point the mouse): a bread on the floor is 0.14 m up
    const onFloor = (v) => xyz(v)[1] < 0.3 && Math.hypot(xyz(v)[0] - spot[0], xyz(v)[2] - spot[2]) < 0.3;
    const drawnText = await probeUntil("pos", breadSlot, onFloor);
    check(!!pos && pos[1] === 0 && Math.hypot(pos[0] - spot[0], pos[2] - spot[2]) < 0.3 && onFloor(drawnText),
      "a floor click drops the held item on the floor where clicked (state and Unity)", `clicked ${spot.map((v) => v.toFixed(2)).join(" ")}, state ${show(pos)}, drawn at ${drawnText}`);

    // pause and resume
    await act(() => clickAt("Board/Hud/Pause", "Pause"), () => debug().paused(), "Pause pauses the round");
    const panel = await probeUntil("active", "Board/PausePanel", (v) => v === "True");
    check(panel === "True", "the pause panel shows", panel);
    await act(() => clickAt("Board/PausePanel/Options/Resume", "Resume"), () => !debug().paused(), "Resume carries on");
  }

  // ---- two chefs ---------------------------------------------------------------------------------------------
  const heard = [];
  function channel() {
    const scene = window.BS.Scene.GetInstance();
    scene.On("one-shot", (e) => {
      const data = e && e.detail && e.detail.data;
      if (typeof data !== "string" || data.indexOf("kitchenTest") < 0) return;
      try {
        heard.push(JSON.parse(data));
      } catch (x) {
        /* not ours */
      }
    });
    return (message) => scene.OneShot(JSON.stringify(Object.assign({ kitchenTest: 1 }, message)));
  }
  const stored = (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  async function multi() {
    const back = stored("kitchenTestReloaded") === "1";
    if (!(await waitStarted(back))) return;
    const send = channel();
    const two = await until(() => debug().players().length >= 2, 90000, 500);
    check(!!two, "two players in the room", show(debug().players()));
    if (!two) return;
    await sleep(2000);
    if (back) return afterReload(send);
    const others = debug().players().filter((p) => p.sid !== me().sid);
    const lead = me().sid < others[0].sid;
    say("INFO", (lead ? "lead chef (plates, delivers)" : "second chef (cuts, cooks, pauses, reloads)") + ": " + me().name);

    await act(() => clickAt("Board/Lobby/Cook", "COOK"), () => debug().roster()[me().uid] !== undefined, "COOK: this player takes a chef's place");
    const both = await until(() => Object.keys(debug().roster()).length === 2, 60000, 250);
    check(!!both, "both players are chefs, on both pages", show(debug().roster()));
    if (lead) await act(() => clickAt("Board/Lobby/Play", "PLAY"), () => debug().phase() !== "lobby", "PLAY starts the round for both");
    const round = await until(() => debug().phase() === "round", 30000, 200);
    check(!!round, "the round runs on this page", debug().phase());

    if (lead) {
      await act(() => E("BreadCounter_00"), () => hand() && hand().k === V.Bread, "lead: take bread");
      await act(() => E("Counter_Plate_01"), () => (plated("Counter_Plate_01") || []).indexOf(V.Bread) >= 0, "lead: plate the bread");
      const done = await until(() => show(plated("Counter_Plate_01")) === show([V.Bread, V.CheeseSliced, V.MeatCooked]), 60000, 250);
      check(!!done, "the other chef's slice and meat arrive on the plate (seen here)", show(plated("Counter_Plate_01")));
      const before = debug().score();
      await act(() => E("Counter_Plate_01"), () => hand() && hand().k === -1, "lead: pick up the plate");
      await act(() => E("Counter_Delivery"), () => debug().score() > before, "lead: deliver the X Burger", 5000);
      await sleep(1500);
      send({ kind: "score", score: debug().score() });
      const theirs = await until(() => heard.find((m) => m.kind === "scoreSeen"), 20000, 200);
      check(!!theirs && theirs.score === debug().score(), "the delivery updates the score on the other page too", theirs ? `${theirs.score} there, ${debug().score()} here, their board '${theirs.text}'` : "no word");
      // a pause by the other chef shows here
      const paused = await until(() => debug().paused(), 40000, 200);
      const panel = await probeUntil("active", "Board/PausePanel", (v) => v === "True");
      const by = await probeUntil("text", "Board/PausePanel/PausedBy", (v) => v.length > 0);
      check(!!paused && debug().pausedBy() !== me().uid && panel === "True", "a pause by the other chef shows here (pause panel on)", `paused ${paused}, by ${debug().pausedBy()}, panel ${panel}, '${by}'`);
      const resumed = await until(() => !debug().paused(), 40000, 200);
      check(!!resumed, "the other chef's resume arrives here", "");
      // PORT.md 9.5: both chefs act on one board in the same moment
      await act(() => E("CheeseCounter_01"), () => hand() && hand().k === V.Cheese, "lead: take a cheese for the race");
      await act(() => E("CutCounter_01"), () => on("CutCounter_01") && on("CutCounter_01").k === V.Cheese && !hand(), "lead: put it on the second board");
      await race("Q", Date.now() + 7000, send);
      await race("E", Date.now() + 9000, send);
      await farIntent(send);
      // the other page reloads: it must come back to the same kitchen
      const word = await until(() => heard.find((m) => m.kind === "back"), 120000, 250);
      check(!!word && word.score === debug().score(), "after reloading, the other page sees the score (late join)", word ? `${word.score} / ${debug().score()}` : "no word");
      let same = null;
      await until(() => {
        const mine = debug().digest();
        same = heard.find((m) => m.kind === "digest" && m.digest === mine);
        return !!same;
      }, 20000, 100);
      check(!!same, "both pages reach the same state digest after the reload", same ? same.digest : `mine ${debug().digest()}, theirs ${show(heard.filter((m) => m.kind === "digest").slice(-2).map((m) => m.digest))}`);
      await cmd("shot multi_lead 0 1.7 0 0 0.9 3.36 70");
    } else {
      await act(() => E("CheeseCounter_00"), () => hand() && hand().k === V.Cheese, "second: take a cheese");
      await act(() => E("CutCounter_00"), () => on("CutCounter_00") && on("CutCounter_00").k === V.Cheese, "second: put it on the board");
      await Q("CutCounter_00");
      await act(() => E("MeatCounter_00"), () => hand() && hand().k === V.Meat, "second: take a meat");
      await act(() => E("StoveCounter_00"), () => on("StoveCounter_00") && on("StoveCounter_00").k === V.Meat, "second: put it on the stove");
      await Q("StoveCounter_00");
      const sliced = await until(() => on("CutCounter_00") && on("CutCounter_00").k === V.CheeseSliced, 10000, 200);
      check(!!sliced, "second: the cheese is cut", show(on("CutCounter_00")));
      await act(() => E("CutCounter_00"), () => hand() && hand().k === V.CheeseSliced, "second: take the slice");
      await until(() => (plated("Counter_Plate_01") || []).indexOf(V.Bread) >= 0, 30000, 200);
      await act(() => E("Counter_Plate_01"), () => (plated("Counter_Plate_01") || []).indexOf(V.CheeseSliced) >= 0, "second: plate the slice on the lead's bread");
      const cooked = await until(() => on("StoveCounter_00") && on("StoveCounter_00").k === V.MeatCooked, 12000, 200);
      check(!!cooked, "second: the meat is cooked", show(on("StoveCounter_00")));
      await act(() => E("StoveCounter_00"), () => hand() && hand().k === V.MeatCooked, "second: take the meat");
      await act(() => E("Counter_Plate_01"), () => (plated("Counter_Plate_01") || []).indexOf(V.MeatCooked) >= 0, "second: plate the meat");
      const word = await until(() => heard.find((m) => m.kind === "score"), 60000, 200);
      const seen = word && (await until(() => debug().score() === word.score, 5000, 100));
      const text = await probeUntil("text", "Board/Hud/Score/Current", (v) => word && v === String(word.score));
      check(!!seen && text === String(word.score), "the other chef's delivery shows in the score here (state and board)", `${debug().score()} / ${word && word.score}, board '${text}'`);
      send({ kind: "scoreSeen", score: debug().score(), text });
      await act(() => clickAt("Board/Hud/Pause", "Pause"), () => debug().paused(), "second: pause the round");
      await sleep(3000);
      await act(() => clickAt("Board/PausePanel/Options/Resume", "Resume"), () => !debug().paused(), "second: resume (the chef who paused)");
      // PORT.md 9.5: both chefs act on one board in the same moment (the lead names the moment)
      for (const kind of ["Q", "E"]) {
        const word = await until(() => heard.find((m) => m.kind === "race" + kind), 90000, 100);
        if (!check(!!word, "second: the lead names the moment for the " + kind + " race", "")) break;
        await race(kind, word.at, null);
      }
      await farIntent(send);
      await sleep(1500);
      try {
        sessionStorage.setItem("kitchenTestReloaded", "1");
      } catch (e) {
        /* no storage: the reload cannot be told apart */
      }
      say("INFO", "the second chef reloads its page");
      await sleep(500);
      location.reload();
      await sleep(60000);
    }
  }

  /**
   * Both chefs press Q (or E) on CutCounter_01 at the same wall-clock moment `at` (both players run on this machine). Q:
   * the board holds a whole cheese; the cut must start and the second press, sent before it saw the start, must not
   * pause it. E: the board holds the slice and both hands are empty; exactly one chef gets it. The lead sends the moment.
   */
  async function race(kind, at, send) {
    if (send) send({ kind: "race" + kind, at });
    await goTo("CutCounter_01");
    const path = kind === "Q" ? qPath("CutCounter_01") : "Counters/CutCounter_01/Front";
    const pos = await probe("pos", path);
    await cmd("look " + pos);
    const wait = at - Date.now();
    if (wait > 0) await sleep(wait);
    const r = await cmd("click " + pos);
    say("INFO", kind + " race click at " + (Date.now() - at) + " ms past the moment: " + r);
    if (kind === "Q") {
      await sleep(2000);
      const p = debug().prep("CutCounter_01");
      check(!!p && p.p === 1 && p.ps === 0, "two chefs press Q on one board at once: it cuts, and the second press does not pause it", show(p));
      const sliced = await until(() => on("CutCounter_01") && on("CutCounter_01").k === V.CheeseSliced, 8000, 200);
      check(!!sliced, "the race's cheese is cut", show(on("CutCounter_01")));
    } else {
      await sleep(3000);
      const holders = debug().holders();
      const hands = Object.keys(holders).filter((k) => k.indexOf("hand:") === 0 && debug().items()[holders[k]] && debug().items()[holders[k]].k === V.CheeseSliced);
      check(hands.length === 1 && !on("CutCounter_01"), "two chefs press E on one board at once: exactly one takes the slice", show(hands));
    }
  }

  /**
   * The referee checks reach itself (PORT.md 11.8, trust). The page that is not the referee stands at the bread crate
   * and sends, as a modified client would (past its own reach check), an E on a counter far across the kitchen: a crate
   * when its hand is empty, else an empty plain counter (either would change the kitchen if it ran). The referee's page,
   * the other player, must refuse it from its own app's reading of this player's head, and must have let this chef's
   * honest intents through by the same check.
   */
  const ALLOWED = 2 + 2.5; // REACH + REFEREE_REACH_SLACK (Kitchen.ts)
  const CRATES = ["BreadCounter_01", "CabbageCounter_00", "CabbageCounter_01", "CheeseCounter_00", "CheeseCounter_01", "MeatCounter_00", "MeatCounter_01", "TomatoCounter_00", "TomatoCounter_01"];
  const PLAIN = ["Counter_Normal_00", "Counter_Normal_01", "Counter_Normal_02", "Counter_Normal_03", "Counter_Normal_05", "Counter_Normal_06", "Counter_Normal_07", "Counter_Normal_08", "Counter_Normal_09", "Counter_Normal_11"];
  async function farIntent(send) {
    const ref = debug().referee();
    const referee = !!ref && ref.sid === me().sid;
    say("INFO", "far intent check: this page is " + (referee ? "the referee" : "not the referee"));
    if (!referee) {
      const at = await goTo("BreadCounter_00");
      await sleep(4000); // the referee judges by the nearest of its last 3 s of head readings (Kitchen.HEAD_HISTORY)
      const head = [at[0], 1.6, at[1]];
      const holding = hand();
      let best = null;
      for (const cell of holding ? PLAIN : CRATES) {
        if (holding && on(cell)) continue;
        if ((await probe("active", "Counters/" + cell)) !== "True") continue;
        const p = xyz(await probe("pos", "Counters/" + cell + "/Top"));
        if (p.length !== 3 || p.some((v) => !isFinite(v))) continue;
        const d = Math.hypot(p[0] - head[0], p[1] - head[1], p[2] - head[2]);
        if (!best || d > best.d) best = { cell, d };
      }
      if (!check(!!best && best.d > ALLOWED + 1, "a counter far across the kitchen to aim at", best ? best.cell + " " + best.d.toFixed(2) + " m" : "none")) return;
      const before = show(hand());
      const there = show(on(best.cell));
      debug().forceIntent("E", "c:" + best.cell);
      await sleep(3000);
      check(show(hand()) === before && show(on(best.cell)) === there, "a far E sent past this page's own check changes nothing here (" + (holding ? "the held item stays in hand" : "no ingredient taken") + ")",
        `${best.cell} at ${best.d.toFixed(2)} m, hand ${show(hand())}`);
      send({ kind: "far", uid: me().uid, target: "c:" + best.cell, d: best.d, hand: before, there });
      const word = await until(() => heard.find((m) => m.kind === "farSeen"), 30000, 200);
      check(!!word && word.refused, "the remote referee says it refused the far intent", word ? show(word.check) : "no word");
    } else {
      const word = await until(() => heard.find((m) => m.kind === "far"), 90000, 200);
      if (!check(!!word, "the other chef sends a far intent", "")) return;
      await sleep(1500);
      const reach = debug().reach();
      const mine = reach.log.filter((c) => c.uid === word.uid);
      const far = mine.filter((c) => c.target === word.target).at(-1);
      const honest = mine.filter((c) => c.ok);
      const refused = !!far && !far.ok && far.distance > ALLOWED && !!far.head;
      const holders = debug().holders();
      const theirHand = holders["hand:" + word.uid] ? Object.assign({ id: holders["hand:" + word.uid] }, debug().items()[holders["hand:" + word.uid]]) : null;
      check(refused && show(theirHand) === word.hand && show(on(word.target.slice(2))) === word.there,
        "as the referee, this page refuses the other chef's far intent, from its own app's reading of their head", show(far) + ", their hand " + show(theirHand));
      check(honest.length > 0 && honest.every((c) => c.distance <= ALLOWED && !!c.head), "as the referee, this page let the other chef's honest intents through by the same check",
        honest.length + " passed, e.g. " + show(honest.at(-1)) + "; refused " + reach.refused);
      send({ kind: "farSeen", refused, check: far || null });
    }
  }

  async function afterReload(send) {
    const back = await until(() => debug().phase() === "round" && debug().score() > 0, 30000, 250);
    check(!!back, "after reloading, this page sees the running round and the score (late join)", `${debug().phase()}, score ${debug().score()}`);
    const text = await probeUntil("text", "Board/Hud/Score/Current", (v) => v === String(debug().score()));
    const plate = on("Counter_Plate_00");
    check(text === String(debug().score()) && plate && plate.k === -1, "the reloaded page draws the kitchen as it is: score on the board, a plate on its counter", `board '${text}', plate counter ${show(plate)}`);
    send({ kind: "back", score: debug().score() });
    for (let i = 0; i < 30; i++) {
      send({ kind: "digest", digest: debug().digest() });
      await sleep(500);
    }
    try {
      sessionStorage.removeItem("kitchenTestReloaded");
    } catch (e) {
      /* nothing */
    }
  }

  window.__kitchenRun = async function (plan) {
    try {
      if (plan === "single") await single();
      else if (plan === "multi") await multi();
    } catch (e) {
      check(false, "the test ran to its end", e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : String(e));
    }
    say("INFO", "page result " + passed + " passed, " + failed + " failed");
    console.log("PKTEST DONE");
  };
  if (window.__kitchenPlan) window.__kitchenRun(window.__kitchenPlan);
})();
