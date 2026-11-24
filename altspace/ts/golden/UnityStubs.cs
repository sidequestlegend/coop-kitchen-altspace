// Stand-ins for the parts of Unity, TextMesh Pro and the author's ActionCode packages that the upstream gameplay code of
// KitchenChaos calls, so that its .cs files compile UNCHANGED with dotnet 8 (never in Unity) and its real methods can be
// driven by Harness.cs to make golden vectors (portkit README, "Golden vectors"). portkit's ts/golden/UdonStubs.cs is
// for UdonSharp games; this game is plain Unity, so it has stubs of its own.
//
// What is real here: coroutines (a frame-stepped runner with WaitForSeconds, WaitUntil, WaitWhile, nested enumerators,
// StopCoroutine), scaled time (Time.deltaTime, Time.timeScale), Random.value (set by the harness), components on
// GameObjects with parents and children, Instantiate (a copy of the original's components and fields). What is not:
// physics, rendering, sound (calls are recorded), scenes.
#pragma warning disable CS0108, CS0114, CS0169, CS0414, CS0649, CS0067, CS8618, CS8625, CS8600, CS8602, CS8603, CS8604
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace Golden
{
    public static class Record
    {
        public static readonly List<string> Events = new List<string>();
        public static void Note(string what) { Events.Add(Runner.Now.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture) + " " + what); }
    }

    /// <summary>Unity's coroutine scheduling, one fixed frame at a time.</summary>
    public static class Runner
    {
        public sealed class Routine
        {
            public readonly Stack<IEnumerator> Stack = new Stack<IEnumerator>();
            public object Waiting;
            public float WaitLeft;
            public bool Stopped;
            public CancellationToken Token;
        }

        public static readonly List<Routine> Routines = new List<Routine>();
        public static float Now;
        public static int Frame;

        public static Routine Start(IEnumerator e, CancellationToken token = default)
        {
            var r = new Routine { Token = token };
            r.Stack.Push(e);
            Routines.Add(r);
            Advance(r); // runs to its first yield at once, as Unity does
            return r;
        }

        static void Advance(Routine r)
        {
            while (!r.Stopped && r.Stack.Count > 0)
            {
                if (r.Token.IsCancellationRequested) { r.Stopped = true; break; }
                var top = r.Stack.Peek();
                if (!top.MoveNext()) { r.Stack.Pop(); continue; }
                var y = top.Current;
                if (r.Stopped) break;
                if (y is IEnumerator nested) { r.Stack.Push(nested); continue; }
                r.Waiting = y;
                if (y is UnityEngine.WaitForSeconds w) r.WaitLeft = w.Seconds;
                return;
            }
            Routines.Remove(r);
        }

        /// <summary>One frame of `dt` real seconds (scaled by Time.timeScale).</summary>
        public static void Step(float dt)
        {
            UnityEngine.Time.deltaTime = dt * UnityEngine.Time.timeScale;
            Now += UnityEngine.Time.deltaTime;
            Frame++;
            foreach (var r in Routines.ToArray())
            {
                if (r.Stopped || !Routines.Contains(r)) { Routines.Remove(r); continue; }
                if (r.Token.IsCancellationRequested) { Routines.Remove(r); continue; }
                switch (r.Waiting)
                {
                    case UnityEngine.WaitForSeconds _:
                        r.WaitLeft -= UnityEngine.Time.deltaTime;
                        if (r.WaitLeft > 0) continue;
                        break;
                    case UnityEngine.WaitUntil u:
                        if (!u.Predicate()) continue;
                        break;
                    case UnityEngine.WaitWhile w:
                        if (w.Predicate()) continue;
                        break;
                }
                Advance(r);
            }
        }

        public static void Reset()
        {
            Routines.Clear();
            Now = 0;
            Frame = 0;
            UnityEngine.Time.timeScale = 1;
        }
    }
}

