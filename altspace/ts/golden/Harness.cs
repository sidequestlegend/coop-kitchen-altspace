// Golden vectors for coop-kitchen: KitchenChaos's own RandomUtils, IngredientSettings, RecipeData, RecipeSettings, Plate,
// ItemHolder, Order, OrderSettings, ScoreSettings, CuttingBoard, Stove and MatchSettings, unchanged, driven through their
// methods on objects built from UnityStubs.cs, with the data of ../data/kitchen-data.json (the upstream's assets).
// Writes ../vectors/upstream.json; test/golden.test.ts plays the same inputs through the TypeScript.
//
//   dotnet run --project golden -c Release -- vectors/upstream.json      (npm run golden)
//
// Times are frames of 0.05 s on the stub runner, as the port's referee ticks.
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using ActionCode.Audio;
using ActionCode.Physics;
using ActionCode.VisualEffects;
using KitchenChaos;
using KitchenChaos.Counters;
using KitchenChaos.Items;
using KitchenChaos.Matches;
using KitchenChaos.Orders;
using KitchenChaos.Physics;
using KitchenChaos.Recipes;
using KitchenChaos.Score;
using KitchenChaos.UI;
using UnityEngine;
using UnityEngine.UI;

public static class Program
{
    const float DT = 0.05f;
    static JsonNode Data;
    static IngredientData[] Variants;
    static IngredientSettings Ingredients;
    static RecipeSettings Recipes;
    static RecipeData[] RecipeList;

    static void Set(object target, string field, object value)
    {
        for (var t = target.GetType(); t != null; t = t.BaseType)
        {
            var f = t.GetField(field, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly);
            if (f != null) { f.SetValue(target, value); return; }
        }
        throw new Exception($"no field {field} on {target.GetType().Name}");
    }

    static object Get(object target, string field)
    {
        for (var t = target.GetType(); t != null; t = t.BaseType)
        {
            var f = t.GetField(field, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly);
            if (f != null) return f.GetValue(target);
        }
        throw new Exception($"no field {field} on {target.GetType().Name}");
    }

    static object Call(object target, string method, params object[] args) =>
        target.GetType().GetMethod(method, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).Invoke(target, args);

    static void Enable(Component c)
    {
        c.GetType().GetMethod("Awake", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)?.Invoke(c, null);
        c.GetType().GetMethod("OnEnable", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)?.Invoke(c, null);
    }

    static GameObject GO(string name, Transform parent = null)
    {
        var go = new GameObject(name);
        if (parent != null) go.transform.SetParent(parent);
        return go;
    }

    // ---- the data ------------------------------------------------------------------------------------------------

