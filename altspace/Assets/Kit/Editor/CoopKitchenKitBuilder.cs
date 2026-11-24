// The coop-kitchen kit, built from data: the upstream Game scene's counter layout (ts/data/kitchen-data.json) dressed with
// KayKit Restaurant Bits models (Kay Lousberg, CC0), and the object contract the TypeScript expects
// (Assets/Kit/Editor/kit-contract.json, written by ts/tools/gen-bindings.ts). No upstream prefab, model, texture, sound or
// animation is used. What changes against upstream, and why, is in altspace/PORT.md (sections 8, 10 and 11).
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using PortKit;
using TMPro;
using Unity.VisualScripting;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.TextCore;
using Object = UnityEngine.Object;

namespace CoopKitchen
{
    public sealed class CoopKitchenKitBuilder : KitBuilder
    {
        const string ContractPath = "Assets/Kit/Editor/kit-contract.json";
        const string DataPath = "ts/data/kitchen-data.json";
        const string ArtFolder = "Assets/Kit/Art/KayKit";
        const string AudioFolder = "Assets/Kit/Audio";
        const string MaterialFolder = "Assets/Kit/Materials";
        const string AnimationFolder = "Assets/Kit/Animations";
        const string IconFolder = "Assets/Kit/Icons";

        /// <summary>PORT.md 8.1: the kitchen at 0.64 of upstream, so that a counter top is 0.90 m and a cell 0.96 m.</summary>
        public const float KitScale = 0.64f;
        /// <summary>Upstream ring centre (PORT.md 8.1): the kit's origin is the kitchen centre on the floor.</summary>
        static readonly Vector2 Centre = new Vector2(0.25f, -1.25f);
        const float Cell = 1.5f * KitScale;          // 0.96 m
        const float TopY = 0.9f;                     // counter top
        /// <summary>KayKit units to metres for items: a KayKit plate (0.95 units) is 0.64 m, upstream's 1 m plate at kit scale.</summary>
        const float ItemScale = 0.674f;

        public override string Slug => "coop-kitchen";
        public override string Title => "Co-op Kitchen";
        public override string Summary => "Cook burgers together: take ingredients, cut and cook them, plate them and deliver the orders before time runs out.";
        public override string Description =>
            "A co-op cooking game for up to four chefs (eight with the chefs setting): orders come in, chefs take bread, meat, " +
            "cheese, cabbage and tomato from the crates, cut and cook them, build the dish on a plate and deliver it for points " +
            "and tips before the round ends. Click counters, knives and stove knobs (or grab and let go of items in VR). " +
            "Rules from HyagoOliveira/KitchenChaos (MIT, Copyright (c) 2023 Hyago Oliveira), made co-op; models from KayKit " +
            "Restaurant Bits by Kay Lousberg (CC0); sounds from Kenney (CC0). The credits panel on the board lists every licence.";
        public override string SnippetPosition => "0 0 0";
        /// <summary>PORT.md 8.2 (defaults reproduce upstream).</summary>
        public override IReadOnlyList<(string name, string value)> SnippetSettings => new[]
        {
            ("room", ""), ("round", "120"), ("difficulty", "normal"), ("chefs", "4"), ("door", "west"), ("music", "on"), ("tutorial", "on"),
        };

        // ---- what Compose made, by kit path ----
        readonly Dictionary<string, GameObject> made = new Dictionary<string, GameObject>(StringComparer.Ordinal);
        KitStage stage;
        Material kayKit, kayKitBlue, boardBack, panelBack, buttonFace, barBack, barFill, prepFill, arrowMat, sizzleMat, smokeMat, warnMat, knobMat;
        TMP_FontAsset font;
        TMP_SpriteAsset icons;
        readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
        AudioClip sizzle;

        protected override void Compose(KitStage s)
        {
            stage = s;
            made.Clear();
            controllers.Clear();
            var contract = JObject.Parse(File.ReadAllText(ContractPath));
            var data = JObject.Parse(File.ReadAllText(DataPath));
            font = KitText.DefaultFont();
            PrepareImports();
            Materials();

            Put("Logic");
            Floor();
            Counters((JArray)data["layouts"]["game"]);
            Items();
            Board();
            Arrows();
            Audio();
            Put("Music").AddComponent<AudioSource>().playOnAwake = false;     // no music: none with a licence we could verify (PORT.md 11)
            icons = IconSprites();
            foreach (var t in stage.Root.GetComponentsInChildren<TMP_Text>(true)) if (t.name == "Icons") t.spriteAsset = icons;

            ApplyContract(contract);
        }

        // ------------------------------------------------------------------ the contract: keys, refs, behaviours, events

        void ApplyContract(JObject contract)
        {
            var objects = (JObject)contract["objects"];
            var off = new List<GameObject>();
            var byKey = new Dictionary<string, GameObject>(StringComparer.Ordinal);
            foreach (var p in objects.Properties())
            {
                var o = (JObject)p.Value;
                string path = (string)o["path"];
                if (!made.TryGetValue(path, out var go))
                {
                    stage.Report.AppendLine($"   contract path '{path}' had no art: an empty object made for it");
                    go = Put(path);
                }
                byKey[p.Name] = go;
                stage.Object(go, key: p.Name, grab: (bool?)o["grab"] ?? false, click: (bool?)o["click"] ?? false);
                if ((bool?)o["active"] == false) off.Add(go);
            }
            foreach (var key in (JArray)contract["refs"]) stage.Ref(byKey[(string)key]);

            var tokens = new Dictionary<string, object>(StringComparer.Ordinal);
            foreach (JObject b in (JArray)contract["behaviours"])
            {
                var go = byKey[(string)b["object"] ?? "logic"];
                tokens[(string)b["id"]] = stage.Behaviour(go, (string)b["type"], (JObject)(b["fields"] ?? new JObject()).DeepClone());
            }
            foreach (JObject e in (JArray)contract["events"])
                stage.Event(byKey[(string)e["object"]], (string)e["kind"], tokens[(string)e["behaviour"]], (string)e["method"]);

            // the sound effects: one BS Audio Source clip list on the "sfx" object (contract: {"$clip": n, "on": "sfx"})
            var sfx = byKey["sfx"];
            var clipList = clips.OrderBy(c => c.Key, StringComparer.Ordinal).Select(c => c.Value).ToList();
            var source = sfx.GetComponent<AudioSource>();
            var bsAudio = sfx.AddComponent(GraphTypes.Find("BS.BSAudioSource"));
            var so = new SerializedObject(bsAudio);
            var list = so.FindProperty("clips");
            list.arraySize = clipList.Count;
            for (int i = 0; i < clipList.Count; i++) list.GetArrayElementAtIndex(i).objectReferenceValue = clipList[i];
            var playOnAwake = so.FindProperty("playOnAwake");
            if (playOnAwake != null) playOnAwake.boolValue = false;
            so.ApplyModifiedPropertiesWithoutUndo();
            var mirror = new AotList();
            foreach (var c in clipList) mirror.Add(c);
            (sfx.GetComponent<Variables>() ?? sfx.AddComponent<Variables>()).declarations.Set(RelayGraph.ClipsVariable, mirror);
            stage.Report.AppendLine($"   sfx: {clipList.Count} clips ({string.Join(", ", clipList.Select(c => c.name))}); source {source != null}");

            foreach (var go in off) go.SetActive(false);
        }

        // ------------------------------------------------------------------ objects by path

        /// <summary>The object at a kit path (made, with its parents, if it is not there yet).</summary>
        GameObject Put(string path)
        {
            if (made.TryGetValue(path, out var known)) return known;
            int cut = path.LastIndexOf('/');
            var parent = cut < 0 ? stage.Root.transform : Put(path.Substring(0, cut)).transform;
            var go = stage.Create(cut < 0 ? path : path.Substring(cut + 1), parent);
            made[path] = go;
            return go;
        }