namespace UnityEngine
{
    public class Object
    {
        public string name = "";
        public override string ToString() => name;
        public static void Destroy(Object o) { if (o is GameObject g) g.destroyed = true; }
        public static void DestroyImmediate(Object o) => Destroy(o);
        public static T Instantiate<T>(T original) where T : Object => (T)Golden.Clone.Of(original, null);
        public static T Instantiate<T>(T original, Transform parent) where T : Object => (T)Golden.Clone.Of(original, parent);
        public static T Instantiate<T>(T original, Transform parent, bool _) where T : Object => (T)Golden.Clone.Of(original, parent);
        public static void DontDestroyOnLoad(Object o) { }
        public static T FindObjectOfType<T>() where T : Object => null;
    }

    public class ScriptableObject : Object
    {
        public static T CreateInstance<T>() where T : ScriptableObject, new() => new T();
    }

    public class Component : Object
    {
        public GameObject gameObject;
        public Transform transform => gameObject.transform;
        public T GetComponent<T>() where T : class => gameObject.GetComponent<T>();
        public T GetComponentInChildren<T>() where T : class => gameObject.GetComponentInChildren<T>();
        public T GetComponentInParent<T>() where T : class => gameObject.GetComponentInParent<T>();
        public bool TryGetComponent<T>(out T c) where T : class { c = GetComponent<T>(); return c != null; }
    }

    public class Behaviour : Component { public bool enabled = true; }

    public class Coroutine { public Golden.Runner.Routine Routine; }

    public class MonoBehaviour : Behaviour
    {
        public Coroutine StartCoroutine(IEnumerator e) => new Coroutine { Routine = Golden.Runner.Start(e) };
        public void StopCoroutine(Coroutine c) { if (c != null) c.Routine.Stopped = true; }
        public void StopAllCoroutines() { }
        public void Invoke(string method, float seconds) => StartCoroutine(InvokeRoutine(method, seconds));
        IEnumerator InvokeRoutine(string method, float seconds)
        {
            yield return new WaitForSeconds(seconds);
            GetType().GetMethod(method, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).Invoke(this, null);
        }
    }

    public sealed class GameObject : Object
    {
        public readonly Transform transform;
        public readonly List<Component> components = new List<Component>();
        public bool destroyed;
        bool active = true;
        public bool activeSelf => active;
        public int layer;

        public GameObject(string name = "GameObject")
        {
            this.name = name;
            transform = new Transform { gameObject = this };
            components.Add(transform);
        }

        public void SetActive(bool value) { active = value; Golden.Record.Note($"{name}.SetActive({value})"); }

        public T AddComponent<T>() where T : Component, new()
        {
            var c = new T { gameObject = this, name = name };
            components.Add(c);
            return c;
        }

        public Component AddComponent(Type type)
        {
            var c = (Component)Activator.CreateInstance(type);
            c.gameObject = this;
            c.name = name;
            components.Add(c);
            return c;
        }

        public T GetComponent<T>() where T : class => components.OfType<T>().FirstOrDefault();

        public T GetComponentInChildren<T>() where T : class
        {
            var own = GetComponent<T>();
            if (own != null) return own;
            foreach (var child in transform.children)
            {
                var found = child.gameObject.GetComponentInChildren<T>();
                if (found != null) return found;
            }
            return null;
        }

        public T GetComponentInParent<T>() where T : class
        {
            for (var t = transform; t != null; t = t.parent)
            {
                var c = t.gameObject.GetComponent<T>();
                if (c != null) return c;
            }
            return null;
        }
    }

    public class Transform : Component
    {
        public Transform parent;
        public readonly List<Transform> children = new List<Transform>();
        public Vector3 position;
        public Quaternion rotation = Quaternion.identity;
        public Vector3 localPosition;
        public Quaternion localRotation = Quaternion.identity;
        public void SetParent(Transform p)
        {
            parent?.children.Remove(this);
            parent = p;
            p?.children.Add(this);
        }
        public void SetPositionAndRotation(Vector3 p, Quaternion r) { position = p; rotation = r; }
        public void SetLocalPositionAndRotation(Vector3 p, Quaternion r) { localPosition = p; localRotation = r; }
    }