    static void BuildData(string dataPath)
    {
        Data = JsonNode.Parse(File.ReadAllText(dataPath));
        var vs = Data["ingredients"].AsArray();
        Variants = new IngredientData[vs.Count];
        for (var i = 0; i < vs.Count; i++)
        {
            var v = vs[i];
            var d = ScriptableObject.CreateInstance<IngredientData>();
            d.name = (string)v["asset"];
            Set(d, "<Name>k__BackingField", (IngredientName)(int)v["name"]);
            Set(d, "<Status>k__BackingField", (IngredientStatus)(int)v["status"]);
            Set(d, "<PreparationTime>k__BackingField", (float)(double)v["preparationTime"]);
            Set(d, "<Icon>k__BackingField", new Sprite { name = (string)v["icon"] });
            var prefab = GO(d.name);
            var body = prefab.AddComponent<CollectableBody>();
            Set(body, "body", prefab.AddComponent<Rigidbody>());
            var ingredient = prefab.AddComponent<Ingredient>();
            Set(ingredient, "data", d);
            Set(ingredient, "collectibleBody", body);
            Set(ingredient, "highlighterContainer", prefab.AddComponent<HighlighterContainer>());
            Set(d, "<Prefab>k__BackingField", ingredient);
            Variants[i] = d;
        }
        var collections = Data["collections"].AsArray().Select(c =>
        {
            var col = ScriptableObject.CreateInstance<IngredientDataCollection>();
            Set(col, "<Name>k__BackingField", (IngredientName)(int)c["name"]);
            Set(col, "ingredients", c["ingredients"].AsArray().Select(n => Variants[(int)n]).ToArray());
            return col;
        }).ToArray();
        Ingredients = ScriptableObject.CreateInstance<IngredientSettings>();
        Set(Ingredients, "collections", collections);
        Ingredients.InitializeDictionary();
        RecipeList = Data["recipes"].AsArray().Select(r =>
        {
            var recipe = ScriptableObject.CreateInstance<RecipeData>();
            recipe.name = (string)r["asset"];
            Set(recipe, "<Name>k__BackingField", (string)r["name"]);
            Set(recipe, "<Chance>k__BackingField", (float)(double)r["chance"]);
            recipe.TipMultiplier = (float)(double)r["tipMultiplier"];
            recipe.PlatedIngredients = r["plated"].AsArray().Select(p =>
            {
                var pos = p["position"].AsArray().Select(x => (float)(double)x).ToArray();
                var rot = p["rotation"].AsArray().Select(x => (float)(double)x).ToArray();
                return new PlatedIngredient(Variants[(int)p["variant"]], new Vector3(pos[0], pos[1], pos[2]), new Vector3(rot[0], rot[1], rot[2]));
            }).ToArray();
            return recipe;
        }).ToArray();
        Recipes = ScriptableObject.CreateInstance<RecipeSettings>();
        Set(Recipes, "recipes", RecipeList);
        Recipes.Initialize();
    }

    static Ingredient NewIngredient(int variant) => Variants[variant].Spawn();

    static string F(float f) => f.ToString("R", CultureInfo.InvariantCulture);

    // ---- V1 to V5 ------------------------------------------------------------------------------------------------

    static JsonArray WeightedPicks()
    {
        var rolls = new List<float> { 0f, 0.3499f, 0.35f, 0.3501f, 0.4999f, 0.5f, 0.7499f, 0.75f, 0.8999f, 0.9f, 0.9999f, 1f };
        var rng = new System.Random(1);
        for (var i = 0; i < 1000; i++) rolls.Add((float)rng.NextDouble());
        var out_ = new JsonArray();
        foreach (var roll in rolls)
        {
            UnityEngine.Random.value = roll;
            var recipe = Recipes.GetRandom();
            out_.Add(new JsonArray(F(roll), Array.IndexOf(RecipeList, recipe)));
        }
        return out_;
    }

    static JsonArray WaitingTimes() => new JsonArray(RecipeList.Select(r => (JsonNode)F(r.GetWaitingTime(Ingredients, 30))).ToArray());

    static JsonArray Tips()
    {
        var out_ = new JsonArray();
        for (var r = 0; r < RecipeList.Length; r++)
        {
            var recipe = RecipeList[r];
            var wait = recipe.GetWaitingTime(Ingredients, 30);
            var values = new List<float> { wait, wait - 1f / 60f };
            for (var t = wait; t >= 0; t -= 0.5f) values.Add(t);
            for (var k = 1; k <= 40; k++)
            {
                var exact = k / recipe.TipMultiplier;
                values.Add(exact);
                values.Add(MathF.BitDecrement(exact));
                values.Add(MathF.BitIncrement(exact));
            }
            foreach (var v in values)
            {
                if (v < 0 || v > wait) continue;
                var order = new Order(recipe, v);
                out_.Add(new JsonArray(r, F(v), order.GetTip()));
            }
        }
        return out_;
    }

    static JsonArray CanPlate() => new JsonArray(Variants.Select(v => (JsonNode)Recipes.CanPlate(v)).ToArray());

    static readonly int[] Plateable = { 0, 2, 4, 6, 9 };