        static Vector3 KitPosition(float x, float z) => new Vector3((x - Centre.x) * KitScale, 0f, (z - Centre.y) * KitScale);

        GameObject Model(string name, Transform parent, Vector3 position, Vector3 scale, float yaw = 0f, Material material = null, string objectName = null)
        {
            var asset = AssetDatabase.LoadAssetAtPath<GameObject>($"{ArtFolder}/{name}.obj") ?? throw new Exception($"no model {ArtFolder}/{name}.obj");
            var go = stage.Copy(asset, parent, objectName ?? "Model");
            go.transform.localPosition = position;
            go.transform.localRotation = Quaternion.Euler(0f, yaw, 0f);
            go.transform.localScale = scale;
            foreach (var r in go.GetComponentsInChildren<MeshRenderer>(true))
            {
                r.sharedMaterials = Enumerable.Repeat(material ?? kayKit, r.sharedMaterials.Length).ToArray();
                r.shadowCastingMode = ShadowCastingMode.On;
            }
            foreach (var c in go.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(c);
            return go;
        }

        static void Box(GameObject go, Vector3 centre, Vector3 size)
        {
            var box = go.GetComponent<BoxCollider>() ?? go.AddComponent<BoxCollider>();
            box.center = centre;
            box.size = size;
        }

        static AudioSource Speaker(GameObject go, float range = 12f)
        {
            var a = go.GetComponent<AudioSource>() ?? go.AddComponent<AudioSource>();
            a.playOnAwake = false;
            a.spatialBlend = 1f;
            a.rolloffMode = AudioRolloffMode.Linear;
            a.minDistance = 1f;
            a.maxDistance = range;
            a.dopplerLevel = 0f;
            return a;
        }

        GameObject Cube(string name, Transform parent, Vector3 position, Vector3 size, Material material)
        {
            var go = stage.Primitive(PrimitiveType.Cube, name, parent);
            Object.DestroyImmediate(go.GetComponent<Collider>());
            go.transform.localPosition = position;
            go.transform.localScale = size;
            var r = go.GetComponent<MeshRenderer>();
            r.sharedMaterial = material;
            r.shadowCastingMode = ShadowCastingMode.Off;
            return go;
        }

        TextMeshPro Text(GameObject go, string text, float size, Vector2 box, Color colour, TextAlignmentOptions align = TextAlignmentOptions.Center)
        {
            var t = go.GetComponent<TextMeshPro>() ?? go.AddComponent<TextMeshPro>();
            t.font = font;
            t.fontSize = size;
            t.rectTransform.sizeDelta = box;
            t.color = colour;
            t.alignment = align;
            t.textWrappingMode = TextWrappingModes.Normal;
            t.richText = true;
            t.text = text;
            t.GetComponent<MeshRenderer>().shadowCastingMode = ShadowCastingMode.Off;
            return t;
        }

        // ------------------------------------------------------------------ floor and counters

        void Floor()
        {
            var floor = Put("Floor");
            // the whole footprint (counters included): 11 x 7 cells of 0.96 m; a thin box at the floor for clicks
            float w = 11 * Cell, d = 7 * Cell;
            Box(floor, new Vector3(0f, -0.02f, 0f), new Vector3(w, 0.04f, d));
            Speaker(floor);
            var tiles = stage.Create("Tiles", floor.transform);
            for (int i = 0; i < 11; i++)
                for (int j = 0; j < 7; j++)
                    Model("floor_kitchen", tiles.transform, new Vector3((i - 5) * Cell, -0.01f, (j - 3) * Cell), new Vector3(Cell / 4f, 0.03f, Cell / 4f), 0f, null, $"Tile{i}_{j}");
        }

        void Counters(JArray cells)
        {
            Put("Counters");
            foreach (JObject cell in cells)
            {
                string name = (string)cell["name"], prefab = (string)cell["prefab"];
                var root = Put($"Counters/{name}");
                root.transform.localPosition = KitPosition((float)cell["x"], (float)cell["z"]);
                root.transform.localRotation = Quaternion.Euler(0f, (float)cell["yaw"], 0f);
                Speaker(root);
                var front = Put($"Counters/{name}/Front");                                         // where a test points to click the counter
                front.transform.localPosition = new Vector3(0f, 0.35f, Cell / 2f - 0.01f);
                var top = Put($"Counters/{name}/Top");
                top.transform.localPosition = new Vector3(0f, TopY, 0f);
                var counterScale = new Vector3(Cell / 2f, TopY, Cell / 2f);
                float height = TopY;

                switch (prefab)
                {
                    case "Counter_Corner":
                        Model("kitchencounter_outercorner", root.transform, Vector3.zero, counterScale);
                        Object.DestroyImmediate(top);
                        made.Remove($"Counters/{name}/Top");
                        break;
                    case "Trash":
                        // Restaurant Bits has no bin: its large jar, widened, stands in (PORT.md 11, art)
                        Model("jar_C_large", root.transform, Vector3.zero, new Vector3(1.5f, 1.2f, 1.5f));
                        Animated(root, "Trash", ("Idle", Pose("Model", Vector3.zero, new Vector3(1.5f, 1.2f, 1.5f)), false, 1f),
                            ("Trash@DropItem", Squash("Model", new Vector3(1.5f, 1.2f, 1.5f), 0.52f), false, 1f));
                        break;
                    case "Counter_Delivery":
                        Model("kitchencounter_straight_B", root.transform, Vector3.zero, counterScale, 0f, kayKitBlue);
                        Model("menu", root.transform, new Vector3(-0.32f, TopY, -0.3f), Vector3.one * 0.5f, 180f, null, "Menu");
                        DeliveryCanvas(name, root);
                        break;
                    case "CutCounter":
                        Model("kitchencounter_straight_A", root.transform, Vector3.zero, counterScale);
                        CuttingBoard(name, root);
                        top.transform.localPosition = new Vector3(0f, TopY + 0.06f, -0.04f);
                        break;
                    case "StoveCounter":
                        Model("kitchencounter_straight_A", root.transform, Vector3.zero, counterScale);
                        Stove(name, root);
                        top.transform.localPosition = new Vector3(0f, 1.06f, -0.04f);
                        height = 1.08f;
                        break;
                    case "Counter_PlateStack":
                        Model("kitchencounter_straight_B", root.transform, Vector3.zero, counterScale);
                        var ring = stage.Primitive(PrimitiveType.Cylinder, "Ring", root.transform);
                        Object.DestroyImmediate(ring.GetComponent<Collider>());
                        ring.transform.localPosition = new Vector3(0f, TopY + 0.003f, 0f);
                        ring.transform.localScale = new Vector3(0.7f, 0.003f, 0.7f);
                        ring.GetComponent<MeshRenderer>().sharedMaterial = barBack;
                        break;
                    default:
                        if (prefab.EndsWith("Counter") && CrateModels.TryGetValue(prefab, out var crate))
                        {
                            Model("kitchencounter_straight_A", root.transform, Vector3.zero, counterScale);
                            Crate(name, root, crate);
                            top.transform.localPosition = new Vector3(0f, TopY + 0.34f, 0f);
                            height = TopY + 0.34f;
                        }
                        else Model("kitchencounter_straight_A", root.transform, Vector3.zero, counterScale);
                        break;
                }
                Box(root, new Vector3(0f, height / 2f, 0f), new Vector3(Cell, height, Cell));
            }
        }

        static readonly Dictionary<string, string> CrateModels = new Dictionary<string, string>
        {
            ["BreadCounter"] = "crate_buns", ["CabbageCounter"] = "crate_lettuce", ["CheeseCounter"] = "crate_cheese",
            ["MeatCounter"] = "crate_steak", ["TomatoCounter"] = "crate_tomatoes",
        };

        void Crate(string name, GameObject root, string model)
        {
            const float s = 0.4f;                                           // 2 KayKit units -> 0.8 m
            Model(model, root.transform, new Vector3(0f, TopY, 0f), Vector3.one * s, 0f, null, "Crate");
            // the lid: hinged at the back edge, opened and closed by IngredientCounter@Open (upstream: the crate's door)
            var hinge = stage.Create("Lid", root.transform);
            hinge.transform.localPosition = new Vector3(0f, TopY + 0.8f * s, -1f * s);
            Model("crate_lid", hinge.transform, new Vector3(0f, 0f, 1f * s), Vector3.one * s);
            Animated(root, "Crate", ("Idle", Turn("Lid", 0f, 0f, 0f, 0.1f), false, 1f),
                ("IngredientCounter@Open", Turn("Lid", 0f, -75f, 0f, 0.5f), false, 1f));
        }

        void CuttingBoard(string name, GameObject root)
        {
            var board = Put($"Counters/{name}/CuttingBoard");
            Model("cuttingboard", board.transform, new Vector3(0f, TopY, -0.04f), new Vector3(0.45f, 0.4f, 0.55f), 0f, null, "Board");
            // the knife: the object is Q's click target and stays; its Model is shown and hidden (CuttingBoard.ts)
            var knife = Put($"Counters/{name}/CuttingBoard/Knife");
            knife.transform.localPosition = new Vector3(0.05f, TopY + 0.03f, 0.36f);
            Box(knife, new Vector3(0f, 0.03f, 0f), new Vector3(0.42f, 0.1f, 0.14f));
            var model = Model("knife", knife.transform, Vector3.zero, Vector3.one * 0.32f, 0f, null, "Model");
            model.transform.localRotation = KnifeRest;
            Animated(board, "CuttingBoard", ("CuttingBoard@Idle", Pose("Knife/Model", Vector3.zero, Vector3.one * 0.32f, KnifeRest), false, 1f),
                ("CuttingBoard@Cutting", Chop("Knife/Model"), true, 1f));
            PrepCanvas(name, board, "Cannot \nCut");
        }

        static readonly Quaternion KnifeRest = Quaternion.Euler(0f, 0f, 90f);

        void Stove(string name, GameObject root)
        {
            var stove = Put($"Counters/{name}/Stove");
            const float s = Cell / 2f;
            Model("stove_single_countertop", stove.transform, new Vector3(0f, TopY - 0.93f * s, 0f), Vector3.one * s, 0f, null, "Hob");
            var pan = Put($"Counters/{name}/Stove/Pan");
            pan.transform.localPosition = new Vector3(0f, TopY + (1.208f - 0.93f) * s, -0.04f);
            Model("pan_A", pan.transform, Vector3.zero, Vector3.one * 0.5f);
            Particles(Put($"Counters/{name}/Stove/Pan/Sizzle"), sizzleMat, new Color(1f, 0.95f, 0.75f), 0.025f, 40f, 0.5f, 0.6f);
            Particles(Put($"Counters/{name}/Stove/Pan/Smoke"), smokeMat, new Color(0.25f, 0.25f, 0.25f, 0.8f), 0.12f, 6f, 2.2f, 0.25f);
            var loop = Put($"Counters/{name}/Stove/Pan/SizzleAudio");                            // switched on and off (PORT.md 11: no Stop op)
            var audio = Speaker(loop, 8f);
            audio.clip = sizzle;
            audio.loop = true;
            audio.playOnAwake = true;
            audio.volume = 0.5f;
            loop.SetActive(false);
            var warning = Put($"Counters/{name}/Stove/Warning");
            warning.transform.localPosition = new Vector3(0f, 1.55f, 0f);
            warning.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            Text(warning, "<b>!</b>", 6f, new Vector2(0.4f, 0.5f), new Color(1f, 0.25f, 0.1f));
            warning.SetActive(false);
            // the knob: Q's click target on the counter's front
            var knob = Put($"Counters/{name}/Knob");
            var cylinder = stage.Primitive(PrimitiveType.Cylinder, "Model", knob.transform);
            Object.DestroyImmediate(cylinder.GetComponent<Collider>());
            cylinder.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            cylinder.transform.localScale = new Vector3(0.12f, 0.03f, 0.12f);
            cylinder.GetComponent<MeshRenderer>().sharedMaterial = knobMat;
            knob.transform.localPosition = new Vector3(0.28f, 0.72f, Cell / 2f + 0.06f);
            Box(knob, Vector3.zero, new Vector3(0.16f, 0.16f, 0.1f));
            var panPos = pan.transform.localPosition;
            Animated(stove, "Stove", ("Stove@Idle", Pose("Pan", panPos, Vector3.one), false, 1f),
                ("Stove@Heatting", Shake("Pan", panPos, 0.5f, 0.012f, 2), false, 1f),
                ("Stove@WaitBurning", Shake("Pan", panPos, 0.33f, 0.008f, 1), true, 1f),
                ("Stove@Burning", Shake("Pan", panPos, 0.17f, 0.016f, 1), true, 1f));
            PrepCanvas(name, stove, "Cannot \nCook");
        }

        void Particles(GameObject go, Material material, Color colour, float size, float rate, float life, float speed)
        {
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.playOnAwake = false;
            main.loop = true;
            main.startColor = colour;
            main.startSize = size;
            main.startLifetime = life;
            main.startSpeed = speed;
            main.gravityModifier = 0f;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.maxParticles = 100;
            var emission = ps.emission;
            emission.rateOverTime = rate;
            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.15f;
            shape.rotation = new Vector3(-90f, 0f, 0f);
            go.GetComponent<ParticleSystemRenderer>().sharedMaterial = material;
        }

        /// <summary>The bar and the "Cannot Cut/Cook" text over a board or stove, readable from the kitchen (local +Z is the inside).</summary>
        void PrepCanvas(string cell, GameObject preparator, string rejected)
        {
            string path = KitStage.KitPath(preparator.transform, stage.Root.transform) + "/Canvas";
            var canvas = Put(path);
            canvas.transform.localPosition = new Vector3(0f, 1.45f, 0f);
            canvas.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            var bar = Put(path + "/Bar");
            Cube("Back", bar.transform, Vector3.zero, new Vector3(0.62f, 0.09f, 0.01f), barBack);
            var fill = Put(path + "/Bar/Fill");
            fill.transform.localPosition = new Vector3(-0.3f, 0f, -0.008f);
            Cube("Quad", fill.transform, new Vector3(0.3f, 0f, 0f), new Vector3(0.6f, 0.07f, 0.01f), prepFill);
            bar.SetActive(false);
            var text = Put(path + "/Rejected");
            text.transform.localPosition = new Vector3(0f, 0.25f, 0f);
            Text(text, rejected, 2.4f, new Vector2(1f, 0.5f), new Color(1f, 0.3f, 0.2f));
            text.SetActive(false);
        }

        void DeliveryCanvas(string cell, GameObject root)
        {
            string path = $"Counters/{cell}/Canvas";
            var canvas = Put(path);
            canvas.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            canvas.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            foreach (var (n, text, colour) in new[] { ("NeedPlate", "Need Plate!", new Color(1f, 0.3f, 0.2f)), ("Tip", "+00 Tip!", new Color(0.3f, 1f, 0.3f)), ("WrongPlate", "Wrong Plate!", new Color(1f, 0.3f, 0.2f)) })
            {
                var go = Put($"{path}/{n}");
                Text(go, text, 3f, new Vector2(1.6f, 0.4f), colour);
                go.SetActive(false);
            }
            var sign = stage.Create("Sign", root.transform);
            sign.transform.localPosition = new Vector3(0f, 1.15f, -0.35f);
            sign.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            Text(sign, "<b>DELIVER</b>", 2f, new Vector2(1f, 0.3f), new Color(0.2f, 0.4f, 1f));
        }

        // ------------------------------------------------------------------ the item pool

        /// <summary>Ingredient variants 0 to 9 (data/kitchen-data.json) as KayKit models; where KayKit has no exact match the closest (PORT.md 11).</summary>
        static readonly (string model, float scale)[] Variants =
        {
            ("food_ingredient_bun_bottom", ItemScale),          // 0 Bread
            ("food_ingredient_lettuce", ItemScale * 0.8f),      // 1 Cabbage: a lettuce
            ("food_ingredient_lettuce_slice", ItemScale),       // 2 Cabbage_Sliced: a lettuce leaf
            ("food_ingredient_cheese", ItemScale),              // 3 Cheese
            ("food_ingredient_cheese_slice", ItemScale),        // 4 Cheese_Sliced
            ("food_ingredient_burger_uncooked", ItemScale),     // 5 Meat (raw)
            ("food_ingredient_burger_cooked", ItemScale),       // 6 Meat_Cooked
            ("food_ingredient_burger_trash", ItemScale),        // 7 Meat_Burned
            ("food_ingredient_tomato", ItemScale),              // 8 Tomato
            ("food_ingredient_tomato_slice", ItemScale),        // 9 Tomato_Sliced
        };

        void Items()
        {
            Put("Items");
            for (int i = 0; i < 48; i++)
            {
                string path = $"Items/Slot{i:00}";
                var slot = Put(path);
                Box(slot, new Vector3(0f, 0.14f, 0f), new Vector3(0.5f, 0.28f, 0.5f));
                var body = slot.AddComponent<Rigidbody>();
                body.isKinematic = true;
                body.useGravity = false;
                for (int v = 0; v < Variants.Length; v++)
                {
                    var holder = Put($"{path}/V{v}");
                    Model(Variants[v].model, holder.transform, Vector3.zero, Vector3.one * Variants[v].scale);
                    holder.SetActive(false);
                }
                var plate = Put($"{path}/Plate");
                Model("plate", plate.transform, Vector3.zero, Vector3.one * ItemScale);
                var iconsGo = Put($"{path}/Plate/Icons");
                iconsGo.transform.localPosition = new Vector3(0f, 0.55f, 0f);
                iconsGo.transform.localRotation = Quaternion.Euler(35f, 0f, 0f);
                Text(iconsGo, "", 2f, new Vector2(1.2f, 0.3f), Color.white);
                plate.SetActive(false);
            }
        }

        // ------------------------------------------------------------------ the board (PORT.md 8.5)

        void Board()
        {
            var board = Put("Board");
            // behind the right-hand column, facing the kitchen (its local +Z points away from the cooks)
            board.transform.localPosition = new Vector3(5.6f, 1.25f, 0f);
            board.transform.localRotation = Quaternion.Euler(0f, 90f, 0f);
            Speaker(board, 16f);
            Cube("Back", board.transform, new Vector3(0f, 0.95f, 0.03f), new Vector3(3.4f, 1.95f, 0.04f), boardBack);
            var title = stage.Create("Title", board.transform);
            title.transform.localPosition = new Vector3(-1.1f, 1.8f, 0f);
            Text(title, "<b>Co-op Kitchen</b>", 2.2f, new Vector2(1.2f, 0.25f), new Color(1f, 0.85f, 0.4f), TextAlignmentOptions.Left);

            // orders: three tickets across the top
            for (int i = 0; i < 3; i++)
            {
                string t = $"Board/Orders/Ticket{i}";
                var ticket = Put(t);
                ticket.transform.localPosition = new Vector3(-0.55f + i * 0.85f, 1.55f, 0f);
                Cube("Bg", ticket.transform, new Vector3(0f, 0f, 0.01f), new Vector3(0.8f, 0.42f, 0.01f), panelBack);
                var name = Put(t + "/Name");
                name.transform.localPosition = new Vector3(0f, 0.13f, 0f);
                Text(name, "Burger", 1.5f, new Vector2(0.78f, 0.12f), Color.white);
                var iconsGo = Put(t + "/Icons");
                iconsGo.transform.localPosition = new Vector3(0f, -0.02f, 0f);
                Text(iconsGo, "", 2.2f, new Vector2(0.78f, 0.18f), Color.white);
                Bar(t + "/Bar", new Vector3(0f, -0.16f, 0f), 0.7f, new Color(0.3f, 0.9f, 0.3f));
                var at = ticket.transform.localPosition;
                Animated(ticket, $"Ticket{i}", ("Idle", Pose(null, at, Vector3.one), false, 1f),
                    ("OrderTicket@Delivered", Pulse(null, 0.5f, 1.12f, at), true, 1f), ("OrderTicket@Failed", Pulse(null, 0.5f, 0.85f, at), true, 1f));
            }

            // the HUD: score left, timer right, pause
            var score = Put("Board/Hud/Score");
            score.transform.localPosition = new Vector3(-1.2f, 1.05f, 0f);
            Text(Put("Board/Hud/Score/Label"), "Score", 1.4f, new Vector2(0.8f, 0.12f), new Color(0.8f, 0.8f, 0.8f)).transform.localPosition = new Vector3(0f, 0.18f, 0f);
            Text(Put("Board/Hud/Score/Current"), "0", 4f, new Vector2(0.8f, 0.3f), Color.white);
            var delta = Put("Board/Hud/Score/Delta");
            delta.transform.localPosition = new Vector3(0f, -0.25f, 0f);
            Text(delta, "", 2f, new Vector2(0.8f, 0.2f), new Color(0.4f, 1f, 0.4f));
            delta.SetActive(false);
            var timer = Put("Board/Hud/Timer");
            timer.transform.localPosition = new Vector3(1.2f, 1.05f, 0f);
            Text(Put("Board/Hud/Timer/Text"), "02:00", 4f, new Vector2(0.8f, 0.3f), Color.white);
            Bar("Board/Hud/Timer/Bar", new Vector3(0f, -0.25f, 0f), 0.7f, new Color(1f, 0.8f, 0.2f));
            Animated(timer, "Timer", ("Idle", Pose(null, timer.transform.localPosition, Vector3.one), false, 1f),
                ("Timer@FinalSecondsCountDown", Pulse(null, 0.5f, 1.15f, timer.transform.localPosition), false, 1f));
            Button("Board/Hud/Pause", new Vector3(1.2f, 0.5f, 0f), new Vector2(0.5f, 0.16f), "Pause");

            // middle: countdown and times up
            var count = Put("Board/CountDown");
            count.transform.localPosition = new Vector3(0f, 0.95f, -0.05f);
            Text(Put("Board/CountDown/Text"), "3", 9f, new Vector2(1f, 0.7f), new Color(1f, 0.85f, 0.3f));
            Animated(count, "CountDown", ("Idle", Pose(null, count.transform.localPosition, Vector3.one), false, 1f),
                ("CountDown@CountDown", Pulse(null, 0.98f, 1.3f, count.transform.localPosition), false, 1f));
            var timesUp = Put("Board/TimesUp");
            timesUp.transform.localPosition = new Vector3(0f, 0.95f, -0.06f);
            Text(timesUp, "<b>Times Up!</b>", 6f, new Vector2(2.4f, 0.6f), new Color(1f, 0.4f, 0.3f));
            Animated(timesUp, "TimesUp", ("Idle", Pose(null, timesUp.transform.localPosition, Vector3.one), false, 1f),
                ("TimesUp@Show", Pulse(null, 1f, 1.25f, timesUp.transform.localPosition), false, 1f));

            // the lobby (main menu)
            var lobby = Put("Board/Lobby");
            lobby.transform.localPosition = new Vector3(0f, 0.85f, -0.03f);
            Cube("Bg", lobby.transform, new Vector3(0f, 0f, 0.01f), new Vector3(2.0f, 1.1f, 0.01f), panelBack);
            var roster = Put("Board/Lobby/Roster");
            roster.transform.localPosition = new Vector3(0f, 0.32f, 0f);
            Text(roster, "No chefs yet", 1.5f, new Vector2(1.9f, 0.4f), Color.white);
            Button("Board/Lobby/Cook", new Vector3(0f, 0.02f, 0f), new Vector2(0.9f, 0.16f), "COOK");
            Button("Board/Lobby/Play", new Vector3(-0.48f, -0.2f, 0f), new Vector2(0.9f, 0.16f), "PLAY");
            Button("Board/Lobby/Tutorial", new Vector3(0.48f, -0.2f, 0f), new Vector2(0.9f, 0.16f), "TUTORIAL");
            Button("Board/Lobby/Sounds", new Vector3(-0.48f, -0.41f, 0f), new Vector2(0.9f, 0.16f), "SOUNDS");
            Button("Board/Lobby/Credits", new Vector3(0.48f, -0.41f, 0f), new Vector2(0.9f, 0.16f), "CREDITS");

            // credits
            var credits = Put("Board/Credits");
            credits.transform.localPosition = new Vector3(0f, 0.95f, -0.08f);
            Cube("Bg", credits.transform, new Vector3(0f, 0f, 0.01f), new Vector3(3.2f, 1.8f, 0.01f), panelBack);
            var creditsText = Put("Board/Credits/Text");
            creditsText.transform.localPosition = new Vector3(0f, 0.1f, 0f);
            Text(creditsText, CreditsText, 0.9f, new Vector2(3.0f, 1.5f), Color.white, TextAlignmentOptions.TopLeft);
            Button("Board/Credits/Close", new Vector3(0f, -0.75f, 0f), new Vector2(0.6f, 0.15f), "Close");

            // sounds (two local volumes)
            var sounds = Put("Board/Sounds");
            sounds.transform.localPosition = new Vector3(0f, 0.95f, -0.08f);
            Cube("Bg", sounds.transform, new Vector3(0f, 0f, 0.01f), new Vector3(2.0f, 1.2f, 0.01f), panelBack);
            foreach (var (row, label, y) in new[] { ("Music", "Background Music", 0.3f), ("Effects", "Sound Effects", 0f) })
            {
                var line = Put($"Board/Sounds/{row}");
                line.transform.localPosition = new Vector3(0f, y, 0f);
                Text(Put($"Board/Sounds/{row}/Label"), label, 1.3f, new Vector2(0.9f, 0.15f), Color.white, TextAlignmentOptions.Left).transform.localPosition = new Vector3(-0.45f, 0f, 0f);
                Button($"Board/Sounds/{row}/Down", new Vector3(0.2f, 0f, 0f), new Vector2(0.18f, 0.16f), "-");
                var value = Put($"Board/Sounds/{row}/Value");
                value.transform.localPosition = new Vector3(0.45f, 0f, 0f);
                Text(value, "1.0", 1.5f, new Vector2(0.3f, 0.15f), Color.white);
                Button($"Board/Sounds/{row}/Up", new Vector3(0.7f, 0f, 0f), new Vector2(0.18f, 0.16f), "+");
            }
            Button("Board/Sounds/Reset", new Vector3(-0.4f, -0.4f, 0f), new Vector2(0.6f, 0.16f), "Reset");
            Button("Board/Sounds/Back", new Vector3(0.4f, -0.4f, 0f), new Vector2(0.6f, 0.16f), "Back");

            // pause
            var pause = Put("Board/PausePanel");
            pause.transform.localPosition = new Vector3(0f, 0.85f, -0.06f);
            Cube("Bg", pause.transform, new Vector3(0f, 0f, 0.01f), new Vector3(2.0f, 1.2f, 0.01f), panelBack);
            Text(Put("Board/PausePanel/Title"), "<b>Pause</b>", 2.5f, new Vector2(1.8f, 0.25f), Color.white).transform.localPosition = new Vector3(0f, 0.45f, 0f);
            var pausedBy = Put("Board/PausePanel/PausedBy");
            pausedBy.transform.localPosition = new Vector3(0f, 0.27f, 0f);
            Text(pausedBy, "", 1.2f, new Vector2(1.8f, 0.15f), new Color(0.85f, 0.85f, 0.85f));
            Put("Board/PausePanel/Options");
            Button("Board/PausePanel/Options/Resume", new Vector3(0f, 0.07f, 0f), new Vector2(0.9f, 0.15f), "Resume");
            Button("Board/PausePanel/Options/Restart", new Vector3(0f, -0.11f, 0f), new Vector2(0.9f, 0.15f), "Restart");
            Button("Board/PausePanel/Options/Sounds", new Vector3(0f, -0.29f, 0f), new Vector2(0.9f, 0.15f), "Sounds");
            Button("Board/PausePanel/Options/EndRound", new Vector3(0f, -0.47f, 0f), new Vector2(0.9f, 0.15f), "End round");
            var confirm = Put("Board/PausePanel/Confirm");
            confirm.transform.localPosition = new Vector3(0f, 0f, -0.03f);
            Cube("Bg", confirm.transform, new Vector3(0f, -0.15f, 0.01f), new Vector3(1.6f, 0.7f, 0.01f), boardBack);
            Text(Put("Board/PausePanel/Confirm/Text"), "Attention\nYou will lose your progress.\nAre you sure?", 1.3f, new Vector2(1.5f, 0.4f), Color.white).transform.localPosition = new Vector3(0f, 0f, 0f);
            Button("Board/PausePanel/Confirm/Yes", new Vector3(-0.35f, -0.35f, 0f), new Vector2(0.5f, 0.15f), "Yes");
            Button("Board/PausePanel/Confirm/No", new Vector3(0.35f, -0.35f, 0f), new Vector2(0.5f, 0.15f), "No");

            // results
            var results = Put("Board/Results");
            results.transform.localPosition = new Vector3(0f, 0.85f, -0.07f);
            Cube("Bg", results.transform, new Vector3(0f, 0f, 0.01f), new Vector3(2.4f, 1.3f, 0.01f), panelBack);
            Text(Put("Board/Results/Title"), "<b>Results</b>", 2.4f, new Vector2(2f, 0.25f), Color.white).transform.localPosition = new Vector3(0f, 0.5f, 0f);
            var rows = new[] { ("Delivered", "DeliveredTotal", "Delivered Orders x 0", 0.3f), ("Failed", "FailedTotal", "Failed Orders x 0", 0.15f), ("Tips", null, "Tips", 0f), ("Total", null, "Total:", -0.15f) };
            foreach (var (left, right, text, y) in rows)
            {
                Text(Put($"Board/Results/{left}"), text, 1.4f, new Vector2(1.4f, 0.14f), Color.white, TextAlignmentOptions.Left).transform.localPosition = new Vector3(-0.3f, y, 0f);
                if (right != null) Text(Put($"Board/Results/{right}"), "0", 1.4f, new Vector2(0.5f, 0.14f), Color.white, TextAlignmentOptions.Right).transform.localPosition = new Vector3(0.8f, y, 0f);
            }
            Text(Put("Board/Results/Best"), "", 1.2f, new Vector2(2.2f, 0.14f), new Color(0.85f, 0.85f, 0.85f)).transform.localPosition = new Vector3(0f, -0.3f, 0f);
            var high = Put("Board/Results/NewHighScore");
            high.transform.localPosition = new Vector3(0f, -0.42f, 0f);
            Text(high, "New High Score!", 1.5f, new Vector2(2f, 0.14f), new Color(1f, 0.85f, 0.3f));
            Button("Board/Results/Continue", new Vector3(0f, -0.56f, 0f), new Vector2(0.8f, 0.14f), "Continue");

            // tutorial
            var tutorial = Put("Board/Tutorial");
            var tTitle = Put("Board/Tutorial/Title");
            tTitle.transform.localPosition = new Vector3(0f, 1.25f, -0.04f);
            Text(tTitle, "<b>Tutorial</b>", 2.4f, new Vector2(2f, 0.25f), new Color(1f, 0.85f, 0.4f));
            tTitle.SetActive(false);
            var description = Put("Board/Tutorial/Description");
            description.transform.localPosition = new Vector3(0f, 0.25f, -0.04f);
            Cube("Bg", description.transform, new Vector3(0f, 0f, 0.01f), new Vector3(3.0f, 0.4f, 0.01f), panelBack);
            Text(Put("Board/Tutorial/Description/Text"), "", 1.5f, new Vector2(2.9f, 0.38f), Color.white);
            description.SetActive(false);
            tutorial.transform.localPosition = Vector3.zero;
        }

        void Bar(string path, Vector3 at, float width, Color colour)
        {
            var bar = Put(path);
            bar.transform.localPosition = at;
            Cube("Back", bar.transform, Vector3.zero, new Vector3(width + 0.02f, 0.06f, 0.01f), barBack);
            var fill = Put(path + "/Fill");
            fill.transform.localPosition = new Vector3(-width / 2f, 0f, -0.006f);
            Cube("Quad", fill.transform, new Vector3(width / 2f, 0f, 0f), new Vector3(width, 0.045f, 0.01f), barFill);
        }

        void Button(string path, Vector3 at, Vector2 size, string label)
        {
            var go = Put(path);
            go.transform.localPosition = at;
            Box(go, Vector3.zero, new Vector3(size.x, size.y, 0.04f));
            Cube("Face", go.transform, new Vector3(0f, 0f, 0.005f), new Vector3(size.x, size.y, 0.01f), buttonFace);
            var text = stage.Create("Label", go.transform);
            text.transform.localPosition = new Vector3(0f, 0f, -0.002f);
            Text(text, label, Mathf.Min(1.6f, size.y * 10f), size, new Color(0.15f, 0.1f, 0.05f));
        }

        void Arrows()
        {
            for (int i = 0; i < 2; i++)
            {
                var arrow = Put($"Arrows/Arrow{i}");
                var model = stage.Create("Model", arrow.transform);
                var tip = Cube("Tip", model.transform, Vector3.zero, new Vector3(0.18f, 0.18f, 0.18f), arrowMat);
                tip.transform.localRotation = Quaternion.Euler(45f, 0f, 45f);
                Cube("Shaft", model.transform, new Vector3(0f, 0.2f, 0f), new Vector3(0.07f, 0.3f, 0.07f), arrowMat);
                Animated(arrow, "Arrow", ("TutorialArrow@Idle", Bounce("Model", 0.66f, 0.1f), true, 1f));
                arrow.SetActive(false);
            }
        }

        void Audio()
        {
            var sfx = Put("Audio");
            Speaker(sfx, 12f);
        }

        const string CreditsText =
            "<b>Co-op Kitchen</b> (working title)\n" +
            "Rules and original code: <b>KitchenChaos</b> by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos, MIT License, Copyright (c) 2023 Hyago Oliveira. " +
            "Made co-op for Altspace; port source github.com/sidequestlegend/coop-kitchen-altspace (MIT), with the portkit runtime (MIT).\n" +
            "Models: <b>KayKit Restaurant Bits</b> by Kay Lousberg, www.kaylousberg.com, CC0 1.0.\n" +
            "Sounds: <b>Kenney</b> Interface Sounds and Impact Sounds, www.kenney.nl, CC0 1.0. Sizzle: made for this port (CC0).\n" +
            "Font: Liberation Sans (SIL Open Font License 1.1).\n" +
            "No art, sound or music of the upstream project is used. Not affiliated with any commercial cooking game.";

        // ------------------------------------------------------------------ animations (Animator states named as the script sends them)

        /// <summary>An Animator on `go` whose states have the given names; the first is the default. Speed of every state follows the float "Speed" (1).</summary>
        void Animated(GameObject go, string name, params (string state, AnimationClip clip, bool loop, float speed)[] states)
        {
            if (!controllers.TryGetValue(name, out var controller)) controllers[name] = controller = Controller(name, states);
            var animator = go.GetComponent<Animator>() ?? go.AddComponent<Animator>();
            animator.runtimeAnimatorController = controller;
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            animator.applyRootMotion = false;
        }

        readonly Dictionary<string, AnimatorController> controllers = new Dictionary<string, AnimatorController>(StringComparer.Ordinal);

        static AnimatorController Controller(string name, (string state, AnimationClip clip, bool loop, float speed)[] states)
        {
            Directory.CreateDirectory(AnimationFolder);
            string path = $"{AnimationFolder}/{name}.controller";
            AssetDatabase.DeleteAsset(path);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(path);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            var ps = controller.parameters;
            ps[0].defaultFloat = 1f;
            controller.parameters = ps;
            var machine = controller.layers[0].stateMachine;
            foreach (var (state, clip, loop, speed) in states)
            {
                string clipPath = $"{AnimationFolder}/{name}_{state.Replace('@', '_')}.anim";
                var settings = AnimationUtility.GetAnimationClipSettings(clip);
                settings.loopTime = loop;
                AnimationUtility.SetAnimationClipSettings(clip, settings);
                clip.name = state;
                AssetDatabase.DeleteAsset(clipPath);
                AssetDatabase.CreateAsset(clip, clipPath);
                var s = machine.AddState(state);
                s.motion = clip;
                s.speed = speed;
                s.speedParameter = "Speed";
                s.speedParameterActive = true;
                s.writeDefaultValues = false;
            }
            machine.defaultState = machine.states[0].state;
            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            return controller;
        }

        static AnimationCurve Curve(params (float t, float v)[] keys) => new AnimationCurve(keys.Select(k => new Keyframe(k.t, k.v)).ToArray());

        static void SetVector(AnimationClip clip, string path, string property, Func<int, AnimationCurve> axis)
        {
            for (int i = 0; i < 3; i++) clip.SetCurve(path ?? "", typeof(Transform), $"{property}.{"xyz"[i]}", axis(i));
        }

        static AnimationClip Pose(string path, Vector3 position, Vector3 scale, Quaternion? rotation = null)
        {
            var clip = new AnimationClip();
            SetVector(clip, path, "m_LocalPosition", i => Curve((0f, position[i]), (0.1f, position[i])));
            SetVector(clip, path, "m_LocalScale", i => Curve((0f, scale[i]), (0.1f, scale[i])));
            if (rotation.HasValue)
            {
                var r = rotation.Value;
                var q = new[] { r.x, r.y, r.z, r.w };
                for (int i = 0; i < 4; i++) clip.SetCurve(path ?? "", typeof(Transform), $"m_LocalRotation.{"xyzw"[i]}", Curve((0f, q[i]), (0.1f, q[i])));
            }
            return clip;
        }

        static AnimationClip Turn(string path, float from, float to, float back, float seconds)
        {
            var clip = new AnimationClip();
            var a = Quaternion.Euler(from, 0f, 0f);
            var b = Quaternion.Euler(to, 0f, 0f);
            var c = Quaternion.Euler(back, 0f, 0f);
            for (int i = 0; i < 4; i++)
                clip.SetCurve(path, typeof(Transform), $"m_LocalRotation.{"xyzw"[i]}", Curve((0f, a[i]), (seconds * 0.4f, b[i]), (seconds * 0.7f, b[i]), (seconds, c[i])));
            return clip;
        }

        static AnimationClip Squash(string path, Vector3 scale, float seconds)
        {
            var clip = new AnimationClip();
            SetVector(clip, path, "m_LocalScale", i => i == 1
                ? Curve((0f, scale[i]), (seconds * 0.3f, scale[i] * 0.85f), (seconds * 0.6f, scale[i] * 1.05f), (seconds, scale[i]))
                : Curve((0f, scale[i]), (seconds * 0.3f, scale[i] * 1.08f), (seconds * 0.6f, scale[i] * 0.97f), (seconds, scale[i])));
            return clip;
        }

        /// <summary>The knife chops: up and down every 0.25 s (upstream: CuttingBoard@Cutting with 12 chop events in 2.75 s).</summary>
        static AnimationClip Chop(string path)
        {
            var clip = new AnimationClip();
            var down = KnifeRest;
            var up = KnifeRest * Quaternion.Euler(0f, 0f, 0f) * Quaternion.AngleAxis(-35f, Vector3.forward);
            for (int i = 0; i < 4; i++)
                clip.SetCurve(path, typeof(Transform), $"m_LocalRotation.{"xyzw"[i]}", Curve((0f, down[i]), (0.12f, up[i]), (0.25f, down[i])));
            SetVector(clip, path, "m_LocalPosition", i => i == 1 ? Curve((0f, 0f), (0.12f, 0.06f), (0.25f, 0f)) : Curve((0f, 0f), (0.25f, 0f)));
            return clip;
        }

        static AnimationClip Shake(string path, Vector3 at, float seconds, float amount, int cycles)
        {
            var clip = new AnimationClip();
            SetVector(clip, path, "m_LocalPosition", i =>
            {
                if (i == 1) return Curve((0f, at.y), (seconds / 2f, at.y + amount), (seconds, at.y));
                var keys = new List<(float, float)>();
                for (int k = 0; k <= cycles * 2; k++) keys.Add((seconds * k / (cycles * 2), at[i] + (k % 2 == 0 ? 0f : (i == 0 ? amount : -amount))));
                return Curve(keys.ToArray());
            });
            return clip;
        }

        static AnimationClip Pulse(string path, float seconds, float peak, Vector3? at = null)
        {
            var clip = new AnimationClip();
            SetVector(clip, path, "m_LocalScale", i => Curve((0f, 1f), (seconds * 0.3f, peak), (seconds, 1f)));
            if (at.HasValue) SetVector(clip, path, "m_LocalPosition", i => Curve((0f, at.Value[i]), (seconds, at.Value[i])));
            return clip;
        }

        static AnimationClip Bounce(string path, float seconds, float height)
        {
            var clip = new AnimationClip();
            SetVector(clip, path, "m_LocalPosition", i => i == 1 ? Curve((0f, 0f), (seconds / 2f, height), (seconds, 0f)) : Curve((0f, 0f), (seconds, 0f)));
            return clip;
        }

        // ------------------------------------------------------------------ imports, materials, sounds

        void PrepareImports()
        {
            foreach (var path in Directory.GetFiles(ArtFolder, "*.obj").Select(p => p.Replace('\\', '/')))
            {
                if (!(AssetImporter.GetAtPath(path) is ModelImporter mi)) continue;
                bool dirty = mi.materialImportMode != ModelImporterMaterialImportMode.None || mi.isReadable || mi.importAnimation || mi.importCameras || mi.importLights;
                if (!dirty) continue;
                mi.materialImportMode = ModelImporterMaterialImportMode.None;
                mi.isReadable = false;
                mi.importAnimation = false;
                mi.importCameras = false;
                mi.importLights = false;
                mi.meshCompression = ModelImporterMeshCompression.Medium;
                mi.SaveAndReimport();
            }
            string texture = $"{ArtFolder}/restaurantbits_texture.png";
            if (AssetImporter.GetAtPath(texture) is TextureImporter ti && (ti.maxTextureSize != 256 || ti.mipmapEnabled))
            {
                // a gradient atlas: 256 px holds it (the pack says it can go down to 128)
                ti.maxTextureSize = 256;
                ti.mipmapEnabled = false;
                ti.filterMode = FilterMode.Bilinear;
                ti.SaveAndReimport();
            }
            clips.Clear();
            foreach (var path in Directory.GetFiles(AudioFolder, "*.ogg").Select(p => p.Replace('\\', '/')))
            {
                if (AssetImporter.GetAtPath(path) is AudioImporter ai && !ai.forceToMono)
                {
                    ai.forceToMono = true;
                    var s = ai.defaultSampleSettings;
                    s.compressionFormat = AudioCompressionFormat.Vorbis;
                    s.quality = 0.5f;
                    s.loadType = AudioClipLoadType.DecompressOnLoad;
                    ai.defaultSampleSettings = s;
                    ai.SaveAndReimport();
                }
                var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(path);
                string file = Path.GetFileNameWithoutExtension(path);
                if (file.StartsWith("16_")) sizzle = clip;
                else clips[file] = clip;
            }
            if (clips.Count != 16 || sizzle == null) throw new Exception($"expected 16 effects and the sizzle loop in {AudioFolder}, found {clips.Count} and {(sizzle != null ? "the loop" : "no loop")}");
        }

        void Materials()
        {
            Directory.CreateDirectory(MaterialFolder);
            var simpleLit = Shader.Find("Universal Render Pipeline/Simple Lit") ?? throw new Exception("URP Simple Lit shader not found");
            var unlit = Shader.Find("Universal Render Pipeline/Unlit") ?? throw new Exception("URP Unlit shader not found");
            var particles = Shader.Find("Universal Render Pipeline/Particles/Unlit") ?? throw new Exception("URP Particles/Unlit shader not found");
            var atlas = AssetDatabase.LoadAssetAtPath<Texture2D>($"{ArtFolder}/restaurantbits_texture.png");
            kayKit = Save(new Material(simpleLit) { name = "KayKit" }, Color.white, atlas);
            kayKitBlue = Save(new Material(simpleLit) { name = "KayKitDelivery" }, new Color(0.55f, 0.7f, 1f), atlas);
            boardBack = Save(new Material(unlit) { name = "BoardBack" }, new Color(0.16f, 0.11f, 0.08f));
            panelBack = Save(new Material(unlit) { name = "PanelBack" }, new Color(0.24f, 0.17f, 0.12f));
            buttonFace = Save(new Material(unlit) { name = "ButtonFace" }, new Color(1f, 0.82f, 0.45f));
            barBack = Save(new Material(unlit) { name = "BarBack" }, new Color(0.1f, 0.1f, 0.1f));
            barFill = Save(new Material(unlit) { name = "BarFill" }, new Color(0.35f, 0.85f, 0.35f));
            prepFill = Save(new Material(unlit) { name = "PrepFill" }, new Color(1f, 0.75f, 0.2f));
            arrowMat = Save(new Material(unlit) { name = "Arrow" }, new Color(1f, 0.3f, 0.2f));
            warnMat = Save(new Material(unlit) { name = "Warning" }, new Color(1f, 0.25f, 0.1f));
            knobMat = Save(new Material(simpleLit) { name = "Knob" }, new Color(0.8f, 0.15f, 0.1f));
            sizzleMat = Save(new Material(particles) { name = "Sizzle" }, Color.white);
            smokeMat = Save(new Material(particles) { name = "Smoke" }, Color.white);
            // URP's own setup on every material made here (keywords, passes): without it extra passes stay on and the bundle grows
            foreach (var m in new[] { kayKit, kayKitBlue, boardBack, panelBack, buttonFace, barBack, barFill, prepFill, arrowMat, warnMat, knobMat, sizzleMat, smokeMat })
            {
                if (m.shader == simpleLit) BaseShaderGUI.SetMaterialKeywords(m, UnityEditor.Rendering.Universal.ShaderGUI.SimpleLitGUI.SetMaterialKeywords);
                else if (m.shader == particles)
                {
                    m.SetFloat("_Surface", 1f);
                    m.SetFloat("_Blend", 0f);
                    m.SetOverrideTag("RenderType", "Transparent");
                    m.renderQueue = (int)RenderQueue.Transparent;
                    BaseShaderGUI.SetMaterialKeywords(m);
                }
                else BaseShaderGUI.SetMaterialKeywords(m);
                EditorUtility.SetDirty(m);
            }
            AssetDatabase.SaveAssets();
        }

        static Material Save(Material m, Color colour, Texture texture = null)
        {
            string path = $"{MaterialFolder}/{m.name}.mat";
            var existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null)
            {
                existing.shader = m.shader;
                existing.CopyPropertiesFromMaterial(m);
                m = existing;
            }
            else AssetDatabase.CreateAsset(m, path);
            m.SetColor("_BaseColor", colour);
            if (texture != null) m.SetTexture("_BaseMap", texture);
            m.enableInstancing = true;
            EditorUtility.SetDirty(m);
            return m;
        }