    public struct Vector3
    {
        public float x, y, z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 zero => new Vector3(0, 0, 0);
        public static Vector3 up => new Vector3(0, 1, 0);
        public static Vector3 operator +(Vector3 a, Vector3 b) => new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
        public static Vector3 operator *(Vector3 a, float k) => new Vector3(a.x * k, a.y * k, a.z * k);
        public override string ToString() => $"({x}, {y}, {z})";
    }

    public struct Quaternion
    {
        public float x, y, z, w;
        public static Quaternion identity => new Quaternion { w = 1 };
        public static Quaternion Euler(Vector3 e) => new Quaternion { x = e.x, y = e.y, z = e.z, w = 1 };
    }

    public struct Color { public float r, g, b, a; public static Color green => new Color { g = 1, a = 1 }; public static Color red => new Color { r = 1, a = 1 }; }

    public static class Mathf
    {
        public static float Max(float a, float b) => a > b ? a : b;
        public static int Max(int a, int b) => a > b ? a : b;
        public static int CeilToInt(float f) => (int)Math.Ceiling(f);
        public static float Abs(float f) => Math.Abs(f);
    }

    public static class Random
    {
        public static float value = 0;
    }

    public static class Time
    {
        public static float deltaTime;
        public static float timeScale = 1;
    }

    public static class Debug
    {
        public static void LogError(object m) => Golden.Record.Note("LogError " + m);
        public static void Log(object m) { }
    }

    public class Sprite : Object { }
    public class AudioClip : Object { }

    public class AnimationState { public float speed = 1; }

    public class Animation : Behaviour
    {
        readonly Dictionary<string, AnimationState> states = new Dictionary<string, AnimationState>();
        public bool isPlaying;
        public bool Play() { Golden.Record.Note($"{name}.anim.Play()"); return true; }
        public bool Play(string clip) { Golden.Record.Note($"{name}.anim.Play({clip})"); return true; }
        public void Stop() { isPlaying = false; }
        public AnimationState this[string clip] { get { if (!states.TryGetValue(clip, out var s)) states[clip] = s = new AnimationState(); return s; } }
    }

    public class AudioSource : Behaviour
    {
        public float pitch = 1;
        public void Play() => Golden.Record.Note($"{name}.audio.Play()");
        public void PlayOneShot(AudioClip clip) => Golden.Record.Note($"{name}.audio.PlayOneShot({clip?.name})");
        public void Stop() => Golden.Record.Note($"{name}.audio.Stop()");
    }

    public class ParticleSystem : Component
    {
        public void Play() => Golden.Record.Note($"{name}.particles.Play()");
        public void Stop() => Golden.Record.Note($"{name}.particles.Stop()");
    }

    public class SpriteRenderer : Behaviour { public Sprite sprite; }

    public class Rigidbody : Component { public bool isKinematic; public bool detectCollisions = true; }

    public class YieldInstruction { }

    public sealed class WaitForSeconds : YieldInstruction
    {
        public readonly float Seconds;
        public WaitForSeconds(float seconds) { Seconds = seconds; }
    }

    public sealed class WaitUntil { public readonly Func<bool> Predicate; public WaitUntil(Func<bool> p) { Predicate = p; } }
    public sealed class WaitWhile { public readonly Func<bool> Predicate; public WaitWhile(Func<bool> p) { Predicate = p; } }