    static JsonArray Matching()
    {
        var out_ = new JsonArray();
        var closest = typeof(RecipeSettings).GetMethod("GetClosestRecipe", BindingFlags.Instance | BindingFlags.NonPublic);
        var pool = Plateable.ToDictionary(v => v, v => Variants[v].Prefab);
        void Walk(List<int> seq)
        {
            if (seq.Count > 0)
            {
                var ings = seq.Select(v => pool[v]).ToArray();
                var mask = 0;
                for (var r = 0; r < RecipeList.Length; r++) if (RecipeList[r].ContainsOnly(ings)) mask |= 1 << r;
                var layout = (RecipeData)closest.Invoke(Recipes, new object[] { ings });
                out_.Add(new JsonArray(string.Join(",", seq), mask, Array.IndexOf(RecipeList, layout)));
            }
            if (seq.Count == 5) return;
            foreach (var v in Plateable) { seq.Add(v); Walk(seq); seq.RemoveAt(seq.Count - 1); }
        }
        Walk(new List<int>());
        return out_;
    }

    // ---- V6 plate, V7 score -----------------------------------------------------------------------------------

    static JsonArray PlateSequences()
    {
        var out_ = new JsonArray();
        var iconPrefabGo = GO("Icon");
        var iconPrefab = iconPrefabGo.AddComponent<IngredientIcon>();
        Set(iconPrefab, "icon", iconPrefabGo.AddComponent<Image>());
        var rng = new System.Random(6);
        for (var s = 0; s < 200; s++)
        {
            var plateGo = GO("Plate");
            var body = plateGo.AddComponent<CollectableBody>();
            Set(body, "body", plateGo.AddComponent<Rigidbody>());
            var plate = plateGo.AddComponent<Plate>();
            Set(plate, "collectibleBody", body);
            Set(plate, "highlighterContainer", plateGo.AddComponent<HighlighterContainer>());
            Set(plate, "recipeSettings", Recipes);
            var icons = GO("Icons", plateGo.transform).AddComponent<IngredientIcons>();
            Set(icons, "iconPrefab", iconPrefab);
            Set(plate, "icons", icons);
            var steps = new JsonArray();
            for (var n = 0; n < 12; n++)
            {
                if (plate.HasIngredients() && rng.Next(4) == 0)
                {
                    var removed = plate.RemoveLast();
                    steps.Add(new JsonArray("scrape", Array.IndexOf(Variants, removed.Data), Contents(plate), (bool)Get(plate, "hasBread")));
                    continue;
                }
                var variant = rng.Next(10);
                var holder = GO("From").AddComponent<ItemHolder>();
                holder.PlaceItem(NewIngredient(variant));
                var ok = plate.TryTransferItem(holder);
                steps.Add(new JsonArray("offer", variant, ok, Contents(plate), (bool)Get(plate, "hasBread"), holder.HasItem()));
            }
            out_.Add(steps);
        }
        return out_;
    }

    /// <summary>A plate's ingredients bottom to top.</summary>
    static string Contents(Plate plate) => string.Join(",", plate.Ingredients.Reverse().Select(i => Array.IndexOf(Variants, i.Data)));

    static JsonArray ScoreSequences()
    {
        var out_ = new JsonArray();
        var rng = new System.Random(7);
        for (var s = 0; s < 100; s++)
        {
            var score = ScriptableObject.CreateInstance<ScoreSettings>();
            Set(score, "deliveredOrdersMultiplier", 20f);
            Set(score, "failedOrdersMultiplier", 10f);
            score.Initialize();
            var deltas = new List<string>();
            score.OnScoreIncreased += d => deltas.Add("+" + F(d));
            score.OnScoreDecreased += d => deltas.Add("-" + F(d));
            var ops = new JsonArray();
            for (var n = 0; n < 15; n++)
            {
                if (rng.Next(3) == 0) { score.DeliveryFailedOrder(); ops.Add(-1); }
                else { var tip = rng.Next(0, 33); score.DeliveryOrder(tip); ops.Add(tip); }
            }
            out_.Add(new JsonObject
            {
                ["ops"] = ops,
                ["tips"] = score.Tips,
                ["failed"] = score.FailedDeliveries,
                ["ok"] = score.SuccessfulDeliveries,
                ["score"] = F(score.Score),
                ["deltas"] = new JsonArray(deltas.Select(d => (JsonNode)d).ToArray()),
            });
        }
        return out_;
    }

    // ---- V9 timelines -------------------------------------------------------------------------------------------