        // ------------------------------------------------------------------ ingredient icons: the KayKit models drawn into a TextMesh Pro sprite asset

        /// <summary>Sprite names the TypeScript writes (`<sprite name="...">`, data/kitchen-data.json icons), by variant.</summary>
        static readonly string[] IconNames = { "Bread", "Cabbage", "CabbageSlices", "CheeseBlock", "CheeseSlice", "MeatPattyUncooked", "MeatPattyCooked", "MeatPattyBurned", "Tomato", "TomatoSlice" };

        TMP_SpriteAsset IconSprites()
        {
            Directory.CreateDirectory(IconFolder);
            const int cell = 128, columns = 4, rows = 3;
            var atlas = new Texture2D(cell * columns, cell * rows, TextureFormat.RGBA32, false);
            atlas.SetPixels32(Enumerable.Repeat(new Color32(0, 0, 0, 0), atlas.width * atlas.height).ToArray());
            var preview = new PreviewRenderUtility();
            try
            {
                preview.camera.fieldOfView = 30f;
                preview.camera.clearFlags = CameraClearFlags.SolidColor;
                preview.camera.backgroundColor = new Color(0f, 0f, 0f, 0f);
                preview.camera.nearClipPlane = 0.01f;
                preview.camera.farClipPlane = 20f;
                preview.lights[0].intensity = 1.3f;
                preview.lights[0].transform.rotation = Quaternion.Euler(40f, 30f, 0f);
                preview.ambientColor = new Color(0.45f, 0.45f, 0.45f);
                for (int v = 0; v < IconNames.Length; v++)
                {
                    int x = (v % columns) * cell, y = (rows - 1 - v / columns) * cell;
                    try { atlas.SetPixels32(x, y, cell, cell, RenderIcon(preview, Variants[v].model, cell)); }
                    catch (Exception e)
                    {
                        // a disc of the ingredient's colour, if the model cannot be drawn here
                        stage.Report.AppendLine($"   icon {IconNames[v]}: drawn as a disc ({e.Message})");
                        var c = (Color32)IconColours[v];
                        var disc = new Color32[cell * cell];
                        for (int i = 0; i < disc.Length; i++) { float dx = i % cell - cell / 2f, dy = i / cell - cell / 2f; disc[i] = dx * dx + dy * dy < cell * cell / 5f ? c : new Color32(0, 0, 0, 0); }
                        atlas.SetPixels32(x, y, cell, cell, disc);
                    }
                }
            }
            finally { preview.Cleanup(); }
            return Finish(atlas, cell, columns, rows);
        }