    [AttributeUsage(AttributeTargets.Field)] public sealed class SerializeField : Attribute { }
    [AttributeUsage(AttributeTargets.All)] public sealed class HeaderAttribute : Attribute { public HeaderAttribute(string h) { } }
    [AttributeUsage(AttributeTargets.All)] public sealed class RangeAttribute : Attribute { public RangeAttribute(float a, float b) { } }
    [AttributeUsage(AttributeTargets.All)] public sealed class MinAttribute : Attribute { public MinAttribute(float a) { } }
    [AttributeUsage(AttributeTargets.Class)] public sealed class CreateAssetMenuAttribute : Attribute { public string fileName; public string menuName; public int order; }
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)] public sealed class RequireComponent : Attribute { public RequireComponent(Type t) { } }
    [AttributeUsage(AttributeTargets.Class)] public sealed class DisallowMultipleComponent : Attribute { }
    [AttributeUsage(AttributeTargets.Class)] public sealed class DefaultExecutionOrder : Attribute { public DefaultExecutionOrder(int o) { } }
}

namespace UnityEngine.UI
{
    public class Image : Behaviour { public Sprite sprite; }
}

namespace TMPro
{
    public class TMP_Text : UnityEngine.Behaviour { public string text = ""; public UnityEngine.Color color; }
}

namespace ActionCode.Physics
{
    public interface IEnable { bool IsEnabled { get; set; } }

    /// <summary>The box cast of the chef: what it hits is set by the harness.</summary>
    public class BoxCaster : UnityEngine.MonoBehaviour
    {
        public UnityEngine.GameObject Hit;
        public bool HasHit => Hit != null;
        public bool TryGetEnabledComponent<T>(out T component)
        {
            component = default;
            if (!HasHit) return false;
            component = Hit.components.OfType<T>().FirstOrDefault();
            if (component == null) return false;
            return component is IEnable e && e.IsEnabled;
        }
    }
}

namespace ActionCode.VisualEffects
{
    public interface IHighlightable { }
    public class HighlighterContainer : UnityEngine.MonoBehaviour, IHighlightable
    {
        public void Add(IHighlightable h) { }
        public void Remove(IHighlightable h) { }
    }
    public class AbstractMaterialController : UnityEngine.MonoBehaviour { }
}

namespace ActionCode.Audio
{
    public class AudioSourceDictionary : UnityEngine.MonoBehaviour
    {
        public void PlayRandom() => Golden.Record.Note($"{name}.PlayRandom()");
    }
}

namespace ActionCode.AwaitableCoroutines
{
    public static class AwaitableCoroutine
    {
        public static Task Run(IEnumerator routine, CancellationToken token)
        {
            Golden.Runner.Start(routine, token);
            return Task.CompletedTask;
        }
    }
}

namespace Golden
{
    /// <summary>Instantiate: a new GameObject with a copy of each component of the original's (fields copied, shallow).</summary>
    public static class Clone
    {
        public static UnityEngine.Object Of(UnityEngine.Object original, UnityEngine.Transform parent)
        {
            var source = original is UnityEngine.Component c ? c.gameObject : (UnityEngine.GameObject)original;
            var copy = new UnityEngine.GameObject(source.name + "(Clone)");
            UnityEngine.Object result = copy;
            foreach (var component in source.components)
            {
                if (component is UnityEngine.Transform) continue;
                var made = copy.AddComponent(component.GetType());
                for (var type = component.GetType(); type != null && type != typeof(UnityEngine.Component); type = type.BaseType)
                {
                    foreach (var f in type.GetFields(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
                    {
                        if (f.Name == "gameObject") continue;
                        var value = f.GetValue(component);
                        if (value is UnityEngine.Component same && same.gameObject == source) value = copy.components.FirstOrDefault(x => x.GetType() == same.GetType()) ?? value;
                        f.SetValue(made, value);
                    }
                }
                made.gameObject = copy;
                if (component == original) result = made;
            }
            // fields pointing at a component of the original that was copied later
            foreach (var made in copy.components)
                for (var type = made.GetType(); type != null && type != typeof(UnityEngine.Component); type = type.BaseType)
                    foreach (var f in type.GetFields(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
                        if (f.GetValue(made) is UnityEngine.Component other && other.gameObject == source)
                            f.SetValue(made, copy.components.First(x => x.GetType() == other.GetType()));
            if (parent != null) copy.transform.SetParent(parent);
            return result;
        }
    }
}