    static MatchSettings NewMatch(uint time, uint final)
    {
        var match = ScriptableObject.CreateInstance<MatchSettings>();
        Set(match, "<TimeLimit>k__BackingField", new TimeLimit(time, final));
        var manager = GO("MatchManager").AddComponent<MatchManager>();
        match.Initialize(manager);
        return match;
    }

    sealed class Prep
    {
        public AbstractIngredientPreparator preparator;
        public PreparationCounter counter;
        public ItemHolder holder;
        public List<string> log = new List<string>();
    }

    static Prep NewPreparator(bool stove, MatchSettings match)
    {
        var p = new Prep();
        var counterGo = GO(stove ? "StoveCounter" : "CutCounter");
        var counterHolderGo = GO("CounterItemHolder", counterGo.transform);
        var go = GO(stove ? "Stove" : "CuttingBoard", counterGo.transform);
        var holderGo = GO("ItemHolder", go.transform);
        p.holder = holderGo.AddComponent<ItemHolder>();
        var animation = go.AddComponent<Animation>();
        if (stove)
        {
            var s = go.AddComponent<Stove>();
            var pan = GO("FryingPan", go.transform);
            var fry = pan.AddComponent<FryingPan>();
            Set(fry, "audioSource", pan.AddComponent<AudioSource>());
            Set(fry, "sizzlingParticles", GO("Sizzle", pan.transform).AddComponent<ParticleSystem>());
            Set(fry, "burnedParticles", GO("Smoke", pan.transform).AddComponent<ParticleSystem>());
            var warningGo = GO("Warning", go.transform);
            var warning = warningGo.AddComponent<PreparationWarning>();
            Set(warning, "audioSource", warningGo.AddComponent<AudioSource>());
            Set(warning, "spriteRenderer", warningGo.AddComponent<SpriteRenderer>());
            Set(s, "fryingPan", fry);
            Set(s, "warning", warning);
            Set(s, "timeBeforeBurn", 2f);
            Set(s, "allowedStatus", IngredientStatus.Raw);
            p.preparator = s;
        }
        else
        {
            var b = go.AddComponent<CuttingBoard>();
            var knifeGo = GO("Knife", go.transform);
            var knife = knifeGo.AddComponent<CounterKnife>();
            Set(knife, "audioDictionary", knifeGo.AddComponent<AudioSourceDictionary>());
            Set(b, "knife", knife);
            Set(b, "allowedStatus", IngredientStatus.Cuttable);
            p.preparator = b;
        }
        Set(p.preparator, "matchSettings", match);
        Set(p.preparator, "holder", p.holder);
        Set(p.preparator, "animation", animation);
        Set(p.preparator, "preparatedStatus", IngredientStatus.Ready);
        Set(p.preparator, "ingredientSettings", Ingredients);
        Set(p.preparator, "finalSecondsBooster", 1.25f);
        p.counter = counterGo.AddComponent<PreparationCounter>();
        Set(p.counter, "holder", p.holder);
        Set(p.counter, "highlightableContainer", counterGo.AddComponent<HighlighterContainer>());
        Set(p.counter, "preparator", p.preparator);
        Enable(p.preparator);
        Enable(p.counter);
        p.preparator.OnPreparationStarted += () => p.log.Add("started " + F(Golden.Runner.Now));
        p.preparator.OnPreparationCompleted += () => p.log.Add("completed " + F(Golden.Runner.Now) + " " + Array.IndexOf(Variants, ((Ingredient)p.holder.CurrentItem).Data));
        p.preparator.OnIngredientRejected += () => p.log.Add("rejected " + F(Golden.Runner.Now));
        p.holder.OnItemPlaced += item => p.log.Add("placed " + F(Golden.Runner.Now) + " " + Array.IndexOf(Variants, ((Ingredient)item).Data));
        return p;
    }