        static readonly Color[] IconColours =
        {
            new Color(0.85f, 0.6f, 0.3f), new Color(0.4f, 0.8f, 0.3f), new Color(0.55f, 0.9f, 0.4f), new Color(1f, 0.85f, 0.3f), new Color(1f, 0.9f, 0.5f),
            new Color(0.9f, 0.4f, 0.45f), new Color(0.55f, 0.3f, 0.15f), new Color(0.15f, 0.12f, 0.1f), new Color(0.9f, 0.2f, 0.15f), new Color(1f, 0.4f, 0.35f),
        };

        Color32[] RenderIcon(PreviewRenderUtility preview, string model, int cell)
        {
                    var asset = AssetDatabase.LoadAssetAtPath<GameObject>($"{ArtFolder}/{model}.obj");
                    var go = preview.InstantiatePrefabInScene(asset);
                    foreach (var r in go.GetComponentsInChildren<MeshRenderer>(true)) r.sharedMaterials = Enumerable.Repeat(kayKit, r.sharedMaterials.Length).ToArray();
                    var bounds = new Bounds(go.transform.position, Vector3.zero);
                    foreach (var r in go.GetComponentsInChildren<Renderer>()) bounds.Encapsulate(r.bounds);
                    float radius = Mathf.Max(0.05f, bounds.extents.magnitude);
                    var dir = Quaternion.Euler(35f, -30f, 0f) * Vector3.back;
                    preview.camera.transform.position = bounds.center - dir * (radius / Mathf.Sin(15f * Mathf.Deg2Rad));
                    preview.camera.transform.LookAt(bounds.center);
                    preview.BeginStaticPreview(new Rect(0, 0, cell, cell));
                    preview.Render(true);
                    var shot = preview.EndStaticPreview();
                    Object.DestroyImmediate(go);
                    var pixels = shot.GetPixels32();
                    int width = shot.width, height = shot.height;
                    Object.DestroyImmediate(shot);
                    // the background is cleared to the camera colour; make it transparent where nothing was drawn
                    var bg = pixels[0];
                    int drawn = 0;
                    for (int i = 0; i < pixels.Length; i++)
                        if (Mathf.Abs(pixels[i].r - bg.r) + Mathf.Abs(pixels[i].g - bg.g) + Mathf.Abs(pixels[i].b - bg.b) < 6) pixels[i] = new Color32(0, 0, 0, 0);
                        else { pixels[i].a = 255; drawn++; }
                    if (drawn < pixels.Length / 50) throw new Exception("nothing was drawn");
                    return Resize(pixels, width, height, cell);
        }

