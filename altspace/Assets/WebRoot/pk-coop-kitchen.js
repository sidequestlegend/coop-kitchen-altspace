/*!
 * coop-kitchen for Altspace: the rules of KitchenChaos by Hyago Oliveira (https://github.com/HyagoOliveira/KitchenChaos),
 * MIT License, Copyright (c) 2023 Hyago Oliveira, ported to TypeScript as a co-op game on the portkit runtime (MIT).
 * No art, sound or font of the upstream repository is part of this script or its kit.
 */
/* pk-coop-kitchen.js: portkit runtime with the rules of 'coop-kitchen' (protocol pk1, bindings f93517c85d18ae6ae3c5a1b53c97a9905ba8f23b). Built file: do not edit. */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // portkit/src/behaviour.ts
  var NetworkEventTarget = { All: "All", Owner: "Owner" };
  var LINK = /* @__PURE__ */ Symbol("pk1.link");
  function linkBehaviour(behaviour, link) {
    Object.defineProperty(behaviour, LINK, { value: link, enumerable: false, configurable: true, writable: false });
  }
  function linkOf(behaviour) {
    const link = behaviour[LINK];
    if (!link) throw new Error("this behaviour is not part of a running instance yet (do not use the runtime in a constructor or a field initialiser)");
    return link;
  }
  var Behaviour = class {
    // ---- what the runtime provides ------------------------------------------------------------------------------
    /** The id this behaviour has in bindings.json. */
    get behaviourId() {
      return linkOf(this).id;
    }
    get gameObject() {
      return linkOf(this).gameObject;
    }
    get transform() {
      return linkOf(this).gameObject.transform;
    }
    get Networking() {
      return linkOf(this).networking;
    }
    get Time() {
      return linkOf(this).time;
    }
    get Random() {
      return linkOf(this).random;
    }
    get Debug() {
      return linkOf(this).debug;
    }
    /** Commit / reveal, fair draws and sealed delivery. */
    get Secrets() {
      return linkOf(this).secrets;
    }
    /** Per-device saved data for the local player (localStorage). */
    get Storage() {
      return linkOf(this).storage;
    }
    /** Text, animator parameters, particles and colours on kit objects. */
    get Host() {
      return linkOf(this).host;
    }
    /** The snippet element's attributes. */
    get Settings() {
      return linkOf(this).settings;
    }
    /** Per-player saved values everyone present can read (VRChat: PlayerData). */
    get PlayerData() {
      return linkOf(this).playerData;
    }
    /** Buttons, thumbsticks, triggers, keys, head and hand poses, haptics, teleport. */
    get Input() {
      return linkOf(this).input;
    }
    /** Values only the world's owner and moderators can write. */
    get Protected() {
      return linkOf(this).protectedValues;
    }
    /**
     * For a per-player behaviour: the player it belongs to. Null on an ordinary behaviour. An upstream field named
     * `Player` would hide it: such a port renames the field (the convention: `upstreamPlayer`) or reads `OwnerPlayer`.
     */
    get Player() {
      return linkOf(this).player;
    }
    /** The same as `Player`, under a name no upstream field is likely to use. */
    get OwnerPlayer() {
      return linkOf(this).player;
    }
    /**
     * One object shared by every instance of this game on the page (two tables of one game keep one chip balance
     * here). Page memory only: not synced, not saved, gone when the page reloads (use Storage for that).
     */
    get Shared() {
      return linkOf(this).shared;
    }
    /** This instance's key (the `room` / `instance` attribute, or the element's index): `pk1.<slug>.<key>`. */
    get InstanceKey() {
      return linkOf(this).instanceKey;
    }
    /**
     * This behaviour's own click reach in metres, overriding the bindings' `reach`, the class's `interactReach` and
     * the game's default (a snippet setting, for example). Undefined: those apply. 0: any distance.
     */
    get InteractReach() {
      return linkOf(this).reach.get(this);
    }
    set InteractReach(metres) {
      if (metres === void 0) linkOf(this).reach.delete(this);
      else linkOf(this).reach.set(this, metres);
    }
    // ---- calls --------------------------------------------------------------------------------------------------
    /** Sends the synced fields. Only the owner's request does anything; it goes out at the end of the tick. */
    RequestSerialization() {
      linkOf(this).requestSerialization();
    }
    SendCustomEvent(name) {
      const fn = this[name];
      if (typeof fn === "function") fn.call(this);
      else this.Debug.LogWarning(`SendCustomEvent: ${this.behaviourId} has no method '${name}'`);
    }
    /**
     * Runs `name` on every client (All: here at once, then everywhere else) or only on the owner's. Arguments
     * must be JSON data or the value types of values.ts. While the method runs, `Networking.CallingPlayer` is
     * the sender: check it before honouring a request not everybody may make. `name` must be listed in the
     * class's `static networkCallable`.
     */
    SendCustomNetworkEvent(target, name, ...args) {
      linkOf(this).sendNetworkEvent(target, name, args);
    }
    /**
     * Asks the referee to run `name` on its copy of this behaviour, with `Networking.CallingPlayer` set to the
     * sender. Unlike a network event the request is numbered and kept until the referee acknowledges it: it is
     * run in order, survives a change of referee, and is never replayed to a late joiner. Returns its number.
     */
    SendCommand(name, ...args) {
      return linkOf(this).sendCommand(name, args);
    }
    SendCustomEventDelayedSeconds(name, seconds) {
      linkOf(this).delaySeconds(name, seconds);
    }
    /** A frame is one 50 ms tick here. */
    SendCustomEventDelayedFrames(name, frames) {
      linkOf(this).delayFrames(name, frames);
    }
    /** Another behaviour of this instance, by its bindings id. */
    FindBehaviour(id) {
      return linkOf(this).find(id);
    }
    /** Every ordinary behaviour of this instance with the given bindings type, in bindings order. */
    FindBehavioursOfType(type) {
      return linkOf(this).findByType(type);
    }
    /** The per-player behaviour of the given type that belongs to `player`. */
    PlayerBehaviour(player, type) {
      return linkOf(this).playerBehaviour(player, type);
    }
    /** One per-player behaviour of the given type for every player present, in player-id order. */
    PlayerBehaviours(type) {
      return linkOf(this).playerBehaviours(type);
    }
    /** One of the few things that are truly asynchronous: await it. */
    Raycast(origin, direction, maxDistance = 1e3, layerMask = -1) {
      return linkOf(this).raycast(origin, direction, maxDistance, layerMask);
    }
    /**
     * Has `method` called when a graph of the kit reports `name` through
     * `window.__pk1.event("<slug>:<inst>", "<name>", "<arg>|<arg>...")`. The method receives the arguments as strings.
     */
    RegisterGraphEvent(name, method) {
      linkOf(this).onGraphEvent(name, method);
    }
    // ---- overridable, as in UdonSharp ---------------------------------------------------------------------------
    Start() {
    }
    /**
     * Called after Start and after any saved values were applied, once this client knows what it came to: a new
     * game ("fresh"), saved state nobody was playing ("resumed": carry on or reset, as the game prefers), a game
     * others are playing ("joined"), or no game yet ("idle"). In a game with declared referee candidates it is
     * called again when the first referee is elected. The same value is `this.Networking.StartKind`.
     */
    OnInstanceStart(_kind) {
    }
    /** Called 20 times a second, only on classes that override it. `this.Time.deltaTime` is the time it covers. */
    Update() {
    }
    /** Synced fields were just replaced by another player's values. Not called for the owner's own writes. */
    OnDeserialization(_result) {
    }
    OnPreSerialization() {
    }
    /** `success` is false when the room refused the write (see OnWriteRefused for why). */
    OnPostSerialization(_result) {
    }
    OnOwnershipTransferred(_player) {
    }
    OnPlayerJoined(_player) {
    }
    OnPlayerLeft(_player) {
    }
    /** A player's saved data and per-player behaviours are loaded and published (VRChat: OnPlayerRestored). */
    OnPlayerRestored(_player) {
    }
    /** Values in a player's PlayerData changed; `keys` names them. */
    OnPlayerDataUpdated(_player, _keys) {
    }
    /** The room refused something this behaviour wrote. Also reported through OnPostSerialization for fields. */
    OnWriteRefused(_refusal) {
    }
    /** The referee has run the command this behaviour sent with that number. */
    OnCommandAcknowledged(_number) {
    }
    /** A player's fair draw under `label` changed state (see Secrets.beginDraw). Called on every behaviour that overrides it. */
    OnDrawChanged(_player, _label, _state) {
    }
    /** A protected value changed. Called on every behaviour that overrides it. */
    OnProtectedChanged(_key) {
    }
    /**
     * The referee changed (VRChat: OnMasterTransferred). Null when there is none left (a game with declared
     * candidates and nobody offering). A game with hidden information may void its match here: the new referee
     * does not know what the old one dealt.
     */
    OnMasterTransferred(_newMaster) {
    }
    /** A controller button of the local player went down or came up. Called on every behaviour that overrides it. */
    OnButtonPressed(_button, _side) {
    }
    OnButtonReleased(_button, _side) {
    }
    /** A key went down or came up; `key` is the Unity KeyCode name. */
    OnKeyPressed(_key) {
    }
    OnKeyReleased(_key) {
    }
    /** The local player clicked this behaviour's object. */
    Interact() {
    }
    OnPickup() {
    }
    OnDrop() {
    }
    /** The instance is going away (its element left the page), or this per-player behaviour's player left. */
    OnDestroy() {
    }
  };
  /** Names of the fields that are synced. Values must be JSON data, arrays of it, or the value types of values.ts. */
  __publicField(Behaviour, "synced", []);
  /** "manual": sent by RequestSerialization(). "continuous": sent when changed, a few times a second. */
  __publicField(Behaviour, "syncMode", "manual");
  /**
   * UdonSharp's [FieldChangeCallback]: synced field name -> the property to assign instead. When a received
   * value differs from the field's current one, the property's setter is called with it (and must store it);
   * local code gets the same effect by assigning through the property.
   *
   *   static synced = ["_open"];
   *   static fieldChangeCallbacks = { _open: "Open" };
   *   _open = false;
   *   get Open() { return this._open; }
   *   set Open(value: boolean) { this._open = value; this.door.SetActive(!value); }
   */
  __publicField(Behaviour, "fieldChangeCallbacks", {});
  /**
   * True for a behaviour that exists once per player (VRChat: a PlayerObject). It is made when the player joins
   * and dropped when they leave, that player owns it for good, and its synced fields travel in their user state.
   */
  __publicField(Behaviour, "perPlayer", false);
  /** For a per-player behaviour: its synced fields are saved on the device and put back on the next visit. */
  __publicField(Behaviour, "persistent", false);
  /**
   * Metres from the nearest of the local head and hands within which a click counts as Interact() (or as a bound
   * click). 0 means any distance. A behaviour can change its own at run time with `InteractReach`.
   */
  __publicField(Behaviour, "interactReach", 0);
  /**
   * The methods another client may run on this behaviour: by SendCustomNetworkEvent, or by SendCommand on the
   * referee. Nothing else can be called from the network (a modified client names any method it likes), and a
   * name starting with `_` never can. A subclass's list adds to its parent's.
   *
   *   static networkCallable = ["StartGame", "PlaceBid"];
   */
  __publicField(Behaviour, "networkCallable", []);

  // portkit/src/names.ts
  var TAG = "pk1";
  function sanitizeInstanceKey(raw) {
    if (!raw) return "";
    return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24).replace(/-+$/g, "");
  }
  function isValidSlug(slug) {
    return /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug);
  }
  function instanceKeyFor(attrs, indexAmongSameName) {
    return sanitizeInstanceKey(attrs.room) || sanitizeInstanceKey(attrs.instance) || String(indexAmongSameName);
  }
  function holderName(slug, inst) {
    return `${TAG}:${slug}:${inst}`;
  }
  function relayKey(slug, inst) {
    return `${slug}:${inst}`;
  }
  function networkId(slug, inst, objKey) {
    return `${TAG}/${slug}/${inst}/${objKey}`;
  }
  function statePrefix(slug, inst) {
    return `${TAG}.${slug}.${inst}`;
  }
  function storagePrefix(slug, inst, uid) {
    return `${TAG}.${slug}.${inst}.${uid}.`;
  }
  function isPathSegment(segment) {
    return /^[A-Za-z0-9_\-@]{1,64}$/.test(segment);
  }
  function makeEnvelope(slug, inst, type, fields) {
    return { pk: 1, g: slug, i: inst, t: type, ...fields };
  }

  // portkit/src/util.ts
  function utf8Length(text) {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 128) bytes += 1;
      else if (c < 2048) bytes += 2;
      else if (c >= 55296 && c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320) {
        bytes += 4;
        i++;
      } else bytes += 3;
    }
    return bytes;
  }
  function utf8Encode(text) {
    const out = new Uint8Array(utf8Length(text));
    let o = 0;
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      if (c >= 55296 && c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (text.charCodeAt(++i) - 56320);
      } else if (c >= 55296 && c <= 57343) c = 65533;
      if (c < 128) out[o++] = c;
      else if (c < 2048) {
        out[o++] = 192 | c >> 6;
        out[o++] = 128 | c & 63;
      } else if (c < 65536) {
        out[o++] = 224 | c >> 12;
        out[o++] = 128 | c >> 6 & 63;
        out[o++] = 128 | c & 63;
      } else {
        out[o++] = 240 | c >> 18;
        out[o++] = 128 | c >> 12 & 63;
        out[o++] = 128 | c >> 6 & 63;
        out[o++] = 128 | c & 63;
      }
    }
    return out;
  }
  function utf8Decode(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; ) {
      const b = bytes[i++];
      let c;
      if (b < 128) c = b;
      else if (b < 224) c = (b & 31) << 6 | bytes[i++] & 63;
      else if (b < 240) {
        c = (b & 15) << 12 | (bytes[i] & 63) << 6 | bytes[i + 1] & 63;
        i += 2;
      } else {
        c = (b & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63;
        i += 3;
      }
      out += String.fromCodePoint(c);
    }
    return out;
  }
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  function toBase64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i];
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      out += B64[a >> 2] + B64[(a & 3) << 4 | b >> 4];
      if (i + 1 < bytes.length) out += B64[(b & 15) << 2 | c >> 6];
      if (i + 2 < bytes.length) out += B64[c & 63];
    }
    return out;
  }
  function fromBase64(text) {
    const clean = text.replace(/=+$/, "");
    const out = new Uint8Array(Math.floor(clean.length * 3 / 4));
    let o = 0;
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < clean.length; i++) {
      let v = B64.indexOf(clean[i]);
      if (v < 0) v = clean[i] === "+" ? 62 : clean[i] === "/" ? 63 : -1;
      if (v < 0) throw new Error("bad base64 character");
      buffer = buffer << 6 | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out[o++] = buffer >> bits & 255;
      }
    }
    return out.subarray(0, o);
  }
  function fnv1a(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  function canonicalJson(value) {
    return JSON.stringify(sortKeys(value));
  }
  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
      const out = {};
      for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
      return out;
    }
    return value;
  }
  function asciiJson(value) {
    const json = JSON.stringify(value);
    let out = "";
    let from = 0;
    for (let i = 0; i < json.length; i++) {
      const code = json.charCodeAt(i);
      if (code !== 124 && code < 127) continue;
      out += json.slice(from, i) + BACKSLASH + "u" + code.toString(16).padStart(4, "0");
      from = i + 1;
    }
    return from === 0 ? json : out + json.slice(from);
  }
  var BACKSLASH = String.fromCharCode(92);
  function jsonLeafBytes(text) {
    let bytes = 2;
    for (let i = 0; i < text.length; i++) bytes += leafCharBytes(text, i);
    return bytes;
  }
  function leafCharBytes(text, i) {
    const c = text.charCodeAt(i);
    if (c === 34 || c === 92) return 2;
    if (c < 32) return c === 8 || c === 9 || c === 10 || c === 12 || c === 13 ? 2 : 6;
    if (c < 128) return 1;
    if (c < 2048) return 2;
    if (c >= 56320 && c <= 57343) return i > 0 && (text.charCodeAt(i - 1) & 64512) === 55296 ? 0 : 3;
    if (c >= 55296 && c <= 56319) return i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320 ? 4 : 3;
    return 3;
  }
  function safeParse(text) {
    if (typeof text !== "string" || text.length === 0) return void 0;
    try {
      return JSON.parse(text);
    } catch {
      return void 0;
    }
  }
  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function deferred() {
    let resolveFn;
    const d = {
      promise: new Promise((resolve) => {
        resolveFn = resolve;
      }),
      resolve(value) {
        if (d.settled) return;
        d.settled = true;
        resolveFn(value);
      },
      settled: false
    };
    return d;
  }

  // portkit/src/values.ts
  var Vector2 = class _Vector2 {
    constructor(x = 0, y = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      this.x = x;
      this.y = y;
    }
    static get zero() {
      return new _Vector2(0, 0);
    }
    static get one() {
      return new _Vector2(1, 1);
    }
    static get up() {
      return new _Vector2(0, 1);
    }
    static get down() {
      return new _Vector2(0, -1);
    }
    static get left() {
      return new _Vector2(-1, 0);
    }
    static get right() {
      return new _Vector2(1, 0);
    }
    clone() {
      return new _Vector2(this.x, this.y);
    }
    add(o) {
      return new _Vector2(this.x + o.x, this.y + o.y);
    }
    sub(o) {
      return new _Vector2(this.x - o.x, this.y - o.y);
    }
    scale(k) {
      return new _Vector2(this.x * k, this.y * k);
    }
    /** C# `==` on Vector2 is an approximate comparison; this is the same test. */
    equals(o) {
      if (!o) return false;
      const dx = this.x - o.x;
      const dy = this.y - o.y;
      return dx * dx + dy * dy < 999999944e-19;
    }
    get magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get sqrMagnitude() {
      return this.x * this.x + this.y * this.y;
    }
    get normalized() {
      const m = this.magnitude;
      return m > 1e-5 ? this.scale(1 / m) : _Vector2.zero;
    }
    static Distance(a, b) {
      return a.sub(b).magnitude;
    }
    static Dot(a, b) {
      return a.x * b.x + a.y * b.y;
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Vector2(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    }
    toString() {
      return `(${this.x}, ${this.y})`;
    }
  };
  var Vector3 = class _Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static get zero() {
      return new _Vector3(0, 0, 0);
    }
    static get one() {
      return new _Vector3(1, 1, 1);
    }
    static get up() {
      return new _Vector3(0, 1, 0);
    }
    static get down() {
      return new _Vector3(0, -1, 0);
    }
    static get left() {
      return new _Vector3(-1, 0, 0);
    }
    static get right() {
      return new _Vector3(1, 0, 0);
    }
    static get forward() {
      return new _Vector3(0, 0, 1);
    }
    static get back() {
      return new _Vector3(0, 0, -1);
    }
    clone() {
      return new _Vector3(this.x, this.y, this.z);
    }
    add(o) {
      return new _Vector3(this.x + o.x, this.y + o.y, this.z + o.z);
    }
    sub(o) {
      return new _Vector3(this.x - o.x, this.y - o.y, this.z - o.z);
    }
    scale(k) {
      return new _Vector3(this.x * k, this.y * k, this.z * k);
    }
    equals(o) {
      if (!o) return false;
      const dx = this.x - o.x;
      const dy = this.y - o.y;
      const dz = this.z - o.z;
      return dx * dx + dy * dy + dz * dz < 999999944e-19;
    }
    get magnitude() {
      return Math.sqrt(this.sqrMagnitude);
    }
    get sqrMagnitude() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    get normalized() {
      const m = this.magnitude;
      return m > 1e-5 ? this.scale(1 / m) : _Vector3.zero;
    }
    static Distance(a, b) {
      return a.sub(b).magnitude;
    }
    /** Degrees between two directions, 0 to 180 (UnityEngine.Vector3.Angle; 0 when either is nearly zero). */
    static Angle(from, to) {
      const denominator = Math.sqrt(from.sqrMagnitude * to.sqrMagnitude);
      if (denominator < 1e-15) return 0;
      const dot = Mathf.Clamp(_Vector3.Dot(from, to) / denominator, -1, 1);
      return Math.acos(dot) * Mathf.Rad2Deg;
    }
    /** Reflects a direction off the plane with normal `inNormal` (UnityEngine.Vector3.Reflect). */
    static Reflect(inDirection, inNormal) {
      const factor = -2 * _Vector3.Dot(inNormal, inDirection);
      return new _Vector3(factor * inNormal.x + inDirection.x, factor * inNormal.y + inDirection.y, factor * inNormal.z + inDirection.z);
    }
    static Dot(a, b) {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    static Cross(a, b) {
      return new _Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Vector3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
    }
    static MoveTowards(current, target, maxDelta) {
      const d = target.sub(current);
      const m = d.magnitude;
      return m <= maxDelta || m === 0 ? target.clone() : current.add(d.scale(maxDelta / m));
    }
    toString() {
      return `(${this.x}, ${this.y}, ${this.z})`;
    }
  };
  var Quaternion = class _Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "w");
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    static get identity() {
      return new _Quaternion(0, 0, 0, 1);
    }
    clone() {
      return new _Quaternion(this.x, this.y, this.z, this.w);
    }
    /** Unity's Quaternion.Euler: degrees, applied in Z, X, Y order. */
    static Euler(x, y, z) {
      const hx = x * Mathf.Deg2Rad / 2;
      const hy = y * Mathf.Deg2Rad / 2;
      const hz = z * Mathf.Deg2Rad / 2;
      const sx = Math.sin(hx), cx = Math.cos(hx);
      const sy = Math.sin(hy), cy = Math.cos(hy);
      const sz = Math.sin(hz), cz = Math.cos(hz);
      return new _Quaternion(
        cy * sx * cz + sy * cx * sz,
        sy * cx * cz - cy * sx * sz,
        cy * cx * sz - sy * sx * cz,
        cy * cx * cz + sy * sx * sz
      );
    }
    static AngleAxis(degrees, axis) {
      const n = axis.normalized;
      const h = degrees * Mathf.Deg2Rad / 2;
      const s = Math.sin(h);
      return new _Quaternion(n.x * s, n.y * s, n.z * s, Math.cos(h));
    }
    /** this * o: rotate by o first, then by this (Unity's operator order). */
    mul(o) {
      return new _Quaternion(
        this.w * o.x + this.x * o.w + this.y * o.z - this.z * o.y,
        this.w * o.y + this.y * o.w + this.z * o.x - this.x * o.z,
        this.w * o.z + this.z * o.w + this.x * o.y - this.y * o.x,
        this.w * o.w - this.x * o.x - this.y * o.y - this.z * o.z
      );
    }
    /** this * v: the vector rotated by this quaternion. */
    rotate(v) {
      const { x, y, z, w } = this;
      const tx = 2 * (y * v.z - z * v.y);
      const ty = 2 * (z * v.x - x * v.z);
      const tz = 2 * (x * v.y - y * v.x);
      return new Vector3(v.x + w * tx + (y * tz - z * ty), v.y + w * ty + (z * tx - x * tz), v.z + w * tz + (x * ty - y * tx));
    }
    get inverse() {
      const n = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w || 1;
      return new _Quaternion(-this.x / n, -this.y / n, -this.z / n, this.w / n);
    }
    /** Degrees, each in [0, 360), in Unity's convention. */
    get eulerAngles() {
      const { x, y, z, w } = this;
      const sinX = 2 * (w * x - y * z);
      let ex, ey, ez;
      if (Math.abs(sinX) > 0.9999995) {
        ex = Math.sign(sinX) * Math.PI / 2;
        ey = 2 * Math.atan2(y, w);
        ez = 0;
      } else {
        ex = Math.asin(sinX);
        ey = Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
        ez = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
      }
      const wrap = (r) => {
        const d = r * Mathf.Rad2Deg % 360;
        return d < 0 ? d + 360 : d;
      };
      return new Vector3(wrap(ex), wrap(ey), wrap(ez));
    }
    /** Degrees between two rotations (UnityEngine.Quaternion.Angle). */
    static Angle(a, b) {
      const dot = Math.min(Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w), 1);
      return dot > 0.999999 ? 0 : Math.acos(dot) * 2 * Mathf.Rad2Deg;
    }
    /**
     * The rotation whose forward (Z) is `forward` and whose up is as close to `upwards` as it can be
     * (UnityEngine.Quaternion.LookRotation). A zero forward gives the identity.
     */
    static LookRotation(forward, upwards = new Vector3(0, 1, 0)) {
      const f5 = forward.normalized;
      if (f5.sqrMagnitude < 1e-12) return _Quaternion.identity;
      let r = Vector3.Cross(upwards, f5);
      if (r.sqrMagnitude < 1e-12) {
        const axis = Vector3.Cross(new Vector3(0, 0, 1), f5);
        if (axis.sqrMagnitude < 1e-12) return f5.z >= 0 ? _Quaternion.identity : new _Quaternion(0, 1, 0, 0);
        return _Quaternion.AngleAxis(Math.acos(Mathf.Clamp(f5.z, -1, 1)) * Mathf.Rad2Deg, axis);
      }
      r = r.normalized;
      const u = Vector3.Cross(f5, r);
      const m00 = r.x, m01 = u.x, m02 = f5.x;
      const m10 = r.y, m11 = u.y, m12 = f5.y;
      const m20 = r.z, m21 = u.z, m22 = f5.z;
      const trace = m00 + m11 + m22;
      let q;
      if (trace > 0) {
        const s = Math.sqrt(trace + 1) * 2;
        q = new _Quaternion((m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s);
      } else if (m00 > m11 && m00 > m22) {
        const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
        q = new _Quaternion(0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s);
      } else if (m11 > m22) {
        const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
        q = new _Quaternion((m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s);
      } else {
        const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
        q = new _Quaternion((m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s);
      }
      return q;
    }
    static Slerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
      const s = dot < 0 ? -1 : 1;
      dot = Math.abs(dot);
      let wa, wb;
      if (dot > 0.9995) {
        wa = 1 - k;
        wb = k;
      } else {
        const theta = Math.acos(dot);
        const sin = Math.sin(theta);
        wa = Math.sin((1 - k) * theta) / sin;
        wb = Math.sin(k * theta) / sin;
      }
      wb *= s;
      const q = new _Quaternion(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb);
      const n = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
      return new _Quaternion(q.x / n, q.y / n, q.z / n, q.w / n);
    }
    equals(o) {
      if (!o) return false;
      return Math.abs(this.x * o.x + this.y * o.y + this.z * o.z + this.w * o.w) > 0.999999;
    }
    toString() {
      return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
    }
  };
  var Vector4 = class _Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "w");
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    clone() {
      return new _Vector4(this.x, this.y, this.z, this.w);
    }
    equals(o) {
      return !!o && this.x === o.x && this.y === o.y && this.z === o.z && this.w === o.w;
    }
  };
  var Color = class _Color {
    constructor(r = 0, g = 0, b = 0, a = 1) {
      __publicField(this, "r");
      __publicField(this, "g");
      __publicField(this, "b");
      __publicField(this, "a");
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
    static get white() {
      return new _Color(1, 1, 1, 1);
    }
    static get black() {
      return new _Color(0, 0, 0, 1);
    }
    static get red() {
      return new _Color(1, 0, 0, 1);
    }
    static get green() {
      return new _Color(0, 1, 0, 1);
    }
    static get blue() {
      return new _Color(0, 0, 1, 1);
    }
    static get yellow() {
      return new _Color(1, 0.92156863, 0.015686275, 1);
    }
    static get clear() {
      return new _Color(0, 0, 0, 0);
    }
    static get cyan() {
      return new _Color(0, 1, 1, 1);
    }
    static get magenta() {
      return new _Color(1, 0, 1, 1);
    }
    static get gray() {
      return new _Color(0.5, 0.5, 0.5, 1);
    }
    static get grey() {
      return new _Color(0.5, 0.5, 0.5, 1);
    }
    /**
     * UnityEngine.Color.HSVToRGB, line for line: H, S, V in [0, 1]; with `hdr` false each channel is clamped to
     * [0, 1]. Alpha is 1. (Unity computes in single precision; this in double: the last digits can differ.)
     */
    static HSVToRGB(H, S, V, hdr = true) {
      const c = new _Color(1, 1, 1, 1);
      if (S === 0) {
        c.r = V;
        c.g = V;
        c.b = V;
      } else if (V === 0) {
        c.r = 0;
        c.g = 0;
        c.b = 0;
      } else {
        c.r = 0;
        c.g = 0;
        c.b = 0;
        const h = H * 6;
        const temp = Math.floor(h);
        const t = h - temp;
        const var1 = V * (1 - S);
        const var2 = V * (1 - S * t);
        const var3 = V * (1 - S * (1 - t));
        switch (temp) {
          case 0:
            c.r = V;
            c.g = var3;
            c.b = var1;
            break;
          case 1:
            c.r = var2;
            c.g = V;
            c.b = var1;
            break;
          case 2:
            c.r = var1;
            c.g = V;
            c.b = var3;
            break;
          case 3:
            c.r = var1;
            c.g = var2;
            c.b = V;
            break;
          case 4:
            c.r = var3;
            c.g = var1;
            c.b = V;
            break;
          case 5:
            c.r = V;
            c.g = var1;
            c.b = var2;
            break;
          case 6:
            c.r = V;
            c.g = var3;
            c.b = var1;
            break;
          case -1:
            c.r = V;
            c.g = var1;
            c.b = var2;
            break;
        }
        if (!hdr) {
          c.r = Mathf.Clamp01(c.r);
          c.g = Mathf.Clamp01(c.g);
          c.b = Mathf.Clamp01(c.b);
        }
      }
      return c;
    }
    /** UnityEngine.Color.RGBToHSV: [H, S, V], each in [0, 1]. */
    static RGBToHSV(color) {
      const { r, g, b } = color;
      const rgbToHue = (offset, dominant, c1, c2) => {
        const V = dominant;
        if (V === 0) return [0, 0, 0];
        const min = c1 > c2 ? c2 : c1;
        const delta = V - min;
        if (delta === 0) return [0, 0, V];
        const S = delta / V;
        let H = offset + (c1 - c2) / delta;
        H /= 6;
        if (H < 0) H += 1;
        return [H, S, V];
      };
      if (b > g && b > r) return rgbToHue(4, b, r, g);
      if (g > r) return rgbToHue(2, g, b, r);
      return rgbToHue(0, r, g, b);
    }
    clone() {
      return new _Color(this.r, this.g, this.b, this.a);
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Color(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k, a.a + (b.a - a.a) * k);
    }
    equals(o) {
      return !!o && this.r === o.r && this.g === o.g && this.b === o.b && this.a === o.a;
    }
  };
  var Curve = class {
    constructor(keys) {
      __publicField(this, "keys");
      this.keys = keys;
    }
    Evaluate(t) {
      const k = this.keys;
      if (k.length === 0) return 0;
      if (t <= k[0][0]) return k[0][1];
      for (let i = 1; i < k.length; i++) {
        if (t <= k[i][0]) {
          const [t0, v0] = k[i - 1];
          const [t1, v1] = k[i];
          return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
        }
      }
      return k[k.length - 1][1];
    }
  };
  var Mathf = {
    PI: Math.PI,
    Deg2Rad: Math.PI / 180,
    Rad2Deg: 180 / Math.PI,
    Epsilon: 1401298e-51,
    Infinity: Number.POSITIVE_INFINITY,
    Abs: Math.abs,
    Min: Math.min,
    Max: Math.max,
    Sqrt: Math.sqrt,
    Pow: Math.pow,
    Sin: Math.sin,
    Cos: Math.cos,
    Atan2: Math.atan2,
    Floor: Math.floor,
    Ceil: Math.ceil,
    FloorToInt: (v) => Math.floor(v),
    CeilToInt: (v) => Math.ceil(v),
    /** C# rounds halves to the even neighbour; Math.round does not. */
    Round: (v) => {
      const f5 = Math.floor(v);
      const d = v - f5;
      if (d < 0.5) return f5;
      if (d > 0.5) return f5 + 1;
      return f5 % 2 === 0 ? f5 : f5 + 1;
    },
    RoundToInt: (v) => Mathf.Round(v),
    Sign: (v) => v >= 0 ? 1 : -1,
    Clamp: (v, lo, hi) => v < lo ? lo : v > hi ? hi : v,
    Clamp01: (v) => v < 0 ? 0 : v > 1 ? 1 : v,
    Lerp: (a, b, t) => a + (b - a) * Mathf.Clamp01(t),
    LerpUnclamped: (a, b, t) => a + (b - a) * t,
    InverseLerp: (a, b, v) => a === b ? 0 : Mathf.Clamp01((v - a) / (b - a)),
    MoveTowards: (current, target, maxDelta) => Math.abs(target - current) <= maxDelta ? target : current + Math.sign(target - current) * maxDelta,
    Repeat: (t, length) => Mathf.Clamp(t - Math.floor(t / length) * length, 0, length),
    Approximately: (a, b) => Math.abs(b - a) < Math.max(1e-6 * Math.max(Math.abs(a), Math.abs(b)), 1121039e-50)
  };
  function encodeValue(value) {
    if (value === void 0 || value === null) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "object") return value;
    if (value instanceof Vector2) return { $v2: [value.x, value.y] };
    if (value instanceof Vector3) return { $v3: [value.x, value.y, value.z] };
    if (value instanceof Quaternion) return { $q: [value.x, value.y, value.z, value.w] };
    if (value instanceof Vector4) return { $v4: [value.x, value.y, value.z, value.w] };
    if (value instanceof Color) return { $color: [value.r, value.g, value.b, value.a] };
    if (value instanceof Curve) return { $curve: value.keys };
    if (Array.isArray(value)) return value.map(encodeValue);
    const out = {};
    for (const key of Object.keys(value)) out[key] = encodeValue(value[key]);
    return out;
  }
  function decodeValue(json) {
    if (json === null || typeof json !== "object") return json;
    if (Array.isArray(json)) return json.map(decodeValue);
    const o = json;
    const n = (key, len) => {
      const a2 = o[key];
      return Array.isArray(a2) && a2.length === len && a2.every((v) => typeof v === "number") ? a2 : null;
    };
    let a;
    if (a = n("$v2", 2)) return new Vector2(a[0], a[1]);
    if (a = n("$v3", 3)) return new Vector3(a[0], a[1], a[2]);
    if (a = n("$q", 4)) return new Quaternion(a[0], a[1], a[2], a[3]);
    if (a = n("$v4", 4)) return new Vector4(a[0], a[1], a[2], a[3]);
    if (a = n("$color", 4)) return new Color(a[0], a[1], a[2], a[3]);
    if (Array.isArray(o.$curve)) return new Curve(o.$curve);
    const out = {};
    for (const key of Object.keys(o)) out[key] = decodeValue(o[key]);
    return out;
  }

  // portkit/src/fields.ts
  function readFields(target, fields) {
    const bag = target;
    const out = {};
    for (const field of fields) out[field] = encodeValue(bag[field]);
    return out;
  }
  function assignFields(target, fields, data, callbacks) {
    if (!isRecord(data)) return;
    const bag = target;
    for (const field of fields) {
      if (!(field in data)) continue;
      const property = callbacks ? callbacks[field] : void 0;
      if (property === void 0) {
        bag[field] = decodeValue(data[field]);
        continue;
      }
      if (canonicalJson(encodeValue(bag[field])) === canonicalJson(data[field] ?? null)) continue;
      bag[property] = decodeValue(data[field]);
    }
  }

  // portkit/src/peruser.ts
  var MAX_PLAYER_LEAVES = 4;
  var PER_LEAF = 24;
  var PerUser = class {
    constructor(core, storage, hooks) {
      __publicField(this, "core");
      __publicField(this, "storage");
      __publicField(this, "hooks");
      __publicField(this, "remote", /* @__PURE__ */ new Map());
      __publicField(this, "delivered", /* @__PURE__ */ new Map());
      __publicField(this, "local", {});
      __publicField(this, "localLoaded", false);
      __publicField(this, "localDirty", false);
      __publicField(this, "changedKeys", /* @__PURE__ */ new Set());
      /** sid -> behaviour id -> the per-player behaviour */
      __publicField(this, "owned", /* @__PURE__ */ new Map());
      __publicField(this, "dirtyBuckets", /* @__PURE__ */ new Set());
      __publicField(this, "lastWrite", /* @__PURE__ */ new Map());
      __publicField(this, "typeIds", []);
      /** PlayerData is published only when the game uses it. */
      __publicField(this, "dataEnabled", false);
      __publicField(this, "started", false);
      this.core = core;
      this.storage = storage;
      this.hooks = hooks;
    }
    path(leaf) {
      return `${this.core.prefix}.${leaf}`;
    }
    /** Declares the per-player behaviour ids of this game, in bindings order (it fixes which leaf each uses). */
    declareTypes(ids) {
      this.typeIds = ids.slice();
    }
    bucketOf(id) {
      const index = Math.max(0, this.typeIds.indexOf(id));
      const leaves = Math.min(MAX_PLAYER_LEAVES, Math.max(1, Math.ceil(this.typeIds.length / PER_LEAF)));
      return Math.floor(index * leaves / Math.max(1, this.typeIds.length));
    }
    listen() {
      const dot = this.core.prefix + ".";
      this.core.own(
        this.core.platform.onUser(dot, (sid, path) => {
          if (this.core.disposed || sid === this.core.me.sid) return;
          const leaf = path.slice(dot.length);
          if (leaf === "d") this.readRemoteData(sid);
          else if (/^p[0-3]$/.test(leaf)) this.readRemoteBucket(sid, Number(leaf.slice(1)));
        })
      );
    }
    // ---- PlayerData ---------------------------------------------------------------------------------------------
    /** Loads the local player's saved values and publishes them. Called once behaviours have started. */
    restoreLocal() {
      if (this.localLoaded) return;
      this.localLoaded = true;
      const saved = this.storage.get("playerdata", null);
      this.local = isRecord(saved) ? encodeValue(saved) : {};
      if (this.dataEnabled) this.localDirty = true;
    }
    enableData() {
      if (this.dataEnabled) return;
      this.dataEnabled = true;
      if (this.localLoaded) this.localDirty = true;
    }
    Set(key, value) {
      const encoded = encodeValue(value);
      if (canonicalJson(this.local[key] ?? null) === canonicalJson(encoded) && key in this.local) return;
      this.local[key] = encoded;
      this.changedKeys.add(key);
      this.localDirty = true;
      this.enableData();
    }
    Delete(key) {
      if (!(key in this.local)) return;
      delete this.local[key];
      this.changedKeys.add(key);
      this.localDirty = true;
    }
    bag(player) {
      if (player.isLocal) return this.local;
      return this.remote.get(player.sid)?.data ?? null;
    }
    Get(player, key, fallback) {
      const bag = this.bag(player);
      return bag && key in bag ? decodeValue(bag[key]) : fallback;
    }
    Has(player, key) {
      const bag = this.bag(player);
      return !!bag && key in bag;
    }
    Keys(player) {
      const bag = this.bag(player);
      return bag ? Object.keys(bag) : [];
    }
    IsRestored(player) {
      return player.isLocal ? this.localLoaded : !!this.remote.get(player.sid)?.restored;
    }
    SetString(key, value) {
      this.Set(key, String(value));
    }
    SetInt(key, value) {
      this.Set(key, Math.trunc(value));
    }
    SetFloat(key, value) {
      this.Set(key, value);
    }
    SetBool(key, value) {
      this.Set(key, !!value);
    }
    GetString(player, key) {
      return String(this.Get(player, key, ""));
    }
    GetInt(player, key) {
      return Math.trunc(Number(this.Get(player, key, 0)) || 0);
    }
    GetFloat(player, key) {
      return Number(this.Get(player, key, 0)) || 0;
    }
    GetBool(player, key) {
      return this.Get(player, key, false) === true;
    }
    readRemoteData(sid) {
      const raw = safeParse(this.core.platform.userGet(sid, this.path("d")));
      let entry = this.remote.get(sid);
      if (!entry) this.remote.set(sid, entry = { data: {}, restored: false, announced: false });
      const before = entry.data;
      const now = isRecord(raw) && isRecord(raw.d) ? raw.d : {};
      entry.data = now;
      entry.restored = isRecord(raw) && raw.r === 1;
      const player = this.delivered.get(sid);
      if (!player || !this.started) return;
      if (entry.restored && !entry.announced) {
        entry.announced = true;
        this.hooks.restored(player);
        const all = Object.keys(now).sort();
        if (all.length) this.hooks.dataUpdated(player, all);
        return;
      }
      const keys = [];
      for (const key of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(now)])) {
        if (canonicalJson(before[key] ?? null) !== canonicalJson(now[key] ?? null) || key in before !== key in now) keys.push(key);
      }
      if (keys.length) this.hooks.dataUpdated(player, keys.sort());
    }
    // ---- per-player behaviours ----------------------------------------------------------------------------------
    /** Registers a per-player behaviour that has just been made for `player`. Returns true if it already has data. */
    adopt(player, id, behaviour, fields, persistent, callbacks) {
      let mine = this.owned.get(player.sid);
      if (!mine) this.owned.set(player.sid, mine = /* @__PURE__ */ new Map());
      const entry = { id, behaviour, fields, callbacks, persistent, bucket: this.bucketOf(id), n: 0 };
      mine.set(id, entry);
      if (player.isLocal) {
        if (!persistent) return false;
        const saved = this.storage.get(`po.${id}`, null);
        if (!isRecord(saved)) return false;
        this.core.guard(`${id} field change callback`, () => assignFields(behaviour, fields, encodeValue(saved), callbacks));
        entry.n = 1;
        this.dirtyBuckets.add(entry.bucket);
        return true;
      }
      const stored = this.remoteBucket(player.sid, entry.bucket)[id];
      if (!stored) return false;
      this.core.guard(`${id} field change callback`, () => assignFields(behaviour, fields, stored[1], callbacks));
      entry.n = stored[0];
      return true;
    }
    behaviour(sid, id) {
      return this.owned.get(sid)?.get(id)?.behaviour ?? null;
    }
    behavioursOf(sid) {
      return [...this.owned.get(sid)?.values() ?? []].map((o) => o.behaviour);
    }
    /** The local player asked to send one of their per-player behaviours. */
    requestSerialization(behaviour) {
      const mine = this.owned.get(this.core.me.sid);
      if (!mine) return;
      for (const entry of mine.values()) {
        if (entry.behaviour !== behaviour) continue;
        entry.n++;
        this.dirtyBuckets.add(entry.bucket);
        return;
      }
    }
    remoteBucket(sid, bucket) {
      const raw = safeParse(this.core.platform.userGet(sid, this.path(`p${bucket}`)));
      const out = {};
      if (!isRecord(raw) || !isRecord(raw.b)) return out;
      for (const id of Object.keys(raw.b)) {
        const entry = raw.b[id];
        if (Array.isArray(entry) && typeof entry[0] === "number") out[id] = [entry[0], entry[1]];
      }
      return out;
    }
    readRemoteBucket(sid, bucket) {
      const theirs = this.owned.get(sid);
      if (!theirs) return;
      const stored = this.remoteBucket(sid, bucket);
      for (const entry of theirs.values()) {
        const value = stored[entry.id];
        if (!value || value[0] === entry.n) continue;
        entry.n = value[0];
        this.core.guard(`${entry.id} field change callback`, () => assignFields(entry.behaviour, entry.fields, value[1], entry.callbacks));
        if (this.started) this.hooks.deserialized(entry.behaviour);
      }
    }
    // ---- players coming and going -------------------------------------------------------------------------------
    /** Called after OnPlayerJoined has been delivered for `player`. */
    playerDelivered(player) {
      this.delivered.set(player.sid, player);
      if (player.isLocal) {
        if (this.dataEnabled || this.hasPersistentLocal()) {
          this.hooks.restored(player);
          const all = Object.keys(this.local).sort();
          if (this.dataEnabled && all.length) this.hooks.dataUpdated(player, all);
        }
        return;
      }
      this.readRemoteData(player.sid);
    }
    hasPersistentLocal() {
      for (const entry of this.owned.get(this.core.me.sid)?.values() ?? []) if (entry.persistent) return true;
      return false;
    }
    /** Drops everything kept for a player who left. Returns their per-player behaviours, for OnDestroy. */
    playerGone(sid) {
      const gone = this.behavioursOf(sid);
      this.owned.delete(sid);
      this.remote.delete(sid);
      this.delivered.delete(sid);
      return gone;
    }
    // ---- writing ------------------------------------------------------------------------------------------------
    /** Writes what changed, at most a few times a second per leaf. Called once per tick. */
    flush() {
      if (this.core.disposed || !this.started) return;
      const now = this.core.platform.clock.now();
      const due = (leaf) => now - (this.lastWrite.get(leaf) ?? -Infinity) >= this.core.options.continuousIntervalMs;
      const limit = this.core.platform.limits.maxLeafBytes - 64;
      for (const bucket of [...this.dirtyBuckets]) {
        const leaf = `p${bucket}`;
        if (!due(leaf)) continue;
        this.dirtyBuckets.delete(bucket);
        const b = {};
        const mine = [...this.owned.get(this.core.me.sid)?.values() ?? []].filter((o) => o.bucket === bucket && o.n > 0);
        for (const entry of mine) b[entry.id] = [entry.n, readFields(entry.behaviour, entry.fields)];
        const text = asciiJson({ b });
        if (jsonLeafBytes(text) > limit) {
          this.hooks.refused("playerObject", "value_too_large", this.path(leaf), mine[0]?.behaviour ?? null);
          continue;
        }
        this.lastWrite.set(leaf, now);
        this.core.platform.userSet(this.path(leaf), text);
        for (const entry of mine) if (entry.persistent) this.storage.set(`po.${entry.id}`, decodeValue(b[entry.id][1]));
      }
      if (this.localDirty && this.localLoaded && this.dataEnabled && due("d")) {
        this.localDirty = false;
        const keys = [...this.changedKeys].sort();
        this.changedKeys.clear();
        const text = asciiJson({ r: 1, d: this.local });
        if (jsonLeafBytes(text) > limit) {
          this.hooks.refused("playerData", "value_too_large", this.path("d"), null);
        } else {
          this.lastWrite.set("d", now);
          this.core.platform.userSet(this.path("d"), text);
          this.storage.set("playerdata", decodeValue(this.local));
        }
        const me = this.delivered.get(this.core.me.sid);
        if (me && keys.length) this.hooks.dataUpdated(me, keys);
      }
    }
    /** Removes the local player's leaves, when the instance stops while they stay in the room. */
    retire() {
      const { platform } = this.core;
      if (this.dataEnabled) platform.userSet(this.path("d"), null);
      const leaves = /* @__PURE__ */ new Set();
      for (const entry of this.owned.get(this.core.me.sid)?.values() ?? []) if (entry.n > 0) leaves.add(entry.bucket);
      for (const bucket of leaves) platform.userSet(this.path(`p${bucket}`), null);
    }
  };

  // portkit/src/bindings.ts
  var EVENT_KINDS = ["click", "grab", "drop", "triggerEnter", "triggerExit", "collisionEnter", "collisionExit", "uiButton", "uiSlider", "uiToggle", "heldTrigger", "heldPrimary", "heldSecondary", "field", "graph"];
  var GRAPH_KINDS = ["uiButton", "uiSlider", "uiToggle", "heldTrigger", "heldPrimary", "heldSecondary", "field"];
  function validateBindings(json) {
    const problems = [];
    const fail = (text) => problems.push(text);
    if (!isRecord(json)) throw new Error("bindings: not an object");
    if (json.schema !== 1) fail(`schema is ${JSON.stringify(json.schema)}, expected 1`);
    if (typeof json.slug !== "string" || !isValidSlug(json.slug)) fail(`slug ${JSON.stringify(json.slug)} is not lower-case letters, digits and hyphens`);
    const bundles = isRecord(json.bundles) ? json.bundles : {};
    const objects = isRecord(json.objects) ? json.objects : {};
    const refs = Array.isArray(json.refs) ? json.refs : [];
    const behaviours = Array.isArray(json.behaviours) ? json.behaviours : [];
    const events = Array.isArray(json.events) ? json.events : [];
    const paths = /* @__PURE__ */ new Map();
    for (const key of Object.keys(objects)) {
      const o = objects[key];
      if (!isPathSegment(key)) fail(`object key '${key}' must be 1-64 of A-Z a-z 0-9 _ - @ (it becomes part of a network id)`);
      if (!isRecord(o) || typeof o.path !== "string") {
        fail(`object '${key}' has no path`);
        continue;
      }
      if (o.sync !== void 0 && o.sync !== "none" && o.sync !== "transform") fail(`object '${key}': sync must be "none" or "transform"`);
      const other = paths.get(o.path);
      if (other !== void 0) fail(`objects '${other}' and '${key}' have the same path '${o.path}'`);
      paths.set(o.path, key);
    }
    refs.forEach((ref, i) => {
      if (typeof ref !== "string" || !(ref in objects)) fail(`refs[${i}] '${String(ref)}' is not an object key`);
    });
    if (new Set(refs).size !== refs.length) fail("refs lists an object twice");
    const ids = /* @__PURE__ */ new Set();
    for (const b of behaviours) {
      if (!isRecord(b) || typeof b.id !== "string" || typeof b.type !== "string") {
        fail(`a behaviour entry has no id or type: ${JSON.stringify(b)}`);
        continue;
      }
      if (!isPathSegment(b.id)) fail(`behaviour id '${b.id}' must be 1-64 of A-Z a-z 0-9 _ - @ (it is a state key)`);
      if (ids.has(b.id)) fail(`behaviour id '${b.id}' is used twice`);
      ids.add(b.id);
      if (b.object !== void 0 && b.object !== null && !(String(b.object) in objects)) fail(`behaviour '${b.id}': object '${String(b.object)}' is not an object key`);
      if (b.fields !== void 0 && !isRecord(b.fields)) fail(`behaviour '${b.id}': fields is not an object`);
      if (b.group !== void 0 && (typeof b.group !== "string" || !/^[A-Za-z0-9_-]{1,48}$/.test(b.group))) fail(`behaviour '${b.id}': group must be 1-48 of A-Z a-z 0-9 _ -`);
      if (b.group !== void 0 && b.perPlayer === true) fail(`behaviour '${b.id}': a per-player behaviour cannot be in a sync group`);
    }
    const checkRefs = (where, value) => {
      if (Array.isArray(value)) value.forEach((v, i) => checkRefs(`${where}[${i}]`, v));
      else if (isRecord(value)) {
        if (typeof value.$obj === "string" && !(value.$obj in objects)) fail(`${where}: $obj '${value.$obj}' is not an object key`);
        else if (typeof value.$beh === "string" && !ids.has(value.$beh)) fail(`${where}: $beh '${value.$beh}' is not a behaviour id`);
        else if (typeof value.$comp === "string" && !(value.$comp in objects)) fail(`${where}: $comp '${value.$comp}' is not an object key`);
        else if (value.$clip !== void 0 && value.on !== void 0 && !(String(value.on) in objects)) fail(`${where}: $clip on '${String(value.on)}' is not an object key`);
        else if (!Object.keys(value).some((k) => k.startsWith("$"))) for (const k of Object.keys(value)) checkRefs(`${where}.${k}`, value[k]);
      }
    };
    for (const b of behaviours) if (isRecord(b) && isRecord(b.fields)) for (const f5 of Object.keys(b.fields)) checkRefs(`behaviour '${String(b.id)}' field '${f5}'`, b.fields[f5]);
    events.forEach((e, i) => {
      if (!isRecord(e)) return fail(`events[${i}] is not an object`);
      if (typeof e.kind !== "string" || EVENT_KINDS.indexOf(e.kind) < 0) fail(`events[${i}]: kind '${String(e.kind)}' is not one of ${EVENT_KINDS.join(", ")}`);
      if (e.kind === "graph") {
        if (typeof e.name !== "string" || !e.name) fail(`events[${i}]: a graph event needs a name`);
      } else if (typeof e.object !== "string" || !(e.object in objects)) fail(`events[${i}]: object '${String(e.object)}' is not an object key`);
      const unbound = GRAPH_KINDS.indexOf(String(e.kind)) >= 0 && !e.behaviour && !e.method;
      if (unbound) return;
      if (typeof e.behaviour !== "string" || !ids.has(e.behaviour)) fail(`events[${i}]: behaviour '${String(e.behaviour)}' is not a behaviour id`);
      if (typeof e.method !== "string" || !e.method) fail(`events[${i}]: no method`);
    });
    if (problems.length) throw new Error("bindings.json is not valid:\n  - " + problems.join("\n  - "));
    const normalObjects = {};
    for (const key of Object.keys(objects)) {
      const o = objects[key];
      normalObjects[key] = { path: o.path, sync: o.sync === "transform" ? "transform" : "none", grab: o.grab === true, click: o.click === true, seat: o.seat === true };
      if (o.active === false) normalObjects[key].active = false;
    }
    return {
      schema: 1,
      slug: json.slug,
      hash: typeof json.hash === "string" ? json.hash : void 0,
      root: typeof json.root === "string" && json.root ? json.root : void 0,
      bundles: { windows: typeof bundles.windows === "string" ? bundles.windows : "", android: typeof bundles.android === "string" ? bundles.android : "" },
      objects: normalObjects,
      refs,
      behaviours,
      events
    };
  }

  // portkit/src/events.ts
  var NetEvents = class {
    constructor(core, sync, routes) {
      __publicField(this, "core");
      __publicField(this, "sync");
      __publicField(this, "routes");
      __publicField(this, "held", /* @__PURE__ */ new Map());
      /** The session whose event or command is being run right now, for Networking.CallingPlayer. */
      __publicField(this, "callingSid", null);
      __publicField(this, "sent", 0);
      __publicField(this, "received", 0);
      /** Requests naming a method that may not be called from the network, for tests and diagnostics. */
      __publicField(this, "refusedCount", 0);
      __publicField(this, "refusedNames", /* @__PURE__ */ new Set());
      this.core = core;
      this.sync = sync;
      this.routes = routes;
    }
    listen() {
      this.core.own(this.core.platform.onOneShot((fromSid, data) => this.receive(fromSid, data)));
    }
    send(behaviour, target, name, args) {
      if (this.core.disposed) return;
      const address = this.routes.address(behaviour);
      if (!address) return;
      if (!callable(behaviour, name)) {
        this.core.log("warn", `SendCustomNetworkEvent: ${address.id} has no network-callable method '${name}' (list it in its class's static networkCallable; names starting with '_' can never be sent)`);
        return;
      }
      const fields = { b: address.id, e: name };
      if (args.length) fields.a = args.map(encodeValue);
      const me = this.core.me.sid;
      let ownerSid;
      if (address.playerSid !== null) {
        fields.ps = address.playerSid;
        ownerSid = address.playerSid;
      } else {
        const slot = this.sync.slotOf(behaviour);
        ownerSid = slot ? this.sync.ownerSid(slot) : null;
        if (slot && ownerSid === me) {
          const mark = this.sync.flushOne(slot);
          if (mark && mark.w === me) fields.s = [mark.g, mark.n];
        }
      }
      if (target === "Owner") {
        if (ownerSid === me) {
          this.invoke(behaviour, name, args, me);
          return;
        }
        if (ownerSid === null) {
          this.core.log("warn", `${address.id}.${name}: no owner to send to`);
          return;
        }
        fields.o = ownerSid;
      } else this.invoke(behaviour, name, args, me);
      this.post(behaviour, name, fields);
    }
    post(behaviour, name, fields) {
      const text = asciiJson(makeEnvelope(this.core.slug, this.core.inst, "ev", fields));
      if (utf8Length(text) > this.core.platform.limits.oneShotMaxBytes || !this.core.platform.oneShot(text)) {
        this.core.log("error", `network event '${name}' is too large to send (${utf8Length(text)} bytes)`);
        this.routes.refused(behaviour, "oneshot_too_large", name);
        return;
      }
      this.sent++;
    }
    receive(fromSid, data) {
      if (this.core.disposed || !this.sync.started) return;
      const env2 = parseOurs(data, this.core.slug, this.core.inst);
      if (!env2 || env2.t !== "ev" || typeof env2.b !== "string" || typeof env2.e !== "string") return;
      const me = this.core.me.sid;
      const name = env2.e;
      const args = Array.isArray(env2.a) ? env2.a.map(decodeValue) : [];
      this.received++;
      if (typeof env2.ps === "string") {
        if (typeof env2.o === "string" && env2.o !== me) return;
        const behaviour2 = this.routes.playerBehaviour(env2.ps, env2.b);
        if (behaviour2) this.invoke(behaviour2, name, args, fromSid);
        return;
      }
      const behaviour = this.routes.behaviour(env2.b);
      const slot = behaviour ? this.sync.slotOf(behaviour) : null;
      if (!behaviour || !slot) return;
      if (typeof env2.o === "string") {
        if (env2.o !== me) return;
        if (!this.sync.isOwner(slot)) {
          const owner = this.sync.ownerSid(slot);
          const hops = typeof env2.h === "number" ? env2.h : 0;
          if (owner !== null && owner !== fromSid && hops < 2) {
            const fields = { b: env2.b, e: name, o: owner, h: hops + 1 };
            if (args.length) fields.a = env2.a;
            this.post(behaviour, name, fields);
          }
          return;
        }
      }
      const run = () => this.invoke(behaviour, name, args, fromSid);
      const mark = Array.isArray(env2.s) && typeof env2.s[0] === "number" && typeof env2.s[1] === "number" ? { g: env2.s[0], n: env2.s[1] } : null;
      if (mark && !this.has(slot, mark.g, mark.n)) this.hold(slot, mark.g, mark.n, run);
      else run();
    }
    /** Has the write the event was sent after reached this client's mirror? (Sequence numbers only rise.) */
    has(slot, _g, n) {
      return slot.seenN >= n;
    }
    hold(slot, g, n, run) {
      let list = this.held.get(slot.id);
      if (!list) this.held.set(slot.id, list = []);
      const entry = { g, n, run, timer: 0 };
      entry.timer = this.core.scheduler.after(this.core.options.eventHoldMs, () => {
        const current = this.held.get(slot.id) ?? [];
        const at = current.indexOf(entry);
        if (at < 0) return;
        current.splice(at, 1);
        run();
      });
      list.push(entry);
      slot.onApplied = () => this.release(slot);
    }
    release(slot) {
      const list = this.held.get(slot.id);
      if (!list || !list.length) return;
      const ready = list.filter((h) => this.has(slot, h.g, h.n));
      if (!ready.length) return;
      this.held.set(
        slot.id,
        list.filter((h) => !ready.includes(h))
      );
      for (const h of ready) {
        this.core.scheduler.cancel(h.timer);
        h.run();
      }
    }
    /** Runs a method of game code on behalf of `fromSid` (a network event or a command). */
    invoke(behaviour, name, args, fromSid) {
      if (!callable(behaviour, name)) {
        const key = `${behaviour.constructor.name}.${name}`;
        if (!this.refusedNames.has(key) && this.refusedNames.size < 64) {
          this.refusedNames.add(key);
          this.core.log("warn", `refused a request from session ${fromSid} to run '${String(name).slice(0, 64)}' on ${behaviour.constructor.name}: not in its networkCallable list`);
        }
        this.refusedCount++;
        return;
      }
      const before = this.callingSid;
      this.callingSid = fromSid;
      try {
        this.core.guard(name, () => behaviour[name](...args));
      } finally {
        this.callingSid = before;
      }
    }
  };
  var LISTS = /* @__PURE__ */ new WeakMap();
  function networkCallableOf(cls) {
    let set = LISTS.get(cls);
    if (set) return set;
    const names = /* @__PURE__ */ new Set();
    for (let c = cls; typeof c === "function" && c !== Behaviour && c !== Function.prototype; c = Object.getPrototypeOf(c)) {
      if (Object.prototype.hasOwnProperty.call(c, "networkCallable")) {
        const list = c.networkCallable;
        if (Array.isArray(list)) {
          for (const name of list) if (typeof name === "string") names.add(name);
        }
      }
    }
    set = names;
    LISTS.set(cls, set);
    return set;
  }
  function callable(behaviour, name) {
    if (typeof name !== "string" || name.length === 0 || name.charCodeAt(0) === 95 || name === "constructor") return false;
    if (!networkCallableOf(behaviour.constructor).has(name)) return false;
    for (let proto = Object.getPrototypeOf(behaviour); proto && proto !== Behaviour.prototype && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
      if (Object.prototype.hasOwnProperty.call(proto, name)) return typeof behaviour[name] === "function";
    }
    return false;
  }
  function parseOurs(data, slug, inst) {
    if (typeof data !== "string" || data.indexOf('"pk":1') < 0) return null;
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    const e = parsed;
    if (e.pk !== 1 || e.g !== slug || e.i !== inst || typeof e.t !== "string") return null;
    return e;
  }

  // portkit/src/refrecord.ts
  var RefereeTable = class {
    constructor(presence, referee, name, parseEntry) {
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "name");
      __publicField(this, "parseEntry");
      __publicField(this, "last", null);
      __publicField(this, "lastText", "");
      this.presence = presence;
      this.referee = referee;
      this.name = name;
      this.parseEntry = parseEntry;
    }
    /** The table as the referee published it: read from the referee's own user state, else the last one read. */
    read() {
      const ref = this.referee.current();
      const epoch = this.referee.epoch;
      if (ref) {
        const raw = this.presence.extra(ref.sid, this.name);
        const parsed = this.parse(raw, epoch);
        if (parsed) {
          this.last = { e: epoch, m: parsed };
          return parsed;
        }
      }
      return this.last && this.last.e === epoch ? this.last.m : {};
    }
    /** A copy the referee may change and `write`: its own published table, else its predecessor's last one. */
    working() {
      const epoch = this.referee.epoch;
      const own = this.parse(this.presence.extra(this.presence.localSid, this.name), epoch);
      const base = own ?? (this.last && this.last.e === epoch ? this.last.m : {});
      return JSON.parse(JSON.stringify(base));
    }
    /** Publishes the table in the local player's user state (only the referee calls this). */
    write(table) {
      const value = { e: this.referee.epoch, m: table };
      const text = asciiJson(value);
      if (text === this.lastText && this.presence.extra(this.presence.localSid, this.name) !== void 0) return;
      this.lastText = text;
      this.presence.setExtra(this.name, value);
      this.last = { e: value.e, m: JSON.parse(JSON.stringify(table)) };
    }
    parse(raw, epoch) {
      if (!isRecord(raw) || raw.e !== epoch || !isRecord(raw.m)) return null;
      const out = {};
      for (const key of Object.keys(raw.m)) {
        const entry = this.parseEntry(raw.m[key]);
        if (entry !== null) out[key] = entry;
      }
      return out;
    }
  };

  // portkit/src/commands.ts
  var MAX_COMMAND_BYTES = 2048;
  var MAX_BATCH = 8;
  var MAX_BATCH_BYTES = 4096;
  var Commands = class {
    constructor(core, presence, referee, routes) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "routes");
      __publicField(this, "queue", []);
      __publicField(this, "nextNumber", 0);
      __publicField(this, "acks");
      /** False until behaviours have started: the referee runs nothing before then. */
      __publicField(this, "started", false);
      __publicField(this, "run", 0);
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.routes = routes;
      this.acks = new RefereeTable(presence, referee, "ak", (v) => typeof v === "number" ? v : null);
    }
    listen() {
      this.presence.onExtra(() => this.review());
      this.presence.on(() => this.review());
      this.referee.on(() => this.review());
    }
    send(behaviour, name, args) {
      const address = this.routes.address(behaviour);
      if (!address) return 0;
      if (!callable(behaviour, name)) {
        this.core.log("warn", `SendCommand: ${address.id} has no network-callable method '${name}' (list it in its class's static networkCallable)`);
        return 0;
      }
      if (this.nextNumber === 0) this.nextNumber = (this.table()[this.core.me.sid] ?? 0) + 1;
      const n = this.nextNumber++;
      const record = [n, address.id, address.playerSid ?? "", name, args.map(encodeValue)];
      if (utf8Length(asciiJson(record)) > MAX_COMMAND_BYTES) {
        this.routes.refused(behaviour, "value_too_large", name);
        return 0;
      }
      this.queue.push({ n, behaviour, record });
      this.review();
      return n;
    }
    /** Publishes, runs and acknowledges whatever is due. Also called about once a second. */
    review() {
      if (this.core.disposed || !this.started) return;
      const me = this.core.me.sid;
      const acked = this.table()[me] ?? 0;
      while (this.queue.length && this.queue[0].n <= acked) {
        const done = this.queue.shift();
        this.core.guard("OnCommandAcknowledged", () => this.routes.acknowledged(done.behaviour, done.n));
      }
      const published = this.presence.extra(me, "q");
      if (this.queue.length) {
        const batch = [];
        let bytes = 2;
        for (const pending of this.queue) {
          const size = utf8Length(asciiJson(pending.record)) + 1;
          if (batch.length >= MAX_BATCH || batch.length && bytes + size > MAX_BATCH_BYTES) break;
          batch.push(pending.record);
          bytes += size;
        }
        const first = Array.isArray(published) && Array.isArray(published[0]) ? published[0][0] : null;
        const last = Array.isArray(published) && Array.isArray(published[published.length - 1]) ? published[published.length - 1][0] : null;
        if (first !== batch[0][0] || last !== batch[batch.length - 1][0]) this.presence.setExtra("q", batch);
      } else if (published !== void 0) this.presence.setExtra("q", void 0);
      if (this.referee.isMe()) this.officiate();
    }
    officiate() {
      const table = this.acks.working();
      let changed = false;
      for (const sid of Object.keys(table)) {
        if (!this.presence.has(sid)) {
          delete table[sid];
          changed = true;
        }
      }
      for (const who of this.presence.list()) {
        const batch = this.presence.extra(who.sid, "q");
        if (!Array.isArray(batch)) continue;
        for (const q of batch.slice(0, MAX_BATCH)) {
          if (!Array.isArray(q) || typeof q[0] !== "number" || typeof q[1] !== "string" || typeof q[3] !== "string") break;
          const acked = table[who.sid] ?? 0;
          if (q[0] <= acked) continue;
          if (acked > 0 && q[0] !== acked + 1) break;
          table[who.sid] = q[0];
          changed = true;
          const behaviour = this.routes.resolve(q[1], typeof q[2] === "string" && q[2] ? q[2] : null);
          const args = Array.isArray(q[4]) ? q[4].map(decodeValue) : [];
          this.run++;
          if (behaviour) this.routes.invoke(behaviour, q[3], args, who.sid);
        }
      }
      if (changed) this.acks.write(table);
    }
    table() {
      return this.acks.read();
    }
  };

  // portkit/src/core.ts
  var DEFAULT_OPTIONS = {
    settleMs: 1e3,
    claimStepMs: 400,
    claimRetryMs: 3e3,
    snapshotTimeoutMs: 8e3,
    clockTimeoutMs: 2e3,
    clockResyncMs: 6e4,
    admitWarnMs: 15e3,
    ownerClaimTimeoutMs: 5e3,
    continuousIntervalMs: 200,
    eventHoldMs: 2e3,
    whenEmpty: "reset"
  };
  var Core = class {
    constructor(platform, slug, inst, options, scheduler) {
      __publicField(this, "platform");
      __publicField(this, "slug");
      __publicField(this, "inst");
      /** `pk1.<slug>.<inst>` */
      __publicField(this, "prefix");
      __publicField(this, "options");
      __publicField(this, "scheduler");
      /** The local player as the platform reported them when the instance started. */
      __publicField(this, "me");
      __publicField(this, "disposed", false);
      __publicField(this, "unsubs", []);
      __publicField(this, "stateHandlers", []);
      this.platform = platform;
      this.slug = slug;
      this.inst = inst;
      this.prefix = statePrefix(slug, inst);
      this.options = options;
      this.scheduler = scheduler;
      this.me = platform.local();
    }
    /** Starts listening to the room's state under this instance's prefix. */
    listen() {
      const dot = this.prefix + ".";
      this.own(
        this.platform.onState(dot, (path, value) => {
          if (this.disposed) return;
          const key = path.slice(dot.length);
          for (const handler of this.stateHandlers.slice()) {
            try {
              handler(key, value);
            } catch (error) {
              this.error("state handler", error);
            }
          }
        })
      );
    }
    /** Reads a leaf of this instance from the mirror. `key` is relative to the prefix. */
    get(key) {
      return this.platform.stateGet(this.prefix + "." + key);
    }
    set(key, value) {
      if (this.disposed) return;
      this.platform.stateSet(this.prefix + "." + key, value);
    }
    entries() {
      const dot = this.prefix + ".";
      return this.platform.stateEntries(dot).map(([path, value]) => [path.slice(dot.length), value]);
    }
    onState(handler) {
      this.stateHandlers.push(handler);
    }
    /** Keeps an unsubscribe to run when the instance is disposed. */
    own(unsub) {
      if (this.disposed) unsub();
      else this.unsubs.push(unsub);
    }
    log(level, message) {
      this.platform.log(level, `[${this.slug}:${this.inst}] ${message}`);
    }
    error(where, error) {
      const text = error instanceof Error ? error.stack ?? error.message : String(error);
      this.log("error", `${where}: ${text}`);
    }
    /** Runs game code so that one behaviour's exception cannot stop the others. */
    guard(where, fn) {
      try {
        fn();
      } catch (error) {
        this.error(where, error);
      }
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.scheduler.stop();
      for (const unsub of this.unsubs.splice(0)) {
        try {
          unsub();
        } catch {
        }
      }
      this.stateHandlers.length = 0;
    }
  };

  // portkit/src/host.ts
  function encodeRelayArg(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c === 37 || c === 124 || c === 94 || c === 34 || c === 92 || c < 32) {
        out += "%" + c.toString(16).toUpperCase().padStart(2, "0");
      } else if (c >= 55296 && c <= 57343) {
        const pairStart = c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320;
        if (pairStart) {
          out += text[i] + text[i + 1];
          i++;
        } else out += "\uFFFD";
      } else out += text[i];
    }
    return out;
  }
  function decodeRelayArg(text) {
    return text.replace(/%([0-9A-F]{2})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  function relayNumber(value) {
    if (!Number.isFinite(value)) return "0";
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  }
  function relayRecord(op, target, args) {
    let record = op + "|" + (typeof target === "number" ? String(target) : encodeRelayArg(target));
    for (const arg of args) record += "|" + encodeRelayArg(arg);
    return record;
  }
  function relayPayload(slug, inst, records) {
    return relayKey(slug, inst) + "|" + records.join("^");
  }
  function parseEventArgs(text) {
    return text === "" ? [] : text.split("|").map(decodeRelayArg);
  }
  function materialProperty(property, slot = 0) {
    return slot > 0 ? `#${Math.floor(slot)}:${property}` : property;
  }
  var MAX_PAYLOAD = 12e3;
  var RelayHost = class {
    constructor(platform, slug, inst, refs) {
      __publicField(this, "platform");
      __publicField(this, "slug");
      __publicField(this, "inst");
      __publicField(this, "refs");
      __publicField(this, "warned", /* @__PURE__ */ new Set());
      __publicField(this, "waiting", /* @__PURE__ */ new Map());
      /** What was last sent (or queued) per target and property: an unchanged value is not sent again. */
      __publicField(this, "last", /* @__PURE__ */ new Map());
      __publicField(this, "queue", []);
      __publicField(this, "nextRequest", 1);
      /** Payloads and records handed to the bridge, for tests and diagnostics. */
      __publicField(this, "payloadsSent", 0);
      __publicField(this, "recordsSent", 0);
      /** Used instead of the relay for an object that is not in refs but that the page can reach. */
      __publicField(this, "fallbackActive", () => false);
      /** Plays a clip of the object's own list through the page when the page can reach the object. */
      __publicField(this, "fallbackClip", () => false);
      this.platform = platform;
      this.slug = slug;
      this.inst = inst;
      this.refs = refs;
    }
    /** Called with the graph's reply to a clock op. */
    onClockReply(requestId, seconds) {
      const resolve = this.waiting.get(requestId);
      if (!resolve) return;
      this.waiting.delete(requestId);
      resolve(seconds);
    }
    setText(target, text) {
      this.value("text", target, "text", [text]);
    }
    animBool(target, name, value) {
      this.value("animBool", target, "anim." + name, [name, value ? "1" : "0"]);
    }
    animFloat(target, name, value) {
      this.value("animFloat", target, "anim." + name, [name, relayNumber(value)]);
    }
    animInt(target, name, value) {
      this.value("animInt", target, "anim." + name, [name, String(Math.trunc(value))]);
    }
    animResetTrigger(target, name) {
      this.event("animResetTrigger", target, [name]);
    }
    animPlay(target, state, crossFadeSeconds = 0) {
      this.event("animPlay", target, [state, relayNumber(crossFadeSeconds)]);
    }
    animTrigger(target, name) {
      this.event("animTrigger", target, [name, "1"]);
    }
    particles(target, play) {
      this.event("particles", target, [play ? "play" : "stop"]);
    }
    setColor(target, property, color, slot = 0) {
      const name = materialProperty(property, slot);
      this.value("color", target, "color." + name, [name, relayNumber(color.r), relayNumber(color.g), relayNumber(color.b), relayNumber(color.a)]);
    }
    matFloat(target, property, value, slot = 0) {
      const name = materialProperty(property, slot);
      this.value("matFloat", target, "mat." + name, [name, relayNumber(value)]);
    }
    uiColor(target, color) {
      this.value("uiColor", target, "uiColor", [relayNumber(color.r), relayNumber(color.g), relayNumber(color.b), relayNumber(color.a)]);
    }
    setActive(target, active) {
      if (!target.startsWith("@") && this.refs.indexOf(target) < 0 && this.fallbackActive(target, active)) return;
      this.value("active", target, "active", [active ? "1" : "0"]);
    }
    playClip(target, clipIndex, clipsOn, volumeScale) {
      const own = clipsOn === void 0 || clipsOn === target;
      const scaled = volumeScale !== void 0 && volumeScale !== 1;
      if (own && !scaled && !target.startsWith("@") && this.refs.indexOf(target) < 0 && this.fallbackClip(target, clipIndex)) return;
      const holder = this.resolve("audio", own ? target : clipsOn);
      if (holder === null) return;
      if (typeof holder !== "number") {
        this.warnOnce(`audio:${holder}`, `the clips of ${holder} cannot be played: the audio op needs the holder in bindings.refs`);
        return;
      }
      if (scaled) this.event("audioScaled", target, [String(Math.trunc(clipIndex)), String(holder), relayNumber(volumeScale)]);
      else this.event("audio", target, [String(Math.trunc(clipIndex)), String(holder)]);
    }
    audioPitch(target, pitch) {
      this.value("audioPitch", target, "audioPitch", [relayNumber(pitch)]);
    }
    audioVolume(target, volume) {
      this.value("audioVolume", target, "audioVolume", [relayNumber(volume)]);
    }
    animEnabled(target, enabled) {
      this.value("animEnabled", target, "animEnabled", [enabled ? "1" : "0"]);
    }
    uiSetToggle(target, on) {
      this.value("uiSetToggle", target, "uiSetToggle", [on ? "1" : "0"]);
    }
    uiSetSlider(target, value) {
      this.value("uiSetSlider", target, "uiSetSlider", [relayNumber(value)]);
    }
    scale(target, localScale) {
      this.value("scale", target, "scale", [relayNumber(localScale.x), relayNumber(localScale.y), relayNumber(localScale.z)]);
    }
    rbVelocity(target, velocity) {
      this.event("rbVelocity", target, [relayNumber(velocity.x), relayNumber(velocity.y), relayNumber(velocity.z)]);
    }
    rbKinematic(target, kinematic) {
      this.value("rbKinematic", target, "rbKinematic", [kinematic ? "1" : "0"]);
    }
    spawn(target, name) {
      this.event("spawn", target, [name]);
    }
    despawn(target) {
      this.event("despawn", target, []);
      if (target.startsWith("@")) {
        for (const key of [...this.last.keys()]) if (key.startsWith(target + "/")) this.last.delete(key);
      }
    }
    op(name, target, args, property) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || name === "clock") throw new Error(`'${name}' is not a relay op name (letters, digits, _; not clock)`);
      const text = args.map((a) => typeof a === "number" ? relayNumber(a) : typeof a === "boolean" ? a ? "1" : "0" : String(a));
      if (property !== void 0) this.value(name, target, `op.${name}.${property}`, text);
      else this.event(name, target, text);
    }
    /** The clock is not batched: its answer is timed from the moment it is sent. */
    requestClock() {
      const id = String(this.nextRequest++);
      return new Promise((resolve) => {
        this.waiting.set(id, resolve);
        this.platform.relaySend(relayPayload(this.slug, this.inst, [relayRecord("clock", 0, [id])]));
      });
    }
    /** Forgets clock requests nobody answered. */
    abandonClock() {
      this.waiting.clear();
    }
    /** Forgets what was sent, so that every value goes out again (after the kit was loaded anew). */
    forget() {
      this.last.clear();
    }
    flush() {
      if (!this.queue.length) return;
      const queue = this.queue;
      this.queue = [];
      const prefix = relayKey(this.slug, this.inst).length + 1;
      let batch = [];
      let size = prefix;
      const send = () => {
        if (!batch.length) return;
        this.payloadsSent++;
        this.recordsSent += batch.length;
        this.platform.relaySend(relayPayload(this.slug, this.inst, batch));
        batch = [];
        size = prefix;
      };
      for (const item of queue) {
        if (batch.length && size + item.record.length + 1 > MAX_PAYLOAD) send();
        batch.push(item.record);
        size += item.record.length + 1;
      }
      send();
    }
    warnOnce(key, message) {
      if (this.warned.has(key)) return;
      this.warned.add(key);
      this.platform.log("warn", `[${this.slug}:${this.inst}] ${message}`);
    }
    /** The wire form of a target: a Refs index, "@<path>", or null when the relay cannot reach the object. */
    resolve(op, target) {
      if (target.startsWith("@")) return target;
      const index = this.refs.indexOf(target);
      if (index >= 0) return index;
      if (!this.warned.has(target)) {
        this.warned.add(target);
        this.platform.log("warn", `[${this.slug}:${this.inst}] '${target}' is not in bindings.refs, so the relay graph cannot reach it (${op} ignored)`);
      }
      return null;
    }
    /** Queues a value. Sending the same value again does nothing; a newer one in the same tick replaces it. */
    value(op, target, property, args) {
      const wire = this.resolve(op, target);
      if (wire === null) return;
      const record = relayRecord(op, wire, args);
      const slot = `${wire}/${property}`;
      if (this.last.get(slot) === record) return;
      this.last.set(slot, record);
      const pending = this.queue.find((q) => q.slot === slot);
      if (pending) pending.record = record;
      else this.queue.push({ slot, record });
    }
    event(op, target, args) {
      const wire = this.resolve(op, target);
      if (wire === null) return;
      this.queue.push({ slot: null, record: relayRecord(op, wire, args) });
    }
  };
  var ClockSync = class {
    constructor(clock) {
      __publicField(this, "clock");
      __publicField(this, "offsetSeconds");
      __publicField(this, "synced", false);
      this.clock = clock;
      this.offsetSeconds = clock.wallSeconds() - clock.now() / 1e3;
    }
    /** `sentAt` and the present bracket the host's reading; it is placed halfway between them. */
    accept(hostSeconds, sentAtMs) {
      if (!Number.isFinite(hostSeconds)) return;
      const mid = (sentAtMs + this.clock.now()) / 2;
      this.offsetSeconds = hostSeconds - mid / 1e3;
      this.synced = true;
    }
    seconds() {
      return this.clock.now() / 1e3 + this.offsetSeconds;
    }
  };

  // portkit/src/scene.ts
  var Transform = class {
    constructor(gameObject) {
      __publicField(this, "gameObject");
      __publicField(this, "pos", Vector3.zero);
      __publicField(this, "rot", Quaternion.identity);
      __publicField(this, "lpos", Vector3.zero);
      __publicField(this, "lrot", Quaternion.identity);
      __publicField(this, "lscale", Vector3.one);
      /** False until the world pose has been read from the host or set by the script. */
      __publicField(this, "known", false);
      this.gameObject = gameObject;
    }
    /** World position as last set or reported. Returns a copy, as a C# struct would be. */
    get position() {
      return this.pos.clone();
    }
    set position(v) {
      this.pos = v.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ position: v.clone() });
    }
    get rotation() {
      return this.rot.clone();
    }
    set rotation(q) {
      this.rot = q.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ rotation: q.clone() });
    }
    get eulerAngles() {
      return this.rot.eulerAngles;
    }
    set eulerAngles(v) {
      this.rotation = Quaternion.Euler(v.x, v.y, v.z);
    }
    /** Local values are only what the script itself set: the host is not asked for them. */
    get localPosition() {
      return this.lpos.clone();
    }
    set localPosition(v) {
      this.lpos = v.clone();
      this.gameObject.host?.setTransform({ localPosition: v.clone() });
    }
    get localRotation() {
      return this.lrot.clone();
    }
    set localRotation(q) {
      this.lrot = q.clone();
      this.gameObject.host?.setTransform({ localRotation: q.clone() });
    }
    get localScale() {
      return this.lscale.clone();
    }
    set localScale(v) {
      this.lscale = v.clone();
      this.gameObject.host?.setTransform({ localScale: v.clone() });
    }
    get forward() {
      return this.rot.rotate(Vector3.forward);
    }
    get up() {
      return this.rot.rotate(Vector3.up);
    }
    get right() {
      return this.rot.rotate(Vector3.right);
    }
    SetPositionAndRotation(position, rotation) {
      this.pos = position.clone();
      this.rot = rotation.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ position: position.clone(), rotation: rotation.clone() });
    }
    /** Asks the host where the object is now (after a drop, or physics). Await it before reading `position`. */
    async Refresh() {
      const pose2 = await this.gameObject.host?.readTransform();
      if (pose2) this._report(pose2.position, pose2.rotation);
    }
    /** @internal The host reported the object's pose. */
    _report(position, rotation) {
      this.pos = position.clone();
      this.rot = rotation.clone();
      this.known = true;
    }
  };
  var GameObject = class {
    constructor(key, name, host, actions, subscribe2 = null) {
      /** The key in bindings.objects, or "" for an object that only exists in the script. */
      __publicField(this, "key");
      __publicField(this, "name");
      __publicField(this, "transform");
      /** @internal */
      __publicField(this, "host");
      __publicField(this, "actions");
      __publicField(this, "subscribe");
      __publicField(this, "active", true);
      __publicField(this, "layerValue", -1);
      this.key = key;
      this.name = name;
      this.host = host;
      this.actions = actions;
      this.subscribe = subscribe2;
      this.transform = new Transform(this);
    }
    /** As last set by the script (objects start active unless the script says otherwise). */
    get activeSelf() {
      return this.active;
    }
    SetActive(active) {
      this.active = !!active;
      if (this.actions && this.key) this.actions.setActive(this.key, this.active);
      else this.host?.setActive(this.active);
    }
    /**
     * The object's layer as last set by the script (-1 before that: the kit's own). Setting it moves the object's
     * collider: 20 (Grabbable) for a pickup that may be picked up, 5 (UI) for one that may not, which is then
     * clickable and lets hands pass through. Only what changes is sent.
     */
    get layer() {
      return this.layerValue;
    }
    set layer(value) {
      const layer = Math.trunc(value);
      if (layer === this.layerValue) return;
      this.layerValue = layer;
      this.host?.setLayer(layer);
    }
    /**
     * Listens to this object's events: the page's own (click, grab, drop, ...) and those a graph reports for it
     * (uiButton, uiSlider, heldTrigger, ...). Prefer `events` in bindings.json; this is for wiring made in code.
     * The listener lives as long as the instance.
     */
    On(kind, handler) {
      if (this.subscribe) this.subscribe(kind, handler);
      else this.host?.on(kind, handler);
    }
    /**
     * Attaches this object to the local player's hand (0 left, 1 right), at an offset from it (BS.AttachedObject;
     * UNVERIFIED in Play mode). Only the local player can be attached to; other players see it only through a synced
     * transform.
     */
    AttachToHand(side, position = new Vector3(), rotation = new Quaternion()) {
      this.host?.attachToHand(side, position, rotation);
    }
    /** Lets go of what AttachToHand attached. */
    Detach() {
      this.host?.detach();
    }
    /** Makes the local player let go of this object if they hold it (VRChat: VRCPickup.Drop()); `drop` follows. */
    ReleaseGrab() {
      this.host?.releaseGrab();
    }
    /** Asks to own the object's synced transform (VRChat: Networking.SetOwner on a VRCObjectSync). */
    TakeOwnership() {
      this.host?.takeOwnership();
    }
    toString() {
      return this.name || this.key;
    }
  };
  var ComponentRef = class {
    constructor(kind, gameObject, actions) {
      __publicField(this, "kind");
      __publicField(this, "gameObject");
      __publicField(this, "actions");
      this.kind = kind;
      this.gameObject = gameObject;
      this.actions = actions;
    }
    get transform() {
      return this.gameObject.transform;
    }
  };
  var TextRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "value", "");
    }
    get text() {
      return this.value;
    }
    set text(value) {
      const next = value === null || value === void 0 ? "" : String(value);
      if (next === this.value) return;
      this.value = next;
      this.actions.setText(this.gameObject.key, next);
    }
    /** The colour of the text (a uGUI graphic). */
    set color(value) {
      this.actions.uiColor(this.gameObject.key, value);
    }
  };
  var AnimatorRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "on", true);
    }
    /** Animator.enabled: a disabled animator holds its pose. Reading gives what the script last set. */
    get enabled() {
      return this.on;
    }
    set enabled(value) {
      this.on = !!value;
      this.actions.animEnabled(this.gameObject.key, this.on);
    }
    SetBool(name, value) {
      this.actions.animBool(this.gameObject.key, name, value);
    }
    SetFloat(name, value) {
      this.actions.animFloat(this.gameObject.key, name, value);
    }
    SetInteger(name, value) {
      this.actions.animInt(this.gameObject.key, name, value);
    }
    SetTrigger(name) {
      this.actions.animTrigger(this.gameObject.key, name);
    }
    ResetTrigger(name) {
      this.actions.animResetTrigger(this.gameObject.key, name);
    }
    Play(state) {
      this.actions.animPlay(this.gameObject.key, state, 0);
    }
    CrossFade(state, seconds) {
      this.actions.animPlay(this.gameObject.key, state, seconds);
    }
  };
  var ParticleSystemRef = class extends ComponentRef {
    Play() {
      this.actions.particles(this.gameObject.key, true);
    }
    Stop() {
      this.actions.particles(this.gameObject.key, false);
    }
  };
  var RendererRef = class extends ComponentRef {
    /** Sets a colour property of one of the renderer's materials, "_BaseColor" of slot 0 by default (URP). */
    SetColor(color, property = "_BaseColor", slot = 0) {
      this.actions.setColor(this.gameObject.key, property, color, slot);
    }
    /** Sets a float property of one of the renderer's materials. */
    SetFloat(property, value, slot = 0) {
      this.actions.matFloat(this.gameObject.key, property, value, slot);
    }
  };
  var AudioSourceRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "pitchValue", 1);
      __publicField(this, "volumeValue", 1);
      /** The clip `Play()` plays (UnityEngine.AudioSource.clip). */
      __publicField(this, "clip", null);
    }
    /** Plays a clip (a `$clip` field value, or an index into this object's own clip list) through this audio source. */
    PlayOneShot(clip, volumeScale) {
      if (typeof clip === "number") this.actions.playClip(this.gameObject.key, clip, void 0, volumeScale);
      else this.actions.playClip(this.gameObject.key, clip.index, clip.on ?? void 0, volumeScale);
    }
    /** Plays `clip` as a one-shot (it overlaps a sound still playing instead of cutting it off). */
    Play() {
      if (this.clip) this.PlayOneShot(this.clip);
    }
    /** AudioSource.pitch (relay op `audioPitch`). Reading gives what the script last set. */
    get pitch() {
      return this.pitchValue;
    }
    set pitch(value) {
      this.pitchValue = value;
      this.actions.audioPitch(this.gameObject.key, value);
    }
    /** AudioSource.volume (relay op `audioVolume`). */
    get volume() {
      return this.volumeValue;
    }
    set volume(value) {
      this.volumeValue = value;
      this.actions.audioVolume(this.gameObject.key, value);
    }
  };
  var AudioClipRef = class {
    constructor(index, on = null) {
      __publicField(this, "index");
      __publicField(this, "on");
      this.index = index;
      this.on = on;
    }
  };
  function makeComponent(kind, gameObject, actions) {
    switch (kind) {
      case "Text":
      case "TMP":
        return new TextRef(kind, gameObject, actions);
      case "Animator":
        return new AnimatorRef(kind, gameObject, actions);
      case "ParticleSystem":
        return new ParticleSystemRef(kind, gameObject, actions);
      case "Renderer":
        return new RendererRef(kind, gameObject, actions);
      case "AudioSource":
        return new AudioSourceRef(kind, gameObject, actions);
      case "Transform":
        return gameObject.transform;
      default:
        return new ComponentRef(kind, gameObject, actions);
    }
  }

  // portkit/src/networking.ts
  var Networking = class {
    /** @internal */
    constructor(host) {
      __publicField(this, "host");
      this.host = host;
    }
    get LocalPlayer() {
      return this.host.localPlayer();
    }
    /** True on the one client that is this instance's referee (VRChat: the master). */
    get IsReferee() {
      return this.host.isReferee();
    }
    /** The same as IsReferee, under the name upstream code uses. */
    get IsMaster() {
      return this.host.isReferee();
    }
    /** The referee, or null while there is none. */
    get Master() {
      return this.host.refereePlayer();
    }
    /**
     * IsOwner(target): does the local player own it?  IsOwner(player, target): does that player?
     * A GameObject stands for the behaviours on it, as in Udon, where ownership belongs to the object.
     */
    IsOwner(a, b) {
      const player = b === void 0 ? this.host.localPlayer() : a;
      const target = b === void 0 ? a : b;
      const behaviour = this.first(target);
      return behaviour ? this.host.isOwner(behaviour, player) : false;
    }
    GetOwner(target) {
      const behaviour = this.first(target);
      return behaviour ? this.host.owner(behaviour) : null;
    }
    /**
     * Makes `player` the owner. It takes effect here at once; if someone else claimed at the same moment and the
     * room kept their claim, OnOwnershipTransferred reports the real owner a moment later.
     */
    SetOwner(player, target) {
      for (const behaviour of this.all(target)) this.host.setOwner(behaviour, player);
    }
    /** Synced time in seconds: the same on every client, to within the accuracy of the first clock exchange. */
    GetServerTimeInSeconds() {
      return this.host.serverSeconds();
    }
    GetServerTimeInMilliseconds() {
      return Math.floor(this.host.serverSeconds() * 1e3);
    }
    /** Everyone taking part in this instance, in player-id order (VRChat: VRCPlayerApi.GetPlayers). */
    GetPlayers() {
      return this.host.playerList();
    }
    GetPlayerCount() {
      return this.host.playerList().length;
    }
    GetPlayerById(id) {
      return this.host.playerById(id);
    }
    /**
     * While a network event or a command runs: the player who sent it (the local player for one sent here).
     * Null outside one, and null for a sender who is not taking part in this instance.
     */
    get CallingPlayer() {
      return this.host.callingPlayer();
    }
    /** The sender's session and user id, as the room stamped them, even when they are not a participant. */
    get CallingSession() {
      return this.host.callingSession();
    }
    /**
     * In a game whose referee candidates are "declared": offers the local player as referee, or withdraws them.
     * A referee who withdraws stops being referee and the remaining candidates elect another.
     */
    SetRefereeCandidate(on) {
      this.host.setCandidate(on);
    }
    IsRefereeCandidate(player) {
      return this.host.isCandidate(player);
    }
    /** Whether this client started a new game, resumed a saved one, or joined one in progress. */
    get StartKind() {
      return this.host.startKind();
    }
    /** Always false: the app queues and retries writes itself. Kept so that upstream checks translate. */
    get IsClogged() {
      return false;
    }
    all(target) {
      return target instanceof GameObject ? this.host.behavioursOn(target) : [target];
    }
    first(target) {
      return this.all(target)[0] ?? null;
    }
  };

  // portkit/src/persistence.ts
  var Persistence = class {
    constructor(store, slug, inst, uid) {
      __publicField(this, "store");
      __publicField(this, "prefix");
      this.store = store;
      this.prefix = storagePrefix(slug, inst, uid);
    }
    /** The saved value, or `fallback` when there is none or it cannot be read. */
    get(key, fallback) {
      let text = null;
      try {
        text = this.store.get(this.prefix + key);
      } catch {
        return fallback;
      }
      if (text === null) return fallback;
      try {
        return decodeValue(JSON.parse(text));
      } catch {
        return fallback;
      }
    }
    /** False when the device refused to store it (storage full or switched off). */
    set(key, value) {
      try {
        this.store.set(this.prefix + key, JSON.stringify(encodeValue(value)));
        return true;
      } catch {
        return false;
      }
    }
    has(key) {
      try {
        return this.store.get(this.prefix + key) !== null;
      } catch {
        return false;
      }
    }
    remove(key) {
      try {
        this.store.remove(this.prefix + key);
      } catch {
      }
    }
    keys() {
      try {
        return this.store.keys(this.prefix).map((k) => k.slice(this.prefix.length));
      } catch {
        return [];
      }
    }
  };

  // portkit/src/players.ts
  var ID_SETTLE_MS = 600;
  var Player = class {
    constructor(sid, uid, name, isLocal, playerId) {
      __publicField(this, "sid");
      __publicField(this, "uid");
      __publicField(this, "isLocal");
      __publicField(this, "displayName");
      __publicField(this, "playerId");
      /** The space's owner or a moderator, as the platform reports it. Not proof: check what the room accepted. */
      __publicField(this, "isSpaceAdmin", false);
      /** @internal */
      __publicField(this, "_valid", true);
      /** @internal */
      __publicField(this, "_isMaster", () => false);
      this.sid = sid;
      this.uid = uid;
      this.displayName = name;
      this.isLocal = isLocal;
      this.playerId = playerId;
    }
    /** False once the player has left: keep no references across OnPlayerLeft. */
    IsValid() {
      return this._valid;
    }
    get isMaster() {
      return this._valid && this._isMaster();
    }
    toString() {
      return `${this.displayName}#${this.playerId}`;
    }
  };
  var Players = class {
    constructor(core, presence, referee) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "bySidMap", /* @__PURE__ */ new Map());
      __publicField(this, "claims", /* @__PURE__ */ new Map());
      __publicField(this, "handlers", []);
      __publicField(this, "localAssigned", deferred());
      __publicField(this, "highWater", 0);
      __publicField(this, "myId", 0);
      __publicField(this, "recheck", 0);
      this.core = core;
      this.presence = presence;
      this.referee = referee;
    }
    /** Starts following ids and claims one for the local player (who must have announced already). */
    start() {
      this.presence.on(() => this.refresh());
      this.presence.onExtra(() => this.refresh());
      this.refresh();
      this.claim();
    }
    /** Resolves once the local player's id has stood for the settle time. */
    whenLocalAssigned() {
      return this.localAssigned.promise;
    }
    get local() {
      return this.bySidMap.get(this.core.me.sid) ?? null;
    }
    bySid(sid) {
      return this.bySidMap.get(sid) ?? null;
    }
    byId(id) {
      for (const player of this.bySidMap.values()) if (player.playerId === id) return player;
      return null;
    }
    /** Everyone taking part, in player-id order. */
    list() {
      return [...this.bySidMap.values()].sort((a, b) => a.playerId - b.playerId);
    }
    on(handler) {
      this.handlers.push(handler);
    }
    /** Upkeep no event triggers. Called about once a second. */
    tend() {
      this.refresh();
    }
    idOf(sid) {
      const id = this.presence.extra(sid, "id");
      return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
    }
    claim() {
      let top = this.highWater;
      for (const who of this.presence.list()) {
        const id = this.idOf(who.sid);
        const hw = this.presence.extra(who.sid, "hw");
        if (id !== null && id > top) top = id;
        if (typeof hw === "number" && hw > top) top = hw;
      }
      this.myId = top + 1;
      this.highWater = this.myId;
      this.presence.setExtra("id", this.myId);
      this.presence.setExtra("hw", this.highWater);
      this.presence.flush();
    }
    refresh() {
      if (this.core.disposed) return;
      const clock = this.core.platform.clock;
      const now = clock.now();
      const me = this.core.me.sid;
      const present = this.presence.list();
      const holders = /* @__PURE__ */ new Map();
      let top = this.highWater;
      for (const who of present) {
        const id = this.idOf(who.sid);
        const hw = this.presence.extra(who.sid, "hw");
        if (typeof hw === "number" && hw > top) top = hw;
        if (id === null) {
          this.claims.delete(who.sid);
          continue;
        }
        if (id > top) top = id;
        const claim = this.claims.get(who.sid);
        if (!claim || claim.id !== id) this.claims.set(who.sid, { id, since: now });
        if (!holders.has(id)) holders.set(id, who.sid);
      }
      for (const sid of [...this.claims.keys()]) if (!this.presence.has(sid)) this.claims.delete(sid);
      if (this.myId > 0 && holders.get(this.myId) !== void 0 && holders.get(this.myId) !== me) {
        this.highWater = top;
        this.claim();
        return;
      }
      if (top > this.highWater) {
        this.highWater = top;
        if (this.myId > 0) this.presence.setExtra("hw", top);
      }
      const leaving = [];
      const joining = [];
      let nextCheck = Infinity;
      for (const player of this.bySidMap.values()) if (!this.presence.has(player.sid)) leaving.push(player);
      for (const who of present) {
        const claim = this.claims.get(who.sid);
        if (!claim || holders.get(claim.id) !== who.sid) continue;
        const existing = this.bySidMap.get(who.sid);
        if (existing) {
          existing.displayName = who.name;
          if (existing.playerId !== claim.id) {
            this.core.log("warn", `player ${existing.displayName} changed id ${existing.playerId} -> ${claim.id} after joining (two ids were claimed at once)`);
            existing.playerId = claim.id;
          }
          continue;
        }
        const ready = claim.since + ID_SETTLE_MS;
        const echoed = who.sid !== me || this.localEchoed();
        if (now >= ready && echoed) joining.push(this.make(who, claim.id));
        else nextCheck = Math.min(nextCheck, Math.max(ready, now + 50));
      }
      for (const player of leaving) {
        this.bySidMap.delete(player.sid);
        player._valid = false;
      }
      for (const player of joining) this.bySidMap.set(player.sid, player);
      for (const player of leaving) this.emit("leave", player);
      for (const player of joining.sort((a, b) => a.playerId - b.playerId)) this.emit("join", player);
      if (this.bySidMap.has(me)) this.localAssigned.resolve();
      if (this.recheck) this.core.scheduler.cancel(this.recheck);
      this.recheck = 0;
      if (nextCheck !== Infinity) {
        this.recheck = this.core.scheduler.after(nextCheck - now, () => {
          this.recheck = 0;
          this.refresh();
        });
      }
    }
    localEchoed() {
      const marker = safeParse(this.core.platform.userGet(this.core.me.sid, this.core.prefix + ".k"));
      return isRecord(marker) && isRecord(marker.x) && marker.x.id === this.myId;
    }
    make(who, id) {
      const player = new Player(who.sid, who.uid, who.name, who.isLocal, id);
      player._isMaster = () => this.referee.current()?.sid === player.sid;
      player.isSpaceAdmin = this.core.platform.players().find((p) => p.sid === who.sid)?.isAdmin === true;
      return player;
    }
    emit(kind, player) {
      for (const handler of this.handlers.slice()) this.core.guard("player handler", () => handler(kind, player));
    }
  };

  // portkit/src/presence.ts
  var Presence = class {
    constructor(core) {
      __publicField(this, "core");
      __publicField(this, "known", /* @__PURE__ */ new Map());
      __publicField(this, "extras", /* @__PURE__ */ new Map());
      __publicField(this, "texts", /* @__PURE__ */ new Map());
      /** Every public key each session has announced, kept after it leaves (a sealed box can outlive its sender's visit). */
      __publicField(this, "keysSeen", /* @__PURE__ */ new Map());
      __publicField(this, "handlers", []);
      __publicField(this, "extraHandlers", []);
      __publicField(this, "announced", null);
      __publicField(this, "localExtras", {});
      __publicField(this, "dirty", false);
      __publicField(this, "started", false);
      this.core = core;
    }
    get markerPath() {
      return this.core.prefix + ".k";
    }
    start() {
      if (this.started) return;
      this.started = true;
      const { platform } = this.core;
      this.core.own(platform.onPlayers(() => this.recompute()));
      this.core.own(
        platform.onUser(this.core.prefix + ".", (_sid, path) => {
          if (path === this.markerPath) this.recompute();
        })
      );
      this.recompute();
    }
    /** Publishes the local marker. From here on the local player is a participant. */
    announce(publicKey) {
      this.announced = publicKey;
      this.write();
      this.recompute();
    }
    /** Withdraws the marker, when the instance stops while its player stays in the room. */
    retire() {
      if (this.announced === null) return;
      this.announced = null;
      this.core.platform.userSet(this.markerPath, null);
    }
    /** Sets or (with undefined) removes one of the local player's published records. Sent at the end of the tick. */
    setExtra(name, value) {
      if (value === void 0) {
        if (!(name in this.localExtras)) return;
        delete this.localExtras[name];
      } else this.localExtras[name] = value;
      this.dirty = true;
      this.emitExtra(this.core.me.sid);
    }
    /** The local player's session id. */
    get localSid() {
      return this.core.me.sid;
    }
    /** A published record of any participant, from the mirror (the local player's own is read back at once). */
    extra(sid, name) {
      if (sid === this.core.me.sid) return this.localExtras[name];
      return this.extras.get(sid)?.[name];
    }
    /** Called when a participant's published records may have changed. */
    onExtra(handler) {
      this.extraHandlers.push(handler);
    }
    /** Looks again at who is here: a session id can change without an event. Called about once a second. */
    tend() {
      if (this.started) this.recompute();
    }
    /** Sends the marker if a record changed. Called once per tick. */
    flush() {
      if (!this.dirty || this.announced === null || this.core.disposed) return;
      this.write();
    }
    write() {
      this.dirty = false;
      const marker = { k: this.announced, v: 1 };
      if (Object.keys(this.localExtras).length) marker.x = this.localExtras;
      this.core.platform.userSet(this.markerPath, asciiJson(marker));
    }
    /** Participants ordered by user id, then session id: the order referee ranks and player ids follow. */
    list() {
      return [...this.known.values()].sort(compare);
    }
    has(sid) {
      return this.known.has(sid);
    }
    get(sid) {
      return this.known.get(sid);
    }
    /** The public key a session announced, now or before it left; undefined for a session never seen. */
    keyOf(sid) {
      return this.known.get(sid)?.publicKey ?? this.keysSeen.get(sid);
    }
    /** Position of `sid` in `list()`, or -1. */
    rank(sid) {
      return this.list().findIndex((p) => p.sid === sid);
    }
    on(handler) {
      this.handlers.push(handler);
    }
    recompute() {
      if (this.core.disposed) return;
      const { platform } = this.core;
      const now = /* @__PURE__ */ new Map();
      const changed = [];
      for (const player of platform.players()) {
        let key = null;
        if (player.isLocal) key = this.announced;
        else {
          const text = platform.userGet(player.sid, this.markerPath) ?? "";
          if (text !== this.texts.get(player.sid)) {
            this.texts.set(player.sid, text);
            const marker2 = safeParse(text);
            this.extras.set(player.sid, isRecord(marker2) && isRecord(marker2.x) ? marker2.x : {});
            changed.push(player.sid);
          }
          const marker = safeParse(text);
          if (isRecord(marker) && typeof marker.k === "string" && marker.k.length > 0) key = marker.k;
        }
        if (key === null) continue;
        now.set(player.sid, { sid: player.sid, uid: player.uid, name: player.name, isLocal: player.isLocal, publicKey: key });
      }
      const left = [];
      const joined = [];
      for (const [sid, who] of this.known) if (!now.has(sid)) left.push(who);
      for (const [sid, who] of now) {
        const before = this.known.get(sid);
        if (!before) joined.push(who);
        else {
          before.name = who.name;
          before.publicKey = who.publicKey;
        }
      }
      for (const who of now.values()) this.keysSeen.set(who.sid, who.publicKey);
      for (const who of left) {
        this.known.delete(who.sid);
        this.extras.delete(who.sid);
        this.texts.delete(who.sid);
      }
      for (const who of joined) this.known.set(who.sid, who);
      for (const who of left.sort(compare)) this.emit("leave", who);
      for (const who of joined.sort(compare)) this.emit("join", who);
      for (const sid of changed) if (this.known.has(sid)) this.emitExtra(sid);
    }
    emit(kind, who) {
      for (const handler of this.handlers.slice()) this.core.guard("presence handler", () => handler(kind, who));
    }
    emitExtra(sid) {
      for (const handler of this.extraHandlers.slice()) this.core.guard("presence record handler", () => handler(sid));
    }
  };
  function compare(a, b) {
    return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : a.sid < b.sid ? -1 : a.sid > b.sid ? 1 : 0;
  }

  // portkit/src/protect.ts
  var ProtectedValues = class {
    constructor(core) {
      __publicField(this, "core");
      /** Told when a protected value changed. */
      __publicField(this, "onChanged", () => {
      });
      this.core = core;
    }
    listen() {
      this.core.onState((key) => {
        if (key.startsWith("x.")) this.core.guard("OnProtectedChanged", () => this.onChanged(key.slice(2)));
      });
    }
    get CanWrite() {
      return this.core.platform.local().isAdmin;
    }
    Set(key, value) {
      if (!isPathSegment(key)) throw new Error(`a protected key must be 1-64 of A-Z a-z 0-9 _ - @, not '${key}'`);
      if (this.core.disposed) return;
      this.core.platform.stateSetProtected(`${this.core.prefix}.x.${key}`, asciiJson({ v: encodeValue(value) }));
    }
    Get(key, fallback) {
      const raw = safeParse(this.core.get(`x.${key}`));
      return raw && typeof raw === "object" && "v" in raw ? decodeValue(raw.v) : fallback;
    }
    Has(key) {
      const raw = safeParse(this.core.get(`x.${key}`));
      return !!raw && typeof raw === "object" && "v" in raw;
    }
  };

  // portkit/src/referee.ts
  var CROSSING_MS = 1500;
  var Referee = class {
    constructor(core, presence, rule) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "rule");
      __publicField(this, "handlers", []);
      __publicField(this, "judging", false);
      __publicField(this, "timer", 0);
      __publicField(this, "timerDue", -1);
      __publicField(this, "invalidSince", 0);
      __publicField(this, "claimAt", -Infinity);
      __publicField(this, "seen", null);
      __publicField(this, "lastEpoch", 0);
      __publicField(this, "declared", false);
      /** Counters for tests and diagnostics. */
      __publicField(this, "claims", 0);
      /** What this client found when it last claimed: a new epoch, or a game other participants were still running. */
      __publicField(this, "lastClaim", null);
      this.core = core;
      this.presence = presence;
      this.rule = rule;
    }
    start() {
      this.core.onState((key) => {
        if (key === "ref") this.check();
      });
      this.presence.on(() => this.check());
      this.presence.onExtra(() => this.check());
      this.invalidSince = this.core.platform.clock.now();
      this.check();
      this.core.scheduler.after(this.core.options.settleMs, () => {
        this.judging = true;
        this.invalidSince = this.core.platform.clock.now();
        this.check();
      });
    }
    /** The mirrored record, whether or not its session is still a candidate. */
    mirrored() {
      const raw = safeParse(this.core.get("ref"));
      if (!isRecord(raw) || typeof raw.sid !== "string" || typeof raw.uid !== "string") return null;
      if (typeof raw.term !== "number" || typeof raw.e !== "number") return null;
      return { sid: raw.sid, uid: raw.uid, term: raw.term, e: raw.e };
    }
    /** The referee, or null while there is none. */
    current() {
      const m = this.mirrored();
      return m && this.isCandidate(m.sid) ? m : null;
    }
    isMe() {
      return this.current()?.sid === this.core.me.sid;
    }
    /** The epoch of the last valid referee seen: records of any other epoch are ignored. 0 before the first. */
    get epoch() {
      return this.lastEpoch;
    }
    /** May this session be elected? */
    isCandidate(sid) {
      if (!this.presence.has(sid)) return false;
      return this.rule === "anyone" || this.presence.extra(sid, "rc") === 1;
    }
    /** Candidates in rank order. */
    candidates() {
      return this.presence.list().filter((p) => this.isCandidate(p.sid)).map((p) => p.sid);
    }
    /** Under the "declared" rule: offers the local player as referee, or withdraws the offer. */
    setCandidate(on) {
      if (this.declared === on) return;
      this.declared = on;
      this.presence.setExtra("rc", on ? 1 : void 0);
      this.presence.flush();
    }
    /** Tells the others which epoch this client is running in, so a claimant knows the game is still alive. */
    publishEpoch() {
      if (this.presence.extra(this.core.me.sid, "ep") === this.lastEpoch) return;
      this.presence.setExtra("ep", this.lastEpoch);
      this.presence.flush();
    }
    on(handler) {
      this.handlers.push(handler);
    }
    check() {
      if (this.core.disposed) return;
      const now = this.current();
      const before = this.seen;
      if (now) {
        this.cancelTimer();
        if (!before || before.sid !== now.sid || before.term !== now.term || before.e !== now.e) {
          const me2 = this.core.me.sid;
          if (before && before.sid === me2 && now.sid !== me2 && this.isCandidate(me2) && this.core.platform.clock.now() - this.claimAt > CROSSING_MS) {
            this.core.log("warn", `the referee seat was taken by session ${now.sid} (term ${now.term}) while this client was referee`);
          }
          this.lastEpoch = now.e;
          this.seen = now;
          this.publishEpoch();
          this.emit(now, before);
        }
        return;
      }
      if (before) {
        this.seen = null;
        this.invalidSince = this.core.platform.clock.now();
        this.claimAt = -Infinity;
        this.emit(null, before);
      }
      if (!this.judging) return;
      const me = this.core.me.sid;
      const rank = this.candidates().indexOf(me);
      if (rank < 0) {
        this.cancelTimer();
        return;
      }
      const earliest = Math.max(this.invalidSince + rank * this.core.options.claimStepMs, this.claimAt + this.core.options.claimRetryMs);
      if (this.timer && this.timerDue === earliest) return;
      this.cancelTimer();
      this.timerDue = earliest;
      this.timer = this.core.scheduler.after(Math.max(0, earliest - this.core.platform.clock.now()), () => {
        this.timer = 0;
        this.claim();
      });
    }
    claim() {
      if (this.core.disposed || this.current()) return;
      const me = this.core.me;
      if (!this.isCandidate(me.sid)) return;
      const old = this.mirrored();
      const alive = old !== null && this.presence.list().some((p) => this.presence.extra(p.sid, "ep") === old.e);
      const fresh = old === null || this.core.options.whenEmpty === "reset" && !alive;
      const record = { sid: me.sid, uid: me.uid, term: (old?.term ?? 0) + 1, e: (old?.e ?? 0) + (fresh ? 1 : 0) };
      this.claims++;
      this.lastClaim = { term: record.term, fresh, alive };
      this.claimAt = this.core.platform.clock.now();
      this.core.log("info", `claiming referee, term ${record.term}, epoch ${record.e}${fresh && old ? " (fresh start)" : ""}`);
      this.core.set("ref", asciiJson(record));
      this.check();
    }
    cancelTimer() {
      if (this.timer) this.core.scheduler.cancel(this.timer);
      this.timer = 0;
      this.timerDue = -1;
    }
    emit(now, before) {
      for (const handler of this.handlers.slice()) this.core.guard("referee handler", () => handler(now, before));
    }
  };

  // portkit/src/scheduler.ts
  var TICK_MS = 50;
  var TICK_SECONDS = TICK_MS / 1e3;
  var Scheduler = class {
    constructor(clock, onError) {
      __publicField(this, "clock");
      __publicField(this, "onError");
      __publicField(this, "delayed", /* @__PURE__ */ new Map());
      __publicField(this, "framed", []);
      __publicField(this, "nextHandle", 1);
      __publicField(this, "tickTimer", 0);
      __publicField(this, "running", false);
      __publicField(this, "stopped", false);
      __publicField(this, "startedAt", 0);
      __publicField(this, "lastTickAt", 0);
      __publicField(this, "tickCount", 0);
      /** Seconds the last tick covered (0 outside a tick's first run). */
      __publicField(this, "deltaTime", 0);
      this.clock = clock;
      this.onError = onError;
      this.startedAt = clock.now();
      this.lastTickAt = this.startedAt;
    }
    /** Seconds since the scheduler was made. */
    get time() {
      return (this.clock.now() - this.startedAt) / 1e3;
    }
    get ticks() {
      return this.tickCount;
    }
    /** Starts the tick. `onTick` runs every 50 ms; a page that stalled is not paid back with a burst of ticks. */
    start(onTick) {
      if (this.running || this.stopped) return;
      this.running = true;
      this.lastTickAt = this.clock.now();
      const step = () => {
        if (!this.running) return;
        const now = this.clock.now();
        const elapsed = now - this.lastTickAt;
        this.lastTickAt = now;
        this.tickCount++;
        this.deltaTime = Math.min(0.25, Math.max(1e-3, elapsed / 1e3));
        const due = this.framed.filter((f5) => --f5.ticks <= 0);
        if (due.length) this.framed = this.framed.filter((f5) => f5.ticks > 0);
        for (const f5 of due) this.guard("delayed frames", f5.fn);
        this.guard("tick", () => onTick(this.deltaTime));
        if (this.running) this.tickTimer = this.clock.setTimeout(step, TICK_MS);
      };
      this.tickTimer = this.clock.setTimeout(step, TICK_MS);
    }
    /** Runs `fn` once after `ms`. Returns a handle for `cancel`. */
    after(ms, fn) {
      const id = this.nextHandle++;
      if (this.stopped) return id;
      const timer = this.clock.setTimeout(
        () => {
          if (!this.delayed.delete(id)) return;
          this.guard("delayed event", fn);
        },
        Math.max(0, ms)
      );
      this.delayed.set(id, { timer });
      return id;
    }
    /** Runs `fn` at the start of the tick `ticks` ticks from now (at least the next one). */
    afterTicks(ticks, fn) {
      const id = this.nextHandle++;
      if (!this.stopped) this.framed.push({ id, ticks: Math.max(1, Math.floor(ticks)), fn });
      return id;
    }
    cancel(handle) {
      const d = this.delayed.get(handle);
      if (d) {
        this.clock.clearTimeout(d.timer);
        this.delayed.delete(handle);
        return;
      }
      this.framed = this.framed.filter((f5) => f5.id !== handle);
    }
    /** Cancels the tick and every pending delayed event. The scheduler cannot be started again. */
    stop() {
      this.running = false;
      this.stopped = true;
      this.clock.clearTimeout(this.tickTimer);
      for (const d of this.delayed.values()) this.clock.clearTimeout(d.timer);
      this.delayed.clear();
      this.framed = [];
    }
    get pending() {
      return this.delayed.size + this.framed.length;
    }
    guard(where, fn) {
      try {
        fn();
      } catch (error) {
        this.onError(where, error);
      }
    }
  };

  // portkit/src/sha256.ts
  var K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  function sha256(message) {
    const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
    const length = message.length;
    const padded = new Uint8Array((length + 8 >> 6) + 1 << 6);
    padded.set(message);
    padded[length] = 128;
    const bits = length * 8;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
    view.setUint32(padded.length - 4, bits >>> 0);
    const w = new Uint32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i++) {
        const a2 = w[i - 15];
        const b2 = w[i - 2];
        const s0 = (a2 >>> 7 | a2 << 25) ^ (a2 >>> 18 | a2 << 14) ^ a2 >>> 3;
        const s1 = (b2 >>> 17 | b2 << 15) ^ (b2 >>> 19 | b2 << 13) ^ b2 >>> 10;
        w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f5 = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
        const ch = e & f5 ^ ~e & g;
        const t1 = hh + s1 + ch + K[i] + w[i] | 0;
        const s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
        const maj = a & b ^ a & c ^ b & c;
        const t2 = s0 + maj | 0;
        hh = g;
        g = f5;
        f5 = e;
        e = d + t1 | 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 | 0;
      }
      h[0] = h[0] + a | 0;
      h[1] = h[1] + b | 0;
      h[2] = h[2] + c | 0;
      h[3] = h[3] + d | 0;
      h[4] = h[4] + e | 0;
      h[5] = h[5] + f5 | 0;
      h[6] = h[6] + g | 0;
      h[7] = h[7] + hh | 0;
    }
    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i]);
    return out;
  }
  function sha256Text(text) {
    return toBase64(sha256(utf8Encode(text)));
  }
  function toHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
    return out;
  }

  // portkit/src/secrets.ts
  var Draw = class {
    constructor(seed) {
      __publicField(this, "seed");
      this.seed = seed;
    }
    /** An integer in [0, maxExclusive). `index` picks which of the draw's numbers: die 0, die 1, ... */
    Int(maxExclusive, index = 0) {
      const h = sha256(utf8Encode(`${this.seed}
${index}`));
      const n = h[0] * 2 ** 40 + h[1] * 2 ** 32 + h[2] * 2 ** 24 + h[3] * 2 ** 16 + h[4] * 2 ** 8 + h[5];
      return n % Math.max(1, Math.floor(maxExclusive));
    }
    Ints(count, maxExclusive) {
      const out = [];
      for (let i = 0; i < count; i++) out.push(this.Int(maxExclusive, i));
      return out;
    }
    /** In [0, 1). */
    Float(index = 0) {
      return this.Int(2 ** 32, index) / 2 ** 32;
    }
    toString() {
      return this.seed;
    }
  };
  var DRAW_KEEP_MS = 12e4;
  function parseDrawEntry(e) {
    if (!Array.isArray(e) || typeof e[0] !== "string" || typeof e[1] !== "string" || typeof e[2] !== "string") return null;
    return [e[0], e[1], e[2], typeof e[3] === "number" ? e[3] : 0, e[4] === 1 ? 1 : 0, typeof e[5] === "string" ? e[5] : ""];
  }
  var CURVE = { name: "ECDH", namedCurve: "P-256" };
  function parseDeal(raw) {
    if (!isRecord(raw) || typeof raw.l !== "string" || typeof raw.h !== "string" || !Array.isArray(raw.s)) return null;
    return { l: raw.l, h: raw.h, s: raw.s.filter((x) => typeof x === "string"), p: raw.p === 1 ? 1 : 0, r: typeof raw.r === "string" ? raw.r : void 0 };
  }
  function parseContribution(raw) {
    if (!isRecord(raw) || typeof raw.l !== "string" || typeof raw.h !== "string") return null;
    return { l: raw.l, h: raw.h, c: typeof raw.c === "string" ? raw.c : void 0 };
  }
  var Secrets = class {
    constructor(core, presence, referee, nowSeconds) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "crypto");
      __publicField(this, "nowSeconds");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __publicField(this, "privateKey", null);
      __publicField(this, "publicKeyText", "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __publicField(this, "derived", /* @__PURE__ */ new Map());
      __publicField(this, "mySecret", null);
      __publicField(this, "lastStates", /* @__PURE__ */ new Map());
      /** The referee's numbers and judgements, read from the referee's own user state. */
      __publicField(this, "numbers");
      __publicField(this, "pins", /* @__PURE__ */ new Map());
      __publicField(this, "pinsEpoch", -1);
      __publicField(this, "warnedPins", /* @__PURE__ */ new Set());
      __publicField(this, "goneSince", /* @__PURE__ */ new Map());
      __publicField(this, "drawStore", null);
      __publicField(this, "drawKey", "");
      __publicField(this, "restoring", null);
      /** The referee's own seed for its current deal. */
      __publicField(this, "dealSeed", null);
      /** This player's contribution to a deal. */
      __publicField(this, "myContribution", null);
      /** Commitments and contributions as first seen, per deal label and session (they outlive a player's visit). */
      __publicField(this, "dealSeen", /* @__PURE__ */ new Map());
      /** Told when a player's draw changes state. */
      __publicField(this, "onDrawChanged", () => {
      });
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.crypto = core.platform.crypto;
      this.nowSeconds = nowSeconds;
      this.numbers = new RefereeTable(presence, referee, "fn", parseDrawEntry);
    }
    /** Starts following commitments, the referee's numbers and reveals. */
    listen() {
      this.presence.onExtra(() => this.review());
      this.presence.on(() => this.review());
      this.referee.on(() => this.review());
    }
    /** `n` bytes from the strong generator (WebCrypto; seeded in the fake room). */
    RandomBytes(n) {
      return this.crypto.getRandomValues(new Uint8Array(Math.max(0, Math.floor(n))));
    }
    // ---- commit / reveal ----------------------------------------------------------------------------------------
    commit(value) {
      const nonce = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      const opening = { v: encodeValue(value), s: nonce };
      const hash = hashOpening(opening);
      return { hash, reveal: () => ({ v: opening.v, s: opening.s }) };
    }
    /** True when `opening` is what `hash` committed to. */
    verify(hash, opening) {
      if (!opening || typeof opening.s !== "string" || typeof hash !== "string") return false;
      return hashOpening(opening) === hash;
    }
    /** The value inside an opening, with value types rebuilt. Check it with `verify` first. */
    valueOf(opening) {
      return decodeValue(opening.v);
    }
    /** Publishes one of the local player's commitments under `label`, in their own user state. */
    publish(label, hash) {
      const all = { ...this.own("c") };
      all[label] = hash;
      this.presence.setExtra("c", all);
    }
    /** Takes a published commitment back (when its round is over). */
    retract(label) {
      const all = { ...this.own("c") };
      delete all[label];
      this.presence.setExtra("c", Object.keys(all).length ? all : void 0);
    }
    /** The commitment a participant published under `label`, or null. Only that player can have written it. */
    published(sid, label) {
      const all = this.presence.extra(sid, "c");
      return isRecord(all) && typeof all[label] === "string" ? all[label] : null;
    }
    own(name) {
      const value = this.presence.extra(this.core.me.sid, name);
      return isRecord(value) ? value : {};
    }
    // ---- fair draws ---------------------------------------------------------------------------------------------
    //
    // Where each part lives, so that nobody can change another player's part:
    //   x.fd  [label, hash]          the player's commitment, in the player's own user state
    //   x.fr  [label, secret]        the player's reveal, in the player's own user state
    //   x.fn  {e, m: {sid: entry}}   the referee's numbers and judgements, in the referee's own user state
    //                                (refrecord.ts); entry = [label, hash, number, deadline, forfeit, uid]
    // Each client also keeps the first hash and number it saw for a player's label in this epoch (`pins`): a later
    // table that changes them (a referee seat taken over by a modified client) is not believed.
    /** Starts a draw for the local player under `label` (a round name). It replaces their previous draw. */
    beginDraw(label) {
      const secret = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      this.mySecret = { label, secret };
      this.restoring = null;
      this.saveDraw(false);
      this.presence.setExtra("fr", void 0);
      this.presence.setExtra("fd", [label, sha256Text(secret)]);
    }
    /** Publishes the local player's secret for `label`, so everyone can compute and check the draw. */
    revealDraw(label) {
      if (!this.mySecret || this.mySecret.label !== label) return;
      this.saveDraw(true);
      this.presence.setExtra("fr", [label, this.mySecret.secret]);
    }
    /** The referee starts the clock: draws under `label` not revealed within `seconds` are forfeit. */
    demandReveal(label, seconds) {
      if (!this.referee.isMe()) return;
      const table = this.numbers.working();
      const deadline = this.nowSeconds() + seconds;
      let changed = false;
      for (const sid of Object.keys(table)) {
        const entry = table[sid];
        if (entry[0] === label && entry[3] === 0 && entry[4] === 0) {
          entry[3] = deadline;
          changed = true;
        }
      }
      if (changed) this.numbers.write(table);
    }
    /** Where a participant's draw under `label` stands, and the draw itself once this client may know it. */
    drawOf(sid, label) {
      const entry = this.entryOf(sid);
      const committed = this.presence.extra(sid, "fd");
      const hasCommit = Array.isArray(committed) && committed[0] === label && typeof committed[1] === "string";
      if (!entry || entry[0] !== label) return { state: hasCommit ? "committed" : "none", draw: null };
      const [, hash, number, , forfeit] = entry;
      if (hasCommit && committed[1] !== hash) return { state: "rejected", draw: null };
      const revealed = this.presence.extra(sid, "fr");
      if (Array.isArray(revealed) && revealed[0] === label && typeof revealed[1] === "string") {
        if (sha256Text(revealed[1]) !== hash) return { state: "rejected", draw: null };
        if (forfeit) return { state: "forfeit", draw: null };
        return { state: "revealed", draw: new Draw(drawSeed(revealed[1], number, label)) };
      }
      if (forfeit) return { state: "forfeit", draw: null };
      if (sid === this.core.me.sid && this.mySecret && this.mySecret.label === label && sha256Text(this.mySecret.secret) === hash) {
        return { state: "numbered", draw: new Draw(drawSeed(this.mySecret.secret, number, label)) };
      }
      return { state: "numbered", draw: null };
    }
    /** The local player's own draw under `label`, as soon as the referee's number is in. */
    myDraw(label) {
      return this.drawOf(this.core.me.sid, label).draw;
    }
    /** A participant's entry in the referee's table, with the hash and number this client saw first. */
    entryOf(sid) {
      const entry = this.numbers.read()[sid];
      if (!entry) return null;
      const epoch = this.referee.epoch;
      if (this.pinsEpoch !== epoch) {
        this.pins.clear();
        this.pinsEpoch = epoch;
      }
      const key = `${entry[5]}
${entry[0]}`;
      const pin = this.pins.get(key);
      if (!pin) {
        this.pins.set(key, [entry[1], entry[2]]);
        return entry;
      }
      if (pin[0] !== entry[1] || pin[1] !== entry[2]) {
        if (!this.warnedPins.has(key)) {
          this.warnedPins.add(key);
          this.core.log("warn", `the referee's table changed the pinned commitment or number of a draw (${entry[0]}); keeping the first one seen`);
        }
        return [entry[0], pin[0], pin[1], entry[3], entry[4], entry[5]];
      }
      return entry;
    }
    /** Looks at every participant's draw: the referee answers and judges, and everyone reports changes. */
    review() {
      if (this.core.disposed) return;
      this.reviewDeal();
      this.restoreDraw();
      if (this.referee.isMe()) this.officiate();
      for (const who of this.presence.list()) {
        const committed = this.presence.extra(who.sid, "fd");
        const entry = this.entryOf(who.sid);
        const label = entry ? entry[0] : Array.isArray(committed) && typeof committed[0] === "string" ? committed[0] : null;
        if (label === null) continue;
        const status = this.drawOf(who.sid, label);
        const mark = `${label}
${status.state}`;
        if (this.lastStates.get(who.sid) === mark) continue;
        this.lastStates.set(who.sid, mark);
        this.core.guard("draw handler", () => this.onDrawChanged(who.sid, label, status));
      }
    }
    officiate() {
      const table = this.numbers.working();
      let changed = false;
      const now = this.nowSeconds();
      const clock = this.core.platform.clock.now();
      for (const sid of Object.keys(table)) {
        if (this.presence.has(sid)) {
          this.goneSince.delete(sid);
          continue;
        }
        const since = this.goneSince.get(sid) ?? clock;
        this.goneSince.set(sid, since);
        if (clock - since >= DRAW_KEEP_MS) {
          delete table[sid];
          this.goneSince.delete(sid);
          changed = true;
        }
      }
      for (const who of this.presence.list()) {
        const committed = this.presence.extra(who.sid, "fd");
        const entry = table[who.sid];
        if (Array.isArray(committed) && typeof committed[0] === "string" && typeof committed[1] === "string") {
          if (!entry || entry[0] !== committed[0]) {
            const before = Object.keys(table).find((sid) => {
              const e = table[sid];
              return !this.presence.has(sid) && e[5] === who.uid && e[0] === committed[0] && e[1] === committed[1];
            });
            if (before !== void 0) {
              table[who.sid] = table[before];
              delete table[before];
              this.goneSince.delete(before);
            } else table[who.sid] = [committed[0], committed[1], toBase64(this.crypto.getRandomValues(new Uint8Array(16))), 0, 0, who.uid];
            changed = true;
            continue;
          }
        }
        if (entry && entry[3] > 0 && entry[4] === 0 && now >= entry[3]) {
          const revealed = this.presence.extra(who.sid, "fr");
          const ok = Array.isArray(revealed) && revealed[0] === entry[0] && typeof revealed[1] === "string" && sha256Text(revealed[1]) === entry[1];
          if (!ok) {
            entry[4] = 1;
            changed = true;
          }
        }
      }
      if (changed) this.numbers.write(table);
    }
    saveDraw(revealed) {
      if (!this.drawStore || !this.mySecret) return;
      try {
        this.drawStore.set(this.drawKey, JSON.stringify({ e: this.referee.epoch, l: this.mySecret.label, s: this.mySecret.secret, r: revealed ? 1 : 0 }));
      } catch {
      }
    }
    /**
     * After a page reload: the secret this device saved comes back once the referee's table (as last mirrored)
     * still holds this user's entry for it; the commitment (and the reveal, if it was made) is published again and
     * the referee moves the entry to the new session.
     */
    restoreDraw() {
      const saved = this.restoring;
      if (!saved || this.mySecret) return;
      const epoch = this.referee.epoch;
      if (epoch === 0) return;
      if (saved.e !== 0 && saved.e !== epoch) {
        this.restoring = null;
        return;
      }
      const hash = sha256Text(saved.s);
      const table = this.numbers.read();
      const mine = Object.keys(table).map((sid) => table[sid]).filter((e) => e[5] === this.core.me.uid);
      if (mine.some((e) => e[0] === saved.l && e[1] === hash)) {
        this.restoring = null;
        this.mySecret = { label: saved.l, secret: saved.s };
        this.presence.setExtra("fd", [saved.l, hash]);
        if (saved.r) this.presence.setExtra("fr", [saved.l, saved.s]);
        this.core.log("info", `the draw '${saved.l}' came back after a reload`);
      } else if (mine.length) {
        this.restoring = null;
      }
    }
    // ---- dealt draws ---------------------------------------------------------------------------------------------
    //
    //   referee x.dl  {l: label, h: SHA-256(seed), s: [listed session ids], p: 0 committing | 1 revealing, r?: seed}
    //   player  x.dc  {l: label, h: SHA-256(contribution), c?: contribution}
    // The runtime answers for every listed player by itself (review), so game code only calls beginDeal, dealDraw,
    // revealDeal on the referee and verifyDeal anywhere.
    /** The referee starts a deal under `label` for the players with these session ids. Replaces its previous deal. */
    beginDeal(label, sids) {
      if (!this.referee.isMe()) return;
      const seed = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      this.dealSeed = { label, seed };
      this.presence.setExtra("dl", { l: label, h: sha256Text(seed), s: sids.slice(), p: 0 });
      this.review();
    }
    /** Where the current referee's deal under `label` stands. */
    dealState(label) {
      const deal = this.currentDeal();
      if (!deal || deal.l !== label) return "none";
      const seen = this.dealSeen.get(label);
      if (deal.r !== void 0) return seen && sha256Text(deal.r) === seen.h ? "revealed" : "invalid";
      if (deal.p === 0) return "committing";
      return this.contributions(deal) ? "ready" : "revealing";
    }
    /**
     * The referee's deal, once every listed player still present has revealed a contribution (a listed player who
     * left counts as absent: say so in the game if it matters). Null before that, and on any other client.
     */
    dealDraw(label) {
      const deal = this.currentDeal();
      if (!this.referee.isMe() || !deal || deal.l !== label || !this.dealSeed || this.dealSeed.label !== label) return null;
      const parts = this.contributions(deal);
      return parts ? new Draw(dealSeedOf(this.dealSeed.seed, label, parts)) : null;
    }
    /** The referee publishes its seed (after the hand), so that everyone can check the deal. */
    revealDeal(label) {
      const deal = this.currentDeal();
      if (!this.referee.isMe() || !deal || deal.l !== label || !this.dealSeed || this.dealSeed.label !== label) return;
      this.presence.setExtra("dl", { ...deal, r: this.dealSeed.seed });
    }
    /** After revealDeal: the deal, recomputed here from the referee's seed and the contributions this client saw; null if it does not check out. */
    verifyDeal(label) {
      const deal = this.currentDeal();
      if (!deal || deal.l !== label || deal.r === void 0) return null;
      const seen = this.dealSeen.get(label);
      if (!seen || sha256Text(deal.r) !== seen.h) return null;
      const parts = this.contributions(deal);
      return parts ? new Draw(dealSeedOf(deal.r, label, parts)) : null;
    }
    currentDeal() {
      const ref = this.referee.current();
      return ref ? parseDeal(this.presence.extra(ref.sid, "dl")) : null;
    }
    /** Every listed contribution, revealed and matching its commitment ("-" for a listed player who left); null while one is missing. */
    contributions(deal) {
      const seen = this.dealSeen.get(deal.l);
      if (!seen) return null;
      const out = [];
      for (const sid of deal.s) {
        const part = seen.parts.get(sid);
        if (part && part.c !== void 0) out.push(part.c);
        else if (!this.presence.has(sid) && (!part || deal.p === 1)) out.push("-");
        else return null;
      }
      return out;
    }
    /** Follows the deal: records what is first seen, answers for the local player, and moves the referee's phase on. */
    reviewDeal() {
      const ref = this.referee.current();
      const deal = this.currentDeal();
      if (!ref || !deal) return;
      let seen = this.dealSeen.get(deal.l);
      if (!seen || seen.refSid !== ref.sid) {
        seen = { h: deal.h, refSid: ref.sid, parts: /* @__PURE__ */ new Map() };
        this.dealSeen.set(deal.l, seen);
        while (this.dealSeen.size > 8) this.dealSeen.delete(this.dealSeen.keys().next().value);
      }
      for (const sid of deal.s) {
        const part = parseContribution(this.presence.extra(sid, "dc"));
        if (!part || part.l !== deal.l) continue;
        const known = seen.parts.get(sid);
        if (!known) seen.parts.set(sid, { h: part.h });
        const entry = seen.parts.get(sid);
        if (part.c !== void 0 && entry.c === void 0 && entry.h === part.h && sha256Text(part.c) === entry.h) entry.c = part.c;
      }
      const me = this.core.me.sid;
      if (deal.s.includes(me)) {
        if (!this.myContribution || this.myContribution.label !== deal.l) {
          this.myContribution = { label: deal.l, c: toBase64(this.crypto.getRandomValues(new Uint8Array(16))) };
          this.presence.setExtra("dc", { l: deal.l, h: sha256Text(this.myContribution.c) });
        } else if (deal.p === 1) {
          const mine = parseContribution(this.presence.extra(me, "dc"));
          if (mine && mine.c === void 0) this.presence.setExtra("dc", { ...mine, c: this.myContribution.c });
        }
      }
      if (this.referee.isMe() && deal.p === 0 && this.dealSeed && this.dealSeed.label === deal.l) {
        const all = deal.s.every((sid) => seen.parts.has(sid) || !this.presence.has(sid));
        if (all) this.presence.setExtra("dl", { ...deal, p: 1 });
      }
    }
    // ---- seal / open --------------------------------------------------------------------------------------------
    /** The local public key (raw point, base64url). Empty before `init`. */
    get publicKey() {
      return this.publicKeyText;
    }
    /**
     * Makes the local key pair, or loads the one this device saved for this player and instance, so that a page
     * reload can still open what was sealed before it.
     */
    async init(store, storeKey, drawKey = "") {
      const subtle = this.crypto.subtle;
      if (store && drawKey) {
        this.drawStore = store;
        this.drawKey = drawKey;
        try {
          const saved = safeParse(store.get(drawKey));
          if (isRecord(saved) && typeof saved.l === "string" && typeof saved.s === "string") {
            this.restoring = { e: typeof saved.e === "number" ? saved.e : 0, l: saved.l, s: saved.s, r: saved.r === 1 ? 1 : 0 };
          }
        } catch {
        }
      }
      if (store) {
        try {
          const saved = safeParse(store.get(storeKey));
          if (isRecord(saved) && isRecord(saved.d) && typeof saved.p === "string") {
            this.privateKey = await subtle.importKey("jwk", saved.d, CURVE, false, ["deriveKey"]);
            this.publicKeyText = saved.p;
            return this.publicKeyText;
          }
        } catch {
        }
      }
      const pair = await subtle.generateKey(CURVE, true, ["deriveKey"]);
      this.privateKey = pair.privateKey;
      this.publicKeyText = toBase64(new Uint8Array(await subtle.exportKey("raw", pair.publicKey)));
      if (store) {
        try {
          store.set(storeKey, JSON.stringify({ p: this.publicKeyText, d: await subtle.exportKey("jwk", pair.privateKey) }));
        } catch {
        }
      }
      return this.publicKeyText;
    }
    /** True once the player's public key is known, so `seal` for them can work. */
    canSealFor(sid) {
      return !!this.presence.get(sid)?.publicKey;
    }
    /**
     * Encrypts `value` for one participant. The result is text that can go anywhere (a synced field, a network
     * event): only that player's key opens it.
     */
    async seal(forSid, value) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const target = this.presence.get(forSid);
      if (!target || !target.publicKey) throw new Error(`no public key known for player session ${forSid}`);
      const key = await this.sharedKey(target.publicKey);
      const iv = this.crypto.getRandomValues(new Uint8Array(12));
      const me = this.core.me;
      const aad = utf8Encode(`${this.core.prefix}
${me.sid}
${forSid}`);
      const plain = utf8Encode(canonicalJson(encodeValue(value)));
      const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, plain));
      return JSON.stringify({ f: me.sid, t: forSid, u: target.uid, p: this.publicKeyText, i: toBase64(iv), c: toBase64(cipher) });
    }
    /**
     * Opens a box sealed for the local player. Throws when it is for someone else, was changed on the way, or
     * claims a sender whose announced key is not the one it was sealed with.
     */
    async open(box) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const b = safeParse(box);
      if (!isRecord(b) || typeof b.f !== "string" || typeof b.t !== "string" || typeof b.p !== "string" || typeof b.i !== "string" || typeof b.c !== "string") {
        throw new Error("not a sealed box");
      }
      const me = this.core.me;
      if (b.t !== me.sid && b.u !== me.uid) throw new Error("this box is sealed for another player");
      const senderKey = this.presence.keyOf(b.f);
      if (senderKey !== b.p) throw new Error("the box does not come from the player it names");
      const key = await this.sharedKey(b.p);
      const aad = utf8Encode(`${this.core.prefix}
${b.f}
${b.t}`);
      let plain;
      try {
        plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(b.i), additionalData: aad }, key, fromBase64(b.c));
      } catch {
        throw new Error("the box could not be opened (wrong key or changed contents)");
      }
      return decodeValue(JSON.parse(utf8Decode(new Uint8Array(plain))));
    }
    /**
     * Seals one value per participant into a single text, for one synced field that is rewritten as a whole.
     *
     * A box written for one player at a telling moment names its reader even though nobody else can open it. Here
     * every participant gets an entry every time, each padded to `slotBytes` before encryption, in session-id
     * order: the text has the same size and shape whoever it really concerns. `valueFor` returns undefined for a
     * participant who gets nothing; their entry is filled with padding.
     */
    async sealAll(valueFor, slotBytes = 256) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const me = this.core.me;
      const entries = {};
      const everyone = this.presence.list().map((p) => p.sid).sort();
      for (const sid of everyone) {
        const target = this.presence.get(sid);
        if (!target || !target.publicKey) continue;
        const value = valueFor(sid);
        const text = value === void 0 ? "{}" : canonicalJson({ v: encodeValue(value) });
        const bytes = utf8Encode(text);
        if (bytes.length > slotBytes) throw new Error(`sealAll: the value for one player needs ${bytes.length} bytes, more than the slot of ${slotBytes}`);
        const padded = new Uint8Array(slotBytes).fill(32);
        padded.set(bytes);
        const key = await this.sharedKey(target.publicKey);
        const iv = this.crypto.getRandomValues(new Uint8Array(12));
        const aad = utf8Encode(`${this.core.prefix}
${me.sid}
${sid}
all`);
        const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, padded));
        entries[sid] = [toBase64(iv), toBase64(cipher)];
      }
      return asciiJson({ f: me.sid, p: this.publicKeyText, n: slotBytes, m: entries });
    }
    /**
     * Opens the local player's entry of a `sealAll` text. Resolves null when the entry holds nothing for them,
     * or there is none (they arrived after it was written).
     */
    async openMine(bundle) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const b = safeParse(bundle);
      if (!isRecord(b) || typeof b.f !== "string" || typeof b.p !== "string" || !isRecord(b.m)) throw new Error("not a sealed bundle");
      const me = this.core.me;
      const entry = b.m[me.sid];
      if (!Array.isArray(entry) || typeof entry[0] !== "string" || typeof entry[1] !== "string") return null;
      if (this.presence.keyOf(b.f) !== b.p) throw new Error("the bundle does not come from the player it names");
      const key = await this.sharedKey(b.p);
      const aad = utf8Encode(`${this.core.prefix}
${b.f}
${me.sid}
all`);
      let plain;
      try {
        plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(entry[0]), additionalData: aad }, key, fromBase64(entry[1]));
      } catch {
        throw new Error("the entry could not be opened (wrong key or changed contents)");
      }
      const parsed = safeParse(utf8Decode(new Uint8Array(plain)).trimEnd());
      return isRecord(parsed) && "v" in parsed ? decodeValue(parsed.v) : null;
    }
    /**
     * Opens a box sealed for the local player and says who sealed it (a session id whose announced key the box was
     * sealed with). A game that takes a dealt value as authority checks that the sender is the referee.
     */
    async openWithSender(box) {
      const value = await this.open(box);
      return { value, from: String(safeParse(box).f) };
    }
    /** True when `box` names the local player as its reader. */
    isForMe(box) {
      const b = safeParse(box);
      return isRecord(b) && (b.t === this.core.me.sid || b.u === this.core.me.uid);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sharedKey(theirPublic) {
      let key = this.derived.get(theirPublic);
      if (!key) {
        const subtle = this.crypto.subtle;
        key = (async () => {
          const pub = await subtle.importKey("raw", fromBase64(theirPublic), CURVE, false, []);
          return subtle.deriveKey({ name: "ECDH", public: pub }, this.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        })();
        this.derived.set(theirPublic, key);
        key.catch(() => this.derived.delete(theirPublic));
      }
      return key;
    }
  };
  function hashOpening(opening) {
    return sha256Text(opening.s + "\n" + canonicalJson(opening.v));
  }
  function dealSeedOf(seed, label, parts) {
    return toHex(sha256(utf8Encode(`${seed}
${label}
${parts.join("\n")}`)));
  }
  function drawSeed(secret, number, label) {
    return toHex(sha256(utf8Encode(`${secret}
${number}
${label}`)));
  }

  // portkit/src/leaf.ts
  var LEAF_MARGIN = 96;
  var TOMBSTONE = "";
  function headKey(id) {
    return `v.${id}`;
  }
  function chunkKey(id, index) {
    return `c.${id}.${index}`;
  }
  function encodeLeaf(id, record, maxLeafBytes, previousChunks) {
    const budget = Math.max(256, maxLeafBytes - LEAF_MARGIN);
    const whole = asciiJson({ e: record.e, g: record.g, n: record.n, w: record.w, d: record.d });
    const bytes = jsonLeafBytes(whole);
    const writes = [];
    let chunks = 0;
    if (bytes <= budget) {
      writes.push([headKey(id), whole]);
    } else {
      const pieces = splitByLeafBytes(whole, budget - 32);
      chunks = pieces.length;
      for (let i = 0; i < pieces.length; i++) writes.push([chunkKey(id, i), `${record.n}.${i}~${pieces[i]}`]);
      writes.push([headKey(id), asciiJson({ e: record.e, g: record.g, n: record.n, w: record.w, c: chunks })]);
    }
    for (let i = chunks; i < previousChunks; i++) writes.push([chunkKey(id, i), TOMBSTONE]);
    return { writes, chunks, bytes };
  }
  function splitByLeafBytes(text, budget) {
    const pieces = [];
    let start = 0;
    let size = 0;
    for (let i = 0; i < text.length; i++) {
      const add = leafCharBytes(text, i);
      const lowHalf = (text.charCodeAt(i) & 64512) === 56320;
      if (size + add > budget && i > start && !lowHalf) {
        pieces.push(text.slice(start, i));
        start = i;
        size = 0;
      }
      size += add;
    }
    if (start < text.length) pieces.push(text.slice(start));
    return pieces;
  }
  function decodeLeaf(id, get) {
    const head = get(headKey(id));
    if (head === void 0 || head === TOMBSTONE) return { kind: "none" };
    const parsed = safeParse(head);
    if (!isRecord(parsed) || !isCount(parsed.e) || !isCount(parsed.g) || !isCount(parsed.n) || typeof parsed.w !== "string") return { kind: "bad" };
    const e = parsed.e;
    const g = parsed.g;
    const n = parsed.n;
    const w = parsed.w;
    if (parsed.c === void 0) return { kind: "value", record: { e, g, n, w, d: parsed.d }, chunks: 0 };
    if (!isCount(parsed.c) || parsed.c < 1 || parsed.c > 512) return { kind: "bad" };
    const chunks = parsed.c;
    let whole = "";
    for (let i = 0; i < chunks; i++) {
      const piece = get(chunkKey(id, i));
      const tag = `${n}.${i}~`;
      if (piece === void 0 || !piece.startsWith(tag)) return { kind: "pending", e, g, n, w, chunks };
      whole += piece.slice(tag.length);
    }
    const full = safeParse(whole);
    if (!isRecord(full) || full.e !== e || full.g !== g || full.n !== n || full.w !== w) return { kind: "bad" };
    return { kind: "value", record: { e, g, n, w, d: full.d }, chunks };
  }
  function isCount(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
  }
  function leafOwnerOf(key) {
    if (key.startsWith("v.")) return key.indexOf(".", 2) < 0 ? key.slice(2) : null;
    if (key.startsWith("c.")) {
      const end = key.indexOf(".", 2);
      return end > 2 ? key.slice(2, end) : null;
    }
    return null;
  }

  // portkit/src/sync.ts
  var Sync = class {
    constructor(core, presence, referee, players) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "players");
      __publicField(this, "slots", /* @__PURE__ */ new Map());
      __publicField(this, "byBehaviour", /* @__PURE__ */ new Map());
      __publicField(this, "stats", { writes: 0, applied: 0, repairs: 0, claims: 0, lostRaces: 0, rejected: 0, reverted: 0 });
      /** False until behaviours have started: data applied before then is reported once, afterwards. */
      __publicField(this, "started", false);
      __publicField(this, "epochSeen", 0);
      __publicField(this, "warnedIdle", false);
      /** Told when the local player becomes or stops being the owner of a slot (to move its synced objects). */
      __publicField(this, "onLocalOwnership", () => {
      });
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.players = players;
    }
    get me() {
      return this.core.me.sid;
    }
    /** Registers a behaviour. With `group`, it shares the leaf and the owner of every other behaviour of that group. */
    add(behaviour, id, fields, mode, callbacks, group) {
      const slotId = group ? `@${group}` : id;
      let slot = this.slots.get(slotId);
      if (!slot) {
        slot = {
          id: slotId,
          grouped: !!group,
          members: [],
          mode,
          snapshotOwed: false,
          mo: null,
          topG: 0,
          pending: null,
          applied: null,
          seenN: 0,
          lastValid: null,
          unconfirmed: null,
          dirty: false,
          chunks: 0,
          lastSent: null,
          lastContinuousAt: -Infinity,
          ownerView: null,
          warnedNotOwner: false,
          onApplied: null
        };
        this.slots.set(slotId, slot);
      } else if (mode === "continuous" || slot.mode === "none" && mode !== "none") slot.mode = mode;
      slot.members.push({ id, behaviour, fields, callbacks: callbacks && Object.keys(callbacks).length ? callbacks : void 0, lastPart: null, owed: false });
      this.byBehaviour.set(behaviour, slot);
      return slot;
    }
    slotOf(behaviour) {
      return this.byBehaviour.get(behaviour) ?? null;
    }
    /** Subscribes to the mirror and reads the owner records. Data is applied by `applySnapshot`, after Start. */
    attach() {
      this.core.onState((key) => this.onLeaf(key));
      this.presence.on(() => this.onPeopleChanged());
      this.presence.onExtra(() => this.onPeopleChanged());
      this.referee.on(() => this.onPeopleChanged());
      this.epochSeen = this.referee.epoch;
      for (const slot of this.slots.values()) {
        this.readOwner(slot);
        slot.ownerView = this.ownerSid(slot);
      }
    }
    /** Applies whatever counts in the mirror to every behaviour. Runs after Start, so stored data wins over it. */
    applySnapshot() {
      for (const slot of this.slots.values()) {
        this.markParts(slot);
        slot.snapshotOwed = decodeLeaf(slot.id, (key) => this.core.get(key)).kind === "pending";
        this.evaluate(slot, true);
      }
    }
    /** True when the mirror held a value for any behaviour when this client started. */
    hasData() {
      for (const slot of this.slots.values()) if (slot.applied !== null) return true;
      return false;
    }
    /** Marks the behaviours as started and calls OnDeserialization once on each that already has data. */
    begin() {
      this.started = true;
      for (const slot of this.slots.values()) {
        for (const member of slot.members) {
          if (!member.owed) continue;
          member.owed = false;
          this.core.guard(`${member.id}.OnDeserialization`, () => member.behaviour.OnDeserialization({ isSnapshot: true, isRollback: false }));
        }
      }
    }
    /** The slot a leaf key belongs to (`o.<slot>`, `v.<slot>`, `c.<slot>.<i>`), for reporting a refused write. */
    slotForKey(key) {
      const id = key.startsWith("o.") ? key.slice(2) : leafOwnerOf(key);
      return id === null ? null : this.slots.get(id) ?? null;
    }
    // ---- ownership ----------------------------------------------------------------------------------------------
    ownerSid(slot) {
      if (slot.pending) return slot.pending.sid;
      if (slot.mo && this.presence.has(slot.mo.s)) return slot.mo.s;
      return this.referee.current()?.sid ?? null;
    }
    owner(slot) {
      const sid = this.ownerSid(slot);
      return sid === null ? null : this.players.bySid(sid);
    }
    isOwner(slot, sid = this.me) {
      return this.ownerSid(slot) === sid;
    }
    setOwner(slot, sid, uid) {
      if (this.core.disposed) return;
      if (this.referee.epoch === 0) {
        if (!this.warnedIdle) {
          this.warnedIdle = true;
          this.core.log("warn", `${slot.id}: SetOwner ignored, the instance has no referee yet`);
        }
        return;
      }
      const recorded = slot.pending ? slot.pending.sid : slot.mo ? slot.mo.s : null;
      if (recorded === sid) return;
      const g = Math.max(slot.topG, slot.pending ? slot.pending.g : 0) + 1;
      const record = { e: this.referee.epoch, g, s: sid, u: uid };
      if (slot.pending) this.core.scheduler.cancel(slot.pending.timer);
      const timer = this.core.scheduler.after(this.core.options.ownerClaimTimeoutMs, () => {
        if (slot.pending && slot.pending.g === g) {
          this.core.log("warn", `ownership claim for ${slot.id} never came back; giving it up`);
          slot.pending = null;
          this.settleLostClaim(slot);
        }
      });
      slot.pending = { g, sid, timer };
      this.stats.claims++;
      this.core.set(`o.${slot.id}`, asciiJson(record));
      this.noteOwner(slot);
    }
    readOwner(slot) {
      const raw = safeParse(this.core.get(`o.${slot.id}`));
      let record = null;
      if (isRecord(raw) && typeof raw.e === "number" && typeof raw.g === "number" && typeof raw.s === "string") {
        record = { e: raw.e, g: raw.g, s: raw.s, u: typeof raw.u === "string" ? raw.u : "" };
        if (record.g > slot.topG) slot.topG = record.g;
      }
      slot.mo = record && record.e === this.referee.epoch ? record : null;
    }
    onOwnerLeaf(slot) {
      this.readOwner(slot);
      const mo = slot.mo;
      if (slot.pending && mo && mo.s === slot.pending.sid && mo.g === slot.pending.g) {
        this.core.scheduler.cancel(slot.pending.timer);
        slot.pending = null;
        if (slot.unconfirmed) slot.lastValid = slot.unconfirmed;
        slot.unconfirmed = null;
      }
      this.noteOwner(slot);
      this.evaluate(slot, false);
    }
    /** The claim never reached the room: whatever was changed for it is put back. */
    settleLostClaim(slot) {
      this.stats.lostRaces++;
      const touched = slot.unconfirmed !== null || slot.dirty;
      slot.unconfirmed = null;
      slot.dirty = false;
      if (touched) {
        if (slot.lastValid) {
          slot.applied = slot.lastValid.marker;
          this.markParts(slot);
          this.deserialized(slot, this.assign(slot, slot.lastValid.d), true);
        } else slot.applied = null;
      }
      this.noteOwner(slot);
      this.evaluate(slot, false);
    }
    /** Records what each member of a group holds now, so that the next value only reports real changes. */
    markParts(slot) {
      if (!slot.grouped) return;
      for (const member of slot.members) {
        const bag = member.behaviour;
        member.lastPart = canonicalJson(member.fields.map((field) => encodeValue(bag[field])));
      }
    }
    noteOwner(slot) {
      const now = this.ownerSid(slot);
      if (now === slot.ownerView) return;
      const before = slot.ownerView;
      slot.ownerView = now;
      if (now === this.me || before === this.me) this.core.guard("ownership hook", () => this.onLocalOwnership(slot, now === this.me));
      if (!this.started || now === null) return;
      const player = this.players.bySid(now);
      if (!player) return;
      for (const member of slot.members) this.core.guard(`${member.id}.OnOwnershipTransferred`, () => member.behaviour.OnOwnershipTransferred(player));
    }
    onPeopleChanged() {
      if (this.core.disposed) return;
      if (this.referee.epoch !== this.epochSeen) this.adoptEpoch();
      for (const slot of this.slots.values()) this.noteOwner(slot);
      this.takeOver();
    }
    /**
     * A referee of another epoch appeared: a client that started while there was none joins the game in progress,
     * or the game was started afresh. Everything known about owners and values is read again from the mirror, and
     * values found there are reported as a snapshot.
     */
    adoptEpoch() {
      this.epochSeen = this.referee.epoch;
      for (const slot of this.slots.values()) {
        if (slot.pending) this.core.scheduler.cancel(slot.pending.timer);
        slot.pending = null;
        slot.unconfirmed = null;
        slot.lastValid = null;
        slot.applied = null;
        slot.dirty = false;
        this.readOwner(slot);
        slot.snapshotOwed = true;
        this.evaluate(slot, true);
        slot.snapshotOwed = decodeLeaf(slot.id, (key) => this.core.get(key)).kind === "pending";
      }
    }
    /** The referee records itself as owner of whatever an absent player owned. */
    takeOver() {
      if (!this.started || !this.referee.isMe()) return;
      for (const slot of this.slots.values()) {
        if (slot.pending || !slot.mo || this.presence.has(slot.mo.s)) continue;
        this.setOwner(slot, this.me, this.core.me.uid);
      }
    }
    // ---- data ---------------------------------------------------------------------------------------------------
    requestSerialization(slot) {
      if (slot.mode === "none") return;
      if (!this.isOwner(slot)) {
        if (!slot.warnedNotOwner) {
          slot.warnedNotOwner = true;
          this.core.log("warn", `${slot.id}: RequestSerialization by a player who is not the owner is ignored`);
        }
        return;
      }
      slot.dirty = true;
    }
    /** Writes every dirty slot the local player owns. Called once per tick. */
    flush() {
      if (this.core.disposed || !this.started) return;
      const now = this.core.platform.clock.now();
      for (const slot of this.slots.values()) {
        if (slot.mode === "none") continue;
        if (slot.mode === "continuous" && now - slot.lastContinuousAt >= this.core.options.continuousIntervalMs && this.isOwner(slot)) {
          slot.lastContinuousAt = now;
          if (canonicalJson(this.read(slot)) !== slot.lastSent) slot.dirty = true;
        }
        if (!slot.dirty) continue;
        slot.dirty = false;
        if (this.isOwner(slot)) this.write(slot);
        else this.revert(slot);
      }
    }
    /**
     * The fields were changed by the owner, and ownership went to someone else before the change could be sent.
     * Nobody else will ever see it, so it is taken back.
     */
    revert(slot) {
      if (!slot.lastValid) return;
      slot.applied = slot.lastValid.marker;
      this.markParts(slot);
      const changed = this.assign(slot, slot.lastValid.d);
      this.stats.reverted++;
      this.deserialized(slot, changed, true);
    }
    /** Serialises one slot now (used when an event must follow its state). Returns the marker of what it holds. */
    flushOne(slot) {
      if (slot.dirty && this.started && this.isOwner(slot)) {
        slot.dirty = false;
        this.write(slot);
      }
      return slot.applied;
    }
    write(slot) {
      const named = slot.pending ? slot.pending.sid === this.me : slot.mo !== null && slot.mo.s === this.me;
      if (!named) this.setOwner(slot, this.me, this.core.me.uid);
      if (!slot.pending && !slot.mo) return;
      const g = slot.pending ? slot.pending.g : slot.mo.g;
      for (const member of slot.members) this.core.guard(`${member.id}.OnPreSerialization`, () => member.behaviour.OnPreSerialization());
      const d = this.read(slot);
      const n = ++slot.seenN;
      const encoded = encodeLeaf(slot.id, { e: this.referee.epoch, g, n, w: this.me, d }, this.core.platform.limits.maxLeafBytes, slot.chunks);
      for (const [key, value] of encoded.writes) this.core.set(key, value);
      slot.chunks = encoded.chunks;
      slot.applied = { g, n, w: this.me };
      slot.lastSent = canonicalJson(d);
      if (slot.grouped) for (const member of slot.members) member.lastPart = canonicalJson(d[member.id] ?? null);
      const kept = { d, marker: slot.applied };
      if (slot.pending) slot.unconfirmed = kept;
      else slot.lastValid = kept;
      this.stats.writes++;
      const result = { success: true, byteCount: encoded.bytes };
      for (const member of slot.members) this.core.guard(`${member.id}.OnPostSerialization`, () => member.behaviour.OnPostSerialization(result));
    }
    read(slot) {
      if (!slot.grouped) return readFields(slot.members[0].behaviour, slot.members[0].fields);
      const out = {};
      for (const member of slot.members) {
        const bag = member.behaviour;
        out[member.id] = member.fields.map((field) => encodeValue(bag[field]));
      }
      return out;
    }
    /** Puts data into the behaviours. Returns the members whose part was new to them. */
    assign(slot, d) {
      if (!slot.grouped) {
        const member = slot.members[0];
        this.core.guard(`${member.id} field change callback`, () => assignFields(member.behaviour, member.fields, d, member.callbacks));
        return [member];
      }
      const changed = [];
      if (!isRecord(d)) return changed;
      for (const member of slot.members) {
        const part = d[member.id];
        if (!Array.isArray(part)) continue;
        const text = canonicalJson(part);
        if (text === member.lastPart) continue;
        member.lastPart = text;
        const asFields = {};
        member.fields.forEach((field, i) => {
          if (i < part.length) asFields[field] = part[i];
        });
        this.core.guard(`${member.id} field change callback`, () => assignFields(member.behaviour, member.fields, asFields, member.callbacks));
        changed.push(member);
      }
      return changed;
    }
    onLeaf(key) {
      if (this.core.disposed) return;
      if (key.startsWith("o.")) {
        const slot2 = this.slots.get(key.slice(2));
        if (slot2) this.onOwnerLeaf(slot2);
        return;
      }
      const id = leafOwnerOf(key);
      if (id === null) return;
      const slot = this.slots.get(id);
      if (slot) this.evaluate(slot, slot.snapshotOwed);
    }
    /**
     * Looks at the mirrored value of one slot and applies it, ignores it, or repairs it. `asSnapshot`: the value
     * was already stored when this client came to the game, so it is taken whoever wrote it.
     */
    evaluate(slot, asSnapshot) {
      this.consider(slot, asSnapshot);
      if (slot.onApplied && this.started) this.core.guard("held events", slot.onApplied);
    }
    consider(slot, asSnapshot) {
      const decoded = decodeLeaf(slot.id, (key) => this.core.get(key));
      if (decoded.kind === "pending") {
        if (decoded.n > slot.seenN) slot.seenN = decoded.n;
        return;
      }
      if (decoded.kind !== "value") return;
      const x = decoded.record;
      if (x.n > slot.seenN) slot.seenN = x.n;
      slot.chunks = decoded.chunks;
      if (x.e !== this.referee.epoch) return;
      const a = slot.applied;
      if (a && x.n === a.n && x.w === a.w && x.g === a.g) return;
      if (x.w === this.me && a && a.w === this.me && x.n <= a.n) return;
      const mo = slot.mo;
      if (asSnapshot || mo !== null && x.w === mo.s) {
        slot.applied = { g: x.g, n: x.n, w: x.w };
        slot.lastValid = { d: x.d, marker: slot.applied };
        slot.lastSent = null;
        this.stats.applied++;
        this.deserialized(slot, this.assign(slot, x.d), false);
        return;
      }
      this.stats.rejected++;
      if (mo !== null && mo.s === this.me && !slot.pending) {
        this.stats.repairs++;
        slot.dirty = true;
      }
    }
    deserialized(slot, changed, isRollback) {
      if (!this.started) {
        for (const member of changed) member.owed = true;
        return;
      }
      const isSnapshot = slot.snapshotOwed && !isRollback;
      slot.snapshotOwed = false;
      for (const member of changed) {
        this.core.guard(`${member.id}.OnDeserialization`, () => member.behaviour.OnDeserialization({ isSnapshot, isRollback }));
      }
    }
    /** Canonical text of every synced field of every behaviour: equal on two clients that agree. */
    snapshotText() {
      const all = {};
      for (const slot of this.slots.values()) {
        if (slot.mode === "none") continue;
        for (const member of slot.members) if (member.fields.length) all[member.id] = readFields(member.behaviour, member.fields);
      }
      return canonicalJson(all);
    }
  };

  // portkit/src/instance.ts
  var OBJECT_EVENTS = [
    "click",
    "grab",
    "drop",
    "triggerEnter",
    "triggerExit",
    "collisionEnter",
    "collisionExit",
    "uiButton",
    "uiSlider",
    "uiToggle",
    "heldTrigger",
    "heldPrimary",
    "heldSecondary",
    "field"
  ];
  var MAX_EARLY_EVENTS = 256;
  var GameInstance = class {
    constructor(platform, game2, bindings, element, inst, shared = {}) {
      __publicField(this, "platform");
      __publicField(this, "game");
      __publicField(this, "bindings");
      __publicField(this, "element");
      __publicField(this, "inst");
      __publicField(this, "core");
      __publicField(this, "scheduler");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "players");
      __publicField(this, "sync");
      __publicField(this, "events");
      __publicField(this, "commands");
      __publicField(this, "perUser");
      __publicField(this, "secrets");
      __publicField(this, "protectedValues");
      __publicField(this, "host");
      __publicField(this, "clockSync");
      __publicField(this, "storage");
      __publicField(this, "networking");
      __publicField(this, "settings", /* @__PURE__ */ new Map());
      __publicField(this, "objects", /* @__PURE__ */ new Map());
      /** Set when the instance has started its behaviours. */
      __publicField(this, "started", false);
      /** Resolves when behaviours have started (or the instance was disposed first). */
      __publicField(this, "ready", deferred());
      __publicField(this, "rule");
      __publicField(this, "kit", null);
      __publicField(this, "ordinary", []);
      __publicField(this, "byId", /* @__PURE__ */ new Map());
      __publicField(this, "addresses", /* @__PURE__ */ new Map());
      __publicField(this, "templates", []);
      __publicField(this, "playerBehaviourMap", /* @__PURE__ */ new Map());
      __publicField(this, "objectHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "hostWired", /* @__PURE__ */ new Set());
      __publicField(this, "graphHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "pendingLeaves", []);
      __publicField(this, "earlyGraphEvents", []);
      __publicField(this, "buttons", /* @__PURE__ */ new Set());
      __publicField(this, "keys", /* @__PURE__ */ new Set());
      __publicField(this, "sticks", [new Vector2(), new Vector2()]);
      __publicField(this, "triggers", [0, 0]);
      __publicField(this, "abilitiesOff", /* @__PURE__ */ new Set());
      __publicField(this, "blocksOn", /* @__PURE__ */ new Set());
      __publicField(this, "poses", null);
      __publicField(this, "triggerAt", [-Infinity, -Infinity]);
      __publicField(this, "lastClickSide", null);
      __publicField(this, "vr", null);
      __publicField(this, "reachOverride", /* @__PURE__ */ new Map());
      __publicField(this, "position", null);
      __publicField(this, "startKindValue", "idle");
      __publicField(this, "lastClockAsk", -Infinity);
      __publicField(this, "timeView");
      __publicField(this, "randomView");
      __publicField(this, "debugView");
      __publicField(this, "inputView");
      /** The page-wide object every instance of this game shares (GameRuntime.shared). */
      __publicField(this, "shared");
      this.shared = shared;
      this.platform = platform;
      this.game = game2;
      this.bindings = bindings;
      this.element = element;
      this.inst = inst;
      this.rule = game2.referee ?? "anyone";
      const options = { ...DEFAULT_OPTIONS, ...game2.options ?? {} };
      this.scheduler = new Scheduler(platform.clock, (where, error) => this.core.error(where, error));
      this.core = new Core(platform, game2.slug, inst, options, this.scheduler);
      for (const name of element.attributeNames()) this.settings.set(name, element.getAttribute(name) ?? "");
      this.presence = new Presence(this.core);
      this.referee = new Referee(this.core, this.presence, this.rule);
      this.players = new Players(this.core, this.presence, this.referee);
      this.sync = new Sync(this.core, this.presence, this.referee, this.players);
      this.clockSync = new ClockSync(platform.clock);
      this.host = new RelayHost(platform, game2.slug, inst, bindings.refs);
      this.storage = new Persistence(platform.storage, game2.slug, inst, platform.local().uid);
      this.secrets = new Secrets(this.core, this.presence, this.referee, () => this.clockSync.seconds());
      this.protectedValues = new ProtectedValues(this.core);
      this.events = new NetEvents(this.core, this.sync, {
        behaviour: (id) => this.byId.get(id) ?? null,
        playerBehaviour: (sid, id) => this.playerBehaviourMap.get(sid)?.get(id) ?? null,
        address: (behaviour) => this.addresses.get(behaviour) ?? null,
        refused: (behaviour, code, name) => this.refuse(behaviour, { kind: "event", code, key: name, final: true })
      });
      this.commands = new Commands(this.core, this.presence, this.referee, {
        resolve: (id, playerSid) => playerSid ? this.playerBehaviourMap.get(playerSid)?.get(id) ?? null : this.byId.get(id) ?? null,
        address: (behaviour) => this.addresses.get(behaviour) ?? null,
        invoke: (behaviour, name, args, fromSid) => this.events.invoke(behaviour, name, args, fromSid),
        acknowledged: (behaviour, number) => behaviour.OnCommandAcknowledged(number),
        refused: (behaviour, code, name) => this.refuse(behaviour, { kind: "event", code, key: name, final: true })
      });
      this.perUser = new PerUser(this.core, this.storage, {
        restored: (player) => this.each("OnPlayerRestored", (b) => b.OnPlayerRestored(player)),
        dataUpdated: (player, keys) => this.each("OnPlayerDataUpdated", (b) => b.OnPlayerDataUpdated(player, keys)),
        deserialized: (behaviour) => this.core.guard("OnDeserialization", () => behaviour.OnDeserialization({ isSnapshot: false, isRollback: false })),
        refused: (kind, code, key, behaviour) => this.refuse(behaviour, { kind, code, key, final: true })
      });
      this.networking = new Networking(this);
      const scheduler = this.scheduler;
      this.timeView = {
        get time() {
          return scheduler.time;
        },
        get deltaTime() {
          return scheduler.deltaTime;
        },
        get frameCount() {
          return scheduler.ticks;
        }
      };
      this.randomView = {
        get value() {
          return platform.random();
        },
        Range: (min, max) => min + (max - min) * platform.random(),
        RangeInt: (min, max) => Math.floor(min) + Math.floor((Math.floor(max) - Math.floor(min)) * platform.random()),
        Bytes: (n) => platform.crypto.getRandomValues(new Uint8Array(Math.max(0, Math.floor(n))))
      };
      const say = (level) => (message) => this.core.log(level, typeof message === "string" ? message : String(message));
      this.debugView = { Log: say("info"), LogWarning: say("warn"), LogError: say("error") };
      const owner = this;
      this.inputView = {
        GetButton: (button, side) => this.buttons.has(`${side}/${button}`),
        GetThumbstick: (side) => this.sticks[side].clone(),
        GetTrigger: (side) => this.triggers[side],
        GetKey: (key) => this.keys.has(key),
        get Poses() {
          return owner.poses;
        },
        get Position() {
          return owner.position ? owner.position.clone() : null;
        },
        Haptic: (side, strength, seconds) => platform.haptic(side, strength, seconds),
        get LastClickSide() {
          return owner.lastClickSide;
        },
        get IsVR() {
          return owner.vr;
        },
        InReach: (point, metres) => !(metres > 0) || this.nearestDistance(point) <= metres,
        TeleportTo: (position, yDegrees, stopMovement = true) => {
          this.position = position.clone();
          platform.teleport(position, yDegrees, stopMovement);
        },
        SetAbility: (ability, allowed) => {
          if (allowed) this.abilitiesOff.delete(ability);
          else this.abilitiesOff.add(ability);
          platform.setAbility(ability, allowed);
        },
        SetBlock: (control, blocked) => {
          if (blocked) this.blocksOn.add(control);
          else this.blocksOn.delete(control);
          platform.setBlock(control, blocked);
        }
      };
    }
    // ---- starting -----------------------------------------------------------------------------------------------
    /** Runs the start gate: platform, kit, snapshot, clock, keys, an id, a referee; then starts the behaviours. */
    async start() {
      const { platform, core } = this;
      try {
        await platform.whenReady();
        if (core.disposed) return;
        core.me = platform.local();
        core.listen();
        core.own(
          platform.onRelay(relayKey(core.slug, core.inst), {
            clock: (requestId, seconds) => this.host.onClockReply(requestId, seconds),
            event: (name, args) => this.onGraphEvent(name, args)
          })
        );
        core.own(platform.onPose((poses) => this.onPose(poses)));
        void platform.isVR().then((vr) => this.vr = vr, () => this.vr = false);
        core.own(platform.onInput((event) => this.onInput(event)));
        core.own(platform.onStateError(core.prefix + ".", (path, code, final) => this.onRefusedPath(path.slice(core.prefix.length + 1), code, final)));
        await this.loadKit();
        if (core.disposed) return;
        const snapshot = await platform.whenSnapshot(core.options.snapshotTimeoutMs);
        if (core.disposed) return;
        if (!snapshot) core.log("warn", "no full state snapshot arrived in time; starting from what is mirrored");
        await this.askClock(true);
        if (core.disposed) return;
        const saved = storagePrefix(core.slug, core.inst, core.me.uid);
        const publicKey = await this.secrets.init(platform.storage, saved + "ecdh", saved + "draw");
        if (core.disposed) return;
        this.players.on((kind, player) => this.onPlayer(kind, player));
        this.referee.on((now, before) => this.onReferee(now?.sid ?? null, before?.sid ?? null));
        this.presence.start();
        this.presence.announce(publicKey);
        this.referee.start();
        this.players.start();
        this.secrets.listen();
        this.commands.listen();
        this.perUser.listen();
        this.protectedValues.listen();
        this.events.listen();
        this.secrets.onDrawChanged = (sid, label, status) => {
          const player = this.players.bySid(sid);
          if (player && this.started) this.each("OnDrawChanged", (b) => b.OnDrawChanged(player, label, status.state));
        };
        this.protectedValues.onChanged = (key) => {
          if (this.started) this.each("OnProtectedChanged", (b) => b.OnProtectedChanged(key));
        };
        const warn = this.scheduler.after(core.options.admitWarnMs, () => {
          core.log("warn", `still waiting to start: ${this.players.local ? "no referee has been elected" : "the local player's id has not settled"}`);
        });
        await this.players.whenLocalAssigned();
        if (this.rule === "anyone") await this.whenReferee();
        this.scheduler.cancel(warn);
        if (core.disposed) return;
        this.begin();
      } catch (error) {
        core.error("start", error);
      } finally {
        this.ready.resolve(this.started);
      }
    }
    whenReferee() {
      if (this.referee.current()) return Promise.resolve();
      const gate = deferred();
      this.referee.on((now) => {
        if (now) gate.resolve();
      });
      return gate.promise;
    }
    async loadKit() {
      const { core, bindings, element } = this;
      const address = (attr, fallback) => {
        const value = (element.getAttribute(attr) ?? "").trim();
        return /^https?:\/\//i.test(value) ? value : fallback;
      };
      const released = this.platform.bundles(core.slug);
      const windows = address("windows", released?.windows || bindings.bundles.windows);
      const android = address("android", released?.android || bindings.bundles.android);
      const keys = Object.keys(bindings.objects);
      if (windows || android) {
        const spec = {
          holderName: holderName(core.slug, core.inst),
          rootName: (bindings.root ?? bindings.slug) + "(Clone)",
          windows,
          android,
          position: triple(element.getAttribute("position"), false),
          rotation: triple(element.getAttribute("rotation"), false),
          scale: triple(element.getAttribute("scale"), true),
          objects: keys.map((key) => {
            const o = bindings.objects[key];
            const synced = o.sync === "transform" || o.seat;
            return { key, path: o.path, networkId: synced ? networkId(core.slug, core.inst, key) : "", sync: o.sync, grab: o.grab, click: o.click, seat: o.seat };
          })
        };
        try {
          this.kit = await this.platform.loadKit(spec);
          if (this.kit.missing.length) core.log("error", `kit objects not found: ${this.kit.missing.join(", ")}`);
        } catch (error) {
          core.error("the kit did not load", error);
        }
      } else if (keys.length) core.log("warn", "no bundle address for this kit (bindings.bundles is empty and the element names none): running without objects");
      if (core.disposed) {
        this.kit?.destroy();
        this.kit = null;
        return;
      }
      for (const key of keys) {
        const path = bindings.objects[key].path;
        const subscribe2 = (kind, handler) => this.addObjectHandler(key, kind, handler);
        this.objects.set(key, new GameObject(key, path.slice(path.lastIndexOf("/") + 1), this.kit?.objects.get(key) ?? null, this.host, subscribe2));
      }
      this.host.fallbackActive = (key, active) => {
        const object = this.kit?.objects.get(key);
        if (!object) return false;
        object.setActive(active);
        return true;
      };
      let hidden = 0;
      for (const key of keys) {
        if (bindings.objects[key].active !== false) continue;
        this.objects.get(key).SetActive(false);
        hidden++;
      }
      if (hidden) this.host.flush();
      this.host.fallbackClip = (key, index) => {
        const object = this.kit?.objects.get(key);
        if (!object) return false;
        object.playClip(index);
        return true;
      };
      if (!this.kit) return;
      const reads = keys.map((key) => this.objects.get(key).transform.Refresh().catch(() => void 0));
      const waited = deferred();
      const limit = this.scheduler.after(3e3, () => waited.resolve());
      await Promise.race([Promise.all(reads), waited.promise]);
      this.scheduler.cancel(limit);
      for (const key of keys) {
        const o = bindings.objects[key];
        const hostObject = this.kit.objects.get(key);
        if (!hostObject || !(o.grab || o.sync === "transform")) continue;
        const transform = this.objects.get(key).transform;
        core.own(hostObject.watchTransform((pose2) => transform._report(pose2.position, pose2.rotation)));
      }
    }
    async askClock(first) {
      const sentAt = this.platform.clock.now();
      this.lastClockAsk = sentAt;
      const answer = this.host.requestClock().then((seconds) => {
        if (!this.core.disposed) this.clockSync.accept(seconds, sentAt);
        return true;
      });
      if (!first) return;
      const gate = deferred();
      const timer = this.scheduler.after(this.core.options.clockTimeoutMs, () => gate.resolve(false));
      const ok = await Promise.race([answer, gate.promise]);
      this.scheduler.cancel(timer);
      if (!ok) this.core.log("warn", "the synced clock did not answer; using this device's clock until it does");
    }
    begin() {
      const { core } = this;
      this.createBehaviours();
      this.wireEvents();
      this.sync.onLocalOwnership = (slot, mine) => {
        if (!mine) return;
        for (const member of slot.members) {
          const key = this.addresses.get(member.behaviour) ? member.behaviour.gameObject.key : "";
          if (key && this.bindings.objects[key]?.sync === "transform") member.behaviour.gameObject.TakeOwnership();
        }
      };
      this.sync.attach();
      for (const behaviour of this.ordinary) core.guard(`${this.idOf(behaviour)}.Start`, () => behaviour.Start());
      this.sync.applySnapshot();
      this.startKindValue = this.computeStartKind();
      this.sync.begin();
      this.commands.started = true;
      this.perUser.started = true;
      this.started = true;
      this.perUser.dataEnabled = this.perUser.dataEnabled || this.anyOverrides("OnPlayerRestored") || this.anyOverrides("OnPlayerDataUpdated");
      this.perUser.restoreLocal();
      for (const behaviour of this.ordinary) core.guard(`${this.idOf(behaviour)}.OnInstanceStart`, () => behaviour.OnInstanceStart(this.startKindValue));
      for (const player of this.players.list()) this.deliverJoin(player);
      this.sync.takeOver();
      this.secrets.review();
      this.commands.review();
      for (const early of this.earlyGraphEvents.splice(0)) this.onGraphEvent(early.name, early.args);
      this.scheduler.start(() => this.tick());
      this.tick();
      let extra = {};
      if (this.game.debug) core.guard("debug hooks", () => extra = this.game.debug(this));
      this.platform.expose(relayKey(core.slug, core.inst), {
        ...extra,
        digest: () => this.digest(),
        state: () => JSON.parse(this.sync.snapshotText()),
        referee: () => this.referee.current(),
        players: () => this.players.list().map((p) => ({ id: p.playerId, name: p.displayName, sid: p.sid }))
      });
      core.log("info", `started (${this.startKindValue}) as ${this.players.local}, ${this.ordinary.length} behaviours`);
    }
    computeStartKind() {
      const ref = this.referee.current();
      if (!ref) return "idle";
      const claim = this.referee.lastClaim;
      if (ref.sid !== this.core.me.sid || !claim || claim.term !== ref.term) return "joined";
      if (claim.fresh) return "fresh";
      return claim.alive ? "joined" : "resumed";
    }
    // ---- behaviours ---------------------------------------------------------------------------------------------
    createBehaviours() {
      const { core, bindings } = this;
      const made = [];
      for (const binding of bindings.behaviours) {
        const cls = this.game.behaviours[binding.type];
        if (!cls) {
          core.log("error", `bindings name behaviour type '${binding.type}' (${binding.id}), which the game does not define`);
          continue;
        }
        if (binding.perPlayer === true || cls.perPlayer === true) {
          this.templates.push({ binding, cls });
          continue;
        }
        const behaviour = new cls();
        linkBehaviour(behaviour, this.makeLink(behaviour, binding, null));
        this.addresses.set(behaviour, { id: binding.id, type: binding.type, playerSid: null });
        this.byId.set(binding.id, behaviour);
        this.ordinary.push(behaviour);
        made.push({ behaviour, binding, cls });
      }
      this.perUser.declareTypes(this.templates.map((t) => t.binding.id));
      for (const { behaviour, binding, cls } of made) {
        this.assignBindingFields(behaviour, binding, null);
        const fields = cls.synced ?? [];
        for (const field of fields) if (!(field in behaviour)) core.log("warn", `${binding.id}: synced field '${field}' is not a field of ${binding.type}`);
        this.sync.add(behaviour, binding.id, fields, fields.length ? cls.syncMode ?? "manual" : "none", cls.fieldChangeCallbacks, binding.group);
      }
    }
    makePlayerBehaviours(player) {
      if (!this.templates.length || this.playerBehaviourMap.has(player.sid)) return;
      const mine = /* @__PURE__ */ new Map();
      this.playerBehaviourMap.set(player.sid, mine);
      const made = [];
      for (const template of this.templates) {
        const behaviour = new template.cls();
        linkBehaviour(behaviour, this.makeLink(behaviour, template.binding, player));
        this.addresses.set(behaviour, { id: template.binding.id, type: template.binding.type, playerSid: player.sid });
        mine.set(template.binding.id, behaviour);
        made.push({ behaviour, template });
      }
      for (const { behaviour, template } of made) this.assignBindingFields(behaviour, template.binding, mine);
      for (const { behaviour, template } of made) {
        const id = template.binding.id;
        this.core.guard(`${id}.Start`, () => behaviour.Start());
        const hasData = this.perUser.adopt(player, id, behaviour, template.cls.synced ?? [], template.cls.persistent === true, template.cls.fieldChangeCallbacks);
        if (hasData) this.core.guard(`${id}.OnDeserialization`, () => behaviour.OnDeserialization({ isSnapshot: true, isRollback: false }));
      }
    }
    makeLink(behaviour, binding, player) {
      const gameObject = (binding.object ? this.objects.get(binding.object) : void 0) ?? new GameObject("", binding.id, null, null);
      const instance = this;
      return {
        id: binding.id,
        gameObject,
        networking: this.networking,
        time: this.timeView,
        random: this.randomView,
        debug: this.debugView,
        secrets: this.secrets,
        storage: this.storage,
        host: this.host,
        settings: this.settings,
        playerData: this.perUser,
        input: this.inputView,
        protectedValues: this.protectedValues,
        player,
        instanceKey: this.inst,
        shared: this.shared,
        reach: this.reachOverride,
        requestSerialization() {
          if (player) {
            if (player.isLocal) instance.perUser.requestSerialization(behaviour);
            return;
          }
          const slot = instance.sync.slotOf(behaviour);
          if (slot) instance.sync.requestSerialization(slot);
        },
        sendNetworkEvent(target, name, args) {
          instance.events.send(behaviour, target, name, args);
        },
        sendCommand(name, args) {
          return instance.commands.send(behaviour, name, args);
        },
        delaySeconds(name, seconds) {
          instance.scheduler.after(seconds * 1e3, () => instance.callByName(behaviour, name));
        },
        delayFrames(name, frames) {
          instance.scheduler.afterTicks(frames, () => instance.callByName(behaviour, name));
        },
        find: (id) => {
          const sibling = player ? this.playerBehaviourMap.get(player.sid)?.get(id) : void 0;
          return sibling ?? this.byId.get(id) ?? null;
        },
        findByType: (type) => this.ordinary.filter((b) => this.addresses.get(b)?.type === type),
        playerBehaviour: (who, type) => this.playerBehaviourOf(who, type),
        playerBehaviours: (type) => this.players.list().map((p) => this.playerBehaviourOf(p, type)).filter((b) => b !== null),
        raycast: (origin, direction, maxDistance, layerMask) => this.platform.raycast(origin, direction, maxDistance, layerMask),
        onGraphEvent: (name, method) => this.addGraphHandler(name, behaviour, method)
      };
    }
    playerBehaviourOf(player, type) {
      const mine = this.playerBehaviourMap.get(player.sid);
      if (!mine) return null;
      for (const behaviour of mine.values()) if (this.addresses.get(behaviour)?.type === type) return behaviour;
      return mine.get(type) ?? null;
    }
    callByName(behaviour, name) {
      if (this.core.disposed) return;
      const fn = behaviour[name];
      if (typeof fn === "function") this.core.guard(name, () => fn.call(behaviour));
      else this.core.log("warn", `${this.idOf(behaviour)} has no method '${name}' for a delayed event`);
    }
    assignBindingFields(behaviour, binding, siblings) {
      if (!binding.fields) return;
      const bag = behaviour;
      for (const name of Object.keys(binding.fields)) bag[name] = this.resolveField(binding.fields[name], siblings, `${binding.id}.${name}`, binding.object ?? null);
    }
    /** Turns a bindings field value into what the behaviour holds: objects, behaviours, component proxies, values. */
    resolveField(value, siblings, where, ownObject) {
      if (Array.isArray(value)) return value.map((v, i) => this.resolveField(v, siblings, `${where}[${i}]`, ownObject));
      if (!isRecord(value)) return value;
      if (typeof value.$obj === "string") return this.objects.get(value.$obj) ?? null;
      if (typeof value.$beh === "string") {
        const found = siblings?.get(value.$beh) ?? this.byId.get(value.$beh) ?? null;
        if (!found) this.core.log("warn", `${where}: behaviour '${value.$beh}' is per-player or missing, so the field is null`);
        return found;
      }
      if (typeof value.$comp === "string") {
        const object = this.objects.get(value.$comp);
        return object ? makeComponent(String(value.kind ?? "Transform"), object, this.host) : null;
      }
      if (typeof value.$clip === "number") return new AudioClipRef(value.$clip, typeof value.on === "string" ? value.on : null);
      if (Object.keys(value).some((key) => key.startsWith("$"))) return decodeValue(value);
      const out = {};
      for (const key of Object.keys(value)) out[key] = this.resolveField(value[key], siblings, `${where}.${key}`, ownObject);
      return out;
    }
    idOf(behaviour) {
      return this.addresses.get(behaviour)?.id ?? "?";
    }
    all() {
      const out = this.ordinary.slice();
      for (const mine of this.playerBehaviourMap.values()) for (const behaviour of mine.values()) out.push(behaviour);
      return out;
    }
    overrides(behaviour, method) {
      return behaviour[method] !== Behaviour.prototype[method];
    }
    anyOverrides(method) {
      if (this.ordinary.some((b) => this.overrides(b, method))) return true;
      return this.templates.some((t) => t.cls.prototype[method] !== Behaviour.prototype[method]);
    }
    /** Calls a callback on every behaviour that overrides it. */
    each(method, call) {
      if (!this.started || this.core.disposed) return;
      for (const behaviour of this.all()) {
        if (this.overrides(behaviour, method)) this.core.guard(`${this.idOf(behaviour)}.${String(method)}`, () => call(behaviour));
      }
    }
    // ---- players and referee ------------------------------------------------------------------------------------
    onPlayer(kind, player) {
      if (!this.started || this.core.disposed) return;
      if (kind === "join") {
        this.deliverJoin(player);
        return;
      }
      if (!this.referee.current()) {
        this.pendingLeaves.push(player);
        if (this.rule === "anyone") this.scheduler.after(5e3, () => this.flushLeaves());
        return;
      }
      this.deliverLeave(player);
    }
    flushLeaves() {
      for (const player of this.pendingLeaves.splice(0)) this.deliverLeave(player);
    }
    deliverJoin(player) {
      this.makePlayerBehaviours(player);
      this.each("OnPlayerJoined", (b) => b.OnPlayerJoined(player));
      this.perUser.playerDelivered(player);
    }
    deliverLeave(player) {
      this.each("OnPlayerLeft", (b) => b.OnPlayerLeft(player));
      const gone = this.perUser.playerGone(player.sid);
      const mine = this.playerBehaviourMap.get(player.sid);
      this.playerBehaviourMap.delete(player.sid);
      for (const behaviour of mine ? mine.values() : gone) {
        this.core.guard("OnDestroy", () => behaviour.OnDestroy());
        this.addresses.delete(behaviour);
      }
    }
    onReferee(now, before) {
      if (!this.started || this.core.disposed) return;
      if (now !== before) {
        const wasIdle = this.startKindValue === "idle";
        if (wasIdle && now !== null) {
          this.startKindValue = this.computeStartKind();
          this.each("OnInstanceStart", (b) => b.OnInstanceStart(this.startKindValue));
        }
        const player = now === null ? null : this.players.bySid(now);
        if (player || now === null && this.referee.candidates().length === 0) this.each("OnMasterTransferred", (b) => b.OnMasterTransferred(player));
      }
      if (now !== null) this.flushLeaves();
    }
    // NetHost
    localPlayer() {
      const local = this.players.local;
      if (!local) throw new Error("the local player is not known before the instance has started");
      return local;
    }
    isReferee() {
      return this.referee.isMe();
    }
    owner(target) {
      const address = this.addresses.get(target);
      if (address?.playerSid) return this.players.bySid(address.playerSid);
      const slot = this.sync.slotOf(target);
      return slot ? this.sync.owner(slot) : null;
    }
    isOwner(target, player) {
      const address = this.addresses.get(target);
      if (address?.playerSid) return address.playerSid === player.sid;
      const slot = this.sync.slotOf(target);
      return slot ? this.sync.isOwner(slot, player.sid) : false;
    }
    setOwner(target, player) {
      if (this.addresses.get(target)?.playerSid) {
        this.core.log("warn", `${this.idOf(target)} is a per-player behaviour: its owner cannot change`);
        return;
      }
      const slot = this.sync.slotOf(target);
      if (slot) this.sync.setOwner(slot, player.sid, player.uid);
    }
    behavioursOn(object) {
      return this.ordinary.filter((b) => b.gameObject === object);
    }
    serverSeconds() {
      return this.clockSync.seconds();
    }
    playerList() {
      return this.players.list();
    }
    playerById(id) {
      return this.players.byId(id);
    }
    callingPlayer() {
      return this.events.callingSid === null ? null : this.players.bySid(this.events.callingSid);
    }
    callingSession() {
      const sid = this.events.callingSid;
      if (sid === null) return null;
      const who = this.platform.players().find((p) => p.sid === sid);
      return { sid, uid: who ? who.uid : "" };
    }
    setCandidate(on) {
      if (this.rule !== "declared") {
        this.core.log("warn", 'SetRefereeCandidate only matters in a game whose definition says referee: "declared"');
        return;
      }
      this.referee.setCandidate(on);
    }
    isCandidate(player) {
      return this.referee.isCandidate(player.sid);
    }
    startKind() {
      return this.startKindValue;
    }
    refereePlayer() {
      const ref = this.referee.current();
      return ref ? this.players.bySid(ref.sid) : null;
    }
    // ---- events from objects, graphs and input ------------------------------------------------------------------
    wireEvents() {
      const explicit = /* @__PURE__ */ new Set();
      const mine = (id) => () => this.playerBehaviourMap.get(this.core.me.sid)?.get(id) ?? null;
      for (const event of this.bindings.events) {
        if (!event.behaviour || !event.method) continue;
        const ordinary = this.byId.get(event.behaviour);
        const perPlayer = !ordinary && this.templates.some((t) => t.binding.id === event.behaviour);
        if (!ordinary && !perPlayer) continue;
        const target = ordinary ?? mine(event.behaviour);
        if (event.kind === "graph") {
          this.addGraphHandler(event.name ?? "", target, event.method);
          continue;
        }
        explicit.add(`${event.object}/${event.kind}/${event.behaviour}`);
        this.addObjectHandler(event.object, event.kind, (detail) => {
          const behaviour = typeof target === "function" ? target() : target;
          if (behaviour) this.callBound(behaviour, event, detail);
        });
      }
      for (const template of this.templates) {
        const key = template.binding.object;
        const object = key ? this.bindings.objects[key] : void 0;
        if (!key || !object) continue;
        const id = template.binding.id;
        const proto = template.cls.prototype;
        const base = Behaviour.prototype;
        if (object.click && proto.Interact !== base.Interact && !explicit.has(`${key}/click/${id}`)) {
          this.addObjectHandler(key, "click", (detail) => {
            const behaviour = mine(id)();
            if (behaviour && this.withinReach(behaviour, void 0, template.cls.interactReach ?? 0, detail)) this.core.guard(`${id}.Interact`, () => behaviour.Interact());
          });
        }
        if (object.grab && proto.OnPickup !== base.OnPickup && !explicit.has(`${key}/grab/${id}`)) {
          this.addObjectHandler(key, "grab", () => mine(id)()?.OnPickup());
        }
        if (object.grab && proto.OnDrop !== base.OnDrop && !explicit.has(`${key}/drop/${id}`)) {
          this.addObjectHandler(key, "drop", () => mine(id)()?.OnDrop());
        }
      }
      for (const behaviour of this.ordinary) {
        const key = behaviour.gameObject.key;
        const object = key ? this.bindings.objects[key] : void 0;
        if (!object) continue;
        const id = this.idOf(behaviour);
        const cls = behaviour.constructor;
        if (object.click && this.overrides(behaviour, "Interact") && !explicit.has(`${key}/click/${id}`)) {
          this.addObjectHandler(key, "click", (detail) => {
            if (this.withinReach(behaviour, void 0, cls.interactReach ?? 0, detail)) this.core.guard(`${id}.Interact`, () => behaviour.Interact());
          });
        }
        if (object.grab && this.overrides(behaviour, "OnPickup") && !explicit.has(`${key}/grab/${id}`)) {
          this.addObjectHandler(key, "grab", () => this.core.guard(`${id}.OnPickup`, () => behaviour.OnPickup()));
        }
        if (object.grab && this.overrides(behaviour, "OnDrop") && !explicit.has(`${key}/drop/${id}`)) {
          this.addObjectHandler(key, "drop", () => this.core.guard(`${id}.OnDrop`, () => behaviour.OnDrop()));
        }
      }
    }
    callBound(behaviour, event, detail) {
      const cls = behaviour.constructor;
      if (event.kind === "click" && !this.withinReach(behaviour, event.reach, cls.interactReach ?? 0, detail)) return;
      const fn = behaviour[event.method];
      if (typeof fn !== "function") {
        this.core.log("warn", `${event.behaviour} has no method '${event.method}' (bound to ${event.kind} of ${event.object})`);
        return;
      }
      let argument = detail;
      if (event.kind === "uiSlider") argument = Number(detail.arg ?? "0");
      else if (event.kind === "uiToggle") argument = detail.arg === "1" || detail.arg === "true" || detail.arg === "True";
      else if (event.kind === "field") argument = detail.arg ?? "";
      this.core.guard(`${event.behaviour}.${event.method}`, () => fn.call(behaviour, argument));
    }
    /**
     * True when a click is close enough to count: measured from the nearest of the local head and hands. The reach is
     * the behaviour's own (InteractReach), else the binding's, else the class's, else the game's. With no pose
     * reported yet, every click counts.
     */
    withinReach(behaviour, eventReach, classReach, detail) {
      const own = this.reachOverride.get(behaviour);
      const reach = own !== void 0 ? own : eventReach !== void 0 ? eventReach : classReach > 0 ? classReach : this.game.interactReach ?? 0;
      if (!(reach > 0)) return true;
      const transform = behaviour.gameObject.transform;
      const point = detail.point ?? (transform.known ? transform.position : null);
      if (!point) return true;
      return this.nearestDistance(point) <= reach;
    }
    /** Metres from `point` to the nearest of the local head and hands; 0 when no pose or position is known. */
    nearestDistance(point) {
      const poses = this.poses;
      const from = poses ? [poses.head.position, poses.leftHand.position, poses.rightHand.position] : this.position ? [this.position] : [];
      if (!from.length) return 0;
      let nearest = Infinity;
      for (const p of from) nearest = Math.min(nearest, Vector3.Distance(p, point));
      return nearest;
    }
    /** The hand that clicked: the one whose trigger went down in the last second, else the one nearest the point. */
    clickSide(point) {
      const now = this.platform.clock.now();
      const [left, right] = this.triggerAt;
      const recent = Math.max(left, right);
      if (now - recent <= 1e3) return right >= left ? 1 : 0;
      if (!this.poses || !point) return null;
      return Vector3.Distance(this.poses.rightHand.position, point) <= Vector3.Distance(this.poses.leftHand.position, point) ? 1 : 0;
    }
    addObjectHandler(objKey, kind, handler) {
      let kinds = this.objectHandlers.get(objKey);
      if (!kinds) this.objectHandlers.set(objKey, kinds = /* @__PURE__ */ new Map());
      let list = kinds.get(kind);
      if (!list) kinds.set(kind, list = []);
      list.push(handler);
      const wire = `${objKey}/${kind}`;
      const hostObject = this.kit?.objects.get(objKey);
      if (hostObject && !this.hostWired.has(wire)) {
        this.hostWired.add(wire);
        this.core.own(hostObject.on(kind, (detail) => this.dispatchObject(objKey, kind, detail)));
      }
    }
    /** Delivers an object's event to what is bound to it. Also the entry point for events a graph raised. */
    dispatchObject(objKey, kind, detail) {
      if (!this.started || this.core.disposed) return;
      if (kind === "click") {
        if (detail.side === void 0) {
          const side = this.clickSide(detail.point);
          if (side !== null) detail.side = side;
        }
        this.lastClickSide = detail.side === 0 || detail.side === 1 ? detail.side : null;
      }
      const handlers = this.objectHandlers.get(objKey)?.get(kind);
      if (!handlers || !handlers.length) return;
      const run = () => {
        if (this.core.disposed) return;
        for (const handler of handlers.slice()) this.core.guard(`${objKey} ${kind}`, () => handler(detail));
      };
      const object = this.objects.get(objKey);
      if (kind === "drop" && object && object.host) {
        object.transform.Refresh().then(run, run);
        return;
      }
      run();
    }
    addGraphHandler(name, behaviour, method) {
      if (!name) return;
      let list = this.graphHandlers.get(name);
      if (!list) this.graphHandlers.set(name, list = []);
      list.push({ behaviour, method });
    }
    onGraphEvent(name, args) {
      if (this.core.disposed) return;
      if (!this.started) {
        if (this.earlyGraphEvents.length < MAX_EARLY_EVENTS) this.earlyGraphEvents.push({ name, args });
        return;
      }
      if (OBJECT_EVENTS.indexOf(name) >= 0) {
        const key = this.keyOfTarget(args[0] ?? "");
        if (!key) return;
        const detail = { arg: args[1], args: args.slice(1) };
        if (name.startsWith("collision") || name.startsWith("trigger")) {
          const n = args.slice(2, 8).map(Number);
          if (args[1] !== void 0) detail.otherName = args[1];
          if (n.length >= 3 && n.slice(0, 3).every(Number.isFinite)) detail.point = new Vector3(n[0], n[1], n[2]);
          if (n.length >= 6 && n.slice(3, 6).every(Number.isFinite)) detail.normal = new Vector3(n[3], n[4], n[5]);
        }
        if (name.startsWith("held") && args[1] === "left") detail.side = 0;
        else if (name.startsWith("held") && args[1] === "right") detail.side = 1;
        this.dispatchObject(key, name, detail);
        return;
      }
      const handlers = this.graphHandlers.get(name);
      if (!handlers) return;
      for (const handler of handlers.slice()) {
        const behaviour = typeof handler.behaviour === "function" ? handler.behaviour() : handler.behaviour;
        const method = handler.method;
        if (!behaviour) continue;
        const fn = behaviour[method];
        if (typeof fn === "function") this.core.guard(`${this.idOf(behaviour)}.${method}`, () => fn.apply(behaviour, args));
      }
    }
    /** A relay target ("3", "@Board/Cup") or a binding key, as a binding key. */
    keyOfTarget(target) {
      if (target.startsWith("@")) {
        const path = target.slice(1);
        for (const key of Object.keys(this.bindings.objects)) if (this.bindings.objects[key].path === path) return key;
        return null;
      }
      if (/^\d+$/.test(target)) return this.bindings.refs[Number(target)] ?? null;
      return target in this.bindings.objects ? target : null;
    }
    onPose(poses) {
      this.poses = poses;
      this.position = poses.head.position;
    }
    onInput(event) {
      if (this.core.disposed) return;
      if (event.type === "button") {
        const id = `${event.side}/${event.button}`;
        if (event.pressed && event.button === 0) this.triggerAt[event.side] = this.platform.clock.now();
        if (event.pressed) this.buttons.add(id);
        else this.buttons.delete(id);
        const { button, side } = event;
        if (event.pressed) this.each("OnButtonPressed", (b) => b.OnButtonPressed(button, side));
        else this.each("OnButtonReleased", (b) => b.OnButtonReleased(button, side));
      } else if (event.type === "thumbstick") {
        this.sticks[event.side] = new Vector2(event.x, event.y);
      } else if (event.type === "trigger") {
        this.triggers[event.side] = event.value;
      } else {
        const key = event.key;
        if (event.pressed) this.keys.add(key);
        else this.keys.delete(key);
        if (event.pressed) this.each("OnKeyPressed", (b) => b.OnKeyPressed(key));
        else this.each("OnKeyReleased", (b) => b.OnKeyReleased(key));
      }
    }
    // ---- the tick -----------------------------------------------------------------------------------------------
    tick() {
      const { core } = this;
      if (core.disposed) return;
      for (const behaviour of this.all()) {
        if (this.overrides(behaviour, "Update")) core.guard(`${this.idOf(behaviour)}.Update`, () => behaviour.Update());
      }
      this.sync.flush();
      this.perUser.flush();
      this.presence.flush();
      this.host.flush();
      if (this.scheduler.ticks % 20 === 0) {
        this.presence.tend();
        this.players.tend();
        this.secrets.review();
        this.commands.review();
        this.sync.takeOver();
        if (this.platform.clock.now() - this.lastClockAsk >= core.options.clockResyncMs) void this.askClock(false);
      }
    }
    // ---- refused writes -----------------------------------------------------------------------------------------
    onRefusedPath(key, code, final) {
      if (this.core.disposed) return;
      this.core.log(final ? "error" : "warn", `the room ${final ? "refused" : "is holding back"} a write to ${key}: ${code}`);
      if (key === "d" || /^p[0-3]$/.test(key)) {
        this.refuse(null, { kind: key === "d" ? "playerData" : "playerObject", code, key, final });
        return;
      }
      if (key.startsWith("x.")) {
        this.refuse(null, { kind: "protected", code, key: key.slice(2), final });
        return;
      }
      const slot = this.sync.slotForKey(key);
      if (!slot) {
        this.refuse(null, { kind: "state", code, key, final });
        return;
      }
      for (const member of slot.members) {
        if (final && !key.startsWith("o.")) this.core.guard("OnPostSerialization", () => member.behaviour.OnPostSerialization({ success: false, byteCount: 0 }));
        this.core.guard("OnWriteRefused", () => member.behaviour.OnWriteRefused({ kind: "state", code, key, final }));
      }
    }
    /** Reports a refusal to the behaviour it belongs to, or to every behaviour that listens and to the game. */
    refuse(behaviour, refusal) {
      if (behaviour) {
        this.core.guard("OnWriteRefused", () => behaviour.OnWriteRefused(refusal));
        return;
      }
      this.each("OnWriteRefused", (b) => b.OnWriteRefused(refusal));
      if (this.game.onWriteRefused) this.core.guard("onWriteRefused", () => this.game.onWriteRefused(refusal));
    }
    // ---- inspection and teardown --------------------------------------------------------------------------------
    /** An ordinary behaviour by its bindings id (for tests and for the page registry). */
    behaviour(id) {
      const found = this.byId.get(id);
      if (!found) throw new Error(`no behaviour '${id}' in ${this.core.slug}:${this.inst}`);
      return found;
    }
    /** A per-player behaviour: the copy of `id` that belongs to the player with session `sid`. */
    playerBehaviour(sid, id) {
      return this.playerBehaviourMap.get(sid)?.get(id) ?? null;
    }
    /** A short hash of every synced field: equal on clients that agree. */
    digest() {
      return fnv1a(this.sync.snapshotText());
    }
    dispose() {
      const { core } = this;
      if (core.disposed) return;
      if (this.started) for (const behaviour of this.all()) core.guard("OnDestroy", () => behaviour.OnDestroy());
      for (const ability of this.abilitiesOff) this.platform.setAbility(ability, true);
      for (const control of this.blocksOn) this.platform.setBlock(control, false);
      this.presence.retire();
      this.perUser.retire();
      this.host.abandonClock();
      this.platform.expose(relayKey(core.slug, core.inst), null);
      core.dispose();
      this.kit?.destroy();
      this.kit = null;
      this.ready.resolve(false);
    }
  };
  function triple(text, uniform) {
    if (!text) return null;
    const parts = text.trim().split(/\s+/).map(Number);
    if (parts.some((n) => !Number.isFinite(n))) return null;
    if (parts.length === 3) return new Vector3(parts[0], parts[1], parts[2]);
    if (uniform && parts.length === 1) return new Vector3(parts[0], parts[0], parts[0]);
    return null;
  }

  // portkit/src/boot.ts
  var RUNTIME_VERSION = "0.1.0";
  var GameRuntime = class {
    constructor(platform, game2, bindings) {
      __publicField(this, "platform");
      __publicField(this, "game");
      __publicField(this, "bindings");
      /** Running instances by instance key. */
      __publicField(this, "instances", /* @__PURE__ */ new Map());
      /** One object for every instance of this game on the page (Behaviour.Shared): page memory, not synced or saved. */
      __publicField(this, "shared", {});
      __publicField(this, "stopped", false);
      __publicField(this, "unsubs", []);
      this.platform = platform;
      this.game = game2;
      this.bindings = bindings;
    }
    /** Waits for the page, then serves every element of this game, now and later. */
    async start() {
      await this.platform.whenReady();
      if (this.stopped) return;
      this.unsubs.push(this.platform.onSnippetsChanged(() => this.scan()));
      this.unsubs.push(
        this.platform.onSessionChanged(() => {
          this.platform.log("warn", `[${this.game.slug}] the session changed; restarting every instance`);
          for (const instance of this.instances.values()) instance.dispose();
          this.instances.clear();
          this.scan();
        })
      );
      this.scan();
    }
    /** Brings the running instances in line with the elements on the page. */
    scan() {
      if (this.stopped) return;
      const wanted = /* @__PURE__ */ new Map();
      for (const element of this.platform.snippets(this.game.slug)) {
        if (!element.connected || !element.active) continue;
        const key = instanceKeyFor({ room: element.getAttribute("room"), instance: element.getAttribute("instance") }, element.index);
        if (wanted.has(key)) {
          this.platform.log("warn", `[${this.game.slug}] two elements resolve to instance '${key}' (same room or instance attribute); the second is ignored`);
          continue;
        }
        wanted.set(key, element);
      }
      for (const [key, instance] of [...this.instances]) {
        if (wanted.get(key) === instance.element) continue;
        instance.dispose();
        this.instances.delete(key);
      }
      for (const [key, element] of wanted) {
        if (this.instances.has(key)) continue;
        const instance = new GameInstance(this.platform, this.game, this.bindings, element, key, this.shared);
        this.instances.set(key, instance);
        void instance.start();
      }
    }
    instance(key) {
      return this.instances.get(key);
    }
    stop() {
      this.stopped = true;
      for (const unsub of this.unsubs.splice(0)) unsub();
      for (const instance of this.instances.values()) instance.dispose();
      this.instances.clear();
    }
  };
  function boot(platform, game2, rawBindings) {
    if (!isValidSlug(game2.slug)) throw new Error(`'${game2.slug}' is not a valid slug`);
    const bindings = validateBindings(rawBindings);
    if (bindings.slug !== game2.slug) throw new Error(`bindings.json is for '${bindings.slug}', the game is '${game2.slug}'`);
    if (!platform.claimGame(game2.slug, { runtime: RUNTIME_VERSION, bindings: bindings.hash ?? "" })) return null;
    const runtime = new GameRuntime(platform, game2, bindings);
    runtime.start().catch((error) => platform.log("error", `[${game2.slug}] could not start: ${error instanceof Error ? error.message : String(error)}`));
    return runtime;
  }

  // portkit/src/types.ts
  var DEFAULT_LIMITS = {
    maxLeafBytes: 16384,
    maxRoomKeys: 2048,
    oneShotMaxBytes: 4089,
    maxUserKeys: 64
  };

  // src/BackgroundMusic.ts
  var BackgroundMusic = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "path", "");
      __publicField(this, "accelerateSpeed", 1.25);
      /** The pitch upstream would set now. */
      __publicField(this, "pitch", 1);
      __publicField(this, "on", null);
      __publicField(this, "volume", -1);
    }
    Update() {
      const on = this.Settings.get("music") !== "off" && (this.kitchen.gameData?.settings.Data.Audio.music ?? 1) > 0;
      if (on !== this.on) {
        this.on = on;
        this.Host.setActive(`@${this.path}`, on);
      }
      const m = this.kitchen.match.match;
      const pitch = m.phase === "round" && m.ff === 1 ? this.accelerateSpeed : 1;
      if (pitch !== this.pitch) {
        this.pitch = pitch;
        this.Host.audioPitch(`@${this.path}`, pitch);
      }
      const volume = this.kitchen.gameData?.settings?.Data.Audio.music ?? 1;
      if (volume !== this.volume) {
        this.volume = volume;
        this.Host.audioVolume(`@${this.path}`, volume);
      }
    }
  };

  // src/ActionCode.ts
  function implementsKind(value, kind) {
    if (value === null || value === void 0 || typeof value !== "object") return false;
    const kinds = value.kinds;
    return Array.isArray(kinds) && kinds.indexOf(kind) >= 0;
  }
  var BoxCaster = class {
    constructor(hit) {
      __publicField(this, "hit");
      this.hit = hit;
    }
    get HasHit() {
      return this.hit !== null;
    }
    /** `HasHit && TryGetComponent(out component) && component.IsEnabled`; the component, or null. */
    TryGetEnabledComponent(kind) {
      if (!this.hit || !implementsKind(this.hit, kind)) return null;
      const component = this.hit;
      return component.IsEnabled ? component : null;
    }
  };
  var NoHighlight = { SetHighlight: () => void 0 };
  var HighlighterContainer = class {
    constructor() {
      __publicField(this, "items", /* @__PURE__ */ new Set());
      __publicField(this, "on", false);
    }
    Add(item) {
      this.items.add(item);
      item.SetHighlight(this.on);
    }
    Remove(item) {
      this.items.delete(item);
      item.SetHighlight(false);
    }
    SetHighlight(on) {
      this.on = on;
      for (const item of this.items) item.SetHighlight(on);
    }
  };
  var CanvasViewer = class {
    constructor(panel) {
      __publicField(this, "panel");
      __publicField(this, "OnHidden", []);
      this.panel = panel;
    }
    get IsVisible() {
      return this.panel?.activeSelf ?? false;
    }
    Show() {
      this.panel?.SetActive(true);
    }
    Hide() {
      const was = this.IsVisible;
      this.panel?.SetActive(false);
      if (was) for (const listener of this.OnHidden.slice()) listener();
    }
  };
  function invoke(listeners, ...args) {
    for (const listener of listeners.slice()) listener(...args);
  }

  // src/CollectableBody.ts
  var CollectableBody = class {
    constructor(kitchen, id) {
      __publicField(this, "kitchen");
      __publicField(this, "id");
      this.kitchen = kitchen;
      this.id = id;
    }
    PickUp(_holder) {
      const rec = this.kitchen.items[this.id];
      if (!rec) return;
      delete rec.pos;
      delete rec.lp;
    }
    Drop() {
      const rec = this.kitchen.items[this.id];
      if (!rec) return;
      rec.pos = this.kitchen.DropPoint();
      delete rec.lp;
    }
  };

  // src/IItemCollectable.ts
  var IItemCollectableKind = "IItemCollectable";

  // src/AbstractItem.ts
  var AbstractItem = class {
    constructor(kitchen, id) {
      __publicField(this, "id");
      __publicField(this, "kitchen");
      __publicField(this, "collectibleBody");
      __publicField(this, "kinds", [IItemCollectableKind]);
      this.kitchen = kitchen;
      this.id = id;
      this.collectibleBody = new CollectableBody(kitchen, id);
    }
    get rec() {
      const rec = this.kitchen.items[this.id];
      if (!rec) throw new Error(`item ${this.id} is gone`);
      return rec;
    }
    get Exists() {
      return this.kitchen.items[this.id] !== void 0;
    }
    get IsEnabled() {
      return this.kitchen.items[this.id]?.off !== 1;
    }
    set IsEnabled(value) {
      const rec = this.kitchen.items[this.id];
      if (!rec) return;
      if (value) delete rec.off;
      else rec.off = 1;
    }
    GetCollectible() {
      return this.collectibleBody;
    }
    GetHighlightable() {
      return NoHighlight;
    }
    /** Upstream moves the transform (the plate stack's height); the port draws stack heights from the stack's order. */
    SetPosition(_position) {
    }
    Destroy() {
      this.kitchen.DestroyItem(this.id);
    }
    toString() {
      return `${this.kind}:${this.id}`;
    }
  };

  // src/Ingredient.ts
  var Ingredient = class extends AbstractItem {
    constructor() {
      super(...arguments);
      __publicField(this, "kind", "ingredient");
    }
    get Data() {
      return this.kitchen.ingredientSettings.variants[this.rec.k];
    }
    get Icon() {
      return this.Data.Icon;
    }
    get Name() {
      return this.Data.Name;
    }
    get Status() {
      return this.Data.Status;
    }
    get PreparationTime() {
      return this.Data.PreparationTime;
    }
    /** PlatedIngredient.Plate: the ingredient's local pose on its plate (position at upstream scale, yaw in degrees). */
    SetLocalPose(position, yaw) {
      this.rec.lp = [position[0], position[1], position[2], yaw];
    }
  };

  // src/IngredientIcon.ts
  var IngredientIcon = class {
    constructor(icon) {
      __publicField(this, "Icon");
      this.Icon = icon;
    }
    /** The icon as rich text. */
    get Tag() {
      return this.Icon ? `<sprite name="${this.Icon}">` : "";
    }
  };

  // src/IngredientIcons.ts
  var IngredientIcons = class {
    constructor() {
      __publicField(this, "icons", []);
    }
    Add(icon) {
      this.icons.push(new IngredientIcon(icon));
    }
    Remove(sprite) {
      for (let i = this.icons.length - 1; i >= 0; i--) {
        if (this.icons[i].Icon === sprite) {
          this.icons.splice(i, 1);
          return;
        }
      }
    }
    Clear() {
      this.icons.length = 0;
    }
    /** The text a plate's icon line shows, for these icon names. */
    static Text(icons) {
      return icons.map((icon) => new IngredientIcon(icon).Tag).join("");
    }
  };

  // data/kitchen-data.json
  var kitchen_data_default = {
    source: "HyagoOliveira/KitchenChaos @ 4a73a26 (MIT, Copyright (c) 2023 Hyago Oliveira): Assets/Settings/**, prefab fields, scene layouts",
    generatedBy: "tools/gen-data.ts",
    enums: {
      IngredientName: {
        None: 0,
        Bread: 1,
        Cabbage: 2,
        Cheese: 3,
        Tomato: 4,
        Meat: 5
      },
      IngredientStatus: {
        None: 0,
        Raw: 1,
        Ready: 2,
        Burned: 3,
        Cuttable: 4
      }
    },
    ingredients: [
      {
        index: 0,
        asset: "Bread",
        name: 1,
        status: 2,
        preparationTime: 0,
        icon: "Bread",
        prefab: "Bread"
      },
      {
        index: 1,
        asset: "Cabbage",
        name: 2,
        status: 4,
        preparationTime: 3,
        icon: "Cabbage",
        prefab: "Cabbage"
      },
      {
        index: 2,
        asset: "Cabbage_Sliced",
        name: 2,
        status: 2,
        preparationTime: 0,
        icon: "CabbageSlices",
        prefab: "Cabbage_Sliced"
      },
      {
        index: 3,
        asset: "Cheese",
        name: 3,
        status: 4,
        preparationTime: 3,
        icon: "CheeseBlock",
        prefab: "Cheese"
      },
      {
        index: 4,
        asset: "Cheese_Sliced",
        name: 3,
        status: 2,
        preparationTime: 1,
        icon: "CheeseSlice",
        prefab: "Cheese_Sliced"
      },
      {
        index: 5,
        asset: "Meat",
        name: 5,
        status: 1,
        preparationTime: 6,
        icon: "MeatPattyUncooked",
        prefab: "Meat"
      },
      {
        index: 6,
        asset: "Meat_Cooked",
        name: 5,
        status: 2,
        preparationTime: 0,
        icon: "MeatPattyCooked",
        prefab: "Meat_Cooked"
      },
      {
        index: 7,
        asset: "Meat_Burned",
        name: 5,
        status: 3,
        preparationTime: 0,
        icon: "MeatPattyBurned",
        prefab: "Meat_Burned"
      },
      {
        index: 8,
        asset: "Tomato",
        name: 4,
        status: 4,
        preparationTime: 4,
        icon: "Tomato",
        prefab: "Tomato"
      },
      {
        index: 9,
        asset: "Tomato_Sliced",
        name: 4,
        status: 2,
        preparationTime: 0,
        icon: "TomatoSlice",
        prefab: "Tomato_Sliced"
      }
    ],
    collections: [
      {
        asset: "_Tomatos",
        name: 4,
        ingredients: [
          8,
          9
        ]
      },
      {
        asset: "_Cheeses",
        name: 3,
        ingredients: [
          3,
          4
        ]
      },
      {
        asset: "_Meats",
        name: 5,
        ingredients: [
          6,
          5,
          7
        ]
      },
      {
        asset: "_Breads",
        name: 1,
        ingredients: [
          0
        ]
      },
      {
        asset: "_Cabbages",
        name: 2,
        ingredients: [
          1,
          2
        ]
      }
    ],
    recipes: [
      {
        asset: "Burger",
        name: "Burger",
        plated: [
          {
            variant: 0,
            position: [
              0,
              0.026,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 6,
            position: [
              0.048,
              0.296,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          }
        ],
        chance: 35,
        tipMultiplier: 0.1
      },
      {
        asset: "SaladBurger",
        name: "Salad Burger",
        plated: [
          {
            variant: 0,
            position: [
              0,
              0.026,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 6,
            position: [
              0.048,
              0.296,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 2,
            position: [
              0.085,
              0.366,
              -0.173
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 9,
            position: [
              0.146,
              0.369,
              0.117
            ],
            rotation: [
              0,
              0,
              0
            ]
          }
        ],
        chance: 15,
        tipMultiplier: 0.15
      },
      {
        asset: "XBurger",
        name: "X Burger",
        plated: [
          {
            variant: 0,
            position: [
              0,
              0.026,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 4,
            position: [
              -8e-3,
              0.22,
              0.052
            ],
            rotation: [
              0,
              49.17986,
              0
            ]
          },
          {
            variant: 6,
            position: [
              0.048,
              0.296,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          }
        ],
        chance: 25,
        tipMultiplier: 0.12
      },
      {
        asset: "XSalad",
        name: "Salad Burger",
        plated: [
          {
            variant: 0,
            position: [
              0,
              0.026,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 4,
            position: [
              -8e-3,
              0.22,
              0.052
            ],
            rotation: [
              0,
              49.17986,
              0
            ]
          },
          {
            variant: 2,
            position: [
              0.085,
              0.28,
              -0.173
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 9,
            position: [
              0.146,
              0.32,
              0.117
            ],
            rotation: [
              0,
              0,
              0
            ]
          }
        ],
        chance: 15,
        tipMultiplier: 0.18
      },
      {
        asset: "XSaladBurger",
        name: "X Salad Burger",
        plated: [
          {
            variant: 0,
            position: [
              0,
              0.026,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 4,
            position: [
              -8e-3,
              0.22,
              0.052
            ],
            rotation: [
              0,
              49.17986,
              0
            ]
          },
          {
            variant: 6,
            position: [
              0.048,
              0.296,
              0
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 2,
            position: [
              0.085,
              0.366,
              -0.173
            ],
            rotation: [
              0,
              0,
              0
            ]
          },
          {
            variant: 9,
            position: [
              0.146,
              0.369,
              0.117
            ],
            rotation: [
              0,
              0,
              0
            ]
          }
        ],
        chance: 10,
        tipMultiplier: 0.2
      }
    ],
    order: {
      maxOrders: 3,
      additionalTimePerIngredient: 30,
      timeByNewOrder: 15,
      timeToRemoveAfterFail: 1,
      timeToRemoveAfterDelivery: 1,
      timeToReturnPlate: 4
    },
    match: {
      countDown: 3,
      timeLimit: 120,
      finalSeconds: 20,
      startDelay: 0.2
    },
    score: {
      deliveredOrdersMultiplier: 20,
      failedOrdersMultiplier: 10
    },
    preparators: {
      cuttingBoard: {
        allowedStatus: 4,
        preparatedStatus: 2,
        finalSecondsBooster: 1.25
      },
      stove: {
        allowedStatus: 1,
        preparatedStatus: 2,
        finalSecondsBooster: 1.25,
        timeBeforeBurn: 2
      }
    },
    tutorial: {
      timeBetweenSteps: 0.4,
      showOrderRecipe: 2,
      timeToRead: 3
    },
    ui: {
      tipFormat: "+{0:D2} Tip!",
      tutorialFadeSpeed: 1.2
    },
    layouts: {
      game: [
        {
          name: "Counter_Corner_02",
          prefab: "Counter_Corner",
          x: -7.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "CabbageCounter_01",
          prefab: "CabbageCounter",
          x: -5.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "BreadCounter_01",
          prefab: "BreadCounter",
          x: -4.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "TomatoCounter_01",
          prefab: "TomatoCounter",
          x: -2.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "MeatCounter_01",
          prefab: "MeatCounter",
          x: -1.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "CheeseCounter_01",
          prefab: "CheeseCounter",
          x: 0.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "CutCounter_01",
          prefab: "CutCounter",
          x: 1.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Plate_00",
          prefab: "Counter_Plate",
          x: 3.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "StoveCounter_01",
          prefab: "StoveCounter",
          x: 4.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_01",
          prefab: "Counter_Normal",
          x: 6.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Corner_03",
          prefab: "Counter_Corner",
          x: 7.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_08",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -5,
          yaw: 90
        },
        {
          name: "Counter_Normal_02",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -5,
          yaw: -90
        },
        {
          name: "Counter_Normal_03",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -3.5,
          yaw: 90
        },
        {
          name: "Counter_Normal_07",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -3.5,
          yaw: -90
        },
        {
          name: "Counter_Normal_09",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -2,
          yaw: 90
        },
        {
          name: "TrashCounter",
          prefab: "Trash",
          x: 7.75,
          z: -2,
          yaw: 0
        },
        {
          name: "Counter_Normal_10",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -0.5,
          yaw: 90
        },
        {
          name: "Counter_Normal_06",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -0.5,
          yaw: -90
        },
        {
          name: "Counter_Normal_11",
          prefab: "Counter_Normal",
          x: -7.25,
          z: 1,
          yaw: 90
        },
        {
          name: "Counter_PlateStack",
          prefab: "Counter_PlateStack",
          x: 7.75,
          z: 1,
          yaw: -90
        },
        {
          name: "Counter_Normal_00",
          prefab: "Counter_Normal",
          x: -7.25,
          z: 2.5,
          yaw: 90
        },
        {
          name: "Counter_Delivery",
          prefab: "Counter_Delivery",
          x: 7.75,
          z: 2.5,
          yaw: -90
        },
        {
          name: "Counter_Corner_01",
          prefab: "Counter_Corner",
          x: -7.25,
          z: 4,
          yaw: -180
        },
        {
          name: "CutCounter_00",
          prefab: "CutCounter",
          x: -5.75,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Plate_01",
          prefab: "Counter_Plate",
          x: -4.25,
          z: 4,
          yaw: -180
        },
        {
          name: "StoveCounter_00",
          prefab: "StoveCounter",
          x: -2.75,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Normal_05",
          prefab: "Counter_Normal",
          x: -1.25,
          z: 4,
          yaw: -180
        },
        {
          name: "CabbageCounter_00",
          prefab: "CabbageCounter",
          x: 0.25,
          z: 4,
          yaw: -180
        },
        {
          name: "BreadCounter_00",
          prefab: "BreadCounter",
          x: 1.75,
          z: 4,
          yaw: -180
        },
        {
          name: "TomatoCounter_00",
          prefab: "TomatoCounter",
          x: 3.25,
          z: 4,
          yaw: -180
        },
        {
          name: "MeatCounter_00",
          prefab: "MeatCounter",
          x: 4.75,
          z: 4,
          yaw: -180
        },
        {
          name: "CheeseCounter_00",
          prefab: "CheeseCounter",
          x: 6.25,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Corner_00",
          prefab: "Counter_Corner",
          x: 7.75,
          z: 4,
          yaw: -180
        }
      ],
      tutorial: [
        {
          name: "Counter_Corner_02",
          prefab: "Counter_Corner",
          x: -7.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_01",
          prefab: "Counter_Normal",
          x: -5.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_03",
          prefab: "Counter_Normal",
          x: -4.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_04",
          prefab: "Counter_Normal",
          x: -2.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_16",
          prefab: "Counter_Normal",
          x: -1.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_17",
          prefab: "Counter_Normal",
          x: 0.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_18",
          prefab: "Counter_Normal",
          x: 1.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_19",
          prefab: "Counter_Normal",
          x: 3.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_20",
          prefab: "Counter_Normal",
          x: 4.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Plate",
          prefab: "Counter_Plate",
          x: 6.25,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Corner_03",
          prefab: "Counter_Corner",
          x: 7.75,
          z: -6.5,
          yaw: 0
        },
        {
          name: "Counter_Normal_13",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -5,
          yaw: 90
        },
        {
          name: "Counter_Normal_21",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -5,
          yaw: -90
        },
        {
          name: "Counter_Normal_12",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -3.5,
          yaw: 90
        },
        {
          name: "Counter_Normal_08",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -3.5,
          yaw: -90
        },
        {
          name: "Counter_Normal_09",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -2,
          yaw: 90
        },
        {
          name: "Counter_Normal_07",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -2,
          yaw: -90
        },
        {
          name: "Counter_Normal_10",
          prefab: "Counter_Normal",
          x: -7.25,
          z: -0.5,
          yaw: 90
        },
        {
          name: "Counter_Normal_06",
          prefab: "Counter_Normal",
          x: 7.75,
          z: -0.5,
          yaw: -90
        },
        {
          name: "Counter_Normal_11",
          prefab: "Counter_Normal",
          x: -7.25,
          z: 1,
          yaw: 90
        },
        {
          name: "Counter_PlateStack",
          prefab: "Counter_PlateStack",
          x: 7.75,
          z: 1,
          yaw: -90
        },
        {
          name: "Counter_Normal_00",
          prefab: "Counter_Normal",
          x: -7.25,
          z: 2.5,
          yaw: 90
        },
        {
          name: "Counter_Delivery_Tutorial",
          prefab: "Counter_Delivery_Tutorial",
          x: 7.75,
          z: 2.5,
          yaw: -90
        },
        {
          name: "Counter_Corner_01",
          prefab: "Counter_Corner",
          x: -7.25,
          z: 4,
          yaw: -180
        },
        {
          name: "CutCounter_00",
          prefab: "CutCounter",
          x: -5.75,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Normal_02",
          prefab: "Counter_Normal",
          x: -4.25,
          z: 4,
          yaw: -180
        },
        {
          name: "StoveCounter_00",
          prefab: "StoveCounter",
          x: -2.75,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Normal_05",
          prefab: "Counter_Normal",
          x: -1.25,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Normal_14",
          prefab: "Counter_Normal",
          x: 0.25,
          z: 4,
          yaw: -180
        },
        {
          name: "BreadCounter",
          prefab: "BreadCounter",
          x: 1.75,
          z: 4,
          yaw: -180
        },
        {
          name: "MeatCounter",
          prefab: "MeatCounter",
          x: 3.25,
          z: 4,
          yaw: -180
        },
        {
          name: "CheeseCounter",
          prefab: "CheeseCounter",
          x: 4.75,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Normal_15",
          prefab: "Counter_Normal",
          x: 6.25,
          z: 4,
          yaw: -180
        },
        {
          name: "Counter_Corner_00",
          prefab: "Counter_Corner",
          x: 7.75,
          z: 4,
          yaw: -180
        }
      ]
    }
  };

  // src/IngredientName.ts
  var IngredientName = {
    None: 0,
    Bread: 1,
    Cabbage: 2,
    Cheese: 3,
    Tomato: 4,
    Meat: 5
  };
  function IngredientNameText(name) {
    return Object.keys(IngredientName).find((k) => IngredientName[k] === name) ?? String(name);
  }

  // src/IngredientStatus.ts
  var IngredientStatus = {
    None: 0,
    Raw: 1,
    Ready: 2,
    Burned: 3,
    Cuttable: 4
  };

  // src/IngredientData.ts
  var IngredientData = class {
    constructor(index, assetName, icon, name, status, preparationTime) {
      /** The variant: 0 to 9, in the order of PORT.md 5.6. */
      __publicField(this, "Index");
      /** The asset's name (Meat_Cooked). */
      __publicField(this, "AssetName");
      /** The icon's name: a sprite of the kit's icon sheet (upstream: a Sprite). */
      __publicField(this, "Icon");
      __publicField(this, "Name");
      __publicField(this, "Status");
      __publicField(this, "PreparationTime");
      /** Set by the kitchen: makes a new item of this variant. */
      __publicField(this, "spawner", null);
      this.Index = index;
      this.AssetName = assetName;
      this.Icon = icon;
      this.Name = name;
      this.Status = status;
      this.PreparationTime = preparationTime;
    }
    /** Null when the kitchen's item pool is full (C10). */
    Spawn() {
      return this.spawner ? this.spawner(this) : null;
    }
    toString() {
      const status = Object.keys(IngredientStatus).find((k) => IngredientStatus[k] === this.Status);
      return `${IngredientNameText(this.Name)}_${status ?? this.Status}`;
    }
    Equals(data) {
      return data !== null && this.Name === data.Name && this.Status === data.Status;
    }
  };

  // src/IngredientDataCollection.ts
  var IngredientDataCollection = class {
    constructor(name, ingredients) {
      __publicField(this, "Name");
      __publicField(this, "ingredients");
      __publicField(this, "ingredientsDictionary", null);
      this.Name = name;
      this.ingredients = ingredients;
    }
    get Ingredients() {
      return this.ingredients;
    }
    TryGetIngredientData(status) {
      return this.ingredientsDictionary.get(status) ?? null;
    }
    GetPreviousIngredientData(data) {
      for (let i = 0; i < this.ingredients.length; i++) {
        const isIngredient = this.ingredients[i].Equals(data);
        if (isIngredient) {
          const previousIndex = i - 1;
          const safeIndex = Math.max(0, previousIndex);
          return this.ingredients[safeIndex];
        }
      }
      return null;
    }
    InitializeDictionary() {
      this.ingredientsDictionary = /* @__PURE__ */ new Map();
      for (const data of this.ingredients) {
        if (this.ingredientsDictionary.has(data.Status)) throw new Error(`${this.Name}: status ${data.Status} twice (C# Dictionary.Add throws)`);
        this.ingredientsDictionary.set(data.Status, data);
      }
    }
  };

  // src/IngredientSettings.ts
  var IngredientSettings = class {
    constructor() {
      /** The ten variants by index. */
      __publicField(this, "variants");
      __publicField(this, "collections");
      __publicField(this, "collectionDictionary", null);
      /** Debug.LogError. */
      __publicField(this, "logError", () => void 0);
      this.variants = kitchen_data_default.ingredients.map((v) => new IngredientData(v.index, v.asset, v.icon ?? "", v.name, v.status, v.preparationTime));
      this.collections = kitchen_data_default.collections.map((c) => new IngredientDataCollection(c.name, c.ingredients.map((i) => this.variants[i])));
    }
    InitializeDictionary() {
      this.collectionDictionary = /* @__PURE__ */ new Map();
      for (const container of this.collections) {
        container.InitializeDictionary();
        this.collectionDictionary.set(container.Name, container);
      }
    }
    SpawnIngredient(name, status) {
      const collection = this.TryGetIngredientCollection(name);
      if (!collection) {
        this.logError(`Ingredient ${name} is not present in any collection.`);
        return null;
      }
      const found = collection.TryGetIngredientData(status);
      if (!found) {
        this.logError(`Ingredient Status ${status} is not present into ${collection.Name}`);
        return null;
      }
      return found.Spawn();
    }
    TryGetIngredientCollection(name) {
      return this.collectionDictionary.get(name) ?? null;
    }
    GetPreparationTime(ingredientData) {
      if (ingredientData.Status === IngredientStatus.Ready) {
        const previousData = this.collectionDictionary.get(ingredientData.Name).GetPreviousIngredientData(ingredientData);
        return previousData.PreparationTime;
      }
      return ingredientData.PreparationTime;
    }
    GetData(ingredient) {
      for (const collection of this.collections) {
        if (collection.Name !== ingredient.Name) continue;
        for (const d of collection.Ingredients) if (d.Status === ingredient.Status) return d;
      }
      return null;
    }
  };

  // src/IInteractable.ts
  var IInteractableKind = "IInteractable";

  // src/IItemCollector.ts
  var IItemCollectorKind = "IItemCollector";

  // src/IItemDisposer.ts
  var IItemDisposerKind = "IItemDisposer";

  // src/IItemHolder.ts
  var IItemHolderKind = "IItemHolder";

  // src/IItemTransfer.ts
  var IItemTransferKind = "IItemTransfer";

  // src/ItemHandler.ts
  var ItemHandler = class {
    constructor(kitchen, holder) {
      __publicField(this, "holder");
      __publicField(this, "detector", new BoxCaster(null));
      __publicField(this, "kitchen");
      this.kitchen = kitchen;
      this.holder = holder;
    }
    IsHoldingPlate() {
      return this.holder.IsPlate() !== null;
    }
    TryInteractWithItem() {
      if (this.holder.HasItem()) {
        if (this.TryInteractWithPlate()) return;
        const wasItemTransfered = this.TryTransferItem();
        const canReleaseItemOnTheFloor = !wasItemTransfered && !this.detector.HasHit;
        if (canReleaseItemOnTheFloor) {
          this.holder.ReleaseItem();
          this.kitchen.Fx("hand", "drop", this.holder.key);
        }
      } else {
        const item = this.TryGetCollectableItem();
        if (item) {
          this.holder.PlaceItem(item);
          this.kitchen.Fx("hand", "pickup", this.holder.key);
        }
      }
    }
    TryInteractWithEnvironment() {
      const interactable = this.detector.TryGetEnabledComponent(IInteractableKind);
      if (interactable) interactable.Interact();
    }
    TryInteractWithPlate() {
      const plate = this.holder.IsPlate();
      return plate !== null && (this.TryDisposeLastPlateIngredient(plate) || this.TryPlateIngredient(plate));
    }
    TryDisposeLastPlateIngredient(plate) {
      if (!plate.HasIngredients()) return false;
      const disposer = this.detector.TryGetEnabledComponent(IItemDisposerKind);
      if (disposer && disposer.IsEnabled) disposer.Dispose(plate.RemoveLast());
      return disposer !== null;
    }
    TryPlateIngredient(plate) {
      const holder = this.detector.TryGetEnabledComponent(IItemHolderKind);
      return holder !== null && plate.TryTransferItem(holder);
    }
    TryTransferItem() {
      const transfer = this.detector.TryGetEnabledComponent(IItemTransferKind);
      return transfer !== null && transfer.TryTransferItem(this.holder);
    }
    TryGetCollectableItem() {
      const collector = this.detector.TryGetEnabledComponent(IItemCollectorKind);
      if (collector) {
        const collected = collector.TryCollectItem();
        return collected.ok ? collected.item : null;
      }
      return this.detector.TryGetEnabledComponent(IItemCollectableKind);
    }
  };

  // src/ItemHolder.ts
  var ItemHolder = class {
    constructor(kitchen, key) {
      __publicField(this, "key");
      __publicField(this, "kinds", [IItemHolderKind, IItemCollectorKind, IItemTransferKind]);
      __publicField(this, "OnItemReleased", []);
      __publicField(this, "OnItemPlaced", []);
      __publicField(this, "kitchen");
      /** The component's `enabled`; nothing switches a holder off. */
      __publicField(this, "IsEnabled", true);
      this.kitchen = kitchen;
      this.key = key;
    }
    get CurrentItem() {
      const id = this.kitchen.holders[this.key];
      return id === void 0 ? null : this.kitchen.Item(id);
    }
    /** internal set */
    set CurrentItem(item) {
      if (item) this.kitchen.holders[this.key] = item.id;
      else delete this.kitchen.holders[this.key];
    }
    PlaceItem(item) {
      item.GetCollectible().PickUp(this.key);
      this.CurrentItem = item;
      invoke(this.OnItemPlaced, item);
    }
    ReleaseItem() {
      const item = this.CurrentItem;
      if (item) {
        this.kitchen.Releasing(this.key);
        item.GetCollectible().Drop();
      }
      this.CurrentItem = null;
      invoke(this.OnItemReleased, item);
    }
    ReplaceItem(item) {
      this.DestroyItem();
      this.PlaceItem(item);
    }
    TryCollectItem() {
      if (this.IsEmpty() || !this.CurrentItem.IsEnabled) return { ok: false, item: null };
      const item = this.CurrentItem;
      this.ReleaseItem();
      return { ok: item !== null, item };
    }
    TryTransferItem(fromHolder) {
      if (this.HasItem()) {
        const plate = this.IsPlate();
        if (plate) return plate.TryTransferItem(fromHolder);
        return false;
      }
      const item = fromHolder.CurrentItem;
      fromHolder.ReleaseItem();
      if (item) this.PlaceItem(item);
      return true;
    }
    DestroyItem() {
      const item = this.CurrentItem;
      this.ReleaseItem();
      item?.Destroy();
    }
    HasItem() {
      return this.kitchen.holders[this.key] !== void 0;
    }
    IsEmpty() {
      return !this.HasItem();
    }
    /** `IsPlate(out Plate plate)`: the plate held, or null. */
    IsPlate() {
      const item = this.CurrentItem;
      return item && item.kind === "plate" ? item : null;
    }
  };

  // src/ItemHolderStack.ts
  var PLATE_HEIGHT = 0.12;
  var ItemHolderStack = class {
    constructor(kitchen, holder) {
      __publicField(this, "kitchen");
      __publicField(this, "holder");
      __publicField(this, "initialPosition", Vector3.zero);
      this.kitchen = kitchen;
      this.holder = holder;
    }
    get stack() {
      var _a, _b;
      return (_a = this.kitchen.stacks)[_b = this.holder.key] ?? (_a[_b] = []);
    }
    /** OnEnable. */
    Enable(orders) {
      this.holder.OnItemPlaced.push((item) => this.HandleItemPlaced(item));
      this.holder.OnItemReleased.push(() => this.HandleItemReleased());
      orders.OnPlateReturned.push(() => this.HandlePlateReturned());
    }
    HandleItemPlaced(item) {
      const position = this.initialPosition.add(Vector3.up.scale(this.stack.length * PLATE_HEIGHT));
      item.SetPosition(position);
      this.stack.push(item.id);
    }
    HandleItemReleased() {
      const stack = this.stack;
      stack.pop();
      const nextItem = stack.length ? this.kitchen.Item(stack[stack.length - 1]) : null;
      if (stack.length === 0) delete this.kitchen.stacks[this.holder.key];
      if (nextItem) this.holder.CurrentItem = nextItem;
    }
    HandlePlateReturned() {
      const plate = this.kitchen.NewPlate();
      if (plate) this.holder.PlaceItem(plate);
    }
  };

  // src/IItemCollectableExtension.ts
  function IsIngredient(item, name, status) {
    if (!(item instanceof Ingredient)) return false;
    if (item.Name !== name) return false;
    return status === void 0 || item.Status === status;
  }

  // src/Plate.ts
  var Plate = class extends AbstractItem {
    constructor() {
      super(...arguments);
      __publicField(this, "kind", "plate");
      __publicField(this, "kinds", [IItemCollectableKind, IItemTransferKind]);
      __publicField(this, "icons", new IngredientIcons());
    }
    /** `event Action<Ingredient> OnIngredientPlated`: the kitchen keeps one list for every plate (the plate is passed too). */
    get OnIngredientPlated() {
      return this.kitchen.plateEvents;
    }
    get hasBread() {
      return this.rec.bread === 1;
    }
    set hasBread(value) {
      if (value) this.rec.bread = 1;
      else delete this.rec.bread;
    }
    /** The ingredients bottom to top (a C# Stack, kept as the order they were pushed). */
    get IngredientList() {
      return (this.rec.ings ?? []).map((id) => this.kitchen.Item(id)).filter((i) => i instanceof Ingredient);
    }
    /** `Ingredients.ToArray()` on a C# Stack: top first. */
    IngredientsToArray() {
      return this.IngredientList.reverse();
    }
    HasIngredients() {
      return (this.rec.ings ?? []).length > 0;
    }
    TryTransferItem(fromHolder) {
      const isPreparing = fromHolder.isPreparationCounter === true && fromHolder.IsPreparing;
      if (isPreparing) return false;
      const isDoubleBread = this.hasBread && IsIngredient(fromHolder.CurrentItem, IngredientName.Bread);
      if (isDoubleBread) return false;
      const ingredient = fromHolder.CurrentItem instanceof Ingredient ? fromHolder.CurrentItem : null;
      const canPlate = ingredient !== null && this.kitchen.recipeSettings.CanPlate(ingredient.Data);
      if (canPlate) {
        fromHolder.ReleaseItem();
        this.PlateIngredient(ingredient);
      }
      return canPlate;
    }
    RemoveLast() {
      const ings = this.rec.ings ?? [];
      const id = ings.pop();
      if (ings.length === 0) delete this.rec.ings;
      const ingredient = this.kitchen.Item(id);
      this.kitchen.Releasing(this.id);
      ingredient.GetCollectible().Drop();
      this.icons.Remove(ingredient.Icon);
      return ingredient;
    }
    PlateIngredient(ingredient) {
      var _a;
      if (!this.hasBread) this.hasBread = ingredient.Name === IngredientName.Bread;
      ingredient.GetCollectible().PickUp(this.id);
      ((_a = this.rec).ings ?? (_a.ings = [])).push(ingredient.id);
      this.kitchen.recipeSettings.Plate(this.IngredientsToArray());
      this.icons.Add(ingredient.Icon);
      for (const listener of this.OnIngredientPlated.slice()) listener(ingredient, this);
    }
  };

  // src/PlatedIngredient.ts
  var PlatedIngredient = class {
    constructor(ingredientData, position, rotation) {
      __publicField(this, "ingredientData");
      /** Local position on the plate, metres at upstream scale. */
      __publicField(this, "position");
      /** Euler angles in degrees. */
      __publicField(this, "rotation");
      this.ingredientData = ingredientData;
      this.position = position;
      this.rotation = rotation;
    }
    get Data() {
      return this.ingredientData;
    }
    /** Upstream: `ingredient.transform.SetLocalPositionAndRotation(position, rotation)`; here the pose goes into its state. */
    Plate(ingredient) {
      ingredient.SetLocalPose(this.position, this.rotation[1]);
    }
    Equals(ingredientData) {
      return this.ingredientData.Equals(ingredientData);
    }
  };

  // src/RandomUtils.ts
  var f = Math.fround;
  var RandomUtils = {
    /** Selects a weighted random item. `roll` is upstream's `Random.value`. */
    WeightedRandom(items, roll) {
      return items[RandomUtils.WeightedIndex(items, roll)];
    },
    WeightedIndex(items, roll) {
      const itemCount = items.length;
      const orderedItems = new Float32Array(itemCount + 1);
      for (let i = 0; i < itemCount; i++) orderedItems[i + 1] = f(orderedItems[i] + f(items[i].Chance));
      const num = f(f(roll) * orderedItems[itemCount]);
      let index = BinarySearch(orderedItems, itemCount, num);
      if (index < 0) index = ~index - 1;
      return index;
    }
  };
  function BinarySearch(array, length, value) {
    let low = 0;
    let high = length - 1;
    while (low <= high) {
      const i = low + (high - low >> 1);
      const element = array[i];
      const order = element < value ? -1 : element > value ? 1 : 0;
      if (order === 0) return i;
      if (order < 0) low = i + 1;
      else high = i - 1;
    }
    return ~low;
  }

  // src/RecipeData.ts
  var f2 = Math.fround;
  var RecipeData = class {
    constructor(index, assetName, name, plated, chance, tipMultiplier) {
      __publicField(this, "Index");
      __publicField(this, "AssetName");
      __publicField(this, "Name");
      __publicField(this, "PlatedIngredients");
      __publicField(this, "Chance");
      __publicField(this, "TipMultiplier");
      __publicField(this, "platedIngredients", null);
      this.Index = index;
      this.AssetName = assetName;
      this.Name = name;
      this.PlatedIngredients = plated;
      this.Chance = chance;
      this.TipMultiplier = tipMultiplier;
    }
    Initialize() {
      this.platedIngredients = /* @__PURE__ */ new Map();
      for (const platedIngredient of this.PlatedIngredients) {
        if (this.platedIngredients.has(platedIngredient.Data.Index)) throw new Error(`${this.AssetName}: an ingredient twice (C# Dictionary.Add throws)`);
        this.platedIngredients.set(platedIngredient.Data.Index, platedIngredient);
      }
    }
    /** In 32-bit floats, as C# adds them. */
    GetWaitingTime(settings, additionalTimePerIngredient) {
      let time = f2(this.PlatedIngredients.length * f2(additionalTimePerIngredient));
      for (const ingredient of this.PlatedIngredients) time = f2(time + f2(settings.GetPreparationTime(ingredient.Data)));
      return time;
    }
    Plate(ingredient) {
      this.platedIngredients.get(ingredient.Data.Index).Plate(ingredient);
    }
    CanPlate(ingredientData) {
      const plated = this.platedIngredients.get(ingredientData.Index);
      return plated !== void 0 && plated.Equals(ingredientData);
    }
    ContainsOnly(ingredients) {
      const hasSameNumerOfIngredients = ingredients.length === this.platedIngredients.size;
      return hasSameNumerOfIngredients && this.ContainsAll(ingredients);
    }
    ContainsAll(ingredients) {
      for (const ingredient of ingredients) {
        if (!this.platedIngredients.has(ingredient.Data.Index)) return false;
      }
      return true;
    }
  };

  // src/RecipeSettings.ts
  var RecipeSettings = class {
    constructor(ingredients) {
      __publicField(this, "recipes");
      /** Debug.LogError. */
      __publicField(this, "logError", () => void 0);
      this.recipes = kitchen_data_default.recipes.map(
        (r, index) => new RecipeData(
          index,
          r.asset ?? "",
          r.name ?? "",
          r.plated.map((p) => new PlatedIngredient(ingredients.variants[p.variant], p.position, p.rotation)),
          r.chance,
          r.tipMultiplier
        )
      );
    }
    Initialize() {
      for (const recipe of this.recipes) recipe.Initialize();
    }
    /** `roll` is upstream's `Random.value`. */
    GetRandom(roll) {
      return RandomUtils.WeightedRandom(this.recipes, roll);
    }
    CanPlate(ingredientData) {
      for (const recipe of this.recipes) if (recipe.CanPlate(ingredientData)) return true;
      return false;
    }
    Plate(ingredients) {
      const recipe = this.GetClosestRecipe(ingredients);
      if (!recipe) {
        this.logError("RecipeSettings does not contains any recipe for any given ingredient.");
        return;
      }
      for (const ingredient of ingredients) recipe.Plate(ingredient);
    }
    GetClosestRecipe(ingredients) {
      for (const recipe of this.recipes) if (recipe.ContainsAll(ingredients)) return recipe;
      return null;
    }
  };

  // src/Kitchen.ts
  var HAND = "hand:";
  var MAX_CHEFS = 8;
  var POOL_SIZE = 48;
  var round3 = (v) => Math.round(v * 1e3) / 1e3;
  var _Kitchen = class _Kitchen extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "items", {});
      __publicField(this, "holders", {});
      __publicField(this, "stacks", {});
      /** Switched-off counters, boards, stoves, trash and the delivery counter (tutorial gating), by key. */
      __publicField(this, "off", {});
      __publicField(this, "prep", {});
      /** Who is cooking: user id -> colour slot (Blue, Green, Red, Yellow, ...). */
      __publicField(this, "roster", {});
      __publicField(this, "next", 1);
      // ---- from bindings.json -------------------------------------------------------------------------------------
      __publicField(this, "match");
      __publicField(this, "orders");
      __publicField(this, "score");
      __publicField(this, "tutorial", null);
      __publicField(this, "gameData", null);
      /** The item pool: one kit object per item shown. */
      __publicField(this, "slots", []);
      /** Each slot's path under the kit root: its variant children are switched by path (relay "@<path>/V<k>"). */
      __publicField(this, "slotPaths", []);
      __publicField(this, "floor", null);
      __publicField(this, "corners", []);
      /** Clip lists by sound name (`{"$clip": n, "on": "<object>"}`). */
      __publicField(this, "clips", {});
      /** The kit's scale against upstream (PORT.md 8.1). */
      __publicField(this, "kitScale", 0.64);
      // ---- built at Start -----------------------------------------------------------------------------------------
      __publicField(this, "ingredientSettings");
      __publicField(this, "recipeSettings");
      __publicField(this, "plateEvents", []);
      __publicField(this, "counters", /* @__PURE__ */ new Map());
      __publicField(this, "preparators", /* @__PURE__ */ new Map());
      __publicField(this, "holderMap", /* @__PURE__ */ new Map());
      __publicField(this, "handlerMap", /* @__PURE__ */ new Map());
      __publicField(this, "views", /* @__PURE__ */ new Map());
      __publicField(this, "fxHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "sent", /* @__PURE__ */ new Map());
      __publicField(this, "releasingFrom", "");
      __publicField(this, "dropAt", null);
      __publicField(this, "lastSweep", 0);
      // pool drawing, per client
      __publicField(this, "slotOf", /* @__PURE__ */ new Map());
      __publicField(this, "slotShown", []);
      __publicField(this, "grabbedSlot", /* @__PURE__ */ new Set());
      __publicField(this, "flashes", /* @__PURE__ */ new Map());
      __publicField(this, "lastRenderG", null);
    }
    Start() {
      this.ingredientSettings = new IngredientSettings();
      this.ingredientSettings.logError = (m) => this.Debug.LogError(m);
      this.ingredientSettings.InitializeDictionary();
      for (const v of this.ingredientSettings.variants) v.spawner = (d) => this.NewIngredient(d);
      this.recipeSettings = new RecipeSettings(this.ingredientSettings);
      this.recipeSettings.logError = (m) => this.Debug.LogError(m);
      this.recipeSettings.Initialize();
      const scale = Number(this.Settings.get("scale") ?? "");
      if (scale > 0) this.kitScale *= scale;
      for (const type of ["Counter", "IngredientCounter", "PreparationCounter", "DeliveryCounter", "Trash"]) {
        for (const c of this.FindBehavioursOfType(type)) this.counters.set(c.cell, c);
      }
      const door = this.Settings.get("door") ?? "west";
      const doorway = door === "west" ? "Counter_Normal_10" : door === "east" ? "Counter_Normal_06" : "";
      const gap = doorway ? this.counters.get(doorway) : void 0;
      if (gap) {
        this.counters.delete(doorway);
        gap.gameObject.SetActive(false);
      }
      for (const type of ["CuttingBoard", "Stove"]) {
        for (const p of this.FindBehavioursOfType(type)) this.preparators.set(p.cell, p);
      }
      this.slots.forEach((slot, index) => {
        this.slotShown.push(null);
        slot.On("click", (detail) => this.ClickSlot(index, detail));
        slot.On("grab", () => this.GrabSlot(index));
        slot.On("drop", (detail) => this.DropSlot(index, detail));
      });
      this.floor?.On("click", (detail) => this.LocalIntent("E", "floor", detail.point ?? null));
      for (const corner of this.corners) corner.On("click", () => this.LocalIntent("E", "corner", null));
      if (this.Settings.get("input") === "click") for (const slot of this.slots) slot.layer = 5;
      this.OnEffect("hand", (kind) => this.PlaySound(kind === "pickup" ? "pickup" : "drop", "floor"));
      this.OnEffect("crate", (cell) => this.Host.animPlay(_Kitchen.CellKey(String(cell)), "IngredientCounter@Open"));
      this.OnEffect("trash", (cell) => {
        this.PlaySound("trash", _Kitchen.CellKey(String(cell)));
        this.Host.animPlay(_Kitchen.CellKey(String(cell)), "Trash@DropItem");
      });
      this.OnEffect("full", (cell) => this.PlaySound("fail01", _Kitchen.CellKey(String(cell))));
    }
    OnInstanceStart(kind) {
      if (!this.Networking.IsReferee || kind !== "fresh" && kind !== "resumed") return;
      this.match.ResetToLobby();
      this.CommitAll();
    }
    /** The start state of the kitchen (a scene load): two plates on their counters, nothing else (8, 12). */
    ResetKitchen() {
      this.items = {};
      this.holders = {};
      this.stacks = {};
      this.off = {};
      this.prep = {};
      this.next = 1;
      this.views.clear();
      for (const p of this.preparators.values()) this.prep[p.cell] = p.DefaultState();
      for (const c of this.counters.values()) {
        if (!c.startsWithPlate) continue;
        const plate = this.NewPlate();
        if (plate) this.Holder(c.cell).PlaceItem(plate);
      }
    }
    // ---- holders, items, views ----------------------------------------------------------------------------------
    Holder(key) {
      let holder = this.holderMap.get(key);
      if (!holder) this.holderMap.set(key, holder = new ItemHolder(this, key));
      return holder;
    }
    Handler(uid) {
      let handler = this.handlerMap.get(uid);
      if (!handler) this.handlerMap.set(uid, handler = new ItemHandler(this, this.Holder(HAND + uid)));
      return handler;
    }
    Item(id) {
      const rec = this.items[id];
      if (!rec) {
        this.views.delete(id);
        return null;
      }
      let view = this.views.get(id);
      const wanted = rec.k < 0 ? "plate" : "ingredient";
      if (!view || view.kind !== wanted) {
        view = rec.k < 0 ? new Plate(this, id) : new Ingredient(this, id);
        this.views.set(id, view);
      }
      return view;
    }
    ItemCount() {
      return Object.keys(this.items).length;
    }
    NewItem(k) {
      if (this.ItemCount() >= POOL_SIZE + 2) return null;
      const id = "i" + this.next++;
      this.items[id] = { k, pos: this.DropPoint() };
      return id;
    }
    NewIngredient(data) {
      const id = this.NewItem(data.Index);
      return id ? this.Item(id) : null;
    }
    NewPlate() {
      const id = this.NewItem(-1);
      return id ? this.Item(id) : null;
    }
    /** Destroy(gameObject): the item and, for a plate, everything on it. */
    DestroyItem(id) {
      const rec = this.items[id];
      if (!rec) return;
      for (const child of rec.ings ?? []) this.DestroyItem(child);
      delete this.items[id];
      for (const key of Object.keys(this.holders)) if (this.holders[key] === id) delete this.holders[key];
      for (const key of Object.keys(this.stacks)) {
        const at = this.stacks[key].indexOf(id);
        if (at >= 0) this.stacks[key].splice(at, 1);
        if (this.stacks[key].length === 0) delete this.stacks[key];
      }
      this.views.delete(id);
    }
    Releasing(from) {
      this.releasingFrom = from;
    }
    /** Where a dropped item lands: the point the chef chose for this action, else below the holder it left. */
    DropPoint() {
      if (this.dropAt && this.releasingFrom.startsWith(HAND)) return this.dropAt.slice();
      const anchor = this.AnchorOf(this.releasingFrom);
      const floorY = this.floor?.transform.known ? this.floor.transform.position.y : 0;
      return anchor ? [round3(anchor.x), round3(floorY), round3(anchor.z)] : [0, round3(floorY), 0];
    }
    /** The world position a holder shows its item at; null for a hand whose chef cannot be placed. */
    AnchorOf(key) {
      if (key.startsWith(HAND)) return this.HandPosition(key.slice(HAND.length));
      const counter = this.counters.get(key);
      const top = counter?.top ?? null;
      if (top?.transform.known) return top.transform.position;
      return counter?.gameObject.transform.known ? counter.gameObject.transform.position : null;
    }
    /** Where a chef's held item is drawn: in front of the local head, or where a remote chef last said their head was. */
    HandPosition(uid) {
      const local = this.Networking.LocalPlayer;
      if (local.uid === uid) {
        const poses = this.Input.Poses;
        if (poses) return poses.head.position.add(poses.head.rotation.rotate(new Vector3(0, -0.3, 0.45)));
        return this.Input.Position?.add(new Vector3(0, -0.3, 0)) ?? null;
      }
      const chef = this.ChefOf(uid);
      return chef && chef.head ? new Vector3(chef.head[0], chef.head[1] - 0.3, chef.head[2]) : null;
    }
    ChefOf(uid) {
      for (const chef of this.PlayerBehaviours("Chef")) if (chef.Player?.uid === uid) return chef;
      return null;
    }
    // ---- intents ------------------------------------------------------------------------------------------------
    /** A local click (or release) becomes an intent for the referee. `target`: "c:<cell>", "i:<item>", "floor", "corner". */
    LocalIntent(kind, target, point, release = false) {
      const args = [kind, target];
      if (point) args.push(round3(point.x), round3(point.y), round3(point.z));
      else args.push(null, null, null);
      args.push(release);
      this.SendCommand("Intent", ...args);
    }
    /** Runs on the referee (a command): the upstream rule, for the calling chef, against the named target. */
    Intent(kind, target, x, y, z, release = false) {
      const player = this.Networking.CallingPlayer;
      if (!player) return;
      this.IntentFor(player.uid, kind, target, x, y, z, release);
    }
    /** The intent of the chef with user id `uid` (Intent, and rules tests that have no room). */
    IntentFor(uid, kind, target, x = null, y = null, z = null, release = false) {
      if (this.roster[uid] === void 0 || !this.match.AcceptsInput()) return;
      const handler = this.Handler(uid);
      handler.detector = new BoxCaster(this.TargetObject(target));
      this.dropAt = x !== null && y !== null && z !== null ? [x, y, z] : this.FloorBelowChef(uid);
      try {
        if (kind === "E") {
          const held = handler.holder.CurrentItem;
          handler.TryInteractWithItem();
          if (release && held && handler.holder.CurrentItem === held) handler.holder.ReleaseItem();
        } else if (kind === "Q") handler.TryInteractWithEnvironment();
      } finally {
        this.dropAt = null;
        this.releasingFrom = "";
      }
      this.CommitAll();
    }
    FloorBelowChef(uid) {
      const chef = this.ChefOf(uid);
      const floorY = this.floor?.transform.known ? this.floor.transform.position.y : 0;
      return chef?.head ? [round3(chef.head[0]), round3(floorY), round3(chef.head[2])] : null;
    }
    /** What a target names, as the box cast would hit it: a counter, a loose item, a corner (a hit with nothing), or nothing. */
    TargetObject(target) {
      if (target === "floor") return null;
      if (target.startsWith("c:")) {
        const counter = this.counters.get(target.slice(2));
        return counter ?? { kinds: [] };
      }
      if (target.startsWith("i:")) {
        const id = target.slice(2);
        const rec = this.items[id];
        if (!rec || !rec.pos || this.WhereIs(id) !== "loose") return { kinds: [] };
        return this.Item(id);
      }
      return { kinds: [] };
    }
    /** "holder:<key>", "stack:<key>", "plate:<id>" or "loose". */
    WhereIs(id) {
      for (const key of Object.keys(this.stacks)) if (this.stacks[key].indexOf(id) >= 0) return "stack:" + key;
      for (const key of Object.keys(this.holders)) if (this.holders[key] === id) return "holder:" + key;
      for (const other of Object.keys(this.items)) if (this.items[other].ings?.indexOf(id) !== void 0 && this.items[other].ings.indexOf(id) >= 0) return "plate:" + other;
      return "loose";
    }
    // ---- roster -------------------------------------------------------------------------------------------------
    /** Command: join the kitchen as a chef, or leave it. */
    Cook(join) {
      const player = this.Networking.CallingPlayer;
      if (!player) return;
      if (join) this.Enrol(player.uid);
      else this.Dismiss(player.uid);
      this.CommitAll();
    }
    Enrol(uid) {
      if (this.roster[uid] !== void 0) return true;
      const max = Math.max(1, Math.min(MAX_CHEFS, Number(this.Settings.get("chefs") ?? "") || 4));
      const used = new Set(Object.values(this.roster));
      if (used.size >= max) return false;
      let slot = 0;
      while (used.has(slot)) slot++;
      this.roster[uid] = slot;
      return true;
    }
    /** A chef leaves the kitchen (or the room): what they held falls where they were (PORT.md 8.6). */
    Dismiss(uid) {
      if (this.roster[uid] === void 0) return;
      const hand = this.Holder(HAND + uid);
      if (hand.HasItem()) {
        this.dropAt = this.FloorBelowChef(uid);
        this.releasingFrom = hand.key;
        hand.ReleaseItem();
        this.dropAt = null;
        this.releasingFrom = "";
      }
      delete this.roster[uid];
    }
    IsChef(uid) {
      return this.roster[uid] !== void 0;
    }
    OnPlayerLeft(_player) {
      if (this.Networking.IsReferee) this.SweepRoster();
    }
    /** Every chef who is no longer in the room is dismissed (also catches a leave the referee missed). */
    SweepRoster() {
      const present = new Set(this.Networking.GetPlayers().map((p) => p.uid));
      let changed = false;
      for (const uid of Object.keys(this.roster)) {
        if (present.has(uid)) continue;
        this.Dismiss(uid);
        changed = true;
      }
      if (changed) this.CommitAll();
    }
    // ---- the referee's clock ------------------------------------------------------------------------------------
    Update() {
      if (this.Networking.IsReferee) this.RefereeTick();
      this.Render();
      const now = this.Time.time;
      for (const [target, until] of [...this.flashes]) {
        if (now < until) continue;
        this.flashes.delete(target);
        this.Host.setActive(target, false);
      }
    }
    /** Shows a kit object (a floating text) for a while on this client: the upstream's one-shot text animations. */
    Flash(target, seconds, others = []) {
      for (const other of others) {
        if (other === target || !this.flashes.has(other)) continue;
        this.flashes.delete(other);
        this.Host.setActive(other, false);
      }
      this.Host.setActive(target, false);
      this.Host.setActive(target, true);
      this.flashes.set(target, this.Time.time + seconds);
    }
    RefereeTick() {
      if (this.Time.time - this.lastSweep >= 1) {
        this.lastSweep = this.Time.time;
        this.SweepRoster();
      }
      const G = this.match.G;
      if (!this.match.Paused) {
        this.match.Tick(G);
        if (this.match.KitchenRuns()) {
          for (const p of this.preparators.values()) p.Tick(G);
          this.orders.Asset.Tick(G);
          this.tutorial?.Tick(G);
        }
      }
      this.CommitAll();
    }
    /** Sends whatever the referee changed (each behaviour's synced fields, when they differ from what was last sent). */
    CommitAll() {
      if (!this.Networking.IsReferee) return;
      for (const b of [this, this.match, this.orders, this.score, this.tutorial]) {
        if (!b) continue;
        const fields = b.constructor.synced ?? [];
        const bag = b;
        const text = canonicalJson(fields.map((f5) => bag[f5] ?? null));
        if (this.sent.get(b) === text) continue;
        this.sent.set(b, text);
        b.RequestSerialization();
      }
    }
    // ---- effects: seen and heard once, where they happen -------------------------------------------------------
    /** Referee: plays a cosmetic effect on every client (a network event; never replayed to a late joiner). */
    Fx(name, ...args) {
      if (!this.Networking.IsReferee) return;
      this.SendCustomNetworkEvent(NetworkEventTarget.All, "OnFx", name, args);
    }
    OnFx(name, args) {
      for (const handler of (this.fxHandlers.get(name) ?? []).slice()) handler(...Array.isArray(args) ? args : []);
    }
    OnEffect(name, handler) {
      let list = this.fxHandlers.get(name);
      if (!list) this.fxHandlers.set(name, list = []);
      list.push(handler);
    }
    /** Plays one clip of a named list (random, as AudioSourceDictionary.PlayRandom) at a kit object. */
    PlaySound(name, at, index = -1) {
      const list = this.clips[name];
      if (!list || list.length === 0 || !at) return;
      const clip = list[index >= 0 ? Math.min(index, list.length - 1) : this.Random.RangeInt(0, list.length)];
      const volume = this.gameData?.settings?.Data.Audio.effects ?? 1;
      this.Host.playClip(at, clip.index, clip.on ?? void 0, volume < 1 ? volume : void 0);
    }
    // ---- the item pool, per client ------------------------------------------------------------------------------
    /** The kit object key of a counter cell ("c_<cell>"). */
    static CellKey(cell) {
      return "c_" + cell;
    }
    Render() {
      const G = this.match.KitchenG;
      for (const p of this.preparators.values()) p.Render(G, this.lastRenderG);
      this.lastRenderG = G;
      if (!this.slots.length) return;
      const place = /* @__PURE__ */ new Map();
      const scale = this.kitScale;
      const holderPos = (key) => this.AnchorOf(key);
      for (const key of Object.keys(this.holders)) {
        if (this.stacks[key]) continue;
        place.set(this.holders[key], { at: "h:" + key, pos: holderPos(key) });
      }
      for (const key of Object.keys(this.stacks)) {
        const base = holderPos(key);
        this.stacks[key].forEach((id, i) => place.set(id, { at: `s:${key}:${i}`, pos: base ? base.add(Vector3.up.scale(i * PLATE_HEIGHT * scale)) : null }));
      }
      for (const id of Object.keys(this.items)) {
        const rec = this.items[id];
        if (rec.pos && !place.has(id)) place.set(id, { at: "loose", pos: new Vector3(rec.pos[0], rec.pos[1], rec.pos[2]) });
      }
      for (const id of Object.keys(this.items)) {
        const rec = this.items[id];
        if (!rec.ings) continue;
        const platePos = place.get(id)?.pos ?? null;
        for (const child of rec.ings) {
          const lp = this.items[child]?.lp;
          const pos = platePos && lp ? platePos.add(new Vector3(lp[0], lp[1], lp[2]).scale(scale)) : platePos;
          place.set(child, { at: "p:" + id, pos });
        }
      }
      for (const [id, slot] of [...this.slotOf]) {
        if (this.items[id]) continue;
        this.slotOf.delete(id);
        this.ShowSlot(slot, null);
      }
      for (const id of Object.keys(this.items)) {
        let slot = this.slotOf.get(id);
        if (slot === void 0) {
          slot = this.FreeSlot();
          if (slot < 0) continue;
          this.slotOf.set(id, slot);
        }
        const rec = this.items[id];
        const where = place.get(id) ?? { at: "?", pos: null };
        const icons = rec.k < 0 ? IngredientIcons.Text((rec.ings ?? []).map((c) => this.ingredientSettings.variants[this.items[c]?.k ?? 0]?.Icon ?? "")) : "";
        this.ShowSlot(slot, { id, k: rec.k, at: where.at, icons });
        if (where.pos && !this.grabbedSlot.has(slot)) {
          const object = this.slots[slot];
          const now = object.transform.position;
          if (!object.transform.known || Vector3.Distance(now, where.pos) > 1e-3) {
            object.transform.SetPositionAndRotation(where.pos, rec.lp ? Quaternion.Euler(0, rec.lp[3], 0) : Quaternion.identity);
          }
        }
      }
    }
    FreeSlot() {
      const used = new Set(this.slotOf.values());
      for (let i = 0; i < this.slots.length; i++) if (!used.has(i)) return i;
      return -1;
    }
    ShowSlot(slot, show) {
      const object = this.slots[slot];
      const path = this.slotPaths[slot] ?? "";
      const before = this.slotShown[slot] ?? null;
      if (!show) {
        if (before) object.SetActive(false);
        this.slotShown[slot] = null;
        return;
      }
      if (!before) object.SetActive(true);
      if (!before || before.k !== show.k) {
        for (let v = 0; v < this.ingredientSettings.variants.length; v++) this.Host.setActive(`@${path}/V${v}`, v === show.k);
        this.Host.setActive(`@${path}/Plate`, show.k < 0);
      }
      if (show.k < 0 && (!before || before.icons !== show.icons)) this.Host.setText(`@${path}/Plate/Icons`, show.icons);
      this.slotShown[slot] = show;
    }
    /** The item a slot shows on this client, if any. */
    SlotItem(slot) {
      return this.slotShown[slot]?.id ?? null;
    }
    /** The slot that shows an item on this client, or -1. */
    SlotOf(id) {
      return this.slotOf.get(id) ?? -1;
    }
    /** The target a click on an item means: the counter it is on, the plate it is on, or the item itself when loose. */
    TargetOfItem(id) {
      const where = this.WhereIs(id);
      if (where.startsWith("holder:") || where.startsWith("stack:")) {
        const key = where.slice(where.indexOf(":") + 1);
        return key.startsWith(HAND) ? null : "c:" + key;
      }
      if (where.startsWith("plate:")) return this.TargetOfItem(where.slice(6));
      return "i:" + id;
    }
    ClickSlot(slot, detail) {
      const id = this.SlotItem(slot);
      if (!id) return;
      const target = this.TargetOfItem(id);
      if (target) this.LocalIntent("E", target, detail.point ?? null);
    }
    /** VR: picking an item up is E on wherever it is; a grab that cannot take it is let go at once. */
    GrabSlot(slot) {
      const id = this.SlotItem(slot);
      const me = this.Networking.LocalPlayer.uid;
      if (!id || !this.IsChef(me) || this.holders[HAND + me] !== void 0) {
        this.slots[slot].ReleaseGrab();
        return;
      }
      const target = this.TargetOfItem(id);
      if (!target) {
        this.slots[slot].ReleaseGrab();
        return;
      }
      this.grabbedSlot.add(slot);
      this.LocalIntent("E", target, null);
    }
    /** VR: letting go is E on what is under the hand: a counter top within reach, a loose plate, else the floor (C9). */
    DropSlot(slot, _detail) {
      this.grabbedSlot.delete(slot);
      const id = this.SlotItem(slot);
      const me = this.Networking.LocalPlayer.uid;
      if (!id || this.holders[HAND + me] !== id) return;
      const at = this.slots[slot].transform.position;
      this.LocalIntent("E", this.TargetBelow(at, id), at, true);
    }
    /** The counter whose top is nearest a point (within half a cell), else a loose plate there, else the floor. */
    TargetBelow(at, except) {
      const reach = 0.75 * this.kitScale;
      let best = null;
      let bestDistance = reach;
      for (const [cell, counter] of this.counters) {
        const p = counter.top?.transform.known ? counter.top.transform.position : counter.gameObject.transform.known ? counter.gameObject.transform.position : null;
        if (!p) continue;
        const d = Math.hypot(p.x - at.x, p.z - at.z);
        if (d < bestDistance) {
          bestDistance = d;
          best = "c:" + cell;
        }
      }
      if (best) return best;
      for (const id of Object.keys(this.items)) {
        const rec = this.items[id];
        if (id === except || rec.k >= 0 || !rec.pos) continue;
        if (Math.hypot(rec.pos[0] - at.x, rec.pos[2] - at.z) < 0.5 * this.kitScale) return "i:" + id;
      }
      return "floor";
    }
  };
  __publicField(_Kitchen, "synced", ["items", "holders", "stacks", "off", "prep", "roster", "next"]);
  /** What other clients may run here: chefs' intents and COOK (commands to the referee), the referee's effects. */
  __publicField(_Kitchen, "networkCallable", ["Intent", "Cook", "OnFx"]);
  var Kitchen = _Kitchen;

  // src/Chef.ts
  var HEAD_STEP = 0.05;
  var Chef = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** The head's position, rounded to centimetres, while this player holds an item; null otherwise. */
      __publicField(this, "head", null);
      __publicField(this, "kitchen");
    }
    Update() {
      const player = this.Player;
      if (!player || !player.isLocal || !this.kitchen) return;
      const holding = this.kitchen.holders[HAND + player.uid] !== void 0;
      const at = this.Input.Position;
      let next = null;
      if (holding && at) next = [Math.round(at.x * 100) / 100, Math.round(at.y * 100) / 100, Math.round(at.z * 100) / 100];
      const same = next === this.head || next !== null && this.head !== null && Math.hypot(next[0] - this.head[0], next[1] - this.head[1], next[2] - this.head[2]) < HEAD_STEP;
      if (same) return;
      this.head = next;
      this.RequestSerialization();
    }
  };
  __publicField(Chef, "perPlayer", true);
  __publicField(Chef, "synced", ["head"]);
  __publicField(Chef, "syncMode", "continuous");

  // src/CountDown.ts
  function D2(value) {
    return String(Math.max(0, Math.trunc(value))).padStart(2, "0");
  }
  var CountDown = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "path", "");
      __publicField(this, "board", "");
      __publicField(this, "countDown", null);
      __publicField(this, "visible", null);
      __publicField(this, "lastElapsed", null);
      __publicField(this, "round", -1);
      /** What this client played (for tests). */
      __publicField(this, "played", []);
    }
    Update() {
      const match = this.kitchen.match;
      const m = match.match;
      const counting = m.phase === "countdown" || (m.phase === "round" || m.phase === "tutorial") && match.G < match.CountDownEnd + 0.5;
      const elapsed = match.KitchenG - m.t0;
      const visible = counting && m.phase === "countdown" && elapsed >= 0;
      if (visible !== this.visible) {
        this.visible = visible;
        this.Host.setActive(`@${this.path}`, visible);
      }
      if (m.round !== this.round) {
        this.round = m.round;
        this.lastElapsed = m.phase === "countdown" ? null : Infinity;
        if (m.phase === "countdown" && elapsed > 1) this.lastElapsed = elapsed;
      }
      if (!counting || this.lastElapsed === Infinity) return;
      const time = match.settings.CountDown;
      const from = this.lastElapsed ?? -1;
      for (const value of time.TicksBetween(from, elapsed)) this.HandleCountDownUpdated(value);
      if (from < time.Time && elapsed >= time.Time) this.HandleCountDownFinished();
      this.lastElapsed = elapsed;
    }
    HandleCountDownUpdated(time) {
      this.played.push(D2(time));
      this.Host.animPlay(`@${this.path}`, "CountDown@CountDown");
      this.kitchen.PlaySound("warning", this.board);
      if (this.countDown) this.countDown.text = D2(time);
    }
    HandleCountDownFinished() {
      this.played.push("start");
      this.kitchen.PlaySound("countdownStart", this.board);
      this.Host.setActive(`@${this.path}`, false);
      this.visible = false;
      this.lastElapsed = Infinity;
    }
  };

  // src/Counter.ts
  var Counter = class extends Behaviour {
    constructor() {
      super(...arguments);
      // ---- from bindings.json ----
      __publicField(this, "kitchen");
      /** The cell's name in the upstream scene (CutCounter_00); also its holder's key. */
      __publicField(this, "cell", "");
      /** Where items sit (the ItemHolder child's position). */
      __publicField(this, "top", null);
      /** Counter_Plate: a plate is under its holder in the prefab (ItemHolder.Awake places it). */
      __publicField(this, "startsWithPlate", false);
      /** Counter_PlateStack: its holder carries an ItemHolderStack. */
      __publicField(this, "plateStack", false);
      __publicField(this, "kinds", [IItemHolderKind, IItemCollectorKind, IItemTransferKind]);
      __publicField(this, "holder");
      __publicField(this, "highlightableContainer", new HighlighterContainer());
      __publicField(this, "stack", null);
    }
    /** `event OnItemCollectedFromTop` forwards to the holder's OnItemReleased. */
    get OnItemCollectedFromTop() {
      return this.holder.OnItemReleased;
    }
    get CurrentItem() {
      return this.holder.CurrentItem;
    }
    get IsEnabled() {
      return this.kitchen.off[this.cell] !== 1;
    }
    set IsEnabled(value) {
      if (value) delete this.kitchen.off[this.cell];
      else this.kitchen.off[this.cell] = 1;
    }
    Start() {
      this.holder = this.kitchen.Holder(this.cell);
      this.OnEnable();
    }
    /** Upstream OnEnable: what this component listens to. */
    OnEnable() {
      this.holder.OnItemPlaced.push((item) => this.HandleItemPlaced(item));
      this.holder.OnItemReleased.push((item) => this.HandleItemReleased(item));
      if (this.plateStack) {
        this.stack = new ItemHolderStack(this.kitchen, this.holder);
        this.stack.Enable(this.kitchen.orders.Asset);
      }
    }
    /** The local player clicked the counter: E on it. */
    Clicked(detail) {
      this.kitchen.LocalIntent("E", "c:" + this.cell, detail?.point ?? null);
    }
    TryTransferItem(fromHolder) {
      return this.holder.TryTransferItem(fromHolder);
    }
    TryCollectItem() {
      return this.holder.TryCollectItem();
    }
    HasPlate() {
      return this.holder.IsPlate() !== null;
    }
    ReleaseItem() {
      this.holder.ReleaseItem();
    }
    HandleItemReleased(item) {
      if (item) this.highlightableContainer.Remove(item.GetHighlightable());
    }
    HandleItemPlaced(item) {
      this.highlightableContainer.Add(item.GetHighlightable());
    }
  };

  // src/GameClock.ts
  var GameClock = class {
    constructor(server, state) {
      __publicField(this, "server");
      __publicField(this, "state");
      this.server = server;
      this.state = state;
    }
    /** A clock whose G is 0 now. */
    static Start(serverNow) {
      return { e: serverNow, f: null };
    }
    /** Game seconds now. */
    get G() {
      const s = this.state();
      return s.f !== null ? s.f : this.server() - s.e;
    }
    get Paused() {
      return this.state().f !== null;
    }
    /** The state after a pause now (unchanged if already paused). */
    Pause() {
      const s = this.state();
      return s.f !== null ? { ...s } : { e: s.e, f: this.server() - s.e };
    }
    /** The state after resuming now: G carries on from where it stopped. */
    Resume() {
      const s = this.state();
      return s.f === null ? { ...s } : { e: this.server() - s.f, f: null };
    }
  };
  function boostedElapsed(from, to, boostFrom, boostTo, factor) {
    if (to <= from) return 0;
    if (boostFrom === null || boostTo === null || factor === 1 || boostTo <= boostFrom) return to - from;
    const overlap = Math.max(0, Math.min(to, boostTo) - Math.max(from, boostFrom));
    return to - from - overlap + overlap * factor;
  }
  function roundTime(t) {
    return Math.round(t * 1e6) / 1e6;
  }

  // src/AbstractIngredientPreparator.ts
  var AbstractIngredientPreparator = class extends Behaviour {
    constructor() {
      super(...arguments);
      // ---- from bindings.json (the prefab's serialized fields) ----
      __publicField(this, "kitchen");
      /** The counter cell this preparator sits on; its holder's key. */
      __publicField(this, "cell", "");
      /** The preparator's object path under the kit root (its knife, pan, warning and texts are children). */
      __publicField(this, "path", "");
      __publicField(this, "allowedStatus", 0);
      __publicField(this, "preparatedStatus", 0);
      __publicField(this, "finalSecondsBooster", 1.25);
      /** `Counter = GetComponentInParent<Counter>()`. */
      __publicField(this, "counter");
      /** The progress bar's fill (scaled along x), under PreparationWorldSpaceCanvas. */
      __publicField(this, "barFill", null);
      __publicField(this, "kinds", [IInteractableKind]);
      __publicField(this, "OnInteracted", []);
      __publicField(this, "OnIngredientRejected", []);
      __publicField(this, "OnPreparationStarted", []);
      __publicField(this, "OnPreparationCompleted", []);
      __publicField(this, "OnPreparationUpdated", []);
      __publicField(this, "holder");
    }
    /** `event OnItemPlaced` forwards to the holder's. */
    get OnItemPlaced() {
      return this.holder.OnItemPlaced;
    }
    get Counter() {
      return this.counter;
    }
    get IsEnabled() {
      return this.kitchen.off["prep:" + this.cell] !== 1;
    }
    set IsEnabled(value) {
      if (value) delete this.kitchen.off["prep:" + this.cell];
      else this.kitchen.off["prep:" + this.cell] = 1;
    }
    /** This preparator's state; a fresh one when the kitchen has none yet. */
    get st() {
      return this.kitchen.prep[this.cell] ?? this.DefaultState();
    }
    get IsPreparing() {
      return this.st.p === 1;
    }
    set IsPreparing(value) {
      this.Write().p = value ? 1 : 0;
    }
    get IsPaused() {
      return this.st.ps === 1;
    }
    set IsPaused(value) {
      const st = this.Write();
      const G = this.kitchen.match.G;
      if (value && st.ps === 0 && st.since !== null) {
        st.acc = roundTime(this.ProgressAt(G));
        st.since = null;
      } else if (!value) st.since = roundTime(G);
      st.ps = value ? 1 : 0;
    }
    /** The state to change; created in the kitchen's state if missing. */
    Write() {
      var _a, _b;
      return (_a = this.kitchen.prep)[_b = this.cell] ?? (_a[_b] = this.DefaultState());
    }
    DefaultState() {
      return { p: 0, ps: 0, acc: 0, since: null, dur: 0, n: 0, burn: null, nb: 0, knife: 1, fry: 0, smoke: 0, anim: this.GetIdleAnimationName() };
    }
    Start() {
      this.holder = this.kitchen.Holder(this.cell);
      this.OnEnable();
    }
    OnEnable() {
    }
    /** Q, on the referee. */
    Interact() {
      invoke(this.OnInteracted);
      this.TogglePreparation();
    }
    PlayIdleAnimation() {
      this.Write().anim = this.GetIdleAnimationName();
    }
    PlayPreparationAnimation() {
      this.Write().anim = this.GetPreparationAnimationName();
    }
    CompletePreparation() {
      this.IsPreparing = false;
      this.PlayIdleAnimation();
      invoke(this.OnPreparationCompleted);
    }
    TogglePreparation() {
      if (!this.IsPreparing) this.TryStartPreparation();
      else if (this.IsPaused) this.ContinuePreparation();
      else this.PausePreparation();
    }
    TryStartPreparation() {
      const item = this.holder.CurrentItem;
      const ingredient = item && item.kind === "ingredient" ? item : null;
      const canPrepare = ingredient !== null && this.CanPrepare(ingredient.Status);
      if (canPrepare) this.StartPreparation(ingredient);
      else invoke(this.OnIngredientRejected);
    }
    StartPreparation(ingredient) {
      this.IsPreparing = true;
      invoke(this.OnPreparationStarted);
      this.ContinuePreparation();
      this.PreparationRoutine(ingredient);
    }
    PausePreparation() {
      this.IsPaused = true;
      this.PlayIdleAnimation();
    }
    ContinuePreparation() {
      this.IsPaused = false;
      this.PlayPreparationAnimation();
    }
    /** The coroutine's start: `currentTime = 0`, `preparingTime = ingredient.PreparationTime`. */
    PreparationRoutine(ingredient) {
      const st = this.Write();
      st.acc = 0;
      st.since = roundTime(this.kitchen.match.G);
      st.dur = ingredient.PreparationTime;
      st.n = ingredient.Name;
      invoke(this.OnPreparationUpdated, 0);
    }
    /** The coroutine's loop, on the referee's tick: done when the progress reaches the preparation time. */
    Tick(G) {
      const st = this.st;
      if (st.p !== 1 || st.ps === 1 || st.since === null) return;
      if (this.ProgressAt(G) < st.dur) return;
      invoke(this.OnPreparationUpdated, 1);
      this.PrepareIngredient(st.n);
      this.CompletePreparation();
    }
    /** Seconds of progress at game time G (upstream's `currentTime`). */
    ProgressAt(G) {
      const st = this.st;
      if (st.p !== 1) return 0;
      if (st.since === null) return st.acc;
      const boost = this.kitchen.match.BoostWindow();
      return st.acc + boostedElapsed(st.since, G, boost?.[0] ?? null, boost?.[1] ?? null, this.finalSecondsBooster);
    }
    /** The bar's value, 0 to 1 (OnPreparationUpdated's argument). */
    NormalizedProgress(G) {
      const st = this.st;
      return st.p === 1 && st.dur > 0 ? Math.min(1, this.ProgressAt(G) / st.dur) : 0;
    }
    PrepareIngredient(name) {
      const preparedIngredient = this.kitchen.ingredientSettings.SpawnIngredient(name, this.preparatedStatus);
      if (preparedIngredient) this.holder.ReplaceItem(preparedIngredient);
    }
    CanPrepare(status) {
      return status === this.allowedStatus;
    }
    /** Every client, every tick: what this preparator looks like (and sounds like) at game time G. */
    Render(_G, _previousG) {
    }
  };

  // src/CounterKnife.ts
  var CounterKnife = class {
    constructor(kitchen, state, at) {
      __publicField(this, "kitchen");
      __publicField(this, "state");
      /** The kit object the chop sounds are played at. */
      __publicField(this, "at");
      this.kitchen = kitchen;
      this.state = state;
      this.at = at;
    }
    Show() {
      this.state().knife = 1;
    }
    Hide() {
      this.state().knife = 0;
    }
    PlayCutSound() {
      this.kitchen.PlaySound("chop", this.at);
    }
  };

  // src/CuttingBoard.ts
  var CHOP_EVERY = 0.25;
  var CuttingBoard = class extends AbstractIngredientPreparator {
    constructor() {
      super(...arguments);
      __publicField(this, "knife");
      __publicField(this, "lastChop", null);
      __publicField(this, "shownAnim", "");
    }
    OnEnable() {
      this.knife = new CounterKnife(this.kitchen, () => this.Write(), Kitchen.CellKey(this.cell));
      this.holder.OnItemPlaced.push(() => this.HandleItemPlaced());
      this.holder.OnItemReleased.push(() => this.HandleItemReleased());
    }
    PlayCutSound() {
      this.knife.PlayCutSound();
    }
    /** Reset(): what the board accepts and makes. */
    SetupIngredientStatus() {
      this.allowedStatus = IngredientStatus.Cuttable;
      this.preparatedStatus = IngredientStatus.Ready;
    }
    GetIdleAnimationName() {
      return "CuttingBoard@Idle";
    }
    GetPreparationAnimationName() {
      return "CuttingBoard@Cutting";
    }
    PlayIdleAnimation() {
      super.PlayIdleAnimation();
      if (this.IsPaused) this.knife.Hide();
    }
    PlayPreparationAnimation() {
      this.knife.Show();
      super.PlayPreparationAnimation();
    }
    HandleItemPlaced() {
      this.knife.Hide();
    }
    HandleItemReleased() {
      this.knife.Show();
    }
    Render(G, previousG) {
      const st = this.st;
      this.Host.setActive(`@${this.path}/Knife/Model`, st.knife === 1);
      if (st.anim !== this.shownAnim) {
        this.shownAnim = st.anim;
        this.Host.animPlay(`@${this.path}`, st.anim);
      }
      const cutting = st.p === 1 && st.ps === 0;
      const chop = Math.floor(G / CHOP_EVERY);
      if (cutting && previousG !== null && this.lastChop !== null && chop !== this.lastChop && G > previousG) this.PlayCutSound();
      this.lastChop = cutting ? chop : null;
    }
  };

  // src/DeliveryCounter.ts
  var DeliveryCounter = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "cell", "");
      __publicField(this, "top", null);
      __publicField(this, "canvas");
      __publicField(this, "kinds", [IItemTransferKind]);
    }
    get IsEnabled() {
      return this.kitchen.off[this.cell] !== 1;
    }
    set IsEnabled(value) {
      if (value) delete this.kitchen.off[this.cell];
      else this.kitchen.off[this.cell] = 1;
    }
    /** The local player clicked the delivery counter: E on it. */
    Clicked(detail) {
      this.kitchen.LocalIntent("E", "c:" + this.cell, detail?.point ?? null);
    }
    TryTransferItem(fromHolder) {
      const item = fromHolder.CurrentItem;
      const plate = item && item.kind === "plate" ? item : null;
      if (plate === null) {
        this.canvas.ShowNeedPlate();
        return false;
      }
      fromHolder.ReleaseItem();
      const ingredients = plate.IngredientsToArray();
      const delivery = this.kitchen.orders.Asset.TryDelivery(ingredients);
      this.kitchen.DestroyItem(plate.id);
      if (delivery.delivered) {
        this.canvas.ShowTip(delivery.tip);
        this.kitchen.score.Asset.DeliveryOrder(delivery.tip);
        return true;
      }
      this.canvas.ShowWrongPlate();
      this.kitchen.score.Asset.DeliveryFailedOrder();
      return false;
    }
  };

  // src/DeliveryCounterCanvas.ts
  function FormatTip(format, value) {
    return format.replace(/\{0(?::D(\d+))?\}/, (_m, digits) => {
      const text = String(Math.abs(Math.trunc(value))).padStart(digits ? Number(digits) : 0, "0");
      return (value < 0 ? "-" : "") + text;
    });
  }
  var DeliveryCounterCanvas = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "cell", "");
      __publicField(this, "path", "");
      __publicField(this, "tip", null);
      __publicField(this, "tipFormat", kitchen_data_default.ui.tipFormat ?? "+{0:D2} Tip!");
      /** What this client has shown, newest last (for tests). */
      __publicField(this, "shown", []);
    }
    Start() {
      for (const name of ["NeedPlate", "Tip", "WrongPlate"]) this.Host.setActive(`@${this.path}/${name}`, false);
      this.kitchen.OnEffect("delivery", (kind, value) => this.Play(String(kind), Number(value ?? 0)));
    }
    ShowTip(value) {
      this.kitchen.Fx("delivery", "tip", value);
    }
    ShowNeedPlate() {
      this.kitchen.Fx("delivery", "needPlate", 0);
    }
    ShowWrongPlate() {
      this.kitchen.Fx("delivery", "wrongPlate", 0);
    }
    Play(kind, value) {
      const all = ["NeedPlate", "Tip", "WrongPlate"].map((n) => `@${this.path}/${n}`);
      const at = Kitchen.CellKey(this.cell);
      if (kind === "tip") {
        const text = FormatTip(this.tipFormat, value);
        if (this.tip) this.tip.text = text;
        this.shown.push(text);
        this.kitchen.Flash(`@${this.path}/Tip`, 2.5, all);
      } else if (kind === "needPlate") {
        this.shown.push("Need Plate!");
        this.kitchen.PlaySound("fail01", at);
        this.kitchen.Flash(`@${this.path}/NeedPlate`, 2, all);
      } else if (kind === "wrongPlate") {
        this.shown.push("Wrong Plate!");
        this.kitchen.PlaySound("fail02", at);
        this.kitchen.Flash(`@${this.path}/WrongPlate`, 2, all);
      }
    }
  };

  // src/GameData.ts
  var DefaultVolume = 1;
  function NewGameData(now) {
    return { HighScore: 0, Audio: { music: DefaultVolume, effects: DefaultVolume }, Checked: [], CreationTime: now, LastUpdateTime: 0 };
  }

  // src/GameDataSettings.ts
  var saveFileName = "GameData";
  var GameDataSettings = class {
    constructor(storage, now) {
      __publicField(this, "storage");
      __publicField(this, "now");
      __publicField(this, "OnSaveFinished", []);
      __publicField(this, "OnLoadFinished", []);
      __publicField(this, "Data");
      this.storage = storage;
      this.now = now;
      this.Data = NewGameData(now());
    }
    Save() {
      this.Data.LastUpdateTime = this.now();
      this.storage?.set(saveFileName, this.Data);
      invoke(this.OnSaveFinished);
    }
    LoadOrCreate() {
      const loaded = this.storage ? this.storage.get(saveFileName, null) : null;
      this.Data = loaded && typeof loaded.HighScore === "number" ? { ...NewGameData(this.now()), ...loaded } : NewGameData(this.now());
      invoke(this.OnLoadFinished);
    }
  };

  // src/GameDataManager.ts
  var GameDataManager = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "settings");
    }
    Start() {
      let storage = null;
      try {
        storage = this.Storage;
        storage.has("GameData");
      } catch {
        storage = null;
      }
      this.settings = new GameDataSettings(storage, () => this.Networking.GetServerTimeInSeconds());
      this.settings.LoadOrCreate();
    }
  };

  // src/IngredientCounter.ts
  var IngredientCounter = class extends Counter {
    constructor() {
      super(...arguments);
      /** The ingredient variant this crate gives (`data`, an IngredientData asset upstream). */
      __publicField(this, "data", 0);
      __publicField(this, "OnItemCollectedFromInside", []);
    }
    get Data() {
      return this.kitchen.ingredientSettings.variants[this.data];
    }
    TryCollectItem() {
      const collected = super.TryCollectItem();
      if (collected.ok) return collected;
      const item = this.kitchen.ItemCount() < POOL_SIZE ? this.Data.Spawn() : null;
      if (!item) {
        this.kitchen.Fx("full", this.cell);
        return { ok: false, item: null };
      }
      this.PlayOpenAnimation();
      for (const listener of this.OnItemCollectedFromInside.slice()) listener(item);
      return { ok: true, item };
    }
    GetIngredientName() {
      return this.Data.Name;
    }
    PlayOpenAnimation() {
      this.kitchen.Fx("crate", this.cell);
    }
  };

  // src/MainMenu.ts
  var CHEF_COLOURS = ["Blue", "Green", "Red", "Yellow", "Orange", "Purple", "Pink", "White"];
  var CREDITS = "Rules and original code: <color=yellow>Hyago Oliveira</color> (github.com/HyagoOliveira/KitchenChaos, MIT License, Copyright (c) 2023 Hyago Oliveira)\n\nKitchen art: <color=yellow>KayKit</color> by Kay Lousberg (CC0)\n\nPort to Altspace: AltspaceGames";
  var MainMenu = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "mainMenuOptions");
      __publicField(this, "soundPopup");
      __publicField(this, "credits", null);
      __publicField(this, "creditsText", null);
      __publicField(this, "roster", null);
      __publicField(this, "creditsPopup");
      __publicField(this, "shownPhase", "");
    }
    Start() {
      this.creditsPopup = new CanvasViewer(this.credits);
      this.creditsPopup.Hide();
      if (this.creditsText) this.creditsText.text = CREDITS;
      this.mainMenuOptions.OnOpenCreditsRequested.push(() => this.HandleOpenCreditsRequested());
      this.mainMenuOptions.OnOpenSoundsOptionsRequested.push(() => this.HandleOpenSoundsOptionsRequested());
      this.soundPopup.popup.OnHidden.push(() => this.HandlePopupHidden());
      this.creditsPopup.OnHidden.push(() => this.HandlePopupHidden());
    }
    Update() {
      const phase = this.kitchen.match.Phase;
      if (phase !== this.shownPhase) {
        this.shownPhase = phase;
        if (phase === "lobby" && !this.creditsPopup.IsVisible && !this.soundPopup.popup.IsVisible) this.mainMenuOptions.Show();
        else if (phase !== "lobby") {
          this.mainMenuOptions.Hide();
          this.creditsPopup.Hide();
        }
      }
      if (this.roster) {
        const names = this.Networking.GetPlayers().filter((p) => this.kitchen.roster[p.uid] !== void 0).sort((a, b) => this.kitchen.roster[a.uid] - this.kitchen.roster[b.uid]).map((p) => `${CHEF_COLOURS[this.kitchen.roster[p.uid]] ?? ""}: ${p.displayName}`);
        this.roster.text = names.length ? names.join("\n") : "Press COOK to join the kitchen";
      }
    }
    HandleOpenCreditsRequested() {
      this.mainMenuOptions.Hide();
      this.creditsPopup.Show();
    }
    HandleOpenSoundsOptionsRequested() {
      this.mainMenuOptions.Hide();
      this.soundPopup.Show();
    }
    /** The credits popup's Close button. */
    CloseCredits() {
      this.creditsPopup.Hide();
    }
    HandlePopupHidden() {
      if (this.kitchen.match.Phase === "lobby") this.mainMenuOptions.Show();
    }
  };

  // src/MainMenuOptions.ts
  var MainMenuOptions = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      /** The TUTORIAL button (hidden when the `tutorial` setting is off). */
      __publicField(this, "tutorialButton", "");
      __publicField(this, "OnOpenCreditsRequested", []);
      __publicField(this, "OnOpenSoundsOptionsRequested", []);
      __publicField(this, "viewer");
    }
    Start() {
      this.viewer = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
      if (this.tutorialButton && this.Settings.get("tutorial") === "off") this.Host.setActive(this.tutorialButton, false);
    }
    Show() {
      this.viewer.Show();
    }
    Hide() {
      this.viewer.Hide();
    }
    PlayGame() {
      this.kitchen.match.SendCommand("Play");
    }
    PlayTutorial() {
      this.kitchen.match.SendCommand("Tutorial");
    }
    /** COOK: join the kitchen, or leave it. */
    ToggleCook() {
      this.kitchen.SendCommand("Cook", !this.kitchen.IsChef(this.Networking.LocalPlayer.uid));
    }
    RequestOpenCredits() {
      for (const l of this.OnOpenCreditsRequested.slice()) l();
    }
    RequestOpenSoundOptions() {
      for (const l of this.OnOpenSoundsOptionsRequested.slice()) l();
    }
  };

  // src/TimeDown.ts
  var TimeDown = class {
    constructor(time) {
      /** Whole seconds. */
      __publicField(this, "Time");
      __publicField(this, "OnStarted", []);
      __publicField(this, "OnFinished", []);
      __publicField(this, "OnUpdated", []);
      this.Time = time;
    }
    /** The value shown `elapsed` seconds after the start: Time, Time - 1, ..., 0 (null before the start). */
    ValueAt(elapsed) {
      if (elapsed < 0) return null;
      return Math.max(0, this.Time - Math.floor(elapsed));
    }
    /** The OnUpdated values whose moment lies in (fromElapsed, toElapsed]: the ticks a client crossed since it last looked. */
    TicksBetween(fromElapsed, toElapsed) {
      const out = [];
      for (let k = 0; k <= this.Time; k++) if (k > fromElapsed && k <= toElapsed) out.push(this.Time - k);
      if (fromElapsed < 0 && toElapsed >= 0) out.unshift(this.Time);
      return out.filter((v, i, a) => a.indexOf(v) === i);
    }
  };

  // src/TimeLimit.ts
  var TimeLimit = class extends TimeDown {
    constructor(time, finalSeconds) {
      super(time);
      __publicField(this, "finalSeconds");
      __publicField(this, "OnFinalSecondsStarted", []);
      this.finalSeconds = finalSeconds;
    }
    get FinalSeconds() {
      return this.finalSeconds;
    }
    /** FinalSecondsRoutine: seconds from the start to OnFinalSecondsStarted. */
    get TimeToFinalSeconds() {
      return this.Time - this.finalSeconds;
    }
  };

  // src/MatchSettings.ts
  var MatchSettings = class {
    constructor(roundSeconds = kitchen_data_default.match.timeLimit) {
      __publicField(this, "CountDown");
      __publicField(this, "TimeLimit");
      __publicField(this, "IsAllowToStartTimeLimit", true);
      this.CountDown = new TimeDown(kitchen_data_default.match.countDown);
      this.TimeLimit = new TimeLimit(roundSeconds, kitchen_data_default.match.finalSeconds);
    }
    /** MatchManager.Start: `Invoke(nameof(StartCountDown), 0.2F)`. */
    static get StartDelay() {
      return kitchen_data_default.match.startDelay;
    }
    /** A round of another length (the events' listeners move over). */
    SetRoundLength(seconds) {
      if (seconds === this.TimeLimit.Time) return;
      const next = new TimeLimit(seconds, kitchen_data_default.match.finalSeconds);
      next.OnStarted.push(...this.TimeLimit.OnStarted);
      next.OnFinished.push(...this.TimeLimit.OnFinished);
      next.OnUpdated.push(...this.TimeLimit.OnUpdated);
      next.OnFinalSecondsStarted.push(...this.TimeLimit.OnFinalSecondsStarted);
      this.TimeLimit = next;
    }
  };

  // src/MatchManager.ts
  var TIMES_UP_SECONDS = 3;
  var _MatchManager = class _MatchManager extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "match", _MatchManager.Lobby(0, 0));
      __publicField(this, "kitchen");
      __publicField(this, "settings");
      __publicField(this, "clock");
      __publicField(this, "OnPaused", []);
      __publicField(this, "OnResumed", []);
    }
    static Lobby(round, best) {
      return { phase: "lobby", mode: "game", round, t0: 0, len: 120, rs: null, ff: 0, end: null, clock: { e: 0, f: 0 }, by: "", best, res: null };
    }
    Start() {
      this.settings = new MatchSettings(this.RoundSetting());
      this.clock = new GameClock(() => this.Networking.GetServerTimeInSeconds(), () => this.match.clock);
      this.settings.CountDown.OnFinished.push(() => this.HandleCountDownFinished());
    }
    RoundSetting() {
      const value = Math.round(Number(this.Settings.get("round") ?? ""));
      return value >= 30 && value <= 600 ? value : 120;
    }
    // ---- the clock ----------------------------------------------------------------------------------------------
    get G() {
      return this.clock.G;
    }
    get Paused() {
      return this.match.by !== "";
    }
    get IsPaused() {
      return this.Paused;
    }
    get PausedBy() {
      return this.match.by;
    }
    /** The game time the kitchen is drawn at: frozen where time was up (C17). */
    get KitchenG() {
      const G = this.G;
      return this.match.end !== null ? Math.min(G, this.match.end) : G;
    }
    get Phase() {
      return this.match.phase;
    }
    /** E and Q count: during a countdown, a round or the tutorial, and not while paused (79, 86). */
    AcceptsInput() {
      const phase = this.match.phase;
      return (phase === "countdown" || phase === "round" || phase === "tutorial") && !this.Paused;
    }
    /** The kitchen's timers run (preparations, orders, plate returns, tutorial steps). */
    KitchenRuns() {
      const phase = this.match.phase;
      return phase === "countdown" || phase === "round" || phase === "tutorial";
    }
    /** The final seconds of a round, when preparations run 1.25 times faster (55); null when there are none. */
    BoostWindow() {
      const m = this.match;
      if (m.mode !== "game" || m.rs === null) return null;
      return [m.rs + this.settings.TimeLimit.TimeToFinalSeconds, m.rs + this.settings.TimeLimit.Time];
    }
    /** When the countdown ends and the time limit (or the tutorial) starts. */
    get CountDownEnd() {
      return this.match.t0 + this.settings.CountDown.Time;
    }
    /** Seconds left in the round at G (the Timer's value), or null outside a round. */
    RoundLeft(G) {
      const m = this.match;
      if (m.rs === null) return null;
      return Math.max(0, m.rs + this.settings.TimeLimit.Time - G);
    }
    // ---- pause (the pause-system package over the game clock) ---------------------------------------------------
    Pause(by) {
      if (this.Paused) return;
      this.match.clock = this.clock.Pause();
      this.match.by = by;
      invoke(this.OnPaused);
    }
    Resume() {
      if (!this.Paused) return;
      this.match.clock = this.clock.Resume();
      this.match.by = "";
      invoke(this.OnResumed);
    }
    // ---- commands (run on the referee) --------------------------------------------------------------------------
    Caller() {
      return this.Networking.CallingPlayer;
    }
    /** PLAY (MainMenuOptions.PlayGame -> the Game scene). The one who pressed it cooks. */
    Play() {
      const who = this.Caller();
      if (!who || this.match.phase !== "lobby" || !this.kitchen.Enrol(who.uid)) return;
      this.StartMatch("game");
    }
    /** TUTORIAL (MainMenuOptions.PlayTutorial). */
    Tutorial() {
      const who = this.Caller();
      if (!who || this.match.phase !== "lobby" || this.Settings.get("tutorial") === "off" || !this.kitchen.tutorial || !this.kitchen.Enrol(who.uid)) return;
      this.StartMatch("tutorial");
    }
    /** P (PlayerManager.HandlePlayerPause). The tutorial cannot be paused (90). */
    RequestPause() {
      const who = this.Caller();
      if (!who || !this.kitchen.IsChef(who.uid) || this.match.mode !== "game") return;
      if (this.match.phase !== "countdown" && this.match.phase !== "round") return;
      this.Pause(who.uid);
      this.kitchen.CommitAll();
    }
    /** Resume (PauseCanvas.HandleResumeClicked). */
    RequestResume() {
      const who = this.Caller();
      if (!who || !this.Paused) return;
      const pauserHere = this.Networking.GetPlayers().some((p) => p.uid === this.match.by);
      const allowed = who.uid === this.match.by || who.isMaster || !pauserHere && this.kitchen.IsChef(who.uid);
      if (!allowed) return;
      this.Resume();
      this.kitchen.CommitAll();
    }
    /** Restart, confirmed (PauseCanvas.HandleRestartConfirmed: the Game scene again). */
    Restart() {
      const who = this.Caller();
      if (!who || !this.kitchen.IsChef(who.uid) || !this.Paused) return;
      this.StartMatch("game");
    }
    /** Exit, confirmed (PauseCanvas.HandleExitConfirmed: back to the main menu). */
    EndRound() {
      const who = this.Caller();
      if (!who || !this.kitchen.IsChef(who.uid) || !this.Paused) return;
      this.ResetToLobby();
      this.kitchen.CommitAll();
    }
    /** Continue on the results (Results.HandleContinueButtonClick). */
    Continue() {
      const who = this.Caller();
      if (!who || this.match.phase !== "results" || !this.kitchen.IsChef(who.uid)) return;
      this.ResetToLobby();
      this.kitchen.CommitAll();
    }
    // ---- transitions (referee) ----------------------------------------------------------------------------------
    /** Between rounds the kitchen is in its start state and E and Q are ignored (PORT.md 8.6). */
    ResetToLobby() {
      const keep = this.match;
      this.match = _MatchManager.Lobby(keep.round, keep.best);
      this.match.clock = GameClock.Start(this.Networking.GetServerTimeInSeconds());
      this.match.clock = { e: this.match.clock.e, f: 0 };
      this.kitchen.ResetKitchen();
      this.kitchen.orders.Asset.Initialize();
      this.kitchen.score.Asset.Initialize();
      this.kitchen.tutorial?.ResetTutorial();
    }
    /** The Game (or Tutorial) scene loads: everything starts over (8), the countdown starts 0.2 s later (7). */
    StartMatch(mode) {
      const keep = this.match;
      this.settings.SetRoundLength(this.RoundSetting());
      this.match = _MatchManager.Lobby(keep.round + 1, keep.best);
      this.match.mode = mode;
      this.match.len = this.settings.TimeLimit.Time;
      this.match.clock = GameClock.Start(this.Networking.GetServerTimeInSeconds());
      this.match.phase = "countdown";
      this.match.t0 = roundTime(MatchSettings.StartDelay);
      this.settings.IsAllowToStartTimeLimit = mode === "game";
      this.kitchen.ResetKitchen();
      this.kitchen.orders.Asset.Initialize();
      this.kitchen.score.Asset.Initialize();
      this.kitchen.tutorial?.ResetTutorial();
      if (mode === "tutorial") this.kitchen.tutorial?.Awake();
      invoke(this.settings.CountDown.OnStarted);
      this.kitchen.CommitAll();
    }
    /** The referee's tick: fires what is due, once. */
    Tick(G) {
      const m = this.match;
      if (m.phase === "countdown" && G >= this.CountDownEnd) {
        m.phase = m.mode === "tutorial" ? "tutorial" : "round";
        invoke(this.settings.CountDown.OnFinished);
      }
      if (m.phase === "round" && m.rs !== null) {
        if (m.ff === 0 && G >= m.rs + this.settings.TimeLimit.TimeToFinalSeconds) {
          m.ff = 1;
          invoke(this.settings.TimeLimit.OnFinalSecondsStarted);
        }
        if (G >= m.rs + this.settings.TimeLimit.Time) {
          m.end = roundTime(m.rs + this.settings.TimeLimit.Time);
          m.phase = "timesup";
          invoke(this.settings.TimeLimit.OnFinished);
        }
      }
      if (m.phase === "timesup" && m.end !== null && G >= m.end + TIMES_UP_SECONDS) this.GoToResults();
    }
    /** CountDown.OnFinished -> StartTimeLimit (MatchManager.HandleCountDownFinished). */
    HandleCountDownFinished() {
      if (!this.settings.IsAllowToStartTimeLimit || this.match.mode !== "game") return;
      this.match.rs = roundTime(this.CountDownEnd);
      invoke(this.settings.TimeLimit.OnStarted);
    }
    /** SceneSettings.GoToResults: the score as it stands becomes the results panel. */
    GoToResults() {
      const s = this.kitchen.score.Asset;
      this.match.res = { ok: s.SuccessfulDeliveries, bad: s.FailedDeliveries, tips: s.Tips, score: s.Score, mode: this.match.mode };
      if (this.match.mode === "game") this.match.best = Math.max(this.match.best, s.Score);
      this.match.phase = "results";
      this.match.clock = this.clock.Pause();
      this.match.by = "";
    }
  };
  __publicField(_MatchManager, "synced", ["match"]);
  /** The board's buttons, sent to the referee as commands. */
  __publicField(_MatchManager, "networkCallable", ["Play", "Tutorial", "RequestPause", "RequestResume", "Restart", "EndRound", "Continue"]);
  var MatchManager = _MatchManager;

  // src/Order.ts
  var OrderStatus = { Open: 0, Delivered: 1, Failed: 2 };
  var f3 = Math.fround;
  var Order = class {
    constructor(settings, rec) {
      __publicField(this, "rec");
      __publicField(this, "settings");
      __publicField(this, "OnFailed", []);
      __publicField(this, "OnDelivered", []);
      this.settings = settings;
      this.rec = rec;
    }
    get Recipe() {
      return this.settings.recipeSettings.recipes[this.rec.r];
    }
    get Name() {
      return this.Recipe.Name;
    }
    get PlatedIngredients() {
      return this.Recipe.PlatedIngredients;
    }
    /** The waiting time left at game time G (the ticket's bar). */
    WaitingTimeAt(G) {
      if (this.rec.left !== null) return this.rec.left;
      return f3(Math.max(0, this.rec.wait - (G - this.rec.born)));
    }
    get WaitingTime() {
      return this.WaitingTimeAt(this.settings.G);
    }
    get IsOpen() {
      return this.rec.st === OrderStatus.Open;
    }
    TryDelivery(ingredients) {
      if (!this.IsOpen) return false;
      const canDelivery = this.Recipe.ContainsOnly(ingredients);
      if (canDelivery) this.Delivery();
      return canDelivery;
    }
    StartCountDownWaitingTime(G) {
      this.rec.born = G;
      this.rec.left = null;
    }
    CancelCountDownWaitingTime() {
      if (this.rec.left === null) this.rec.left = this.WaitingTime;
    }
    GetTip() {
      const tip = f3(f3(this.WaitingTime) * f3(this.Recipe.TipMultiplier));
      return Math.ceil(tip);
    }
    /** The countdown's loop, on the referee's tick: at 0 the order fails. */
    CountDown(G) {
      if (this.rec.left !== null || !this.IsOpen) return;
      if (this.rec.wait - (G - this.rec.born) > 0) return;
      this.rec.left = 0;
      invoke(this.OnFailed);
    }
    Delivery() {
      this.CancelCountDownWaitingTime();
      invoke(this.OnDelivered);
    }
  };

  // src/OrderSettings.ts
  function RollOf(seed, n) {
    let t = seed + Math.imul(n + 1, 1831565813) >>> 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  var OrderSettings = class {
    constructor(recipes, ingredients, state, clock, newSeed) {
      __publicField(this, "maxOrders", kitchen_data_default.order.maxOrders);
      __publicField(this, "additionalTimePerIngredient", kitchen_data_default.order.additionalTimePerIngredient);
      __publicField(this, "timeByNewOrder", kitchen_data_default.order.timeByNewOrder);
      __publicField(this, "timeToRemoveAfterFail", kitchen_data_default.order.timeToRemoveAfterFail);
      __publicField(this, "timeToRemoveAfterDelivery", kitchen_data_default.order.timeToRemoveAfterDelivery);
      __publicField(this, "timeToReturnPlate", kitchen_data_default.order.timeToReturnPlate);
      __publicField(this, "OnPlateReturned", []);
      __publicField(this, "OnOrderFailed", []);
      __publicField(this, "OnOrderCreated", []);
      __publicField(this, "OnOrderRemoved", []);
      __publicField(this, "OnOrderDelivered", []);
      __publicField(this, "recipeSettings");
      __publicField(this, "ingredientSettings");
      __publicField(this, "state");
      __publicField(this, "clock");
      __publicField(this, "newSeed");
      __publicField(this, "views", /* @__PURE__ */ new Map());
      /** Tests: the roll for draw n instead of the seeded generator (upstream's Random.value, set by the golden harness). */
      __publicField(this, "rollOverride", null);
      this.recipeSettings = recipes;
      this.ingredientSettings = ingredients;
      this.state = state;
      this.clock = clock;
      this.newSeed = newSeed;
    }
    get G() {
      return this.clock();
    }
    get TotalOrders() {
      return this.state().list.length;
    }
    /** The listed orders, oldest first. */
    get Orders() {
      const list = this.state().list;
      for (const id of [...this.views.keys()]) if (!list.some((r) => r.id === id)) this.views.delete(id);
      return list.map((rec) => this.View(rec));
    }
    View(rec) {
      let order = this.views.get(rec.id);
      if (!order || order.rec !== rec) {
        order = new Order(this, rec);
        const o = order;
        order.OnFailed.push(() => this.Fail(o));
        order.OnDelivered.push(() => this.Delivery(o));
        this.views.set(rec.id, order);
      }
      return order;
    }
    /** A new round: the old orders' countdowns are cancelled and the list starts empty. */
    Initialize() {
      const s = this.state();
      if (s.list.length) this.CancelAll();
      s.list = [];
      s.next = { s: "off", at: 0 };
      s.plates = [];
      s.seed = this.newSeed();
      s.n = 0;
      this.views.clear();
    }
    TryDelivery(ingredients) {
      this.state().plates.push(roundTime(this.G + this.timeToReturnPlate));
      for (const order of this.Orders) {
        if (order.TryDelivery(ingredients)) return { delivered: true, tip: order.GetTip() };
      }
      return { delivered: false, tip: 0 };
    }
    StartOrdering() {
      this.CreateRandom();
      this.state().next = { s: "room", at: 0 };
      this.Tick(this.G);
    }
    StopOrdering() {
      this.state().next = { s: "off", at: 0 };
      this.CancelAll();
    }
    Create(recipe) {
      const s = this.state();
      const waitingTime = recipe.GetWaitingTime(this.ingredientSettings, this.additionalTimePerIngredient);
      const rec = { id: ++s.seq, r: recipe.Index, born: 0, wait: waitingTime, left: null, st: OrderStatus.Open, at: 0 };
      const order = this.View(rec);
      order.StartCountDownWaitingTime(roundTime(this.G));
      s.list.push(rec);
      invoke(this.OnOrderCreated, order);
      return order;
    }
    CreateRandom() {
      const s = this.state();
      const n = s.n++;
      const roll = this.rollOverride ? this.rollOverride(n) : RollOf(s.seed, n);
      this.Create(this.recipeSettings.GetRandom(roll));
    }
    Remove(order) {
      const s = this.state();
      const at = s.list.indexOf(order.rec);
      if (at < 0) return;
      s.list.splice(at, 1);
      this.views.delete(order.rec.id);
      invoke(this.OnOrderRemoved, order);
    }
    Fail(order) {
      order.rec.st = OrderStatus.Failed;
      order.rec.at = roundTime(this.G);
      invoke(this.OnOrderFailed, order);
    }
    Delivery(order) {
      order.rec.st = OrderStatus.Delivered;
      order.rec.at = roundTime(this.G);
      invoke(this.OnOrderDelivered, order);
    }
    CancelAll() {
      for (const order of this.Orders) order.CancelCountDownWaitingTime();
    }
    CanCreateNewOrders() {
      return this.TotalOrders < this.maxOrders;
    }
    /** The coroutines, on the referee's tick. */
    Tick(G) {
      const s = this.state();
      for (const order of this.Orders) order.CountDown(G);
      for (const order of this.Orders) {
        if (order.rec.st === OrderStatus.Open) continue;
        const linger = order.rec.st === OrderStatus.Delivered ? this.timeToRemoveAfterDelivery : this.timeToRemoveAfterFail;
        if (G >= order.rec.at + linger) this.Remove(order);
      }
      while (s.plates.length && s.plates[0] <= G) {
        s.plates.shift();
        invoke(this.OnPlateReturned);
      }
      if (s.next.s === "room" && this.CanCreateNewOrders()) s.next = { s: "wait", at: roundTime(G + this.timeByNewOrder) };
      if (s.next.s === "wait" && G >= s.next.at) {
        this.CreateRandom();
        s.next = { s: "room", at: 0 };
        if (this.CanCreateNewOrders()) s.next = { s: "wait", at: roundTime(G + this.timeByNewOrder) };
      }
    }
  };

  // src/OrderManager.ts
  var OrderManager = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "orders", { list: [], seq: 0, next: { s: "off", at: 0 }, plates: [], seed: 1, n: 0 });
      __publicField(this, "kitchen");
      __publicField(this, "Asset");
    }
    /** Off in the tutorial (OrderManager_Tutorial.prefab). */
    get StartOrderingAfterCountDown() {
      return this.kitchen.match.match.mode === "game";
    }
    Start() {
      const k = this.kitchen;
      this.Asset = new OrderSettings(
        k.recipeSettings,
        k.ingredientSettings,
        () => this.orders,
        () => k.match.G,
        () => {
          const fixed = Math.floor(Number(this.Settings.get("seed") ?? ""));
          return fixed > 0 ? fixed : this.Random.RangeInt(1, 2147483647);
        }
      );
      this.OnEnable();
    }
    OnEnable() {
      const match = this.kitchen.match.settings;
      match.CountDown.OnFinished.push(() => this.HandleCountDownFinished());
      match.TimeLimit.OnFinished.push(() => this.HandleTimeLimitFinished());
    }
    HandleCountDownFinished() {
      if (this.StartOrderingAfterCountDown) this.Asset.StartOrdering();
    }
    HandleTimeLimitFinished() {
      this.Asset.StopOrdering();
    }
  };
  __publicField(OrderManager, "synced", ["orders"]);

  // src/OrderTicket.ts
  var OrderTicket = class {
    constructor(host, path, orderName, icons, waitingTimer) {
      __publicField(this, "host");
      __publicField(this, "path");
      __publicField(this, "orderName");
      __publicField(this, "icons");
      __publicField(this, "waitingTimer");
      __publicField(this, "shownId", null);
      __publicField(this, "value", -1);
      __publicField(this, "flash", "");
      this.host = host;
      this.path = path;
      this.orderName = orderName;
      this.icons = icons;
      this.waitingTimer = waitingTimer;
    }
    /** Shows an order (or nothing), its bar at game time G. */
    Show(order, G) {
      if (!order) {
        if (this.shownId !== null || this.value === -1) this.host.setActive(`@${this.path}`, false);
        this.shownId = null;
        this.value = -2;
        return;
      }
      if (this.shownId !== order.rec.id) {
        this.shownId = order.rec.id;
        this.host.setActive(`@${this.path}`, true);
        this.Initialize(order);
      }
      this.WaitingTime = order.rec.wait > 0 ? order.WaitingTimeAt(G) / order.rec.wait : 0;
      const flash = order.rec.st === OrderStatus.Delivered ? "OrderTicket@Delivered" : order.rec.st === OrderStatus.Failed ? "OrderTicket@Failed" : "";
      if (flash !== this.flash) {
        this.flash = flash;
        if (flash) this.host.animPlay(`@${this.path}`, flash);
      }
    }
    Initialize(order) {
      if (this.orderName) this.orderName.text = order.Name;
      if (this.icons) this.icons.text = IngredientIcons.Text(order.PlatedIngredients.map((p) => p.Data.Icon));
      this.flash = "";
    }
    /** The bar, 0 to 1 of the order's own waiting time. */
    set WaitingTime(value) {
      const rounded = Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
      if (rounded === this.value) return;
      this.value = rounded;
      if (this.waitingTimer) this.waitingTimer.transform.localScale = new Vector3(Math.max(1e-3, rounded), 1, 1);
    }
    get ShownOrder() {
      return this.shownId;
    }
  };

  // src/OrderTicketGroup.ts
  var OrderTicketGroup = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      /** The kit object the sounds come from (the board). */
      __publicField(this, "board", "");
      __publicField(this, "ticketPaths", []);
      __publicField(this, "names", []);
      __publicField(this, "icons", []);
      __publicField(this, "bars", []);
      __publicField(this, "tickets", []);
      /** Sounds this client played (for tests). */
      __publicField(this, "played", []);
    }
    Start() {
      this.tickets = this.ticketPaths.map((path, i) => new OrderTicket(this.Host, path, this.names[i] ?? null, this.icons[i] ?? null, this.bars[i] ?? null));
      this.OnEnable();
    }
    OnEnable() {
      const settings = this.kitchen.orders.Asset;
      settings.OnOrderCreated.push(() => this.kitchen.Fx("orders", "created"));
      settings.OnOrderDelivered.push(() => this.kitchen.Fx("orders", "delivered"));
      this.kitchen.OnEffect("orders", (kind) => kind === "created" ? this.PlayCreatedSound() : this.PlayDeliveredSound());
    }
    Update() {
      const G = this.kitchen.match.KitchenG;
      const orders = this.kitchen.match.Phase === "lobby" ? [] : this.kitchen.orders.Asset.Orders;
      this.tickets.forEach((ticket, i) => ticket.Show(orders[i] ?? null, G));
    }
    PlayCreatedSound() {
      this.played.push("created");
      this.kitchen.PlaySound("newOrder", this.board);
    }
    PlayDeliveredSound() {
      this.played.push("delivered");
      this.kitchen.PlaySound("success", this.board);
    }
  };

  // src/PauseCanvas.ts
  var PauseCanvas = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "pauseOptions");
      __publicField(this, "soundPopup");
      __publicField(this, "confirm", null);
      __publicField(this, "viewer");
      __publicField(this, "confirmPopup");
      /** What the open confirmation is for. */
      __publicField(this, "asking", "");
    }
    Start() {
      this.viewer = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
      this.confirmPopup = new CanvasViewer(this.confirm);
      this.OnEnable();
    }
    OnEnable() {
      this.confirmPopup.OnHidden.push(() => this.HandleAnyPopupHidden());
      this.soundPopup.popup.OnHidden.push(() => this.HandleAnyPopupHidden());
      this.pauseOptions.OnResumeClicked.push(() => this.HandleResumeClicked());
      this.pauseOptions.OnRestartClicked.push(() => this.HandleRestartClicked());
      this.pauseOptions.OnSoundClicked.push(() => this.HandleSoundClicked());
      this.pauseOptions.OnExitClicked.push(() => this.HandleExitClicked());
      this.confirmPopup.Hide();
    }
    Show() {
      this.viewer.Show();
      this.pauseOptions.Show();
    }
    Hide() {
      this.asking = "";
      this.confirmPopup.Hide();
      this.viewer.Hide();
    }
    HandleAnyPopupHidden() {
      if (this.viewer.IsVisible) this.pauseOptions.Show();
    }
    HandleResumeClicked() {
      this.kitchen.match.SendCommand("RequestResume");
    }
    HandleRestartClicked() {
      this.pauseOptions.Hide();
      this.asking = "restart";
      this.confirmPopup.Show();
    }
    HandleSoundClicked() {
      this.pauseOptions.Hide();
      this.soundPopup.Show();
    }
    HandleExitClicked() {
      this.pauseOptions.Hide();
      this.asking = "exit";
      this.confirmPopup.Show();
    }
    /** Yes on the confirmation. */
    Confirmed() {
      const asking = this.asking;
      this.asking = "";
      this.confirmPopup.Hide();
      if (asking === "restart") this.kitchen.match.SendCommand("Restart");
      else if (asking === "exit") this.kitchen.match.SendCommand("EndRound");
    }
    /** No on the confirmation. */
    Declined() {
      this.asking = "";
      this.confirmPopup.Hide();
    }
  };

  // src/PauseHandler.ts
  var PauseHandler = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "pauseCanvas");
      /** The board's PAUSE button. */
      __publicField(this, "pauseButton", "");
      __publicField(this, "pausedBy", null);
      __publicField(this, "paused", null);
      __publicField(this, "button", null);
    }
    Update() {
      const match = this.kitchen.match;
      const paused = match.Paused;
      if (paused !== this.paused) {
        this.paused = paused;
        if (paused) this.HandlePaused();
        else this.HandleResumed();
      }
      const m = match.match;
      const button = !paused && m.mode === "game" && (m.phase === "countdown" || m.phase === "round");
      if (button !== this.button && this.pauseButton) {
        this.button = button;
        this.Host.setActive(this.pauseButton, button);
      }
    }
    HandlePaused() {
      this.pauseCanvas.Show();
      const by = this.Networking.GetPlayers().find((p) => p.uid === this.kitchen.match.PausedBy);
      if (this.pausedBy) this.pausedBy.text = by ? `Paused by ${by.displayName}` : "Paused";
    }
    HandleResumed() {
      this.pauseCanvas.Hide();
    }
  };

  // src/PauseOptions.ts
  var PauseOptions = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "OnResumeClicked", []);
      __publicField(this, "OnRestartClicked", []);
      __publicField(this, "OnSoundClicked", []);
      __publicField(this, "OnExitClicked", []);
      __publicField(this, "viewer");
    }
    Start() {
      this.viewer = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
    }
    Show() {
      this.viewer.Show();
    }
    Hide() {
      this.viewer.Hide();
    }
    /** The PAUSE button (PlayerManager.HandlePlayerPause). */
    Pause() {
      this.kitchen.match.SendCommand("RequestPause");
    }
    Resume() {
      for (const l of this.OnResumeClicked.slice()) l();
    }
    Restart() {
      for (const l of this.OnRestartClicked.slice()) l();
    }
    Sound() {
      for (const l of this.OnSoundClicked.slice()) l();
    }
    Exit() {
      for (const l of this.OnExitClicked.slice()) l();
    }
  };

  // src/PreparationCounter.ts
  var PreparationCounter = class extends Counter {
    constructor() {
      super(...arguments);
      __publicField(this, "preparator");
      __publicField(this, "kinds", [IItemHolderKind, IItemCollectorKind, IItemTransferKind, IInteractableKind]);
      /** `fromHolder is PreparationCounter` without a runtime import cycle (Plate.cs). */
      __publicField(this, "isPreparationCounter", true);
      __publicField(this, "OnInteracted", []);
    }
    get IsPreparing() {
      return this.preparator.IsPreparing;
    }
    TryCollectItem() {
      if (this.IsPreparing) return { ok: false, item: null };
      return super.TryCollectItem();
    }
    TryTransferItem(fromHolder) {
      return !this.preparator.IsPreparing && super.TryTransferItem(fromHolder);
    }
    /** Q, on the referee. (Not the runtime's click: clicks come in through Clicked and ClickedKnob.) */
    Interact() {
      this.preparator.Interact();
      for (const listener of this.OnInteracted.slice()) listener();
    }
    /** The local player clicked the knife or the knob: Q on this counter. */
    ClickedKnob(_detail) {
      this.kitchen.LocalIntent("Q", "c:" + this.cell, null);
    }
  };

  // src/PreparationTimer.ts
  var PreparationTimer = class {
    constructor(host, canvasPath, fill) {
      __publicField(this, "host");
      __publicField(this, "canvasPath");
      __publicField(this, "fill");
      __publicField(this, "shown", null);
      __publicField(this, "progress", -1);
      this.host = host;
      this.canvasPath = canvasPath;
      this.fill = fill;
    }
    get Progress() {
      return Math.max(0, this.progress);
    }
    set Progress(value) {
      const rounded = Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
      if (rounded === this.progress) return;
      this.progress = rounded;
      if (this.fill) this.fill.transform.localScale = new Vector3(Math.max(1e-3, rounded), 1, 1);
    }
    Show() {
      if (this.shown === true) return;
      this.shown = true;
      this.host.setActive(this.canvasPath, true);
    }
    Hide() {
      if (this.shown === false) return;
      this.shown = false;
      this.host.setActive(this.canvasPath, false);
    }
    get Visible() {
      return this.shown === true;
    }
  };

  // src/PreparationWorldSpaceCanvas.ts
  var REJECTED_SECONDS = 2;
  var PreparationWorldSpaceCanvas = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "preparator");
      /** The canvas's path under the kit root. */
      __publicField(this, "path", "");
      __publicField(this, "barFill", null);
      /** "Cannot \nCut" or "Cannot \nCook" (the prefab's text override). */
      __publicField(this, "rejectedText", "");
      __publicField(this, "timer");
      /** How many refusals this client has shown (for tests). */
      __publicField(this, "rejectedShown", 0);
    }
    Start() {
      this.timer = new PreparationTimer(this.Host, `@${this.path}/Bar`, this.barFill);
      this.timer.Hide();
      this.Host.setText(`@${this.path}/Rejected`, this.rejectedText);
      this.Host.setActive(`@${this.path}/Rejected`, false);
      this.OnEnable();
    }
    OnEnable() {
      this.preparator.OnIngredientRejected.push(() => this.HandleIngredientRejected());
      this.kitchen.OnEffect("rejected", (cell) => {
        if (cell === this.preparator.cell) this.ShowRejected();
      });
    }
    Update() {
      const G = this.kitchen.match.KitchenG;
      if (this.preparator.IsPreparing) {
        this.timer.Show();
        this.timer.Progress = this.preparator.NormalizedProgress(G);
      } else this.timer.Hide();
    }
    /** Referee: the preparator refused Q. */
    HandleIngredientRejected() {
      this.kitchen.Fx("rejected", this.preparator.cell);
    }
    ShowRejected() {
      this.rejectedShown++;
      this.kitchen.Flash(`@${this.path}/Rejected`, REJECTED_SECONDS);
      this.kitchen.PlaySound("fail01", Kitchen.CellKey(this.preparator.cell));
    }
    get BarVisible() {
      return this.timer.Visible;
    }
  };

  // src/Score.ts
  var DELTA_SECONDS = 2.5;
  function FloatText(value) {
    return Number.isInteger(value) ? String(value) : String(Math.fround(value));
  }
  var Score = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      /** The score panel's path (its canvas, switched on and off). */
      __publicField(this, "path", "");
      __publicField(this, "current", null);
      __publicField(this, "delta", null);
      __publicField(this, "increasedColor", new Color(0, 1, 0, 1));
      __publicField(this, "decreasedColor", new Color(1, 0, 0, 1));
      /** The deltas this client showed (for tests). */
      __publicField(this, "deltas", []);
      __publicField(this, "visible", null);
    }
    Start() {
      if (this.current) this.current.text = "0";
      const settings = this.kitchen.score.Asset;
      settings.OnScoreIncreased.push((d) => this.kitchen.Fx("score", "+", d));
      settings.OnScoreDecreased.push((d) => this.kitchen.Fx("score", "-", d));
      this.kitchen.OnEffect("score", (sign, d) => sign === "+" ? this.HandleScoreIncreased(Number(d)) : this.HandleScoreDecreased(Number(d)));
    }
    Update() {
      const phase = this.kitchen.match.Phase;
      const visible = phase === "round" || phase === "timesup" || phase === "tutorial";
      if (visible !== this.visible) {
        this.visible = visible;
        this.Host.setActive(`@${this.path}`, visible);
      }
      if (this.current) this.current.text = FloatText(this.kitchen.score.Asset.Score);
    }
    HandleScoreIncreased(deltaScore) {
      if (this.delta) this.delta.color = this.increasedColor;
      this.ShowDelta("+ " + FloatText(deltaScore));
    }
    HandleScoreDecreased(deltaScore) {
      if (this.delta) this.delta.color = this.decreasedColor;
      this.ShowDelta("- " + FloatText(deltaScore));
    }
    ShowDelta(deltaScore) {
      this.deltas.push(deltaScore);
      if (this.delta) this.delta.text = deltaScore;
      this.kitchen.Flash(`@${this.path}/Delta`, DELTA_SECONDS);
    }
  };

  // src/Results.ts
  function Format(format, value) {
    return format.replace("{0:D2}", String(value).padStart(2, "0"));
  }
  var Results = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "gameData");
      __publicField(this, "path", "");
      __publicField(this, "failedDeliveries", null);
      __publicField(this, "totalFailedDeliveries", null);
      __publicField(this, "successfulDeliveries", null);
      __publicField(this, "totalSuccessfulDeliveries", null);
      __publicField(this, "tips", null);
      __publicField(this, "totalScore", null);
      __publicField(this, "best", null);
      __publicField(this, "newHighScore", null);
      __publicField(this, "visible", null);
      /** Whether this client's last results showed "New High Score!" (for tests). */
      __publicField(this, "isNewHighScore", false);
    }
    Update() {
      const m = this.kitchen.match.match;
      const visible = m.phase === "results" && m.res !== null;
      if (visible !== this.visible) {
        this.visible = visible;
        this.Host.setActive(`@${this.path}`, visible);
        if (visible) this.ShowResults();
      }
    }
    ShowResults() {
      const res = this.kitchen.match.match.res;
      const failedOrdersFormat = "Failed Orders x {0:D2}";
      const deliveredOrdersFormat = "Delivered Orders x {0:D2}";
      if (this.failedDeliveries) this.failedDeliveries.text = Format(failedOrdersFormat, res.bad);
      if (this.totalFailedDeliveries) this.totalFailedDeliveries.text = FloatText(res.bad * 10);
      if (this.successfulDeliveries) this.successfulDeliveries.text = Format(deliveredOrdersFormat, res.ok);
      if (this.totalSuccessfulDeliveries) this.totalSuccessfulDeliveries.text = FloatText(res.ok * 20);
      if (this.tips) this.tips.text = String(res.tips);
      if (this.totalScore) this.totalScore.text = FloatText(res.score);
      if (this.best) this.best.text = res.mode === "game" ? `Kitchen best: ${FloatText(this.kitchen.match.match.best)}` : "";
      this.CheckHighScore();
    }
    CheckHighScore() {
      const m = this.kitchen.match.match;
      const res = m.res;
      const data = this.gameData.settings.Data;
      const me = this.Networking.LocalPlayer.uid;
      const mine = res.mode === "game" && this.kitchen.IsChef(me) && data.Checked.indexOf(m.round) < 0;
      this.isNewHighScore = mine && Math.trunc(res.score) > data.HighScore;
      this.newHighScore?.SetActive(this.isNewHighScore);
      if (!mine) return;
      data.Checked = [...data.Checked.slice(-19), m.round];
      if (this.isNewHighScore) data.HighScore = Math.trunc(res.score);
      this.gameData.settings.Save();
    }
    /** The Continue button. */
    HandleContinueButtonClick() {
      this.kitchen.match.SendCommand("Continue");
    }
  };

  // src/ScoreSettings.ts
  var f4 = Math.fround;
  var ScoreSettings = class {
    constructor(state) {
      __publicField(this, "deliveredOrdersMultiplier", kitchen_data_default.score.deliveredOrdersMultiplier);
      __publicField(this, "failedOrdersMultiplier", kitchen_data_default.score.failedOrdersMultiplier);
      __publicField(this, "state");
      __publicField(this, "OnScoreIncreased", []);
      __publicField(this, "OnScoreDecreased", []);
      this.state = state;
    }
    get Tips() {
      return this.state().tips;
    }
    get FailedDeliveries() {
      return this.state().failed;
    }
    get SuccessfulDeliveries() {
      return this.state().ok;
    }
    get Score() {
      return this.state().score;
    }
    Initialize() {
      const s = this.state();
      s.tips = 0;
      s.score = 0;
      s.failed = 0;
      s.ok = 0;
    }
    DeliveryOrder(tip) {
      const s = this.state();
      s.tips += tip;
      s.ok++;
      const lastScore = s.score;
      s.score = this.GetTotalScore();
      invoke(this.OnScoreIncreased, f4(s.score - lastScore));
    }
    DeliveryFailedOrder() {
      const s = this.state();
      s.failed++;
      const lastScore = s.score;
      s.score = this.GetTotalScore();
      invoke(this.OnScoreDecreased, f4(lastScore - s.score));
    }
    GetTotalFailedDeliveries() {
      return f4(this.state().failed * f4(this.failedOrdersMultiplier));
    }
    GetTotalSuccessfulDeliveries() {
      return f4(this.state().ok * f4(this.deliveredOrdersMultiplier));
    }
    GetTotalScore() {
      const score = f4(f4(this.state().tips + this.GetTotalSuccessfulDeliveries()) - this.GetTotalFailedDeliveries());
      return Math.max(0, score);
    }
  };

  // src/ScoreManager.ts
  var ScoreManager = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "tips", 0);
      __publicField(this, "failed", 0);
      __publicField(this, "ok", 0);
      __publicField(this, "score", 0);
      __publicField(this, "Asset", new ScoreSettings(() => this));
    }
  };
  __publicField(ScoreManager, "synced", ["tips", "failed", "ok", "score"]);

  // src/SoundPopup.ts
  var SoundPopup = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "gameData");
      __publicField(this, "path", "");
      __publicField(this, "musicLabel", null);
      __publicField(this, "effectsLabel", null);
      __publicField(this, "popup");
    }
    Start() {
      this.popup = new CanvasViewer(this.gameObject.key ? this.gameObject : null);
      this.popup.Hide();
      this.Refresh();
    }
    Show() {
      this.Refresh();
      this.popup.Show();
    }
    Step(which, delta) {
      const audio = this.gameData.settings.Data.Audio;
      audio[which] = Math.round(Math.min(1, Math.max(0, audio[which] + delta)) * 10) / 10;
      this.Refresh();
    }
    MusicUp() {
      this.Step("music", 0.1);
    }
    MusicDown() {
      this.Step("music", -0.1);
    }
    EffectsUp() {
      this.Step("effects", 0.1);
    }
    EffectsDown() {
      this.Step("effects", -0.1);
    }
    HandleResetButtonClick() {
      const audio = this.gameData.settings.Data.Audio;
      audio.music = DefaultVolume;
      audio.effects = DefaultVolume;
      this.Refresh();
    }
    /** Back: saves, then closes. */
    HandleCloseButtonClick() {
      this.gameData.settings.Save();
      this.popup.Hide();
    }
    Refresh() {
      const audio = this.gameData.settings.Data.Audio;
      if (this.musicLabel) this.musicLabel.text = D2(Math.round(audio.music * 100));
      if (this.effectsLabel) this.effectsLabel.text = D2(Math.round(audio.effects * 100));
    }
  };

  // src/FryingPan.ts
  var FryingPan = class {
    constructor(state) {
      __publicField(this, "state");
      this.state = state;
    }
    StartFry() {
      this.state().fry = 1;
    }
    StopFry() {
      this.state().fry = 0;
    }
    StartBurn() {
      this.state().smoke = 1;
    }
    StopBurn() {
      this.state().smoke = 0;
    }
  };

  // src/PreparationWarning.ts
  var WARNING_BLINKS = (() => {
    const out = [];
    let t = 2;
    for (let i = 0; i < 3; i++, t += 1) out.push([t, 0.8]);
    for (let i = 0; i < 5; i++, t += 0.4) out.push([Math.round(t * 10) / 10, 0.2]);
    return out;
  })();
  var PreparationWarning = class {
    /** Whether the icon is shown `elapsed` seconds into the burn sequence (`timeBeforeBurn` is the stove's). */
    static IsVisibleAt(elapsed, timeBeforeBurn = 2) {
      const shift = timeBeforeBurn - 2;
      return WARNING_BLINKS.some(([from, length]) => elapsed >= from + shift && elapsed < from + shift + length);
    }
    /** How many times the icon has been shown (and beeped) by `elapsed` seconds into the burn sequence. */
    static ShownCount(elapsed, timeBeforeBurn = 2) {
      const shift = timeBeforeBurn - 2;
      return WARNING_BLINKS.filter(([from]) => elapsed >= from + shift).length;
    }
  };

  // src/Stove.ts
  var burningAnimationName = "Stove@Burning";
  var waitBurningAnimationName = "Stove@WaitBurning";
  var Stove = class extends AbstractIngredientPreparator {
    constructor() {
      super(...arguments);
      __publicField(this, "timeBeforeBurn", 2);
      __publicField(this, "fryingPan");
      __publicField(this, "shown", { anim: "", fry: -1, smoke: -1, warning: -1 });
      __publicField(this, "beeps", null);
    }
    get IsBurning() {
      return this.st.burn !== null;
    }
    get IsAbleToBurn() {
      return this.st.nb !== 1;
    }
    set IsAbleToBurn(value) {
      this.Write().nb = value ? 0 : 1;
    }
    /** Seconds from the start of the burn sequence to the burned meat. */
    get BurnDuration() {
      return this.timeBeforeBurn + 3 * (0.8 + 0.2) + 5 * (0.2 + 0.2);
    }
    OnEnable() {
      this.fryingPan = new FryingPan(() => this.Write());
      this.holder.OnItemReleased.push(() => this.HandleOnItemReleased());
    }
    SetupIngredientStatus() {
      this.allowedStatus = IngredientStatus.Raw;
      this.preparatedStatus = IngredientStatus.Ready;
    }
    Interact() {
      if (this.IsBurning) this.StopBurning();
      else super.Interact();
    }
    PlayPreparationAnimation() {
      super.PlayPreparationAnimation();
      this.fryingPan.StartFry();
    }
    PlayIdleAnimation() {
      super.PlayIdleAnimation();
      this.fryingPan.StopFry();
    }
    CompletePreparation() {
      super.CompletePreparation();
      this.BurningRoutine();
    }
    GetIdleAnimationName() {
      return "Stove@Idle";
    }
    GetPreparationAnimationName() {
      return "Stove@Heatting";
    }
    /** The coroutine's start: IsBurning, the wait-burning animation. The rest is timed from `burn`. */
    BurningRoutine() {
      if (!this.IsAbleToBurn) return;
      const st = this.Write();
      st.burn = roundTime(this.kitchen.match.G);
      st.anim = waitBurningAnimationName;
    }
    Tick(G) {
      super.Tick(G);
      const st = this.st;
      if (st.burn === null || G - st.burn < this.BurnDuration) return;
      this.BurnIngredient();
      this.CompleteBurning();
      this.fryingPan.StartBurn();
    }
    BurnIngredient() {
      const ingredient = this.holder.CurrentItem;
      if (!ingredient) return;
      const burnedIngredient = this.kitchen.ingredientSettings.SpawnIngredient(ingredient.Name, IngredientStatus.Burned);
      if (burnedIngredient) this.holder.ReplaceItem(burnedIngredient);
    }
    StopBurning() {
      this.CompleteBurning();
    }
    CompleteBurning() {
      this.Write().burn = null;
      this.PlayIdleAnimation();
    }
    HandleOnItemReleased() {
      if (this.IsBurning) this.StopBurning();
      this.fryingPan.StopBurn();
    }
    /** The animation and the warning at game time G (the burn sequence's parts, from its start). */
    AnimationAt(G) {
      const st = this.st;
      if (st.burn === null) return { anim: st.anim, speed: 1, warning: false, beeps: 0 };
      const elapsed = G - st.burn;
      const burning = elapsed >= this.timeBeforeBurn;
      return {
        anim: burning ? burningAnimationName : waitBurningAnimationName,
        speed: elapsed >= this.timeBeforeBurn + 3 ? 2 : 1,
        warning: PreparationWarning.IsVisibleAt(elapsed, this.timeBeforeBurn),
        beeps: PreparationWarning.ShownCount(elapsed, this.timeBeforeBurn)
      };
    }
    Render(G, previousG) {
      const st = this.st;
      const now = this.AnimationAt(G);
      const anim = now.anim + (now.speed === 2 ? "@x2" : "");
      if (anim !== this.shown.anim) {
        this.shown.anim = anim;
        this.Host.animPlay(`@${this.path}`, now.anim);
        if (now.anim === burningAnimationName) this.Host.animFloat(`@${this.path}`, "Speed", now.speed);
      }
      if (st.fry !== this.shown.fry) {
        this.shown.fry = st.fry;
        this.Host.particles(`@${this.path}/Pan/Sizzle`, st.fry === 1);
        this.Host.setActive(`@${this.path}/Pan/SizzleAudio`, st.fry === 1);
      }
      if (st.smoke !== this.shown.smoke) {
        this.shown.smoke = st.smoke;
        this.Host.particles(`@${this.path}/Pan/Smoke`, st.smoke === 1);
      }
      const warning = now.warning ? 1 : 0;
      if (warning !== this.shown.warning) {
        this.shown.warning = warning;
        this.Host.setActive(`@${this.path}/Warning`, now.warning);
      }
      if (previousG !== null && this.beeps !== null && now.beeps > this.beeps) this.kitchen.PlaySound("warning", Kitchen.CellKey(this.cell));
      this.beeps = st.burn === null ? 0 : now.beeps;
    }
  };

  // src/Timer.ts
  function MinutesSeconds(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(whole / 60) % 60).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }
  var Timer = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "path", "");
      __publicField(this, "board", "");
      __publicField(this, "timer", null);
      __publicField(this, "slider", null);
      __publicField(this, "finalSecondsColor", new Color(1, 0, 0, 1));
      __publicField(this, "visible", null);
      __publicField(this, "lastElapsed", null);
      __publicField(this, "isFinalSeconds", false);
      __publicField(this, "sliderValue", -1);
      /** Beeps this client played (for tests). */
      __publicField(this, "beeps", 0);
    }
    Update() {
      const match = this.kitchen.match;
      const m = match.match;
      const visible = (m.phase === "round" || m.phase === "timesup") && m.rs !== null;
      if (visible !== this.visible) {
        this.visible = visible;
        this.Host.setActive(`@${this.path}`, visible);
        if (!visible) {
          this.isFinalSeconds = false;
          if (this.timer) this.timer.color = new Color(1, 1, 1, 1);
        }
      }
      if (!visible || m.rs === null) {
        this.lastElapsed = null;
        return;
      }
      const limit = match.settings.TimeLimit;
      const elapsed = Math.min(match.KitchenG, m.rs + limit.Time) - m.rs;
      const seconds = limit.ValueAt(elapsed) ?? limit.Time;
      this.HandleTimeLimitUpdated(seconds);
      if (elapsed >= limit.TimeToFinalSeconds && !this.isFinalSeconds) this.HandleFinalSecondsStarted();
      if (this.lastElapsed !== null && this.isFinalSeconds) {
        for (const value of limit.TicksBetween(this.lastElapsed, elapsed)) if (value <= limit.FinalSeconds) this.PlayFinalSecondsEffects();
      }
      this.lastElapsed = elapsed;
    }
    HandleTimeLimitUpdated(seconds) {
      if (this.timer) this.timer.text = MinutesSeconds(seconds);
      const normalized = Math.round(seconds / this.kitchen.match.settings.TimeLimit.Time * 100) / 100;
      if (normalized !== this.sliderValue) {
        this.sliderValue = normalized;
        if (this.slider) this.slider.transform.localScale = new Vector3(Math.max(1e-3, normalized), 1, 1);
      }
    }
    HandleFinalSecondsStarted() {
      this.isFinalSeconds = true;
      if (this.timer) this.timer.color = this.finalSecondsColor;
    }
    PlayFinalSecondsEffects() {
      this.beeps++;
      this.Host.animPlay(`@${this.path}`, "Timer@FinalSecondsCountDown");
      this.kitchen.PlaySound("warning", this.board);
    }
  };

  // src/TimesUp.ts
  var TimesUp = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "path", "");
      __publicField(this, "board", "");
      __publicField(this, "visible", null);
      __publicField(this, "seenRound", -1);
      __publicField(this, "played", 0);
    }
    Update() {
      const m = this.kitchen.match.match;
      const visible = m.phase === "timesup";
      if (visible !== this.visible) {
        if (visible && this.visible === false && this.seenRound !== m.round) this.HandleMatchFinished();
        this.visible = visible;
        this.Host.setActive(`@${this.path}`, visible);
      }
      if (visible) this.seenRound = m.round;
    }
    HandleMatchFinished() {
      this.played++;
      this.kitchen.PlaySound("timesUp", this.board);
      this.Host.animPlay(`@${this.path}`, "TimesUp@Show");
    }
  };

  // src/Trash.ts
  var Trash = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "cell", "");
      __publicField(this, "top", null);
      __publicField(this, "kinds", [IItemDisposerKind, IItemTransferKind]);
      __publicField(this, "holder");
    }
    get IsEnabled() {
      return this.kitchen.off[this.cell] !== 1;
    }
    set IsEnabled(value) {
      if (value) delete this.kitchen.off[this.cell];
      else this.kitchen.off[this.cell] = 1;
    }
    Start() {
      this.holder = this.kitchen.Holder(this.cell);
    }
    /** The local player clicked the trash: E on it. */
    Clicked(detail) {
      this.kitchen.LocalIntent("E", "c:" + this.cell, detail?.point ?? null);
    }
    TryTransferItem(fromHolder) {
      const item = fromHolder.CurrentItem;
      if (item && item.kind === "ingredient") {
        fromHolder.ReleaseItem();
        this.Dispose(item);
        return true;
      }
      return false;
    }
    Dispose(item) {
      this.holder.PlaceItem(item);
      this.PlayAnimationAndDestroyItem();
    }
    PlayAnimationAndDestroyItem() {
      this.kitchen.Fx("trash", this.cell);
      this.holder.DestroyItem();
    }
  };

  // src/TutorialDescription.ts
  var TutorialDescription = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "kitchen");
      __publicField(this, "manager");
      __publicField(this, "path", "");
      __publicField(this, "board", "");
      __publicField(this, "text", null);
      __publicField(this, "uncompletedColor", new Color(1, 1, 1, 1));
      __publicField(this, "completedColor", new Color(0, 1, 0, 1));
      __publicField(this, "shown", "");
      /** Completions this client heard (for tests). */
      __publicField(this, "completions", 0);
    }
    Start() {
      this.kitchen.OnEffect("tutorial", () => {
        this.completions++;
        this.kitchen.PlaySound("tutorialDone", this.board);
      });
    }
    SetUncompletedText(value) {
      const tut = this.manager.tut;
      tut.text = value;
      tut.green = 0;
      tut.fade = null;
    }
    Complete() {
      this.manager.tut.green = 1;
      this.kitchen.Fx("tutorial");
    }
    FadeOut() {
      this.manager.tut.fade = this.kitchen.match.G;
    }
    /** The prompt as this client shows it ("" when hidden). */
    get Visible() {
      const tut = this.manager.tut;
      if (!this.manager.IsRunning || !tut.text) return "";
      if (tut.fade !== null && this.kitchen.match.KitchenG - tut.fade >= this.manager.FadeSeconds) return "";
      return tut.text;
    }
    Update() {
      const text = this.Visible;
      const key = text + "|" + this.manager.tut.green;
      if (key === this.shown) return;
      this.shown = key;
      this.Host.setActive(`@${this.path}`, text !== "");
      if (this.text) {
        this.text.text = text;
        this.text.color = this.manager.tut.green === 1 ? this.completedColor : this.uncompletedColor;
      }
    }
  };

  // src/AbstractTutorialStep.ts
  var AbstractTutorialStep = class {
    constructor() {
      __publicField(this, "manager");
      /** This step's place in the tutorial's list. */
      __publicField(this, "index", -1);
    }
    Initialize(manager, index) {
      this.manager = manager;
      this.index = index;
    }
    /** Subscribes the step's listeners (once, on every client). */
    Listen() {
    }
    /** Whether the tutorial is on this step and waiting for `sub`. */
    Waiting(sub) {
      return this.manager.IsRunning && this.manager.tut.i === this.index && this.manager.tut.sub === sub;
    }
    Complete() {
      this.manager.CompleteStep();
    }
    /** CompleteDescriptionAndInvoke(action): the description completes and fades, then `action` runs. */
    CompleteDescriptionAndInvoke(action) {
      this.manager.CompleteDescription();
      this.manager.Schedule(this.manager.FadeSeconds, `${this.index}:${action}`);
    }
    /** Invoke(nameof(action), seconds). */
    Invoke(action, seconds) {
      this.manager.Schedule(seconds, `${this.index}:${action}`);
    }
    /** Runs a scheduled action of this step by name. */
    Run(action) {
      const fn = this[action];
      if (typeof fn === "function") fn.call(this);
    }
  };

  // src/CookingMeatTutorialStep.ts
  var CookingMeatTutorialStep = class extends AbstractTutorialStep {
    GetDescription() {
      return "Cooking a Meat";
    }
    Listen() {
      const m = this.manager;
      m.MeatCounter.OnItemCollectedFromInside.push(() => this.HandleMeatCollected());
      m.Stove.OnItemPlaced.push((item) => this.HandleMeatPlacedOverStove(item));
      m.Stove.OnPreparationStarted.push(() => this.HandleStovePreparationStarted());
    }
    Begin() {
      this.manager.Stove.IsAbleToBurn = false;
      this.manager.EnableCheeseBurgerTitle(true);
      this.Invoke("GuideToMeatCounter", 2);
    }
    GuideToMeatCounter() {
      const m = this.manager;
      m.MeatCounter.IsEnabled = true;
      m.PlaceArrowOverCounter(m.MeatCounter.cell);
      m.SetDescription("Take a Meat from the crate");
      m.tut.sub = "meat.collect";
    }
    HandleMeatCollected() {
      if (!this.Waiting("meat.collect")) return;
      const m = this.manager;
      m.tut.sub = "meat.place";
      m.HideArrow();
      m.MeatCounter.IsEnabled = false;
      this.CompleteDescriptionAndInvoke("GuideToPlaceMeatOverStove");
    }
    GuideToPlaceMeatOverStove() {
      const m = this.manager;
      m.Stove.Counter.IsEnabled = true;
      m.PlaceArrowOverPreparator(m.Stove.cell);
      m.SetDescription("Put the Meat on the Stove");
    }
    HandleMeatPlacedOverStove(item) {
      if (!this.Waiting("meat.place")) return;
      const isRawMeat = IsIngredient(item, IngredientName.Meat, IngredientStatus.Raw);
      if (!isRawMeat) return;
      this.manager.tut.sub = "meat.start";
      this.manager.HideArrow();
      this.CompleteDescriptionAndInvoke("GuideToUseStove");
    }
    GuideToUseStove() {
      const isCookingMeat = this.manager.Stove.IsPreparing;
      if (isCookingMeat) return;
      this.manager.PlaceArrowOverPreparator(this.manager.Stove.cell);
      this.manager.SetDescription("Start cooking: press the stove's knob");
    }
    HandleStovePreparationStarted() {
      if (!this.Waiting("meat.start")) return;
      this.manager.tut.sub = "";
      this.manager.Stove.Counter.IsEnabled = false;
      this.manager.HideArrow();
      this.Complete();
    }
  };

  // src/CuttingCheeseTutorialStep.ts
  var CuttingCheeseTutorialStep = class extends AbstractTutorialStep {
    GetDescription() {
      return "Cutting the Cheese";
    }
    Listen() {
      const m = this.manager;
      m.CheeseCounter.OnItemCollectedFromInside.push(() => this.HandleCheeseCollected());
      m.CuttingBoard.OnItemPlaced.push((item) => this.HandleCheesePlacedOverCuttingBoard(item));
      m.CuttingBoard.OnPreparationStarted.push(() => this.HandleCuttingBoardPreparationStarted());
    }
    Begin() {
      this.manager.EnableCheeseBurgerTitle(true);
      this.Invoke("GuideToCheeseCounter", 2);
    }
    GuideToCheeseCounter() {
      const m = this.manager;
      m.CheeseCounter.IsEnabled = true;
      m.PlaceArrowOverCounter(m.CheeseCounter.cell);
      m.SetDescription("Take a Cheese from the crate");
      m.tut.sub = "cheese.collect";
    }
    HandleCheeseCollected() {
      if (!this.Waiting("cheese.collect")) return;
      const m = this.manager;
      m.tut.sub = "cheese.place";
      m.HideArrow();
      m.CheeseCounter.IsEnabled = false;
      this.CompleteDescriptionAndInvoke("GuideToPlaceCheeseOverCuttingTable");
    }
    GuideToPlaceCheeseOverCuttingTable() {
      const m = this.manager;
      m.CuttingBoard.Counter.IsEnabled = true;
      m.PlaceArrowOverPreparator(m.CuttingBoard.cell);
      m.SetDescription("Put the Cheese on the Cutting Board");
    }
    HandleCheesePlacedOverCuttingBoard(item) {
      if (!this.Waiting("cheese.place")) return;
      const isCuttableCheese = IsIngredient(item, IngredientName.Cheese, IngredientStatus.Cuttable);
      if (!isCuttableCheese) return;
      this.manager.HideArrow();
      this.manager.tut.sub = "cheese.start";
      this.CompleteDescriptionAndInvoke("GuideToUseCuttingBoard");
    }
    GuideToUseCuttingBoard() {
      const isSlicingCheese = this.manager.CuttingBoard.IsPreparing;
      if (isSlicingCheese) return;
      this.manager.PlaceArrowOverPreparator(this.manager.CuttingBoard.cell);
      this.manager.SetDescription("Start cutting: press the knife");
    }
    HandleCuttingBoardPreparationStarted() {
      if (!this.Waiting("cheese.start")) return;
      this.manager.tut.sub = "";
      this.manager.HideArrow();
      this.manager.CuttingBoard.Counter.IsEnabled = false;
      this.Complete();
    }
  };

  // src/PlatingTutorialStep.ts
  var stoveArrowIndex = 0;
  var cuttingBoardArrowIndex = 1;
  var PlatingTutorialStep = class extends AbstractTutorialStep {
    GetDescription() {
      return "Plating Ingredients";
    }
    Listen() {
      const m = this.manager;
      m.BreadCounter.OnItemCollectedFromInside.push(() => this.HandleBreadCollected());
      m.kitchen.plateEvents.push((ingredient, plate) => {
        this.HandleBreadPlacedOverPlate(ingredient, plate);
        this.HandleRemainIngredientsPlated(ingredient, plate);
      });
      m.PlateCounter.OnItemCollectedFromTop.push(() => this.HandlePlateCollected());
      m.kitchen.orders.Asset.OnOrderDelivered.push(() => this.HandleOrderDelivered());
    }
    Begin() {
      this.manager.EnableCheeseBurgerTitle(true);
      this.Invoke("GuideToBreadCounter", 2);
    }
    GuideToBreadCounter() {
      const m = this.manager;
      m.BreadCounter.IsEnabled = true;
      m.PlaceArrowOverCounter(m.BreadCounter.cell);
      m.SetDescription("Take a Bread from the crate");
      m.tut.sub = "plate.bread";
    }
    HandleBreadCollected() {
      if (!this.Waiting("plate.bread")) return;
      const m = this.manager;
      m.tut.sub = "plate.breadOn";
      m.BreadCounter.IsEnabled = false;
      m.HideArrow();
      const plate = m.Plate;
      if (plate) plate.IsEnabled = true;
      m.PlateCounter.IsEnabled = true;
      this.CompleteDescriptionAndInvoke("GuideToPlaceBreadOverPlate");
    }
    GuideToPlaceBreadOverPlate() {
      this.manager.PlaceArrowOverPlate();
      this.manager.SetDescription("Put the Bread on the Plate");
    }
    HandleBreadPlacedOverPlate(ingredient, plate) {
      if (!this.Waiting("plate.breadOn") || plate.id !== this.manager.tut.plate) return;
      if (!IsIngredient(ingredient, IngredientName.Bread)) return;
      this.manager.tut.sub = "plate.check";
      this.manager.HideArrow();
      this.CompleteDescriptionAndInvoke("CheckWhetherPlayerIsHoldingPlate");
    }
    CheckWhetherPlayerIsHoldingPlate() {
      const isPlayerHoldingPlate = this.manager.kitchen.WhereIs(this.manager.tut.plate).startsWith("holder:hand:");
      if (isPlayerHoldingPlate) this.GuideToPlateRemainIngredients();
      else this.GuideToGetPlate();
    }
    GuideToGetPlate() {
      this.manager.PlaceArrowOverPlate();
      this.manager.SetDescription("Get the Plate");
      this.manager.tut.sub = "plate.get";
    }
    HandlePlateCollected() {
      if (!this.Waiting("plate.get")) return;
      this.manager.tut.sub = "plate.got";
      this.manager.HideArrow();
      this.CompleteDescriptionAndInvoke("GuideToPlateRemainIngredients");
    }
    GuideToPlateRemainIngredients() {
      const m = this.manager;
      m.Stove.Counter.IsEnabled = true;
      m.CuttingBoard.Counter.IsEnabled = true;
      m.PlaceArrowOverPreparator(m.Stove.cell, stoveArrowIndex);
      m.PlaceArrowOverPreparator(m.CuttingBoard.cell, cuttingBoardArrowIndex);
      m.SetDescription("Plate the other Ingredients.");
      m.tut.sub = "plate.rest";
    }
    HandleRemainIngredientsPlated(ingredient, plate) {
      if (!this.Waiting("plate.rest") || plate.id !== this.manager.tut.plate) return;
      const m = this.manager;
      if (IsIngredient(ingredient, IngredientName.Meat, IngredientStatus.Ready)) {
        m.HideArrow(stoveArrowIndex);
        m.Stove.Counter.IsEnabled = false;
        m.tut.meat = 1;
      }
      if (IsIngredient(ingredient, IngredientName.Cheese, IngredientStatus.Ready)) {
        m.HideArrow(cuttingBoardArrowIndex);
        m.CuttingBoard.Counter.IsEnabled = false;
        m.tut.cheese = 1;
      }
      const isRemainIngredientsPlated = m.tut.meat === 1 && m.tut.cheese === 1;
      if (!isRemainIngredientsPlated) return;
      m.tut.sub = "plate.toDeliver";
      this.CompleteDescriptionAndInvoke("GuideToDeliveryCounter");
    }
    GuideToDeliveryCounter() {
      const m = this.manager;
      m.DeliveryCounter.IsEnabled = true;
      m.PlaceArrowOverDeliveryCounter();
      m.SetDescription("Delivery your order!");
      m.tut.sub = "plate.deliver";
    }
    HandleOrderDelivered() {
      if (!this.Waiting("plate.deliver")) return;
      this.manager.tut.sub = "";
      this.manager.HideArrow();
      this.Complete();
    }
  };

  // src/ShowOrderTutorialStep.ts
  var ShowOrderTutorialStep = class extends AbstractTutorialStep {
    constructor() {
      super(...arguments);
      /** The asset's `recipe` (XBurger) and `timeToRead`. */
      __publicField(this, "recipe", kitchen_data_default.tutorial.showOrderRecipe);
      __publicField(this, "timeToRead", kitchen_data_default.tutorial.timeToRead);
    }
    GetDescription() {
      return "Orders appear on the board.";
    }
    Begin() {
      const settings = this.manager.kitchen.orders.Asset;
      const order = settings.Create(settings.recipeSettings.recipes[this.recipe]);
      order.CancelCountDownWaitingTime();
      this.Invoke("Complete", this.timeToRead);
    }
    Complete() {
      super.Complete();
    }
  };

  // src/TutorialIngredientCounters.ts
  var TutorialIngredientCounters = class {
    constructor() {
      __publicField(this, "counters", /* @__PURE__ */ new Map());
    }
    Load(crates) {
      this.counters = /* @__PURE__ */ new Map();
      const ordered = crates.slice().sort((a, b) => Number(!a.cell.endsWith("_00")) - Number(!b.cell.endsWith("_00")));
      for (const counter of ordered) if (!this.counters.has(counter.GetIngredientName())) this.counters.set(counter.GetIngredientName(), counter);
    }
    FindCounter(name) {
      const counter = this.counters.get(name);
      if (!counter) throw new Error(`no crate of ingredient ${name}`);
      return counter;
    }
  };

  // src/TutorialManager.ts
  function EmptyTutorial() {
    return { i: -1, sub: "", timers: [], text: "", green: 0, fade: null, title: 0, arrows: [null, null], meat: 0, cheese: 0, plate: "", done: 0 };
  }
  var TutorialManager = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "tut", EmptyTutorial());
      __publicField(this, "kitchen");
      __publicField(this, "description");
      /** "Cooking a Cheese Burger" (cheeseBurgerStepTitle). */
      __publicField(this, "titlePath", "");
      __publicField(this, "arrowObjects", []);
      __publicField(this, "deliveryCounter");
      /** The cells the tutorial uses: the first plate counter. */
      __publicField(this, "plateCounterCell", "Counter_Plate_00");
      __publicField(this, "timeBetweenSteps", kitchen_data_default.tutorial.timeBetweenSteps);
      __publicField(this, "steps", [new ShowOrderTutorialStep(), new CookingMeatTutorialStep(), new CuttingCheeseTutorialStep(), new PlatingTutorialStep()]);
      __publicField(this, "counters", new TutorialIngredientCounters());
      __publicField(this, "shownArrows", "");
      __publicField(this, "shownTitle", -1);
    }
    get TotalSteps() {
      return this.steps.length;
    }
    get IsRunning() {
      return this.kitchen.match.match.mode === "tutorial" && (this.kitchen.match.Phase === "tutorial" || this.kitchen.match.Phase === "countdown");
    }
    /** The text fades out at 1.2 a second from full: about 0.83 s. */
    get FadeSeconds() {
      return 1 / kitchen_data_default.ui.tutorialFadeSpeed;
    }
    // FindItems
    get Stove() {
      return this.kitchen.preparators.get(this.Cell("StoveCounter"));
    }
    get CuttingBoard() {
      return this.kitchen.preparators.get(this.Cell("CutCounter"));
    }
    get DeliveryCounter() {
      return this.deliveryCounter;
    }
    get PlateCounter() {
      return this.kitchen.counters.get(this.plateCounterCell);
    }
    get Plate() {
      return this.tut.plate ? this.kitchen.Item(this.tut.plate) : null;
    }
    get MeatCounter() {
      return this.counters.FindCounter(IngredientName.Meat);
    }
    get BreadCounter() {
      return this.counters.FindCounter(IngredientName.Bread);
    }
    get CheeseCounter() {
      return this.counters.FindCounter(IngredientName.Cheese);
    }
    /** Every Counter (FindObjectsByType<Counter>: plain counters, crates, the counters under boards and stoves). */
    get Counters() {
      return [...this.kitchen.counters.values()].filter((c) => "holder" in c && "startsWithPlate" in c);
    }
    Cell(prefix) {
      const cells = [...this.kitchen.preparators.keys()].filter((c) => c.startsWith(prefix)).sort();
      return cells.find((c) => c.endsWith("_00")) ?? cells[0];
    }
    Start() {
      this.counters.Load(this.kitchen.FindBehavioursOfType("IngredientCounter"));
      this.steps.forEach((step, i) => step.Initialize(this, i));
      for (const step of this.steps) step.Listen();
      this.kitchen.match.settings.CountDown.OnFinished.push(() => this.HandleCountDownFinished());
    }
    ResetTutorial() {
      this.tut = EmptyTutorial();
    }
    /** Awake (when the tutorial starts): find the items, switch everything off. */
    Awake() {
      this.tut = EmptyTutorial();
      const plate = this.kitchen.Holder(this.plateCounterCell).CurrentItem;
      this.tut.plate = plate?.id ?? "";
      for (const id of Object.keys(this.kitchen.items)) if (this.kitchen.items[id].k < 0) this.kitchen.items[id].off = 1;
      this.DeliveryCounter.IsEnabled = false;
      for (const c of this.kitchen.counters.values()) if (c.kinds?.indexOf("IItemDisposer") >= 0) c.IsEnabled = false;
      this.EnableCounters(false);
    }
    EnableCounters(enabled) {
      for (const counter of this.Counters) counter.IsEnabled = enabled;
    }
    // ---- arrows, title, description ----
    PlaceArrowOverCounter(cell, index = 0) {
      this.tut.arrows[index] = [cell, 1.5];
    }
    PlaceArrowOverDeliveryCounter(index = 0) {
      this.tut.arrows[index] = [this.DeliveryCounter.cell, 2];
    }
    PlaceArrowOverPreparator(cell, index = 0) {
      this.tut.arrows[index] = [cell, 0.5 + 0.2];
    }
    PlaceArrowOverPlate(index = 0) {
      this.tut.arrows[index] = ["plate", 0.5];
    }
    HideArrow(index = 0) {
      this.tut.arrows[index] = null;
    }
    EnableCheeseBurgerTitle(enabled) {
      this.tut.title = enabled ? 1 : 0;
    }
    SetDescription(text) {
      this.description.SetUncompletedText(text);
    }
    CompleteDescription() {
      this.description.Complete();
      this.description.FadeOut();
    }
    /** CompleteStep: the description completes and fades, then 0.4 s, then the next step. */
    CompleteStep() {
      this.CompleteDescription();
      this.Schedule(this.FadeSeconds + this.timeBetweenSteps, "m:TryBeginNextStep");
    }
    Schedule(seconds, act) {
      this.tut.timers.push({ at: roundTime(this.kitchen.match.G + seconds), act });
    }
    HandleCountDownFinished() {
      if (this.kitchen.match.match.mode !== "tutorial") return;
      this.Schedule(this.timeBetweenSteps, "m:TryBeginNextStep");
    }
    TryBeginNextStep() {
      if (++this.tut.i >= this.TotalSteps) {
        this.CompleteTutorial();
        return;
      }
      const step = this.steps[this.tut.i];
      this.tut.sub = "";
      this.SetDescription(step.GetDescription());
      step.Begin();
    }
    CompleteTutorial() {
      this.EnableCounters(true);
      this.tut.done = 1;
      this.tut.arrows = [null, null];
      this.tut.title = 0;
      this.kitchen.match.GoToResults();
    }
    /** The referee's tick: runs the scheduled actions that are due, in time order. */
    Tick(G) {
      if (!this.IsRunning) return;
      for (let guard = 0; guard < 16; guard++) {
        const due = this.tut.timers.filter((t) => t.at <= G).sort((a, b) => a.at - b.at)[0];
        if (!due) return;
        this.tut.timers.splice(this.tut.timers.indexOf(due), 1);
        const [who, method] = due.act.split(":");
        if (who === "m") this[method].call(this);
        else this.steps[Number(who)]?.Run(method);
      }
    }
    // ---- drawing (every client) ----
    Update() {
      const on = this.IsRunning ? this.tut.title : 0;
      if (on !== this.shownTitle && this.titlePath) {
        this.shownTitle = on;
        this.Host.setActive(this.titlePath, on === 1);
      }
      const arrows = this.IsRunning ? this.tut.arrows : [null, null];
      const key = JSON.stringify(arrows) + (arrows.some((a) => a?.[0] === "plate") ? this.kitchen.WhereIs(this.tut.plate) : "");
      if (key === this.shownArrows) return;
      this.shownArrows = key;
      this.arrowObjects.forEach((arrow, i) => {
        const target = arrows[i];
        const at = target ? this.ArrowPosition(target) : null;
        arrow.SetActive(at !== null);
        if (at) arrow.transform.position = at;
      });
    }
    ArrowPosition([target, height]) {
      const scale = this.kitchen.kitScale;
      let base = null;
      if (target === "plate") {
        const where = this.kitchen.WhereIs(this.tut.plate);
        if (where.startsWith("holder:")) base = this.kitchen.AnchorOf(where.slice(7));
        else {
          const pos = this.kitchen.items[this.tut.plate]?.pos;
          base = pos ? new Vector3(pos[0], pos[1], pos[2]) : null;
        }
      } else base = this.kitchen.AnchorOf(target);
      return base ? base.add(Vector3.up.scale(height * scale)) : null;
    }
  };
  __publicField(TutorialManager, "synced", ["tut"]);

  // src/index.ts
  var game = {
    slug: "coop-kitchen",
    behaviours: {
      Kitchen,
      MatchManager,
      ScoreManager,
      OrderManager,
      GameDataManager,
      Counter,
      IngredientCounter,
      PreparationCounter,
      DeliveryCounter,
      Trash,
      CuttingBoard,
      Stove,
      PreparationWorldSpaceCanvas,
      DeliveryCounterCanvas,
      OrderTicketGroup,
      Score,
      Timer,
      CountDown,
      TimesUp,
      Results,
      BackgroundMusic,
      SoundPopup,
      MainMenuOptions,
      MainMenu,
      PauseOptions,
      PauseCanvas,
      PauseHandler,
      TutorialDescription,
      TutorialManager,
      Chef
    },
    debug: (instance) => debugHooks(instance)
  };
  function debugHooks(instance) {
    const kitchen = () => instance.behaviour("kitchen");
    return {
      phase: () => kitchen().match.Phase,
      holders: () => ({ ...kitchen().holders }),
      items: () => JSON.parse(JSON.stringify(kitchen().items)),
      orders: () => kitchen().orders.orders.list.map((o) => ({ ...o })),
      score: () => kitchen().score.Asset.Score,
      roster: () => ({ ...kitchen().roster }),
      paused: () => kitchen().match.Paused,
      pausedBy: () => kitchen().match.PausedBy,
      /** The local player as the instance knows them. */
      me: () => ({ sid: instance.networking.LocalPlayer.sid, uid: instance.networking.LocalPlayer.uid, name: instance.networking.LocalPlayer.displayName }),
      /** The pool slot that shows an item on this page (-1: none). */
      slotOf: (id) => kitchen().SlotOf(id),
      /** A kit object's path by its key (bindings.json). */
      pathOf: (key) => instance.bindings.objects[key]?.path ?? ""
    };
  }
  var src_default = game;

  // bindings.json
  var bindings_default = {
    behaviours: [
      {
        fields: {
          clips: {
            chop: [
              {
                $clip: 4,
                on: "sfx"
              },
              {
                $clip: 5,
                on: "sfx"
              },
              {
                $clip: 6,
                on: "sfx"
              }
            ],
            countdownStart: [
              {
                $clip: 14,
                on: "sfx"
              }
            ],
            drop: [
              {
                $clip: 2,
                on: "sfx"
              },
              {
                $clip: 3,
                on: "sfx"
              }
            ],
            fail01: [
              {
                $clip: 8,
                on: "sfx"
              }
            ],
            fail02: [
              {
                $clip: 9,
                on: "sfx"
              }
            ],
            newOrder: [
              {
                $clip: 0,
                on: "sfx"
              }
            ],
            pickup: [
              {
                $clip: 0,
                on: "sfx"
              },
              {
                $clip: 1,
                on: "sfx"
              }
            ],
            success: [
              {
                $clip: 12,
                on: "sfx"
              },
              {
                $clip: 13,
                on: "sfx"
              }
            ],
            timesUp: [
              {
                $clip: 15,
                on: "sfx"
              }
            ],
            trash: [
              {
                $clip: 10,
                on: "sfx"
              },
              {
                $clip: 11,
                on: "sfx"
              }
            ],
            tutorialDone: [
              {
                $clip: 13,
                on: "sfx"
              }
            ],
            warning: [
              {
                $clip: 7,
                on: "sfx"
              }
            ]
          },
          corners: [
            {
              $obj: "c_Counter_Corner_02"
            },
            {
              $obj: "c_Counter_Corner_03"
            },
            {
              $obj: "c_Counter_Corner_01"
            },
            {
              $obj: "c_Counter_Corner_00"
            }
          ],
          floor: {
            $obj: "floor"
          },
          gameData: {
            $beh: "gameData"
          },
          kitScale: 0.64,
          match: {
            $beh: "match"
          },
          orders: {
            $beh: "orders"
          },
          score: {
            $beh: "score"
          },
          slotPaths: [
            "Items/Slot00",
            "Items/Slot01",
            "Items/Slot02",
            "Items/Slot03",
            "Items/Slot04",
            "Items/Slot05",
            "Items/Slot06",
            "Items/Slot07",
            "Items/Slot08",
            "Items/Slot09",
            "Items/Slot10",
            "Items/Slot11",
            "Items/Slot12",
            "Items/Slot13",
            "Items/Slot14",
            "Items/Slot15",
            "Items/Slot16",
            "Items/Slot17",
            "Items/Slot18",
            "Items/Slot19",
            "Items/Slot20",
            "Items/Slot21",
            "Items/Slot22",
            "Items/Slot23",
            "Items/Slot24",
            "Items/Slot25",
            "Items/Slot26",
            "Items/Slot27",
            "Items/Slot28",
            "Items/Slot29",
            "Items/Slot30",
            "Items/Slot31",
            "Items/Slot32",
            "Items/Slot33",
            "Items/Slot34",
            "Items/Slot35",
            "Items/Slot36",
            "Items/Slot37",
            "Items/Slot38",
            "Items/Slot39",
            "Items/Slot40",
            "Items/Slot41",
            "Items/Slot42",
            "Items/Slot43",
            "Items/Slot44",
            "Items/Slot45",
            "Items/Slot46",
            "Items/Slot47"
          ],
          slots: [
            {
              $obj: "s00"
            },
            {
              $obj: "s01"
            },
            {
              $obj: "s02"
            },
            {
              $obj: "s03"
            },
            {
              $obj: "s04"
            },
            {
              $obj: "s05"
            },
            {
              $obj: "s06"
            },
            {
              $obj: "s07"
            },
            {
              $obj: "s08"
            },
            {
              $obj: "s09"
            },
            {
              $obj: "s10"
            },
            {
              $obj: "s11"
            },
            {
              $obj: "s12"
            },
            {
              $obj: "s13"
            },
            {
              $obj: "s14"
            },
            {
              $obj: "s15"
            },
            {
              $obj: "s16"
            },
            {
              $obj: "s17"
            },
            {
              $obj: "s18"
            },
            {
              $obj: "s19"
            },
            {
              $obj: "s20"
            },
            {
              $obj: "s21"
            },
            {
              $obj: "s22"
            },
            {
              $obj: "s23"
            },
            {
              $obj: "s24"
            },
            {
              $obj: "s25"
            },
            {
              $obj: "s26"
            },
            {
              $obj: "s27"
            },
            {
              $obj: "s28"
            },
            {
              $obj: "s29"
            },
            {
              $obj: "s30"
            },
            {
              $obj: "s31"
            },
            {
              $obj: "s32"
            },
            {
              $obj: "s33"
            },
            {
              $obj: "s34"
            },
            {
              $obj: "s35"
            },
            {
              $obj: "s36"
            },
            {
              $obj: "s37"
            },
            {
              $obj: "s38"
            },
            {
              $obj: "s39"
            },
            {
              $obj: "s40"
            },
            {
              $obj: "s41"
            },
            {
              $obj: "s42"
            },
            {
              $obj: "s43"
            },
            {
              $obj: "s44"
            },
            {
              $obj: "s45"
            },
            {
              $obj: "s46"
            },
            {
              $obj: "s47"
            }
          ],
          tutorial: {
            $beh: "tutorial"
          }
        },
        id: "kitchen",
        object: "logic",
        type: "Kitchen"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          }
        },
        id: "match",
        object: "logic",
        type: "MatchManager"
      },
      {
        fields: {},
        id: "score",
        object: "logic",
        type: "ScoreManager"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          }
        },
        id: "orders",
        object: "logic",
        type: "OrderManager"
      },
      {
        fields: {},
        id: "gameData",
        object: "logic",
        type: "GameDataManager"
      },
      {
        fields: {
          cell: "CabbageCounter_01",
          data: 1,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_CabbageCounter_01"
          }
        },
        id: "ct_CabbageCounter_01",
        object: "c_CabbageCounter_01",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "BreadCounter_01",
          data: 0,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_BreadCounter_01"
          }
        },
        id: "ct_BreadCounter_01",
        object: "c_BreadCounter_01",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "TomatoCounter_01",
          data: 8,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_TomatoCounter_01"
          }
        },
        id: "ct_TomatoCounter_01",
        object: "c_TomatoCounter_01",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "MeatCounter_01",
          data: 5,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_MeatCounter_01"
          }
        },
        id: "ct_MeatCounter_01",
        object: "c_MeatCounter_01",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "CheeseCounter_01",
          data: 3,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_CheeseCounter_01"
          }
        },
        id: "ct_CheeseCounter_01",
        object: "c_CheeseCounter_01",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "CutCounter_01",
          kitchen: {
            $beh: "kitchen"
          },
          preparator: {
            $beh: "pr_CutCounter_01"
          },
          top: {
            $obj: "t_CutCounter_01"
          }
        },
        id: "ct_CutCounter_01",
        object: "c_CutCounter_01",
        type: "PreparationCounter"
      },
      {
        fields: {
          cell: "Counter_Plate_00",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: true,
          top: {
            $obj: "t_Counter_Plate_00"
          }
        },
        id: "ct_Counter_Plate_00",
        object: "c_Counter_Plate_00",
        type: "Counter"
      },
      {
        fields: {
          cell: "StoveCounter_01",
          kitchen: {
            $beh: "kitchen"
          },
          preparator: {
            $beh: "pr_StoveCounter_01"
          },
          top: {
            $obj: "t_StoveCounter_01"
          }
        },
        id: "ct_StoveCounter_01",
        object: "c_StoveCounter_01",
        type: "PreparationCounter"
      },
      {
        fields: {
          cell: "Counter_Normal_01",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_01"
          }
        },
        id: "ct_Counter_Normal_01",
        object: "c_Counter_Normal_01",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_08",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_08"
          }
        },
        id: "ct_Counter_Normal_08",
        object: "c_Counter_Normal_08",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_02",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_02"
          }
        },
        id: "ct_Counter_Normal_02",
        object: "c_Counter_Normal_02",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_03",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_03"
          }
        },
        id: "ct_Counter_Normal_03",
        object: "c_Counter_Normal_03",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_07",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_07"
          }
        },
        id: "ct_Counter_Normal_07",
        object: "c_Counter_Normal_07",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_09",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_09"
          }
        },
        id: "ct_Counter_Normal_09",
        object: "c_Counter_Normal_09",
        type: "Counter"
      },
      {
        fields: {
          cell: "TrashCounter",
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_TrashCounter"
          }
        },
        id: "ct_TrashCounter",
        object: "c_TrashCounter",
        type: "Trash"
      },
      {
        fields: {
          cell: "Counter_Normal_10",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_10"
          }
        },
        id: "ct_Counter_Normal_10",
        object: "c_Counter_Normal_10",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_06",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_06"
          }
        },
        id: "ct_Counter_Normal_06",
        object: "c_Counter_Normal_06",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_11",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_11"
          }
        },
        id: "ct_Counter_Normal_11",
        object: "c_Counter_Normal_11",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_PlateStack",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: true,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_PlateStack"
          }
        },
        id: "ct_Counter_PlateStack",
        object: "c_Counter_PlateStack",
        type: "Counter"
      },
      {
        fields: {
          cell: "Counter_Normal_00",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_00"
          }
        },
        id: "ct_Counter_Normal_00",
        object: "c_Counter_Normal_00",
        type: "Counter"
      },
      {
        fields: {
          canvas: {
            $beh: "deliveryCanvas"
          },
          cell: "Counter_Delivery",
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_Counter_Delivery"
          }
        },
        id: "ct_Counter_Delivery",
        object: "c_Counter_Delivery",
        type: "DeliveryCounter"
      },
      {
        fields: {
          cell: "CutCounter_00",
          kitchen: {
            $beh: "kitchen"
          },
          preparator: {
            $beh: "pr_CutCounter_00"
          },
          top: {
            $obj: "t_CutCounter_00"
          }
        },
        id: "ct_CutCounter_00",
        object: "c_CutCounter_00",
        type: "PreparationCounter"
      },
      {
        fields: {
          cell: "Counter_Plate_01",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: true,
          top: {
            $obj: "t_Counter_Plate_01"
          }
        },
        id: "ct_Counter_Plate_01",
        object: "c_Counter_Plate_01",
        type: "Counter"
      },
      {
        fields: {
          cell: "StoveCounter_00",
          kitchen: {
            $beh: "kitchen"
          },
          preparator: {
            $beh: "pr_StoveCounter_00"
          },
          top: {
            $obj: "t_StoveCounter_00"
          }
        },
        id: "ct_StoveCounter_00",
        object: "c_StoveCounter_00",
        type: "PreparationCounter"
      },
      {
        fields: {
          cell: "Counter_Normal_05",
          kitchen: {
            $beh: "kitchen"
          },
          plateStack: false,
          startsWithPlate: false,
          top: {
            $obj: "t_Counter_Normal_05"
          }
        },
        id: "ct_Counter_Normal_05",
        object: "c_Counter_Normal_05",
        type: "Counter"
      },
      {
        fields: {
          cell: "CabbageCounter_00",
          data: 1,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_CabbageCounter_00"
          }
        },
        id: "ct_CabbageCounter_00",
        object: "c_CabbageCounter_00",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "BreadCounter_00",
          data: 0,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_BreadCounter_00"
          }
        },
        id: "ct_BreadCounter_00",
        object: "c_BreadCounter_00",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "TomatoCounter_00",
          data: 8,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_TomatoCounter_00"
          }
        },
        id: "ct_TomatoCounter_00",
        object: "c_TomatoCounter_00",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "MeatCounter_00",
          data: 5,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_MeatCounter_00"
          }
        },
        id: "ct_MeatCounter_00",
        object: "c_MeatCounter_00",
        type: "IngredientCounter"
      },
      {
        fields: {
          cell: "CheeseCounter_00",
          data: 3,
          kitchen: {
            $beh: "kitchen"
          },
          top: {
            $obj: "t_CheeseCounter_00"
          }
        },
        id: "ct_CheeseCounter_00",
        object: "c_CheeseCounter_00",
        type: "IngredientCounter"
      },
      {
        fields: {
          allowedStatus: 4,
          barFill: {
            $obj: "bar_CutCounter_01"
          },
          cell: "CutCounter_01",
          counter: {
            $beh: "ct_CutCounter_01"
          },
          finalSecondsBooster: 1.25,
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/CutCounter_01/CuttingBoard",
          preparatedStatus: 2
        },
        id: "pr_CutCounter_01",
        object: "logic",
        type: "CuttingBoard"
      },
      {
        fields: {
          allowedStatus: 1,
          barFill: {
            $obj: "bar_StoveCounter_01"
          },
          cell: "StoveCounter_01",
          counter: {
            $beh: "ct_StoveCounter_01"
          },
          finalSecondsBooster: 1.25,
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/StoveCounter_01/Stove",
          preparatedStatus: 2,
          timeBeforeBurn: 2
        },
        id: "pr_StoveCounter_01",
        object: "logic",
        type: "Stove"
      },
      {
        fields: {
          allowedStatus: 4,
          barFill: {
            $obj: "bar_CutCounter_00"
          },
          cell: "CutCounter_00",
          counter: {
            $beh: "ct_CutCounter_00"
          },
          finalSecondsBooster: 1.25,
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/CutCounter_00/CuttingBoard",
          preparatedStatus: 2
        },
        id: "pr_CutCounter_00",
        object: "logic",
        type: "CuttingBoard"
      },
      {
        fields: {
          allowedStatus: 1,
          barFill: {
            $obj: "bar_StoveCounter_00"
          },
          cell: "StoveCounter_00",
          counter: {
            $beh: "ct_StoveCounter_00"
          },
          finalSecondsBooster: 1.25,
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/StoveCounter_00/Stove",
          preparatedStatus: 2,
          timeBeforeBurn: 2
        },
        id: "pr_StoveCounter_00",
        object: "logic",
        type: "Stove"
      },
      {
        fields: {
          barFill: {
            $obj: "bar_CutCounter_01"
          },
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/CutCounter_01/CuttingBoard/Canvas",
          preparator: {
            $beh: "pr_CutCounter_01"
          },
          rejectedText: "Cannot \nCut"
        },
        id: "pc_CutCounter_01",
        object: "logic",
        type: "PreparationWorldSpaceCanvas"
      },
      {
        fields: {
          barFill: {
            $obj: "bar_StoveCounter_01"
          },
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/StoveCounter_01/Stove/Canvas",
          preparator: {
            $beh: "pr_StoveCounter_01"
          },
          rejectedText: "Cannot \nCook"
        },
        id: "pc_StoveCounter_01",
        object: "logic",
        type: "PreparationWorldSpaceCanvas"
      },
      {
        fields: {
          barFill: {
            $obj: "bar_CutCounter_00"
          },
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/CutCounter_00/CuttingBoard/Canvas",
          preparator: {
            $beh: "pr_CutCounter_00"
          },
          rejectedText: "Cannot \nCut"
        },
        id: "pc_CutCounter_00",
        object: "logic",
        type: "PreparationWorldSpaceCanvas"
      },
      {
        fields: {
          barFill: {
            $obj: "bar_StoveCounter_00"
          },
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/StoveCounter_00/Stove/Canvas",
          preparator: {
            $beh: "pr_StoveCounter_00"
          },
          rejectedText: "Cannot \nCook"
        },
        id: "pc_StoveCounter_00",
        object: "logic",
        type: "PreparationWorldSpaceCanvas"
      },
      {
        fields: {
          cell: "Counter_Delivery",
          kitchen: {
            $beh: "kitchen"
          },
          path: "Counters/Counter_Delivery/Canvas",
          tip: {
            $comp: "deliveryTip",
            kind: "TMP"
          },
          tipFormat: "+{0:D2} Tip!"
        },
        id: "deliveryCanvas",
        object: "logic",
        type: "DeliveryCounterCanvas"
      },
      {
        fields: {
          bars: [
            {
              $obj: "ticketBar0"
            },
            {
              $obj: "ticketBar1"
            },
            {
              $obj: "ticketBar2"
            }
          ],
          board: "board",
          icons: [
            {
              $comp: "ticketIcons0",
              kind: "TMP"
            },
            {
              $comp: "ticketIcons1",
              kind: "TMP"
            },
            {
              $comp: "ticketIcons2",
              kind: "TMP"
            }
          ],
          kitchen: {
            $beh: "kitchen"
          },
          names: [
            {
              $comp: "ticketName0",
              kind: "TMP"
            },
            {
              $comp: "ticketName1",
              kind: "TMP"
            },
            {
              $comp: "ticketName2",
              kind: "TMP"
            }
          ],
          ticketPaths: ["Board/Orders/Ticket0", "Board/Orders/Ticket1", "Board/Orders/Ticket2"]
        },
        id: "tickets",
        object: "logic",
        type: "OrderTicketGroup"
      },
      {
        fields: {
          current: {
            $comp: "scoreText",
            kind: "TMP"
          },
          delta: {
            $comp: "scoreDelta",
            kind: "TMP"
          },
          kitchen: {
            $beh: "kitchen"
          },
          path: "Board/Hud/Score"
        },
        id: "scoreUi",
        object: "logic",
        type: "Score"
      },
      {
        fields: {
          board: "board",
          kitchen: {
            $beh: "kitchen"
          },
          path: "Board/Hud/Timer",
          slider: {
            $obj: "timerFill"
          },
          timer: {
            $comp: "timerText",
            kind: "TMP"
          }
        },
        id: "timer",
        object: "logic",
        type: "Timer"
      },
      {
        fields: {
          board: "board",
          countDown: {
            $comp: "countDownText",
            kind: "TMP"
          },
          kitchen: {
            $beh: "kitchen"
          },
          path: "Board/CountDown"
        },
        id: "countDown",
        object: "logic",
        type: "CountDown"
      },
      {
        fields: {
          board: "board",
          kitchen: {
            $beh: "kitchen"
          },
          path: "Board/TimesUp"
        },
        id: "timesUp",
        object: "logic",
        type: "TimesUp"
      },
      {
        fields: {
          best: {
            $comp: "resBest",
            kind: "TMP"
          },
          failedDeliveries: {
            $comp: "resFailed",
            kind: "TMP"
          },
          gameData: {
            $beh: "gameData"
          },
          kitchen: {
            $beh: "kitchen"
          },
          newHighScore: {
            $obj: "newHighScore"
          },
          path: "Board/Results",
          successfulDeliveries: {
            $comp: "resDelivered",
            kind: "TMP"
          },
          tips: {
            $comp: "resTips",
            kind: "TMP"
          },
          totalFailedDeliveries: {
            $comp: "resFailedTotal",
            kind: "TMP"
          },
          totalScore: {
            $comp: "resTotal",
            kind: "TMP"
          },
          totalSuccessfulDeliveries: {
            $comp: "resDeliveredTotal",
            kind: "TMP"
          }
        },
        id: "results",
        object: "logic",
        type: "Results"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          },
          path: "Music"
        },
        id: "music",
        object: "logic",
        type: "BackgroundMusic"
      },
      {
        fields: {
          effectsLabel: {
            $comp: "effectsLabel",
            kind: "TMP"
          },
          gameData: {
            $beh: "gameData"
          },
          musicLabel: {
            $comp: "musicLabel",
            kind: "TMP"
          },
          path: "Board/Sounds"
        },
        id: "soundPopup",
        object: "sounds",
        type: "SoundPopup"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          },
          tutorialButton: "btnTutorial"
        },
        id: "mainMenuOptions",
        object: "lobby",
        type: "MainMenuOptions"
      },
      {
        fields: {
          credits: {
            $obj: "credits"
          },
          creditsText: {
            $comp: "creditsText",
            kind: "TMP"
          },
          kitchen: {
            $beh: "kitchen"
          },
          mainMenuOptions: {
            $beh: "mainMenuOptions"
          },
          roster: {
            $comp: "rosterText",
            kind: "TMP"
          },
          soundPopup: {
            $beh: "soundPopup"
          }
        },
        id: "mainMenu",
        object: "logic",
        type: "MainMenu"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          }
        },
        id: "pauseOptions",
        object: "pauseOptions",
        type: "PauseOptions"
      },
      {
        fields: {
          confirm: {
            $obj: "confirm"
          },
          kitchen: {
            $beh: "kitchen"
          },
          pauseOptions: {
            $beh: "pauseOptions"
          },
          soundPopup: {
            $beh: "soundPopup"
          }
        },
        id: "pauseCanvas",
        object: "pausePanel",
        type: "PauseCanvas"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          },
          pauseButton: "btnPause",
          pauseCanvas: {
            $beh: "pauseCanvas"
          },
          pausedBy: {
            $comp: "pausedBy",
            kind: "TMP"
          }
        },
        id: "pauseHandler",
        object: "logic",
        type: "PauseHandler"
      },
      {
        fields: {
          board: "board",
          kitchen: {
            $beh: "kitchen"
          },
          manager: {
            $beh: "tutorial"
          },
          path: "Board/Tutorial/Description",
          text: {
            $comp: "tutorialText",
            kind: "TMP"
          }
        },
        id: "tutorialDescription",
        object: "logic",
        type: "TutorialDescription"
      },
      {
        fields: {
          arrowObjects: [
            {
              $obj: "arrow0"
            },
            {
              $obj: "arrow1"
            }
          ],
          deliveryCounter: {
            $beh: "ct_Counter_Delivery"
          },
          description: {
            $beh: "tutorialDescription"
          },
          kitchen: {
            $beh: "kitchen"
          },
          plateCounterCell: "Counter_Plate_00",
          timeBetweenSteps: 0.4,
          titlePath: "@Board/Tutorial/Title"
        },
        id: "tutorial",
        object: "logic",
        type: "TutorialManager"
      },
      {
        fields: {
          kitchen: {
            $beh: "kitchen"
          }
        },
        id: "chef",
        object: "logic",
        type: "Chef"
      }
    ],
    bundles: {
      android: "",
      windows: ""
    },
    events: [
      {
        behaviour: "ct_CabbageCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_CabbageCounter_01"
      },
      {
        behaviour: "ct_BreadCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_BreadCounter_01"
      },
      {
        behaviour: "ct_TomatoCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_TomatoCounter_01"
      },
      {
        behaviour: "ct_MeatCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_MeatCounter_01"
      },
      {
        behaviour: "ct_CheeseCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_CheeseCounter_01"
      },
      {
        behaviour: "ct_CutCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_CutCounter_01"
      },
      {
        behaviour: "ct_CutCounter_01",
        kind: "click",
        method: "ClickedKnob",
        object: "q_CutCounter_01"
      },
      {
        behaviour: "ct_Counter_Plate_00",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Plate_00"
      },
      {
        behaviour: "ct_StoveCounter_01",
        kind: "click",
        method: "Clicked",
        object: "c_StoveCounter_01"
      },
      {
        behaviour: "ct_StoveCounter_01",
        kind: "click",
        method: "ClickedKnob",
        object: "q_StoveCounter_01"
      },
      {
        behaviour: "ct_Counter_Normal_01",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_01"
      },
      {
        behaviour: "ct_Counter_Normal_08",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_08"
      },
      {
        behaviour: "ct_Counter_Normal_02",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_02"
      },
      {
        behaviour: "ct_Counter_Normal_03",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_03"
      },
      {
        behaviour: "ct_Counter_Normal_07",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_07"
      },
      {
        behaviour: "ct_Counter_Normal_09",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_09"
      },
      {
        behaviour: "ct_TrashCounter",
        kind: "click",
        method: "Clicked",
        object: "c_TrashCounter"
      },
      {
        behaviour: "ct_Counter_Normal_10",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_10"
      },
      {
        behaviour: "ct_Counter_Normal_06",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_06"
      },
      {
        behaviour: "ct_Counter_Normal_11",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_11"
      },
      {
        behaviour: "ct_Counter_PlateStack",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_PlateStack"
      },
      {
        behaviour: "ct_Counter_Normal_00",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_00"
      },
      {
        behaviour: "ct_Counter_Delivery",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Delivery"
      },
      {
        behaviour: "ct_CutCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_CutCounter_00"
      },
      {
        behaviour: "ct_CutCounter_00",
        kind: "click",
        method: "ClickedKnob",
        object: "q_CutCounter_00"
      },
      {
        behaviour: "ct_Counter_Plate_01",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Plate_01"
      },
      {
        behaviour: "ct_StoveCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_StoveCounter_00"
      },
      {
        behaviour: "ct_StoveCounter_00",
        kind: "click",
        method: "ClickedKnob",
        object: "q_StoveCounter_00"
      },
      {
        behaviour: "ct_Counter_Normal_05",
        kind: "click",
        method: "Clicked",
        object: "c_Counter_Normal_05"
      },
      {
        behaviour: "ct_CabbageCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_CabbageCounter_00"
      },
      {
        behaviour: "ct_BreadCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_BreadCounter_00"
      },
      {
        behaviour: "ct_TomatoCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_TomatoCounter_00"
      },
      {
        behaviour: "ct_MeatCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_MeatCounter_00"
      },
      {
        behaviour: "ct_CheeseCounter_00",
        kind: "click",
        method: "Clicked",
        object: "c_CheeseCounter_00"
      },
      {
        behaviour: "mainMenuOptions",
        kind: "click",
        method: "PlayGame",
        object: "btnPlay"
      },
      {
        behaviour: "mainMenuOptions",
        kind: "click",
        method: "PlayTutorial",
        object: "btnTutorial"
      },
      {
        behaviour: "mainMenuOptions",
        kind: "click",
        method: "RequestOpenSoundOptions",
        object: "btnSounds"
      },
      {
        behaviour: "mainMenuOptions",
        kind: "click",
        method: "RequestOpenCredits",
        object: "btnCredits"
      },
      {
        behaviour: "mainMenuOptions",
        kind: "click",
        method: "ToggleCook",
        object: "btnCook"
      },
      {
        behaviour: "mainMenu",
        kind: "click",
        method: "CloseCredits",
        object: "btnCloseCredits"
      },
      {
        behaviour: "soundPopup",
        kind: "click",
        method: "MusicUp",
        object: "btnMusicUp"
      },
      {
        behaviour: "soundPopup",
        kind: "click",
        method: "MusicDown",
        object: "btnMusicDown"
      },
      {
        behaviour: "soundPopup",
        kind: "click",
        method: "EffectsUp",
        object: "btnEffectsUp"
      },
      {
        behaviour: "soundPopup",
        kind: "click",
        method: "EffectsDown",
        object: "btnEffectsDown"
      },
      {
        behaviour: "soundPopup",
        kind: "click",
        method: "HandleResetButtonClick",
        object: "btnResetVolumes"
      },
      {
        behaviour: "soundPopup",
        kind: "click",
        method: "HandleCloseButtonClick",
        object: "btnSoundsBack"
      },
      {
        behaviour: "pauseOptions",
        kind: "click",
        method: "Pause",
        object: "btnPause"
      },
      {
        behaviour: "pauseOptions",
        kind: "click",
        method: "Resume",
        object: "btnResume"
      },
      {
        behaviour: "pauseOptions",
        kind: "click",
        method: "Restart",
        object: "btnRestart"
      },
      {
        behaviour: "pauseOptions",
        kind: "click",
        method: "Sound",
        object: "btnPauseSounds"
      },
      {
        behaviour: "pauseOptions",
        kind: "click",
        method: "Exit",
        object: "btnEndRound"
      },
      {
        behaviour: "pauseCanvas",
        kind: "click",
        method: "Confirmed",
        object: "btnYes"
      },
      {
        behaviour: "pauseCanvas",
        kind: "click",
        method: "Declined",
        object: "btnNo"
      },
      {
        behaviour: "results",
        kind: "click",
        method: "HandleContinueButtonClick",
        object: "btnContinue"
      }
    ],
    hash: "f93517c85d18ae6ae3c5a1b53c97a9905ba8f23b",
    objects: {
      arrow0: {
        active: false,
        click: false,
        grab: false,
        path: "Arrows/Arrow0",
        seat: false,
        sync: "none"
      },
      arrow1: {
        active: false,
        click: false,
        grab: false,
        path: "Arrows/Arrow1",
        seat: false,
        sync: "none"
      },
      bar: {
        active: false,
        click: false,
        grab: false,
        path: "Counters/CutCounter_01/CuttingBoard/Canvas/Bar",
        seat: false,
        sync: "none"
      },
      bar2: {
        active: false,
        click: false,
        grab: false,
        path: "Counters/StoveCounter_01/Stove/Canvas/Bar",
        seat: false,
        sync: "none"
      },
      bar3: {
        active: false,
        click: false,
        grab: false,
        path: "Counters/CutCounter_00/CuttingBoard/Canvas/Bar",
        seat: false,
        sync: "none"
      },
      bar4: {
        active: false,
        click: false,
        grab: false,
        path: "Counters/StoveCounter_00/Stove/Canvas/Bar",
        seat: false,
        sync: "none"
      },
      bar_CutCounter_00: {
        click: false,
        grab: false,
        path: "Counters/CutCounter_00/CuttingBoard/Canvas/Bar/Fill",
        seat: false,
        sync: "none"
      },
      bar_CutCounter_01: {
        click: false,
        grab: false,
        path: "Counters/CutCounter_01/CuttingBoard/Canvas/Bar/Fill",
        seat: false,
        sync: "none"
      },
      bar_StoveCounter_00: {
        click: false,
        grab: false,
        path: "Counters/StoveCounter_00/Stove/Canvas/Bar/Fill",
        seat: false,
        sync: "none"
      },
      bar_StoveCounter_01: {
        click: false,
        grab: false,
        path: "Counters/StoveCounter_01/Stove/Canvas/Bar/Fill",
        seat: false,
        sync: "none"
      },
      board: {
        click: false,
        grab: false,
        path: "Board",
        seat: false,
        sync: "none"
      },
      btnCloseCredits: {
        click: true,
        grab: false,
        path: "Board/Credits/Close",
        seat: false,
        sync: "none"
      },
      btnContinue: {
        click: true,
        grab: false,
        path: "Board/Results/Continue",
        seat: false,
        sync: "none"
      },
      btnCook: {
        click: true,
        grab: false,
        path: "Board/Lobby/Cook",
        seat: false,
        sync: "none"
      },
      btnCredits: {
        click: true,
        grab: false,
        path: "Board/Lobby/Credits",
        seat: false,
        sync: "none"
      },
      btnEffectsDown: {
        click: true,
        grab: false,
        path: "Board/Sounds/Effects/Down",
        seat: false,
        sync: "none"
      },
      btnEffectsUp: {
        click: true,
        grab: false,
        path: "Board/Sounds/Effects/Up",
        seat: false,
        sync: "none"
      },
      btnEndRound: {
        click: true,
        grab: false,
        path: "Board/PausePanel/Options/EndRound",
        seat: false,
        sync: "none"
      },
      btnMusicDown: {
        click: true,
        grab: false,
        path: "Board/Sounds/Music/Down",
        seat: false,
        sync: "none"
      },
      btnMusicUp: {
        click: true,
        grab: false,
        path: "Board/Sounds/Music/Up",
        seat: false,
        sync: "none"
      },
      btnNo: {
        click: true,
        grab: false,
        path: "Board/PausePanel/Confirm/No",
        seat: false,
        sync: "none"
      },
      btnPause: {
        click: true,
        grab: false,
        path: "Board/Hud/Pause",
        seat: false,
        sync: "none"
      },
      btnPauseSounds: {
        click: true,
        grab: false,
        path: "Board/PausePanel/Options/Sounds",
        seat: false,
        sync: "none"
      },
      btnPlay: {
        click: true,
        grab: false,
        path: "Board/Lobby/Play",
        seat: false,
        sync: "none"
      },
      btnResetVolumes: {
        click: true,
        grab: false,
        path: "Board/Sounds/Reset",
        seat: false,
        sync: "none"
      },
      btnRestart: {
        click: true,
        grab: false,
        path: "Board/PausePanel/Options/Restart",
        seat: false,
        sync: "none"
      },
      btnResume: {
        click: true,
        grab: false,
        path: "Board/PausePanel/Options/Resume",
        seat: false,
        sync: "none"
      },
      btnSounds: {
        click: true,
        grab: false,
        path: "Board/Lobby/Sounds",
        seat: false,
        sync: "none"
      },
      btnSoundsBack: {
        click: true,
        grab: false,
        path: "Board/Sounds/Back",
        seat: false,
        sync: "none"
      },
      btnTutorial: {
        click: true,
        grab: false,
        path: "Board/Lobby/Tutorial",
        seat: false,
        sync: "none"
      },
      btnYes: {
        click: true,
        grab: false,
        path: "Board/PausePanel/Confirm/Yes",
        seat: false,
        sync: "none"
      },
      c_BreadCounter_00: {
        click: true,
        grab: false,
        path: "Counters/BreadCounter_00",
        seat: false,
        sync: "none"
      },
      c_BreadCounter_01: {
        click: true,
        grab: false,
        path: "Counters/BreadCounter_01",
        seat: false,
        sync: "none"
      },
      c_CabbageCounter_00: {
        click: true,
        grab: false,
        path: "Counters/CabbageCounter_00",
        seat: false,
        sync: "none"
      },
      c_CabbageCounter_01: {
        click: true,
        grab: false,
        path: "Counters/CabbageCounter_01",
        seat: false,
        sync: "none"
      },
      c_CheeseCounter_00: {
        click: true,
        grab: false,
        path: "Counters/CheeseCounter_00",
        seat: false,
        sync: "none"
      },
      c_CheeseCounter_01: {
        click: true,
        grab: false,
        path: "Counters/CheeseCounter_01",
        seat: false,
        sync: "none"
      },
      c_Counter_Corner_00: {
        click: true,
        grab: false,
        path: "Counters/Counter_Corner_00",
        seat: false,
        sync: "none"
      },
      c_Counter_Corner_01: {
        click: true,
        grab: false,
        path: "Counters/Counter_Corner_01",
        seat: false,
        sync: "none"
      },
      c_Counter_Corner_02: {
        click: true,
        grab: false,
        path: "Counters/Counter_Corner_02",
        seat: false,
        sync: "none"
      },
      c_Counter_Corner_03: {
        click: true,
        grab: false,
        path: "Counters/Counter_Corner_03",
        seat: false,
        sync: "none"
      },
      c_Counter_Delivery: {
        click: true,
        grab: false,
        path: "Counters/Counter_Delivery",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_00: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_00",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_01: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_01",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_02: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_02",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_03: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_03",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_05: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_05",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_06: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_06",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_07: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_07",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_08: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_08",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_09: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_09",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_10: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_10",
        seat: false,
        sync: "none"
      },
      c_Counter_Normal_11: {
        click: true,
        grab: false,
        path: "Counters/Counter_Normal_11",
        seat: false,
        sync: "none"
      },
      c_Counter_PlateStack: {
        click: true,
        grab: false,
        path: "Counters/Counter_PlateStack",
        seat: false,
        sync: "none"
      },
      c_Counter_Plate_00: {
        click: true,
        grab: false,
        path: "Counters/Counter_Plate_00",
        seat: false,
        sync: "none"
      },
      c_Counter_Plate_01: {
        click: true,
        grab: false,
        path: "Counters/Counter_Plate_01",
        seat: false,
        sync: "none"
      },
      c_CutCounter_00: {
        click: true,
        grab: false,
        path: "Counters/CutCounter_00",
        seat: false,
        sync: "none"
      },
      c_CutCounter_01: {
        click: true,
        grab: false,
        path: "Counters/CutCounter_01",
        seat: false,
        sync: "none"
      },
      c_MeatCounter_00: {
        click: true,
        grab: false,
        path: "Counters/MeatCounter_00",
        seat: false,
        sync: "none"
      },
      c_MeatCounter_01: {
        click: true,
        grab: false,
        path: "Counters/MeatCounter_01",
        seat: false,
        sync: "none"
      },
      c_StoveCounter_00: {
        click: true,
        grab: false,
        path: "Counters/StoveCounter_00",
        seat: false,
        sync: "none"
      },
      c_StoveCounter_01: {
        click: true,
        grab: false,
        path: "Counters/StoveCounter_01",
        seat: false,
        sync: "none"
      },
      c_TomatoCounter_00: {
        click: true,
        grab: false,
        path: "Counters/TomatoCounter_00",
        seat: false,
        sync: "none"
      },
      c_TomatoCounter_01: {
        click: true,
        grab: false,
        path: "Counters/TomatoCounter_01",
        seat: false,
        sync: "none"
      },
      c_TrashCounter: {
        click: true,
        grab: false,
        path: "Counters/TrashCounter",
        seat: false,
        sync: "none"
      },
      confirm: {
        active: false,
        click: false,
        grab: false,
        path: "Board/PausePanel/Confirm",
        seat: false,
        sync: "none"
      },
      countDownText: {
        click: false,
        grab: false,
        path: "Board/CountDown/Text",
        seat: false,
        sync: "none"
      },
      credits: {
        active: false,
        click: false,
        grab: false,
        path: "Board/Credits",
        seat: false,
        sync: "none"
      },
      creditsText: {
        click: false,
        grab: false,
        path: "Board/Credits/Text",
        seat: false,
        sync: "none"
      },
      deliveryTip: {
        active: false,
        click: false,
        grab: false,
        path: "Counters/Counter_Delivery/Canvas/Tip",
        seat: false,
        sync: "none"
      },
      description: {
        active: false,
        click: false,
        grab: false,
        path: "Board/Tutorial/Description",
        seat: false,
        sync: "none"
      },
      effectsLabel: {
        click: false,
        grab: false,
        path: "Board/Sounds/Effects/Value",
        seat: false,
        sync: "none"
      },
      floor: {
        click: true,
        grab: false,
        path: "Floor",
        seat: false,
        sync: "none"
      },
      lobby: {
        click: false,
        grab: false,
        path: "Board/Lobby",
        seat: false,
        sync: "none"
      },
      logic: {
        click: false,
        grab: false,
        path: "Logic",
        seat: false,
        sync: "none"
      },
      musicLabel: {
        click: false,
        grab: false,
        path: "Board/Sounds/Music/Value",
        seat: false,
        sync: "none"
      },
      newHighScore: {
        active: false,
        click: false,
        grab: false,
        path: "Board/Results/NewHighScore",
        seat: false,
        sync: "none"
      },
      pauseOptions: {
        click: false,
        grab: false,
        path: "Board/PausePanel/Options",
        seat: false,
        sync: "none"
      },
      pausePanel: {
        active: false,
        click: false,
        grab: false,
        path: "Board/PausePanel",
        seat: false,
        sync: "none"
      },
      pausedBy: {
        click: false,
        grab: false,
        path: "Board/PausePanel/PausedBy",
        seat: false,
        sync: "none"
      },
      q_CutCounter_00: {
        click: true,
        grab: false,
        path: "Counters/CutCounter_00/CuttingBoard/Knife",
        seat: false,
        sync: "none"
      },
      q_CutCounter_01: {
        click: true,
        grab: false,
        path: "Counters/CutCounter_01/CuttingBoard/Knife",
        seat: false,
        sync: "none"
      },
      q_StoveCounter_00: {
        click: true,
        grab: false,
        path: "Counters/StoveCounter_00/Knob",
        seat: false,
        sync: "none"
      },
      q_StoveCounter_01: {
        click: true,
        grab: false,
        path: "Counters/StoveCounter_01/Knob",
        seat: false,
        sync: "none"
      },
      resBest: {
        click: false,
        grab: false,
        path: "Board/Results/Best",
        seat: false,
        sync: "none"
      },
      resDelivered: {
        click: false,
        grab: false,
        path: "Board/Results/Delivered",
        seat: false,
        sync: "none"
      },
      resDeliveredTotal: {
        click: false,
        grab: false,
        path: "Board/Results/DeliveredTotal",
        seat: false,
        sync: "none"
      },
      resFailed: {
        click: false,
        grab: false,
        path: "Board/Results/Failed",
        seat: false,
        sync: "none"
      },
      resFailedTotal: {
        click: false,
        grab: false,
        path: "Board/Results/FailedTotal",
        seat: false,
        sync: "none"
      },
      resTips: {
        click: false,
        grab: false,
        path: "Board/Results/Tips",
        seat: false,
        sync: "none"
      },
      resTotal: {
        click: false,
        grab: false,
        path: "Board/Results/Total",
        seat: false,
        sync: "none"
      },
      rosterText: {
        click: false,
        grab: false,
        path: "Board/Lobby/Roster",
        seat: false,
        sync: "none"
      },
      s00: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot00",
        seat: false,
        sync: "none"
      },
      s01: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot01",
        seat: false,
        sync: "none"
      },
      s02: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot02",
        seat: false,
        sync: "none"
      },
      s03: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot03",
        seat: false,
        sync: "none"
      },
      s04: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot04",
        seat: false,
        sync: "none"
      },
      s05: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot05",
        seat: false,
        sync: "none"
      },
      s06: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot06",
        seat: false,
        sync: "none"
      },
      s07: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot07",
        seat: false,
        sync: "none"
      },
      s08: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot08",
        seat: false,
        sync: "none"
      },
      s09: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot09",
        seat: false,
        sync: "none"
      },
      s10: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot10",
        seat: false,
        sync: "none"
      },
      s11: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot11",
        seat: false,
        sync: "none"
      },
      s12: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot12",
        seat: false,
        sync: "none"
      },
      s13: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot13",
        seat: false,
        sync: "none"
      },
      s14: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot14",
        seat: false,
        sync: "none"
      },
      s15: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot15",
        seat: false,
        sync: "none"
      },
      s16: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot16",
        seat: false,
        sync: "none"
      },
      s17: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot17",
        seat: false,
        sync: "none"
      },
      s18: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot18",
        seat: false,
        sync: "none"
      },
      s19: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot19",
        seat: false,
        sync: "none"
      },
      s20: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot20",
        seat: false,
        sync: "none"
      },
      s21: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot21",
        seat: false,
        sync: "none"
      },
      s22: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot22",
        seat: false,
        sync: "none"
      },
      s23: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot23",
        seat: false,
        sync: "none"
      },
      s24: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot24",
        seat: false,
        sync: "none"
      },
      s25: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot25",
        seat: false,
        sync: "none"
      },
      s26: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot26",
        seat: false,
        sync: "none"
      },
      s27: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot27",
        seat: false,
        sync: "none"
      },
      s28: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot28",
        seat: false,
        sync: "none"
      },
      s29: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot29",
        seat: false,
        sync: "none"
      },
      s30: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot30",
        seat: false,
        sync: "none"
      },
      s31: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot31",
        seat: false,
        sync: "none"
      },
      s32: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot32",
        seat: false,
        sync: "none"
      },
      s33: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot33",
        seat: false,
        sync: "none"
      },
      s34: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot34",
        seat: false,
        sync: "none"
      },
      s35: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot35",
        seat: false,
        sync: "none"
      },
      s36: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot36",
        seat: false,
        sync: "none"
      },
      s37: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot37",
        seat: false,
        sync: "none"
      },
      s38: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot38",
        seat: false,
        sync: "none"
      },
      s39: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot39",
        seat: false,
        sync: "none"
      },
      s40: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot40",
        seat: false,
        sync: "none"
      },
      s41: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot41",
        seat: false,
        sync: "none"
      },
      s42: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot42",
        seat: false,
        sync: "none"
      },
      s43: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot43",
        seat: false,
        sync: "none"
      },
      s44: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot44",
        seat: false,
        sync: "none"
      },
      s45: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot45",
        seat: false,
        sync: "none"
      },
      s46: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot46",
        seat: false,
        sync: "none"
      },
      s47: {
        active: false,
        click: false,
        grab: true,
        path: "Items/Slot47",
        seat: false,
        sync: "none"
      },
      scoreDelta: {
        active: false,
        click: false,
        grab: false,
        path: "Board/Hud/Score/Delta",
        seat: false,
        sync: "none"
      },
      scoreText: {
        click: false,
        grab: false,
        path: "Board/Hud/Score/Current",
        seat: false,
        sync: "none"
      },
      sfx: {
        click: false,
        grab: false,
        path: "Audio",
        seat: false,
        sync: "none"
      },
      sounds: {
        active: false,
        click: false,
        grab: false,
        path: "Board/Sounds",
        seat: false,
        sync: "none"
      },
      t_BreadCounter_00: {
        click: false,
        grab: false,
        path: "Counters/BreadCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_BreadCounter_01: {
        click: false,
        grab: false,
        path: "Counters/BreadCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_CabbageCounter_00: {
        click: false,
        grab: false,
        path: "Counters/CabbageCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_CabbageCounter_01: {
        click: false,
        grab: false,
        path: "Counters/CabbageCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_CheeseCounter_00: {
        click: false,
        grab: false,
        path: "Counters/CheeseCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_CheeseCounter_01: {
        click: false,
        grab: false,
        path: "Counters/CheeseCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Delivery: {
        click: false,
        grab: false,
        path: "Counters/Counter_Delivery/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_00: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_00/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_01: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_01/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_02: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_02/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_03: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_03/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_05: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_05/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_06: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_06/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_07: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_07/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_08: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_08/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_09: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_09/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_10: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_10/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Normal_11: {
        click: false,
        grab: false,
        path: "Counters/Counter_Normal_11/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_PlateStack: {
        click: false,
        grab: false,
        path: "Counters/Counter_PlateStack/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Plate_00: {
        click: false,
        grab: false,
        path: "Counters/Counter_Plate_00/Top",
        seat: false,
        sync: "none"
      },
      t_Counter_Plate_01: {
        click: false,
        grab: false,
        path: "Counters/Counter_Plate_01/Top",
        seat: false,
        sync: "none"
      },
      t_CutCounter_00: {
        click: false,
        grab: false,
        path: "Counters/CutCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_CutCounter_01: {
        click: false,
        grab: false,
        path: "Counters/CutCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_MeatCounter_00: {
        click: false,
        grab: false,
        path: "Counters/MeatCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_MeatCounter_01: {
        click: false,
        grab: false,
        path: "Counters/MeatCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_StoveCounter_00: {
        click: false,
        grab: false,
        path: "Counters/StoveCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_StoveCounter_01: {
        click: false,
        grab: false,
        path: "Counters/StoveCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_TomatoCounter_00: {
        click: false,
        grab: false,
        path: "Counters/TomatoCounter_00/Top",
        seat: false,
        sync: "none"
      },
      t_TomatoCounter_01: {
        click: false,
        grab: false,
        path: "Counters/TomatoCounter_01/Top",
        seat: false,
        sync: "none"
      },
      t_TrashCounter: {
        click: false,
        grab: false,
        path: "Counters/TrashCounter/Top",
        seat: false,
        sync: "none"
      },
      ticketBar0: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket0/Bar/Fill",
        seat: false,
        sync: "none"
      },
      ticketBar1: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket1/Bar/Fill",
        seat: false,
        sync: "none"
      },
      ticketBar2: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket2/Bar/Fill",
        seat: false,
        sync: "none"
      },
      ticketIcons0: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket0/Icons",
        seat: false,
        sync: "none"
      },
      ticketIcons1: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket1/Icons",
        seat: false,
        sync: "none"
      },
      ticketIcons2: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket2/Icons",
        seat: false,
        sync: "none"
      },
      ticketName0: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket0/Name",
        seat: false,
        sync: "none"
      },
      ticketName1: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket1/Name",
        seat: false,
        sync: "none"
      },
      ticketName2: {
        click: false,
        grab: false,
        path: "Board/Orders/Ticket2/Name",
        seat: false,
        sync: "none"
      },
      timerFill: {
        click: false,
        grab: false,
        path: "Board/Hud/Timer/Bar/Fill",
        seat: false,
        sync: "none"
      },
      timerText: {
        click: false,
        grab: false,
        path: "Board/Hud/Timer/Text",
        seat: false,
        sync: "none"
      },
      tutorialText: {
        click: false,
        grab: false,
        path: "Board/Tutorial/Description/Text",
        seat: false,
        sync: "none"
      }
    },
    refs: [
      "sfx",
      "floor",
      "c_Counter_Corner_02",
      "c_CabbageCounter_01",
      "c_BreadCounter_01",
      "c_TomatoCounter_01",
      "c_MeatCounter_01",
      "c_CheeseCounter_01",
      "c_CutCounter_01",
      "q_CutCounter_01",
      "c_Counter_Plate_00",
      "c_StoveCounter_01",
      "q_StoveCounter_01",
      "c_Counter_Normal_01",
      "c_Counter_Corner_03",
      "c_Counter_Normal_08",
      "c_Counter_Normal_02",
      "c_Counter_Normal_03",
      "c_Counter_Normal_07",
      "c_Counter_Normal_09",
      "c_TrashCounter",
      "c_Counter_Normal_10",
      "c_Counter_Normal_06",
      "c_Counter_Normal_11",
      "c_Counter_PlateStack",
      "c_Counter_Normal_00",
      "c_Counter_Delivery",
      "c_Counter_Corner_01",
      "c_CutCounter_00",
      "q_CutCounter_00",
      "c_Counter_Plate_01",
      "c_StoveCounter_00",
      "q_StoveCounter_00",
      "c_Counter_Normal_05",
      "c_CabbageCounter_00",
      "c_BreadCounter_00",
      "c_TomatoCounter_00",
      "c_MeatCounter_00",
      "c_CheeseCounter_00",
      "c_Counter_Corner_00",
      "deliveryTip",
      "board",
      "scoreText",
      "scoreDelta",
      "timerText",
      "countDownText",
      "ticketName0",
      "ticketIcons0",
      "ticketName1",
      "ticketIcons1",
      "ticketName2",
      "ticketIcons2",
      "lobby",
      "rosterText",
      "btnPlay",
      "btnTutorial",
      "btnSounds",
      "btnCredits",
      "btnCook",
      "credits",
      "creditsText",
      "btnCloseCredits",
      "sounds",
      "musicLabel",
      "effectsLabel",
      "btnMusicUp",
      "btnMusicDown",
      "btnEffectsUp",
      "btnEffectsDown",
      "btnResetVolumes",
      "btnSoundsBack",
      "btnPause",
      "pausePanel",
      "pauseOptions",
      "pausedBy",
      "btnResume",
      "btnRestart",
      "btnPauseSounds",
      "btnEndRound",
      "confirm",
      "btnYes",
      "btnNo",
      "resFailed",
      "resFailedTotal",
      "resDelivered",
      "resDeliveredTotal",
      "resTips",
      "resTotal",
      "resBest",
      "newHighScore",
      "btnContinue",
      "tutorialText"
    ],
    schema: 1,
    slug: "coop-kitchen"
  };

  // portkit/src/platform/bs.ts
  function pageEnv() {
    const g = globalThis;
    let storage = null;
    try {
      storage = g.localStorage ?? null;
    } catch {
      storage = null;
    }
    return {
      get BS() {
        return g.BS;
      },
      win: g.window,
      doc: g.document,
      MutationObserver: g.MutationObserver,
      storage,
      crypto: g.crypto,
      setTimeout: (fn, ms) => g.setTimeout(fn, ms),
      clearTimeout: (handle) => g.clearTimeout(handle),
      now: () => g.performance.now(),
      wallMs: () => g.Date.now(),
      random: () => g.Math.random(),
      console: g.console
    };
  }
  var DEFAULT_BS_OPTIONS = { joinTimeoutMs: 3e4, kitTimeoutMs: 12e4, kitFindMs: 2e4, userFlushMs: 200, verbose: false };
  var HOST_EVENTS = {
    click: "click",
    grab: "grab",
    drop: "drop",
    triggerEnter: "trigger-enter",
    triggerExit: "trigger-exit",
    collisionEnter: "collision-enter",
    collisionExit: "collision-exit"
  };
  var DELIMITER_CODES = [182, 167, 124, 8253, 164];
  function hasDelimiter(text) {
    for (let i = 0; i < text.length; i++) if (DELIMITER_CODES.indexOf(text.charCodeAt(i)) >= 0) return true;
    return false;
  }
  var BsPlatform = class {
    constructor(env2, options = {}) {
      __publicField(this, "clock");
      __publicField(this, "limits", { ...DEFAULT_LIMITS });
      __publicField(this, "storage");
      __publicField(this, "crypto");
      __publicField(this, "env");
      __publicField(this, "options");
      __publicField(this, "scene", null);
      __publicField(this, "readyPromise", null);
      __publicField(this, "mirror", /* @__PURE__ */ new Map());
      __publicField(this, "snapshot", deferred());
      __publicField(this, "fullSeen", false);
      __publicField(this, "stateHandlers", []);
      __publicField(this, "errorHandlers", []);
      __publicField(this, "userHandlers", []);
      __publicField(this, "oneShotHandlers", []);
      __publicField(this, "playerHandlers", []);
      __publicField(this, "sessionHandlers", []);
      __publicField(this, "snippetHandlers", []);
      __publicField(this, "poseHandlers", []);
      __publicField(this, "inputHandlers", []);
      __publicField(this, "wrappers", /* @__PURE__ */ new WeakMap());
      /** uid -> the page's UserData object for everyone in the room. */
      __publicField(this, "roster", /* @__PURE__ */ new Map());
      __publicField(this, "pendingPublic", null);
      __publicField(this, "pendingProtected", null);
      __publicField(this, "pendingUser", /* @__PURE__ */ new Map());
      __publicField(this, "userTimer", 0);
      __publicField(this, "userLastFlush", -Infinity);
      __publicField(this, "userBackoff", 0);
      /** Own user state when the app has no user state to offer (Play mode on your own). */
      __publicField(this, "localUser", null);
      __publicField(this, "ownUser", /* @__PURE__ */ new Map());
      __publicField(this, "sessionId", "");
      __publicField(this, "keyNames", null);
      __publicField(this, "observer", null);
      this.env = env2;
      this.options = { ...DEFAULT_BS_OPTIONS, ...options };
      this.crypto = env2.crypto;
      this.clock = {
        now: () => env2.now(),
        wallSeconds: () => env2.wallMs() / 1e3,
        setTimeout: (fn, ms) => env2.setTimeout(fn, ms),
        clearTimeout: (handle) => env2.clearTimeout(handle)
      };
      const store = env2.storage;
      this.storage = {
        get: (key) => store ? store.getItem(key) : null,
        set: (key, value) => {
          if (!store) throw new Error("no storage on this page");
          store.setItem(key, value);
        },
        remove: (key) => store?.removeItem(key),
        keys: (prefix) => {
          const out = [];
          if (!store) return out;
          for (let i = 0; i < store.length; i++) {
            const key = store.key(i);
            if (key !== null && key.startsWith(prefix)) out.push(key);
          }
          return out;
        }
      };
    }
    random() {
      return this.env.random();
    }
    log(level, message) {
      if (level === "debug" && !this.options.verbose) return;
      const text = "[pk1] " + message;
      if (level === "error") this.env.console.error(text);
      else if (level === "warn") this.env.console.warn(text);
      else this.env.console.log(text);
    }
    // ---- the page registry --------------------------------------------------------------------------------------
    /** `window.__pk1`: made by whichever game script comes first, shared by all of them, so kept small and stable. */
    registry() {
      const win = this.env.win;
      let registry = win.__pk1;
      if (!registry || typeof registry !== "object" || !registry.holders) {
        const made = {
          v: 1,
          games: {},
          holders: {},
          debug: {},
          clock(key, id, seconds) {
            const holder = made.holders[key];
            if (holder) holder.clock(String(id), String(seconds));
          },
          event(key, name, args) {
            const holder = made.holders[key];
            if (holder) holder.event(String(name), args === void 0 || args === null ? "" : String(args));
          }
        };
        registry = made;
        win.__pk1 = made;
      }
      return registry;
    }
    claimGame(slug, info) {
      const registry = this.registry();
      if (Object.prototype.hasOwnProperty.call(registry.games, slug)) return false;
      registry.games[slug] = info;
      return true;
    }
    expose(key, hooks) {
      const registry = this.registry();
      if (hooks) registry.debug[key] = hooks;
      else delete registry.debug[key];
    }
    onRelay(key, handlers) {
      const registry = this.registry();
      const holder = {
        clock: (id, seconds) => handlers.clock(id, Number(seconds)),
        event: (name, args) => handlers.event(name, parseEventArgs(args))
      };
      registry.holders[key] = holder;
      return () => {
        if (registry.holders[key] === holder) delete registry.holders[key];
      };
    }
    relaySend(payload) {
      this.attempt("relay", () => this.scene.SendToVisualScripting(TAG, payload));
    }
    // ---- ready --------------------------------------------------------------------------------------------------
    whenReady() {
      if (!this.readyPromise) this.readyPromise = this.becomeReady();
      return this.readyPromise;
    }
    async becomeReady() {
      const { env: env2 } = this;
      const loaded = deferred();
      env2.win.addEventListener("bs-loaded", () => loaded.resolve());
      await loaded.promise;
      this.scene = env2.BS.Scene.GetInstance();
      this.listen();
      const started = env2.now();
      let warned = false;
      while (!this.joined()) {
        if (env2.now() - started > this.options.joinTimeoutMs) {
          if (!warned) this.log("warn", "the local player has not joined a room; carrying on as the only player");
          warned = true;
          break;
        }
        await this.sleep(100);
      }
      this.sessionId = this.local().sid;
      this.seedMirror();
      this.watchSession();
      this.observeSnippets();
    }
    /** The local user exists and has a real session id (it reads "local" until the room is joined). */
    joined() {
      const user = this.scene.localUser;
      return !!user && typeof user.id === "string" && user.id !== "" && user.id !== "local";
    }
    sleep(ms) {
      return new Promise((resolve) => this.env.setTimeout(resolve, ms));
    }
    watchSession() {
      const check = () => {
        const now = this.local().sid;
        if (now !== this.sessionId) {
          this.sessionId = now;
          for (const handler of this.sessionHandlers.slice()) this.attempt("session handler", handler);
        }
        this.env.setTimeout(check, 1e3);
      };
      this.env.setTimeout(check, 1e3);
    }
    listen() {
      const scene = this.scene;
      const present = scene.users ?? {};
      for (const uid of Object.keys(present)) this.roster.set(uid, present[uid]);
      const on = (name, handler) => scene.On(name, (event) => {
        try {
          handler(event ? event.detail : void 0);
        } catch (error) {
          this.log("error", `${name} handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      on("space-state", (detail) => this.onSpaceState(detail));
      on("space-state-changed", (detail) => {
        if (this.fullSeen || !detail || !Array.isArray(detail.changes)) return;
        for (const change of detail.changes) {
          if (typeof change.property !== "string" || !change.property.startsWith(TAG + ".")) continue;
          this.applyChange(change.property, typeof change.newValue === "string" ? change.newValue : void 0);
        }
      });
      on("space-state-error", (detail) => this.onStateErrorEvent(detail));
      on("user-state-error", (detail) => this.onStateErrorEvent(detail));
      on("one-shot", (detail) => {
        if (!detail || typeof detail.data !== "string") return;
        for (const handler of this.oneShotHandlers.slice()) handler(String(detail.fromId ?? ""), detail.data);
      });
      on("user-joined", (user) => this.emitPlayer("join", user));
      on("user-left", (user) => this.emitPlayer("leave", user));
      on("user-state", (detail) => {
        if (!detail || !Array.isArray(detail.changes)) return;
        const sid = String(detail.id ?? detail.user?.id ?? "");
        for (const change of detail.changes) {
          if (typeof change.path !== "string" || !change.path.startsWith(TAG + ".")) continue;
          const value = change.deleted || typeof change.value !== "string" ? void 0 : change.value;
          if (sid === this.local().sid) {
            if (value === void 0) this.ownUser.delete(change.path);
            else this.ownUser.set(change.path, value);
          }
          this.emitUser(sid, change.path, value);
        }
      });
      on("pose-update", (detail) => {
        if (!detail || !detail.head) return;
        const poses = { head: pose(detail.head), leftHand: pose(detail.leftHand), rightHand: pose(detail.rightHand) };
        for (const handler of this.poseHandlers.slice()) handler(poses);
      });
      const input = (event) => {
        for (const handler of this.inputHandlers.slice()) handler(event);
      };
      on("button-pressed", (d) => input({ type: "button", button: clampInt(d.button, 4), side: clampInt(d.side, 1), pressed: true }));
      on("button-released", (d) => input({ type: "button", button: clampInt(d.button, 4), side: clampInt(d.side, 1), pressed: false }));
      on("controller-axis-update", (d) => input({ type: "thumbstick", side: clampInt(d.hand, 1), x: Number(d.x) || 0, y: Number(d.y) || 0 }));
      on("trigger-axis-update", (d) => input({ type: "trigger", side: clampInt(d.hand, 1), value: Number(d.value) || 0 }));
      on("key-press", (d) => input({ type: "key", key: this.keyName(d.key), pressed: true }));
      on("key-release", (d) => input({ type: "key", key: this.keyName(d.key), pressed: false }));
    }
    keyName(code) {
      if (!this.keyNames) {
        this.keyNames = {};
        const codes = this.env.BS.KeyCode ?? {};
        for (const name of Object.keys(codes)) if (typeof codes[name] === "number") this.keyNames[codes[name]] = name;
      }
      return this.keyNames[Number(code)] ?? String(code);
    }
    // ---- players ------------------------------------------------------------------------------------------------
    toPlayer(user) {
      return { sid: String(user.id ?? ""), uid: String(user.uid ?? ""), name: String(user.name ?? ""), isLocal: user.isLocal === true, isAdmin: user.isSpaceAdmin === true };
    }
    local() {
      const user = this.scene?.localUser;
      if (!user) return { sid: "local", uid: "local", name: "", isLocal: true, isAdmin: false };
      const player = this.toPlayer(user);
      player.isLocal = true;
      if (!player.sid) player.sid = "local";
      return player;
    }
    /**
     * Who is in the room. The page keeps `scene.users` keyed by user id (so two sessions of one account show as
     * one player), and it removes a leaver only after `user-left` has been dispatched: the list is kept here, and
     * each player's fields are read live, because a session id is filled in after the fact.
     */
    players() {
      const out = [];
      let sawLocal = false;
      for (const user of this.roster.values()) {
        const player = this.toPlayer(user);
        if (player.isLocal) {
          sawLocal = true;
          if (!player.sid) player.sid = "local";
        } else if (!player.sid || player.sid === "local") continue;
        out.push(player);
      }
      if (!sawLocal) out.push(this.local());
      return out;
    }
    onPlayers(handler) {
      return subscribe(this.playerHandlers, handler);
    }
    onSessionChanged(handler) {
      return subscribe(this.sessionHandlers, handler);
    }
    emitPlayer(kind, user) {
      if (!user) return;
      const uid = String(user.uid ?? "");
      if (kind === "join") this.roster.set(uid, user);
      else this.roster.delete(uid);
      const player = this.toPlayer(user);
      for (const handler of this.playerHandlers.slice()) this.attempt("player handler", () => handler(kind, player));
    }
    // ---- space state --------------------------------------------------------------------------------------------
    onSpaceState(detail) {
      if (!detail || !Array.isArray(detail.changes)) return;
      if (detail.full) {
        const next = /* @__PURE__ */ new Map();
        for (const change of detail.changes) {
          if (typeof change.path === "string" && change.path.startsWith(TAG + ".") && !change.deleted && typeof change.value === "string") next.set(change.path, change.value);
        }
        this.replaceMirror(next);
        this.fullSeen = true;
        this.snapshot.resolve(true);
        return;
      }
      for (const change of detail.changes) {
        if (typeof change.path !== "string" || !change.path.startsWith(TAG + ".")) continue;
        this.applyChange(change.path, change.deleted || typeof change.value !== "string" ? void 0 : change.value);
      }
    }
    replaceMirror(next) {
      const gone = [...this.mirror.keys()].filter((path) => !next.has(path));
      for (const path of gone) this.applyChange(path, void 0);
      for (const [path, value] of next) this.applyChange(path, value);
    }
    /** Applies one change to the mirror and tells the listeners, unless the mirror already says so. */
    applyChange(path, value) {
      const before = this.mirror.get(path);
      if (before === value) return;
      if (value === void 0) this.mirror.delete(path);
      else this.mirror.set(path, value);
      for (const handler of this.stateHandlers.slice()) {
        if (!path.startsWith(handler.prefix)) continue;
        try {
          handler.fn(path, value);
        } catch (error) {
          this.log("error", `state handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    /**
     * The mirror at the moment the adapter became ready. When the snapshot's own event was missed (the script
     * arrived after it), the page's copy of the state is asked for instead.
     */
    seedMirror() {
      if (this.fullSeen) return;
      const take = (entries) => {
        if (this.fullSeen || !entries) return;
        const next = new Map(this.mirror);
        for (const scope of ["public", "protected"]) {
          const map = entries[scope];
          if (!map) continue;
          for (const path of Object.keys(map)) if (path.startsWith(TAG + ".") && typeof map[path] === "string") next.set(path, map[path]);
        }
        this.replaceMirror(next);
      };
      take(this.scene.spaceStateJson);
      if (!this.joined()) return;
      this.attemptAsync("SpaceStateGetAll", async () => {
        const all = await this.scene.SpaceStateGetAll();
        take(all);
        this.snapshot.resolve(true);
      }).then((ok) => {
        if (!ok) this.snapshot.resolve(true);
      });
    }
    whenSnapshot(timeoutMs) {
      if (this.snapshot.settled) return this.snapshot.promise;
      const gate = deferred();
      const timer = this.env.setTimeout(() => gate.resolve(false), timeoutMs);
      this.snapshot.promise.then((ok) => {
        this.env.clearTimeout(timer);
        gate.resolve(ok);
      });
      return gate.promise;
    }
    stateGet(path) {
      return this.mirror.get(path);
    }
    stateEntries(prefix) {
      const out = [];
      for (const [path, value] of this.mirror) if (path.startsWith(prefix)) out.push([path, value]);
      return out;
    }
    /**
     * Writes go through the page's string calls (SetPublicSpaceProps / SetProtectedSpaceProps): those are the ones
     * the app queues, merges per key, sends as one batch every 0.2 s for a single rate-limit token, and retries
     * when the bucket is empty. The JSON calls (SpaceStateSet) are sent one by one and are refused outright when
     * the bucket is empty. (Runtime/LocalMultiplayer/State/SpaceStateService.cs.)
     */
    stateSet(path, value) {
      this.queueSet(path, value, false);
    }
    stateSetProtected(path, value) {
      this.queueSet(path, value, true);
    }
    queueSet(path, value, isProtected) {
      if (hasDelimiter(value) || hasDelimiter(path)) {
        this.log("error", `a state value for ${path} holds a bridge delimiter character and was not sent`);
        this.emitError(path, "invalid_value", true);
        return;
      }
      const first = this.pendingPublic === null && this.pendingProtected === null;
      if (isProtected) (this.pendingProtected ?? (this.pendingProtected = {}))[path] = value;
      else (this.pendingPublic ?? (this.pendingPublic = {}))[path] = value;
      if (!first) return;
      Promise.resolve().then(() => {
        const pub = this.pendingPublic;
        const prot = this.pendingProtected;
        this.pendingPublic = null;
        this.pendingProtected = null;
        if (pub) this.attempt("SetPublicSpaceProps", () => this.scene.SetPublicSpaceProps(pub));
        if (prot) this.attempt("SetProtectedSpaceProps", () => this.scene.SetProtectedSpaceProps(prot));
      });
    }
    async stateDelete(path) {
      let delay = 250;
      for (let tries = 0; tries < 8; tries++) {
        try {
          await this.scene.SpaceStateDelete(path);
          return;
        } catch (error) {
          const code = errorCode(error);
          if (code === "not_found") return;
          if (code !== "rate_limited" && code !== "timeout") {
            this.emitError(path, code, true);
            return;
          }
          this.emitError(path, code, false);
          await this.sleep(delay);
          delay = Math.min(delay * 2, 4e3);
        }
      }
      this.emitError(path, "rate_limited", true);
    }
    onState(prefix, handler) {
      return subscribe(this.stateHandlers, { prefix, fn: handler });
    }
    onStateError(prefix, handler) {
      return subscribe(this.errorHandlers, { prefix, fn: handler });
    }
    onStateErrorEvent(detail) {
      if (!detail || typeof detail.key !== "string") return;
      if (detail.key.startsWith(TAG + ".")) this.emitError(detail.key, String(detail.code ?? "internal"), true);
    }
    emitError(path, code, final) {
      for (const handler of this.errorHandlers.slice()) {
        if (path.startsWith(handler.prefix)) this.attempt("state error handler", () => handler.fn(path, code, final));
      }
    }
    // ---- user state ---------------------------------------------------------------------------------------------
    /**
     * Own user state goes through the JSON calls (UserStateSet / UserStateDelete), which answer per write. They
     * are sent one by one from a separate rate bucket, so writes are merged per leaf here and sent at most every
     * 0.2 s. Where the app offers no user state at all (Play mode on your own), the values are kept locally.
     */
    userSet(path, value) {
      if (this.localUser) {
        this.setLocalUser(path, value);
        return;
      }
      this.pendingUser.set(path, value);
      this.scheduleUserFlush();
    }
    scheduleUserFlush() {
      if (this.userTimer) return;
      const wait = Math.max(0, this.userLastFlush + Math.max(this.options.userFlushMs, this.userBackoff) - this.env.now());
      this.userTimer = this.env.setTimeout(() => {
        this.userTimer = 0;
        void this.flushUser();
      }, wait);
    }
    async flushUser() {
      this.userLastFlush = this.env.now();
      const batch = [...this.pendingUser];
      this.pendingUser.clear();
      let limited = false;
      for (const [path, value] of batch) {
        if (this.localUser) {
          this.setLocalUser(path, value);
          continue;
        }
        try {
          if (value === null) await this.scene.UserStateDelete(path);
          else await this.scene.UserStateSet(path, value);
        } catch (error) {
          const code = errorCode(error);
          if (code === "not_found") continue;
          if (code === "app_unavailable") {
            this.log("info", "no user state in this session: keeping the local player's own values locally");
            this.localUser = /* @__PURE__ */ new Map();
            this.setLocalUser(path, value);
          } else if (code === "rate_limited" || code === "timeout") {
            limited = true;
            if (!this.pendingUser.has(path)) this.pendingUser.set(path, value);
            this.emitError(path, code, false);
          } else this.emitError(path, code, true);
        }
      }
      this.userBackoff = limited ? Math.min(Math.max(this.userBackoff * 2, 250), 4e3) : 0;
      if (this.pendingUser.size) this.scheduleUserFlush();
    }
    setLocalUser(path, value) {
      const store = this.localUser;
      if (value === null) store.delete(path);
      else store.set(path, value);
      const sid = this.local().sid;
      Promise.resolve().then(() => this.emitUser(sid, path, value === null ? void 0 : value));
    }
    userGet(sid, path) {
      if (sid === this.local().sid) {
        if (this.localUser) return this.localUser.get(path);
        const own = this.ownUser.get(path);
        if (own !== void 0) return own;
      }
      for (const user of this.roster.values()) {
        if (user && user.id === sid) {
          const value = user.state ? user.state[path] : void 0;
          return typeof value === "string" ? value : void 0;
        }
      }
      return void 0;
    }
    onUser(prefix, handler) {
      return subscribe(this.userHandlers, { prefix, fn: handler });
    }
    emitUser(sid, path, value) {
      for (const handler of this.userHandlers.slice()) {
        if (path.startsWith(handler.prefix)) this.attempt("user state handler", () => handler.fn(sid, path, value));
      }
    }
    // ---- one-shots ----------------------------------------------------------------------------------------------
    oneShot(data) {
      if (utf8Length(data) > this.limits.oneShotMaxBytes) return false;
      this.attempt("OneShot", () => this.scene.OneShot(data));
      return true;
    }
    onOneShot(handler) {
      return subscribe(this.oneShotHandlers, handler);
    }
    // ---- kit ----------------------------------------------------------------------------------------------------
    async loadKit(spec) {
      const BS = this.env.BS;
      const holder = new BS.GameObject(spec.holderName);
      await holder.Async();
      const placement = {};
      if (spec.position) placement.localPosition = toBs3(BS, spec.position);
      if (spec.rotation) placement.localEulerAngles = toBs3(BS, spec.rotation);
      if (spec.scale) placement.localScale = toBs3(BS, spec.scale);
      if (Object.keys(placement).length) await holder.SetTransform(placement);
      await holder.AddComponent(new BS.AssetBundle(spec.windows, "", "", spec.android, "", "", false, false));
      const item = new BS.KitItem("*");
      const loaded = deferred();
      item.On("loaded", () => loaded.resolve(true));
      await holder.AddComponent(item);
      if (item.isLoaded) loaded.resolve(true);
      const timer = this.env.setTimeout(() => loaded.resolve(false), this.options.kitTimeoutMs);
      const ok = await loaded.promise;
      this.env.clearTimeout(timer);
      if (!ok) this.log("error", `kit ${spec.holderName}: the kit item never reported loaded`);
      const scene = this.scene;
      const childrenOf = (parent) => {
        const id = String(parent.unityId);
        return Object.values(scene.objects ?? {}).filter((o) => String(o.parent) === id && !o.destroyed);
      };
      const byPath = (root, path) => {
        let at = root;
        if (path === "") return at;
        for (const name of path.split("/")) {
          at = childrenOf(at).find((o) => o.name === name);
          if (!at) return null;
        }
        return at;
      };
      const found = /* @__PURE__ */ new Map();
      let waiting = spec.objects.slice();
      const deadline = this.env.now() + this.options.kitFindMs;
      for (; ; ) {
        const roots = childrenOf(holder);
        const root = roots.find((o) => o.name === spec.rootName) ?? roots[0];
        if (root) {
          waiting = waiting.filter((object) => {
            const go = byPath(root, object.path);
            if (go) found.set(object.key, go);
            return !go;
          });
        }
        if (!waiting.length || this.env.now() >= deadline) break;
        await this.sleep(200);
      }
      for (const object of waiting) {
        try {
          const go = await holder.AddInlineObject(spec.rootName + "/" + object.path);
          if (go) found.set(object.key, go);
        } catch {
        }
      }
      const objects = /* @__PURE__ */ new Map();
      const missing = [];
      const prepare = async (object) => {
        const go = found.get(object.key);
        if (!go) {
          missing.push(object.key);
          return;
        }
        try {
          if (object.networkId) await go.SetNetworkId(object.networkId);
          let synced = null;
          let seat = null;
          if (object.sync === "transform") {
            synced = await go.AddComponent(
              new BS.SyncedObject({
                syncPosition: true,
                syncRotation: true,
                takeOwnershipOnCollision: false,
                takeOwnershipOnProximity: false,
                takeOwnershipOnGrab: object.grab,
                kinematicIfNotOwned: false
              })
            );
          }
          if (object.seat) seat = await go.AddComponent(new BS.Seat({}));
          objects.set(object.key, new BsHostObject(this, object.key, object.path, go, synced, seat));
        } catch (error) {
          this.log("warn", `kit object ${object.key} (${object.path}): ${describe(error)}`);
          missing.push(object.key);
        }
      };
      await Promise.all(spec.objects.map(prepare));
      return {
        objects,
        missing,
        find: async (path) => {
          const roots = childrenOf(holder);
          const root = roots.find((o) => o.name === spec.rootName) ?? roots[0];
          const known = root ? byPath(root, path) : null;
          if (known) return new BsHostObject(this, "", path, known, null, null);
          try {
            const go = await holder.AddInlineObject(spec.rootName + "/" + path);
            return go ? new BsHostObject(this, "", path, go, null, null) : null;
          } catch {
            return null;
          }
        },
        destroy: () => {
          try {
            holder.Destroy();
          } catch {
          }
        }
      };
    }
    bundles(slug) {
      const table = this.env.win.__pk1_bundles;
      const entry = table ? table[slug] : void 0;
      if (!entry) return null;
      const address = (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : "";
      const out = { windows: address(entry.windows), android: address(entry.android) };
      return out.windows || out.android ? out : null;
    }
    // ---- snippets -----------------------------------------------------------------------------------------------
    snippets(slug) {
      const all = Array.from(this.env.doc.querySelectorAll("bs-snippet"));
      const mine = all.filter((el) => (el.getAttribute("name") || "") === slug);
      return mine.map((el, index) => this.wrap(el, slug, index, mine));
    }
    wrap(el, slug, index, sameName) {
      let wrapper = this.wrappers.get(el);
      if (!wrapper) {
        const made = {
          _index: index,
          _peers: sameName,
          getAttribute: (name) => el.getAttribute(name),
          attributeNames: () => typeof el.getAttributeNames === "function" ? el.getAttributeNames() : [],
          get connected() {
            return el.isConnected !== false;
          },
          get active() {
            const single = el.getAttribute("single");
            if (single === null || single === "false") return true;
            if ("ownsSingleton" in el) return el.ownsSingleton === slug;
            return made._peers.indexOf(el) === 0;
          },
          get index() {
            return made._index;
          }
        };
        wrapper = made;
        this.wrappers.set(el, made);
      }
      wrapper._index = index;
      wrapper._peers = sameName;
      return wrapper;
    }
    onSnippetsChanged(handler) {
      return subscribe(this.snippetHandlers, handler);
    }
    observeSnippets() {
      if (this.observer || !this.env.MutationObserver) return;
      let queued = false;
      const observer = new this.env.MutationObserver(() => {
        if (queued) return;
        queued = true;
        this.env.setTimeout(() => {
          queued = false;
          for (const handler of this.snippetHandlers.slice()) this.attempt("snippet handler", handler);
        }, 0);
      });
      observer.observe(this.env.doc.documentElement, { childList: true, subtree: true });
      this.observer = observer;
    }
    // ---- the local player ---------------------------------------------------------------------------------------
    async isVR() {
      try {
        return await this.scene.IsVR() === true;
      } catch {
        return false;
      }
    }
    async raycast(origin, direction, maxDistance, layerMask) {
      const BS = this.env.BS;
      const reply = await this.scene.Raycast(toBs3(BS, origin), toBs3(BS, direction), maxDistance, layerMask);
      if (typeof reply !== "string") return null;
      const parts = reply.split("\xB6");
      if (parts.length < 8) return null;
      const n = parts.slice(2, 8).map(Number);
      return { objectId: parts[1], point: new Vector3(n[0], n[1], n[2]), normal: new Vector3(n[3], n[4], n[5]) };
    }
    onPose(handler) {
      return subscribe(this.poseHandlers, handler);
    }
    onInput(handler) {
      return subscribe(this.inputHandlers, handler);
    }
    haptic(side, strength, seconds) {
      this.attempt("SendHapticImpulse", () => this.scene.SendHapticImpulse(strength, seconds, side));
    }
    teleport(position, yDegrees, stopMovement) {
      this.attempt("TeleportTo", () => this.scene.TeleportTo(toBs3(this.env.BS, position), yDegrees, stopMovement));
    }
    setAbility(ability, allowed) {
      this.attempt("SetCan" + ability, () => this.scene["SetCan" + ability](allowed));
    }
    setBlock(control, blocked) {
      this.attempt("SetBlock" + control, () => this.scene["SetBlock" + control](blocked));
    }
    // ---- helpers ------------------------------------------------------------------------------------------------
    /** Runs a bridge call whose result nobody waits for; a failure is logged, never thrown into game code. */
    attempt(what, call) {
      try {
        const result = call();
        if (result && typeof result.then === "function") {
          result.then(void 0, (error) => this.log("warn", `${what} failed: ${describe(error)}`));
        }
      } catch (error) {
        this.log("warn", `${what} failed: ${describe(error)}`);
      }
    }
    async attemptAsync(what, call) {
      try {
        await call();
        return true;
      } catch (error) {
        this.log("debug", `${what} failed: ${describe(error)}`);
        return false;
      }
    }
    /** @internal for BsHostObject */
    get api() {
      return this.env.BS;
    }
    /** @internal for BsHostObject */
    userSession(user) {
      return user && typeof user.id === "string" ? user.id : void 0;
    }
  };
  var BsHostObject = class {
    constructor(platform, key, path, go, synced, seat) {
      __publicField(this, "key");
      __publicField(this, "path");
      __publicField(this, "platform");
      __publicField(this, "go");
      __publicField(this, "synced");
      __publicField(this, "seat");
      __publicField(this, "watchers", []);
      __publicField(this, "watching", false);
      __publicField(this, "attached", null);
      this.platform = platform;
      this.key = key;
      this.path = path;
      this.go = go;
      this.synced = synced;
      this.seat = seat;
    }
    on(kind, handler) {
      const name = HOST_EVENTS[kind];
      if (!name) return () => {
      };
      const listener = (event) => {
        const d = event && event.detail ? event.detail : {};
        const detail = {};
        if (d.point) detail.point = from3(d.point);
        if (d.normal) detail.normal = from3(d.normal);
        if (typeof d.side === "number") detail.side = d.side;
        if (typeof d.name === "string") detail.otherName = d.name;
        const sid = this.platform.userSession(d.user);
        if (sid) detail.playerSid = sid;
        handler(detail);
      };
      this.go.On(name, listener);
      return () => this.go.Off(name, listener);
    }
    setTransform(patch) {
      const BS = this.platform.api;
      const out = {};
      if (patch.position) out.position = toBs3(BS, patch.position);
      if (patch.localPosition) out.localPosition = toBs3(BS, patch.localPosition);
      if (patch.localScale) out.localScale = toBs3(BS, patch.localScale);
      if (patch.rotation) out.rotation = new BS.Quaternion(patch.rotation.x, patch.rotation.y, patch.rotation.z, patch.rotation.w);
      if (patch.localRotation) out.localRotation = new BS.Quaternion(patch.localRotation.x, patch.localRotation.y, patch.localRotation.z, patch.localRotation.w);
      this.platform.attempt("SetTransform", () => this.go.SetTransform(out));
    }
    /**
     * Asking to watch a transform makes the host push its current value before it answers
     * (BSScene.WatchJsTransform calls SyncProperties(true)), so one round trip is a fresh read.
     * UNVERIFIED in the app: that the push reaches the page before the answer does.
     */
    async readTransform() {
      const PN = this.platform.api.PN ?? this.platform.api.PropertyName;
      try {
        await this.go.WatchTransform([PN.position, PN.rotation], () => this.report());
        this.watching = true;
      } catch {
        return null;
      }
      return this.current();
    }
    watchTransform(handler) {
      this.watchers.push(handler);
      if (!this.watching) void this.readTransform();
      return () => {
        const at = this.watchers.indexOf(handler);
        if (at >= 0) this.watchers.splice(at, 1);
      };
    }
    current() {
      const t = this.go.transform;
      if (!t || !t.position) return null;
      const r = t.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
      return { position: from3(t.position), rotation: new Quaternion(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0, r.w === void 0 ? 1 : Number(r.w)) };
    }
    report() {
      const now = this.current();
      if (now) for (const watcher of this.watchers.slice()) watcher(now);
    }
    setActive(active) {
      this.platform.attempt("SetActive", () => this.go.SetActive(active));
    }
    setLayer(layer) {
      this.platform.attempt("SetLayer", () => this.go.SetLayer(layer));
    }
    takeOwnership() {
      if (this.synced) this.platform.attempt("TakeOwnership", () => this.synced.TakeOwnership());
    }
    async doIOwn() {
      if (!this.synced) return false;
      try {
        return await this.synced.DoIOwn() === true;
      } catch {
        return false;
      }
    }
    /** UNVERIFIED: that a kit object's own BSAudioSource is known to the page once the object is. */
    playClip(index) {
      const BS = this.platform.api;
      const source = this.go.GetComponent ? this.go.GetComponent((BS.CT ?? BS.ComponentType).AudioSource) : null;
      if (source) this.platform.attempt("PlayOneShot", () => source.PlayOneShot(index));
      else this.platform.log("warn", `no audio source known on ${this.path}`);
    }
    sit() {
      if (this.seat) this.platform.attempt("Sit", () => this.seat.Sit());
    }
    stand() {
      if (this.seat) this.platform.attempt("Stand", () => this.seat.Stand());
    }
    /** UNVERIFIED in Play mode: BS.AttachedObject added to a kit object, attachment point set, then Attach(local user id). */
    attachToHand(side, position, rotation) {
      const BS = this.platform.api;
      const uid = this.platform.local().uid;
      void (async () => {
        try {
          if (!this.attached) {
            this.attached = await this.go.AddComponent(
              new BS.AttachedObject({
                uid,
                attachmentPosition: new BS.Vector3(position.x, position.y, position.z),
                attachmentRotation: new BS.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
                attachmentType: 1,
                // NonPhysics
                attachmentPoint: side === 0 ? 1 : 2,
                // LeftHand, RightHand
                autoSync: false,
                jointAvatar: false
              })
            );
          } else {
            this.attached.attachmentPoint = side === 0 ? 1 : 2;
            this.attached.attachmentPosition = new BS.Vector3(position.x, position.y, position.z);
            this.attached.attachmentRotation = new BS.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
          }
          await this.attached.Attach(uid);
        } catch (error) {
          this.platform.log("warn", `AttachedObject on ${this.path}: ${String(error)}`);
        }
      })();
    }
    detach() {
      if (!this.attached) return;
      const uid = this.platform.local().uid;
      this.platform.attempt("Detach", () => this.attached.Detach(uid));
    }
    releaseGrab() {
      this.platform.attempt("ReleaseGrab", () => this.go.ReleaseGrab());
    }
  };
  function subscribe(list, item) {
    list.push(item);
    return () => {
      const at = list.indexOf(item);
      if (at >= 0) list.splice(at, 1);
    };
  }
  function toBs3(BS, v) {
    return new BS.Vector3(v.x, v.y, v.z);
  }
  function from3(v) {
    return new Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0);
  }
  function pose(source) {
    const p = source?.position ?? {};
    const r = source?.rotation ?? {};
    return { position: from3(p), rotation: new Quaternion(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0, r.w === void 0 ? 1 : Number(r.w)) };
  }
  function clampInt(value, max) {
    const n = Math.trunc(Number(value) || 0);
    return n < 0 ? 0 : n > max ? max : n;
  }
  function errorCode(error) {
    if (error && typeof error === "object" && typeof error.code === "string") return error.code;
    return "internal";
  }
  function describe(error) {
    if (error instanceof Error) return error.message;
    return typeof error === "string" ? error : JSON.stringify(error);
  }

  // pk-coop-kitchen.entry.ts
  var env = pageEnv();
  var claimed = env.win.__pk1 && env.win.__pk1.games && Object.prototype.hasOwnProperty.call(env.win.__pk1.games, src_default.slug);
  if (!claimed) boot(new BsPlatform(env), src_default, bindings_default);
})();