    /// <summary>One preparation timeline: put a variant on, then press Q (or remove the item) at the given times.</summary>
    static JsonObject Timeline(string name, bool stove, int variant, (float at, string what)[] actions, float until, float limit = 25, float final = 20)
    {
        Golden.Runner.Reset();
        Golden.Record.Events.Clear();
        var match = NewMatch((uint)limit, (uint)final);
        var p = NewPreparator(stove, match);
        match.StartTimeLimit();
        p.holder.PlaceItem(NewIngredient(variant));
        var next = 0;
        var warnings = new List<string>();
        while (Golden.Runner.Now < until - 1e-4)
        {
            while (next < actions.Length && Golden.Runner.Now >= actions[next].at - 1e-4)
            {
                var a = actions[next++];
                if (a.what == "Q") p.counter.Interact();
                else if (a.what == "take") p.counter.ReleaseItem();
                p.log.Add(a.what + " " + F(Golden.Runner.Now));
            }
            Golden.Runner.Step(DT);
        }
        foreach (var e in Golden.Record.Events) if (e.Contains("Warning.audio.Play")) warnings.Add(e.Split(' ')[0]);
        var item = p.holder.CurrentItem as Ingredient;
        return new JsonObject
        {
            ["name"] = name,
            ["stove"] = stove,
            ["variant"] = variant,
            ["actions"] = new JsonArray(actions.Select(a => (JsonNode)new JsonArray(F(a.at), a.what)).ToArray()),
            ["until"] = F(until),
            ["limit"] = F(limit),
            ["final"] = F(final),
            ["log"] = new JsonArray(p.log.Select(l => (JsonNode)l).ToArray()),
            ["warnings"] = new JsonArray(warnings.Select(w => (JsonNode)w).ToArray()),
            ["end"] = item == null ? -2 : Array.IndexOf(Variants, item.Data),
            ["burning"] = p.preparator is Stove st && st.IsBurning,
        };
    }

    static JsonArray Timelines() => new JsonArray(
        Timeline("cut cheese", false, 3, new[] { (0f, "Q") }, 6),
        Timeline("cut cheese, pause at 1, resume at 2", false, 3, new[] { (0f, "Q"), (1f, "Q"), (2f, "Q") }, 8),
        Timeline("cut tomato from 4 (final seconds from 5)", false, 8, new[] { (4f, "Q") }, 10),
        Timeline("cut tomato from 8", false, 8, new[] { (8f, "Q") }, 14),
        Timeline("cut tomato from 4, paused 6 to 12", false, 8, new[] { (4f, "Q"), (6f, "Q"), (12f, "Q") }, 16),
        Timeline("cut tomato from 22 (final seconds end at 25)", false, 8, new[] { (22f, "Q") }, 28),
        Timeline("cut cabbage: Q twice on the sliced one", false, 1, new[] { (0f, "Q"), (4f, "Q") }, 6),
        Timeline("Q on whole bread: rejected", false, 0, new[] { (0f, "Q") }, 1),
        Timeline("cook and burn", true, 5, new[] { (0f, "Q") }, 16),
        Timeline("cook, cancel the burn at 8", true, 5, new[] { (0f, "Q"), (8f, "Q") }, 20),
        Timeline("cook, take it off at 9", true, 5, new[] { (0f, "Q"), (9f, "take") }, 20),
        Timeline("cook, pause 2 to 4", true, 5, new[] { (0f, "Q"), (2f, "Q"), (4f, "Q") }, 18),
        Timeline("cook from 3 in the final seconds", true, 5, new[] { (3f, "Q") }, 16)
    );