        TMP_SpriteAsset Finish(Texture2D atlas, int cell, int columns, int rows)
        {
            atlas.Apply();
            string png = $"{IconFolder}/IngredientIcons.png";
            File.WriteAllBytes(png, atlas.EncodeToPNG());
            AssetDatabase.ImportAsset(png);
            var ti = (TextureImporter)AssetImporter.GetAtPath(png);
            ti.textureType = TextureImporterType.Default;
            ti.alphaIsTransparency = true;
            ti.mipmapEnabled = false;
            ti.maxTextureSize = 512;
            ti.SaveAndReimport();
            var sheet = AssetDatabase.LoadAssetAtPath<Texture2D>(png);

            string assetPath = $"{IconFolder}/IngredientIcons.asset";
            AssetDatabase.DeleteAsset(assetPath);
            var sprites = ScriptableObject.CreateInstance<TMP_SpriteAsset>();
            sprites.name = "IngredientIcons";
            sprites.spriteSheet = sheet;
            AssetDatabase.CreateAsset(sprites, assetPath);
            var material = new Material(Shader.Find("TextMeshPro/Sprite")) { name = "IngredientIcons Material" };
            material.SetTexture(ShaderUtilities.ID_MainTex, sheet);
            AssetDatabase.AddObjectToAsset(material, sprites);
            sprites.material = material;
            for (int v = 0; v < IconNames.Length; v++)
            {
                int x = (v % columns) * cell, y = (rows - 1 - v / columns) * cell;
                var glyph = new TMP_SpriteGlyph((uint)v, new GlyphMetrics(cell, cell, 0, cell * 0.8f, cell), new GlyphRect(x, y, cell, cell), 1f, 0);
                sprites.spriteGlyphTable.Add(glyph);
                sprites.spriteCharacterTable.Add(new TMP_SpriteCharacter(0xFFFE, sprites, glyph) { name = IconNames[v], scale = 1f });
            }
            var so = new SerializedObject(sprites);
            var version = so.FindProperty("m_Version");
            if (version != null) version.stringValue = "1.1.0";
            so.ApplyModifiedPropertiesWithoutUndo();
            sprites.UpdateLookupTables();
            EditorUtility.SetDirty(sprites);
            AssetDatabase.SaveAssets();
            return sprites;
        }

        static Color32[] Resize(Color32[] pixels, int width, int height, int size)
        {
            var result = new Color32[size * size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                    result[y * size + x] = pixels[Mathf.Min(height - 1, y * height / size) * width + Mathf.Min(width - 1, x * width / size)];
            return result;
        }
    }
}