    /// <summary>The ordering loop, expiry, removal, deliveries (including a second matching plate within the 1 s) and plate returns.</summary>
    static JsonObject Orders(float[] rolls, (float at, int recipe)[] deliveries, float until)
    {
        Golden.Runner.Reset();
        var settings = ScriptableObject.CreateInstance<OrderSettings>();
        Set(settings, "recipeSettings", Recipes);
        Set(settings, "ingredientSettings", Ingredients);
        Set(settings, "maxOrders", 3);
        Set(settings, "additionalTimePerIngredient", 30f);
        Set(settings, "timeByNewOrder", 15f);
        Set(settings, "timeToRemoveAfterFail", 1f);
        Set(settings, "timeToRemoveAfterDelivery", 1f);
        Set(settings, "timeToReturnPlate", 4f);
        var manager = GO("OrderManager").AddComponent<OrderManager>();
        Set(manager, "<Settings>k__BackingField", settings);
        settings.Initialize(manager);
        var log = new JsonArray();
        var ids = new Dictionary<Order, int>();
        var created = 0;
        settings.OnOrderCreated += o => { ids[o] = ++created; log.Add($"created {F(Golden.Runner.Now)} {ids[o]} {Array.IndexOf(RecipeList, Get(o, "recipe"))} {F(o.WaitingTime)}"); };
        settings.OnOrderFailed += o => log.Add($"failed {F(Golden.Runner.Now)} {ids[o]}");
        settings.OnOrderDelivered += o => log.Add($"delivered {F(Golden.Runner.Now)} {ids[o]}");
        settings.OnOrderRemoved += o => log.Add($"removed {F(Golden.Runner.Now)} {ids[o]}");
        settings.OnPlateReturned += () => log.Add($"plate {F(Golden.Runner.Now)}");
        UnityEngine.Random.value = rolls[0];
        settings.StartOrdering();
        var next = 0;
        while (Golden.Runner.Now < until - 1e-4)
        {
            while (next < deliveries.Length && Golden.Runner.Now >= deliveries[next].at - 1e-4)
            {
                var d = deliveries[next++];
                var ings = RecipeList[d.recipe].PlatedIngredients.Select(p => p.Data.Prefab).ToArray();
                try
                {
                    var ok = settings.TryDelivery(ings, out int tip);
                    log.Add($"try {F(Golden.Runner.Now)} {d.recipe} {ok} {tip}");
                }
                catch (Exception e) { log.Add($"try {F(Golden.Runner.Now)} {d.recipe} threw {e.GetType().Name}"); }
            }
            UnityEngine.Random.value = rolls[Math.Min(created, rolls.Length - 1)];
            try { Golden.Runner.Step(DT); }
            catch (Exception e) { log.Add($"threw {F(Golden.Runner.Now)} {e.GetType().Name}"); }
        }
        return new JsonObject
        {
            ["rolls"] = new JsonArray(rolls.Select(r => (JsonNode)F(r)).ToArray()),
            ["deliveries"] = new JsonArray(deliveries.Select(d => (JsonNode)new JsonArray(F(d.at), d.recipe)).ToArray()),
            ["until"] = F(until),
            ["log"] = log,
        };
    }

    public static void Main(string[] args)
    {
        var outPath = args.Length > 0 ? args[0] : "vectors/upstream.json";
        BuildData(Path.Combine(Path.GetDirectoryName(Path.GetFullPath(outPath)), "..", "data", "kitchen-data.json"));
        var rolls = new[] { 0.1f, 0.6f, 0.95f, 0.4f, 0.8f, 0.2f, 0.55f, 0.99f, 0.3f, 0.7f, 0.05f, 0.45f };
        var doc = new JsonObject
        {
            ["source"] = "HyagoOliveira/KitchenChaos @ 4a73a26, compiled with dotnet 8 against golden/UnityStubs.cs",
            ["weighted"] = WeightedPicks(),
            ["waiting"] = WaitingTimes(),
            ["tips"] = Tips(),
            ["canPlate"] = CanPlate(),
            ["matching"] = Matching(),
            ["plates"] = PlateSequences(),
            ["score"] = ScoreSequences(),
            ["timelines"] = Timelines(),
            ["orders"] = new JsonArray(
                Orders(rolls, new (float, int)[0], 220),
                Orders(rolls, new[] { (20f, 0), (20.5f, 0), (40f, 4), (70f, 3) }, 120),
                Orders(new[] { 0.2f, 0.2f, 0.2f, 0.2f, 0.2f, 0.2f }, new[] { (5f, 0), (8f, 0), (30f, 0), (30.3f, 0), (61.5f, 0) }, 90)
            ),
        };
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outPath)));
        File.WriteAllText(outPath, doc.ToJsonString(new JsonSerializerOptions { WriteIndented = false, TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver() }));
        Console.WriteLine($"wrote {outPath}");
    }
}
