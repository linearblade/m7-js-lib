# m7-js-lib API Contract

**(m7-js-lib)**

> **You may paste this file directly into another project so that an LLM can correctly reason about and use the software.**
> This document defines the **public API contract only**.
> It intentionally omits implementation details and source code.
>
> Anything not explicitly specified here must be treated as **undefined behavior**.

---

## Scope

This contract defines the **public, stable interface** for `m7-js-lib`, including:

* singleton runtime identity and lifecycle
* `index.js` and `auto.js` entrypoint behavior
* initialization and re-initialization guarantees
* post-init namespace availability and exported function names
* environment and error guarantees
* extension posture boundaries

This contract does **not** define:

* internal boot order details beyond public guarantees
* private helpers or non-exported symbols
* implementation strategies
* undocumented side effects

---

## Core Concepts

### Singleton Runtime

`m7-js-lib` is a singleton by intent.

* one `lib` object exists per loaded module instance
* re-initialization mutates/rebuilds the same object reference
* no multi-instance factory API is provided

---

### Side-Effect Boundary

Two entrypoint modes are defined:

* `src/index.js`: side-effect free import; explicit `init()` required
* `src/auto.js`: import-time `init()` convenience

---

### Normalization-First Helpers

The library is utility-oriented and normalization-first.

* APIs are generally permissive and coercion-oriented
* strict rejection is used only on explicit guard boundaries

---

## Fundamental Guarantees

m7-js-lib guarantees:

1. **Stable singleton identity**
   `init()` never returns a new singleton object identity.

2. **Explicit lifecycle control in `index.js`**
   Importing `index.js` alone does not initialize modules.

3. **Deterministic init guarding**
   Re-entrant initialization is guarded and throws explicit errors.

4. **Failure-safe rebuild semantics**
   Partial init state is cleared on bootstrap failure.

5. **Contracted convenience mode**
   `auto.js` always attempts `init()` at import time.

---

## Module Exports and Integration

### `src/index.js`

Exports:

* `default` -> `lib`
* named -> `lib`
* named -> `init`

Importing `src/index.js` has no runtime initialization side effect.

### `src/auto.js`

Exports:

* `default` -> `lib`
* named -> `lib`
* named -> `init`

Behavior:

* executes `init()` at module import time
* if initialization throws, import fails with the same error

---

## Public Lifecycle API

### `init(opts?) -> lib`

```js
import { lib, init } from "./src/index.js";

init();
```

Accepted input:

* `opts` object form: `{ force?: boolean }`
* non-object `opts` are normalized to `{ force: !!opts }`

Behavior:

1. If already initialized and `force !== true`, returns `lib`.
2. If initialization is in progress and `force !== true`, throws:
   * `"[lib.init] Initialization already in progress"`
3. If `force === true` while initialization is in progress, throws:
   * `"[lib.init] Cannot force re-init while initialization is in progress"`
4. If `force === true` and initialized:
   * clears enumerable keys on `lib`
   * resets init state, then rebuilds
5. On successful bootstrap:
   * sets internal initialized state true
   * sets `lib._initialized = true`
   * returns `lib`
6. On bootstrap failure:
   * clears partially-attached enumerable keys
   * sets `lib._initialized = false`
   * resets initialized state and rethrows original error
7. Internal initializing guard is always cleared in `finally`.

---

## Public Metadata Contract

### `lib._initialized -> boolean`

* exists as a non-enumerable property on exported `lib`
* `false` before successful init
* `true` after successful init
* reset to `false` during failed/forced rebuild paths

No other internal metadata fields are guaranteed stable.

---

## Public Namespace Surface (Post-init)

After successful `init()`, the following namespaces are available:

* `lib._boot`
* `lib._http`
* `lib.args`
* `lib.array`
* `lib.bool`
* `lib.dom`
* `lib.func`
* `lib.hash`
* `lib.number`
* `lib.require`
* `lib.service`
* `lib.str`
* `lib.utils`

### Function-name contract by namespace

`lib._boot`

* `install`
* `resolveRoot`

`lib._http`

* `get`
* `post`
* `request`

`lib.args`

* `parse`
* `slice`
* `isArguments`

`lib.array`

* `append`
* `subtract`
* `trim`
* `is`
* `to`
* `len`
* `filterStrings`

`lib.bool`

* `intentTrue`
* `intentFalse`
* `is`
* `isIntent`
* `to`
* `byIntent`
* `hasIntent` (alias)
* `ish` (alias)
* `yes` (alias)
* `no` (alias)

`lib.func`

* `name`
* `wrapper`
* `postWrap`
* `preWrap`
* `get`

`lib.hash`

* `get`
* `set`
* `legacySet`
* `expand`
* `to`
* `is`
* `hasKeys`
* `append`
* `merge`
* `mergeMany`
* `flatten`
* `inflate`
* `exists`
* `strip`
* `filter`
* `getUntilNotEmpty`
* `deepCopy`
* `keys`
* `empty`
* `slice`

`lib.number`

* `clamp`
* `toInt`

`lib.require`

* `all`
* `lib` (alias)
* `service`

`lib.service`

* `set`
* `get`
* `start`
* `stop`
* `list`

Additionally exposes:

* `services` (registry object)

`lib.str`

* `is`
* `lc`
* `to`
* `stripComments`
* `countChars`

`lib.utils`

* `isArray`
* `toArray`
* `isHash`
* `toHash`
* `deepCopy`
* `isScalar`
* `toString`
* `baseType`
* `isEmpty`
* `linkType`
* `clamp`
* `toNumber`
* `getFunction`
* `stripComments`
* `lc`

`lib.dom`

* `get`
* `set`
* `is`
* `isDom`
* `getElement`
* `byId`
* `removeElement`
* `qs`
* `insertAfter`
* `filterAttributes`
* `attempt`
* `create` (namespace)
* `append` (namespace)

`lib.dom.create`

* `css`
* `link` (alias)
* `js`
* `element`

`lib.dom.append`

* `before`
* `after`
* `prepend`
* `append`
* `beforeBegin`
* `afterBegin`
* `beforeEnd`
* `afterEnd`
* `adjacent`
* `replace`
* `remove`
* `empty`
* `resolveTarget`

---

## Function Usage Contract (How To Use)

This section defines practical usage semantics for the public functions.
It is intended to be sufficient for correct consumer usage without source access.

Function index links in this file are convenience mirrors only:
[./functions/INDEX.md](./functions/INDEX.md).

### 1) Initialization and import usage

Explicit lifecycle mode:

```js
import { lib, init } from "./src/index.js";
init();
```

Alias import is valid:

```js
import { lib, init as initLib } from "./src/index.js";
initLib();
```

Auto mode:

```js
import lib from "./src/auto.js"; // init() already executed
```

Rule:

* when using `src/index.js`, call `init()` before consuming attached namespaces

### 2) Alias semantics

Alias exports are behaviorally equivalent to their canonical targets.

Examples:

* `lib.require.lib === lib.require.all`
* `lib.bool.yes === lib.bool.intentTrue`
* `lib.dom.create.link === lib.dom.create.css`
* `lib.utils.isArray` delegates to `lib.array.is`

### 2a) Path syntax and resolution rules

Unless a function explicitly documents otherwise, path strings follow this contract:

* dot-delimited segments: `"a.b.c"`
* no bracket notation: `"a[0].b"` is not contract-guaranteed
* no escaped-dot key syntax is defined
* segments are treated as key tokens

Numeric segment note:

* numeric segments are treated as string keys by default
* numeric-index behavior is opt-in only where documented (for example `lib.hash.set(..., { arrayIndex: true })`)

Multi-target string note:

* APIs that accept target/name lists as a single string (for example `lib.require.all`, `lib.require.service`) split entries on whitespace
* array input bypasses whitespace splitting and is used as provided

### 3) `lib.hash` (object/path operations)

Primary usage:

```js
const obj = {};
lib.hash.set(obj, "a.b.c", 1);
const v = lib.hash.get(obj, "a.b.c", null); // 1
const ok = lib.hash.exists(obj, "a.b.c");   // true
```

Key function semantics:

* `get(rec, path, def)`:
  * safe deep lookup
  * returns `def` when missing/unreadable
* `set(rec, path, value, opts)`:
  * creates missing containers as needed
  * with `opts.arrayIndex === true`, numeric segments may create/use arrays
* `legacySet(rec, path, value)`:
  * legacy DOM-safe setter variant
  * returns `1` on success, `0` on failure
* `to(value, hotkey?)`:
  * always returns a plain object
  * wraps non-object values under `hotkey` when provided
* `merge(left, right)` / `mergeMany(list)`:
  * deep merge helpers (non-destructive result)
* `flatten(rec)` / `inflate(rec)`:
  * convert between nested and dotted-key representations
* `slice(rec, list, opts)`:
  * selects paths into a new object
  * defaults to all keys only when `list` is omitted/falsy
  * whitespace-only list is treated as an explicit empty list
  * `opts.set` supports flags:
    * truthy -> force include keys even if missing
    * `"l"` -> skip empty-string/null values (when not force set)
    * `"d"` -> skip null values (when not force set)

### 4) `lib.array` (list normalization)

Primary usage:

```js
const list = lib.array.to("a b c", { split: /\s+/, trim: true }); // ["a","b","c"]
```

Key function semantics:

* `to(value, opts)`:
  * total coercion helper returning an array
  * falsy input yields `[]`
  * `opts.split` splits string input
  * `opts.trim` trims strings and removes empties
* `trim(value)`:
  * returns new array with trimmed string members and no empty strings
* `subtract(list, exclude)`:
  * removes all excluded values
* `append(input, pre, post)`:
  * wraps each item with prefix/postfix
  * returns `undefined` for unsupported input types
* `len(value)`:
  * array length or `0`
* `filterStrings(value, opts)`:
  * returns sanitized non-empty string array

### 5) `lib.bool` (explicit intent booleans)

Primary usage:

```js
lib.bool.yes("true");   // true
lib.bool.no("false");   // true
lib.bool.isIntent("0"); // true
```

Key function semantics:

* `intentTrue` / `yes`: accepts explicit affirmative literals only
* `intentFalse` / `no`: accepts explicit negative literals only
* `isIntent` / `hasIntent` / `ish`: intent-aware validation
* `to`: strict boolean conversion (`true` stays true, everything else false)
* `byIntent`: true only for explicit affirmative intent

### 6) `lib.number` (numeric coercion)

Primary usage:

```js
lib.number.clamp("12", 0, 10, 0); // 10
lib.number.toInt("42.9", 0);      // 42
```

Key function semantics:

* `clamp(n, min, max, def)`:
  * finite numeric coercion + bounds clamp
  * invalid input returns fallback
* `toInt(val, def)`:
  * strict integer conversion policy
  * rejects malformed numeric strings

### 7) `lib.str` (string normalization)

Primary usage:

```js
lib.str.to(12);                          // "12"
lib.str.lc("HELLO");                     // "hello"
lib.str.countChars("banana", ["a","n"]); // 5
```

Key function semantics:

* `is(value)`: string primitive check
* `to(value, opts)`:
  * scalar-to-string coercion helper
  * returns `undefined` for unsupported values unless forced
* `lc(value, force)`: lowercase helper
* `stripComments(text, opts)`: removes JS-style comments by mode
* `countChars(str, chars)`: counts target characters

### 8) `lib.func` (function lookup and composition)

Primary usage:

```js
const fn = lib.func.get("myNamespace.doThing");
const wrapped = lib.func.wrapper(fn, "tail");
```

Key function semantics:

* `get(f, opts)`:
  * resolves callable from function ref or root-relative string path
  * root resolution order: `opts.root`, then `lib._env.root`
  * if no root is resolved, returns `undefined` (or dummy fallback), even when `f` is already a function
  * for string paths, lookup is root-relative dot-path resolution
  * `opts.bind === true` attempts to bind resolved function to its parent object
  * `opts.dummy` enables no-op fallback when unresolved
* `wrapper(fun, ...tailArgs)`:
  * resolves target using `lib.utils.getFunction`
  * returns `undefined` if unresolved
  * otherwise returns function that appends tail arguments at call time
* `postWrap(funs, ...tailArgs)`:
  * resolves and runs each function in sequence with runtime+tail args
  * returns `undefined` immediately if any function in chain cannot be resolved
  * returns last result
* `preWrap(funs, ...headArgs)`:
  * same as `postWrap` but prepends head args
  * returns `undefined` immediately if any function in chain cannot be resolved
* `name()`:
  * best-effort caller-line extraction from stack

### 9) `lib.require` and `lib.service` (dependency gates/registry)

Primary usage:

```js
lib.service.set("bus", eventBus);
lib.require.service("bus"); // [eventBus]
lib.require.all("hash.get array.to");
```

`lib.require` semantics:

* `all(targets, opts)`:
  * validates dot-path targets on `lib`
  * `targets` may be:
    * whitespace-delimited string of paths (for example `"hash.get array.to"`)
    * array of explicit path strings
  * default return is array of resolved values
  * `opts.returnMap` returns `{ path: value }`
  * `opts.allowFalsy` (default true) allows `false`, `0`, and `""` but still rejects `null`/`undefined`
  * `opts.die` (default true) controls throw vs partial result
* `lib(...)`: alias of `all(...)`
* `service(names, opts)`:
  * validates services registered in `lib.service.services`
  * `names` follows same string/array normalization rules as `all`
  * same `returnMap`/`die` behavior as `all`

`lib.service` semantics:

* `set(name, svc)` / `get(name)` / `list()`
* `start(name, ...args)`:
  * calls `svc.start(...args)` when available, else returns service value
* `stop(name, ...args)`:
  * calls `svc.stop(...args)` when available, else returns service value

### 10) `lib.dom`, `lib.dom.create`, `lib.dom.append` (DOM helpers)

Primary usage:

```js
const node = lib.dom.attempt("#app");
lib.dom.set(node, "text", "Hello");
const btn = lib.dom.create.element("button", { class: "btn" }, "Save");
lib.dom.append.append(btn, node);
```

`lib.dom` semantics:

* `attempt(input, barf=false)`:
  * best-effort coercion to DOM element from element/id/event/query
  * throws when unresolved and `barf === true`
* `set(e, attr, val)`:
  * normalizes `attr` to string
  * returns `undefined` when target is not a DOM element or normalized attr is empty
  * class operation attrs (case-insensitive): `setClass`, `addClass`, `removeClass`, `toggleClass`
  * dataset paths supported:
    * `"dataset"` alone is not writable by contract
    * `"dataset.some.path"` writes into `e.dataset` path and returns written value
  * direct property write attrs (case-insensitive): `tagName`, `value`, `name`, `text`, `innerText`, `textContent`, `innerHTML`, `type`, `href`, `src`, `disabled`, `selected`, `checked`
  * dotted non-dataset attrs delegate to legacy dotted setter behavior
  * non-dotted attrs write via `setAttribute`
  * return shape:
    * class ops: implementation return from class API (`toggleClass` typically boolean; others typically undefined)
    * direct property write: assigned value
    * other write paths: post-write `get(e, attr)` result
* `get(e, attr)`:
  * returns `undefined` when target is not a DOM element
  * returns the element itself when `attr` is missing/falsy
  * dataset reads:
    * `"dataset"` -> `e.dataset`
    * `"dataset.some.path"` -> deep dataset value
  * style reads:
    * `"style"` -> `e.style`
    * `"style.display"` -> `e.style.display`
    * other `style.*` paths -> `undefined`
  * direct property reads (case-insensitive): `tagName`, `value`, `name`, `text`, `textContent`, `innerHTML`, `type`
  * all other attrs read via `getAttribute`
* `is` / `isDom`: element detection
* `getElement` / `byId` / `removeElement` / `insertAfter`: direct element utilities
* `qs()`: query-string to object parsing
* `filterAttributes(e, regex, opts)`: attribute extraction/filtering helper

`lib.dom.create` semantics:

* `element(tag, attrs, content)` generic creator
* `js(url, attrs)` script element helper
* `css(url, attrs)` stylesheet link helper
* `link(...)` alias of `css(...)`

`lib.dom.append` semantics:

* insertion helpers: `before`, `after`, `prepend`, `append`
* position helpers: `beforeBegin`, `afterBegin`, `beforeEnd`, `afterEnd`, `adjacent`
* mutation helpers: `replace`, `remove`, `empty`
* `resolveTarget`: coercion helper for append targets
* return shapes:
  * `before`, `after`, `prepend`, `append`, `adjacent`, `replace` -> inserted element or `null`
  * `beforeBegin`, `afterBegin`, `beforeEnd`, `afterEnd` -> inserted element or `null`
  * `remove` -> removed target element or `null`
  * `empty` -> target element (after child removal) or `null`
  * `resolveTarget` -> resolved element or `null`

### 11) `lib._http` (low-level XHR helpers)

Primary usage:

```js
lib._http.get("/ping", {
  load: (req) => console.log(req.status),
  error: (req) => console.error(req.status)
});
```

Key function semantics:

* `get(url, opts)`:
  * async XHR request (default method `GET`)
  * dispatches to `opts.load` or `opts.error` on completion
* `request(url, opts)`:
  * extended form supporting headers/urlencoded/json parse mode
  * when `opts.json === 1`, parsed response is exposed as `req.jsonData`
* `post(url, opts)`:
  * convenience wrapper setting method `POST`

### 12) `lib._boot` and `lib.args`

`lib._boot` usage:

* `resolveRoot(explicit)`:
  * root resolution order: explicit -> `globalThis` -> `window` -> `global`
* `install(opts)`:
  * writes normalized environment metadata to `lib._env`
  * returns the installed `lib._env` object

`lib.args` usage:

```js
function f() {
  return lib.args.parse(arguments, { enabled: true }, {
    parms: "name count",
    req: "name",
    pop: 1
  });
}
```

* `parse(args, def, opts)`:
  * maps positional args to named keys
  * optional trailing-object pop/merge behavior
  * returns `undefined` when required keys are missing
* `slice(args, start, end)`:
  * converts/slices arguments-like input into real array
* `isArguments(item)`:
  * robust arguments-object check

### 13) `lib.utils` (cross-module compatibility surface)

`lib.utils` provides two categories:

1. direct helpers (`isScalar`, `baseType`, `isEmpty`, `linkType`, `clamp`, `toNumber`)
2. alias passthroughs to other namespaces (`isArray`, `toArray`, `toHash`, `toString`, etc.)

Use `lib.utils` when you want a stable cross-module façade without importing individual helper namespaces directly.

---

## Environment Requirements

Minimum runtime assumptions:

* ES module-capable JavaScript runtime
* root resolution capability via one of: `globalThis`, `window`, `global`

Additional requirements by namespace:

* DOM operations (`lib.dom`, `lib.dom.create`, `lib.dom.append`) require browser-like DOM APIs (`document`, `Element`, etc.)
* `lib._http` requires `XMLHttpRequest` on resolved runtime root

---

## Error and Throw Behavior

Public calls may throw in these cases:

* `init()` lifecycle guard violations and bootstrap failures
* `lib.require.all` / `lib.require.service` when required targets are missing and `die` behavior is enabled (default)
* `lib._http.get` / `lib._http.request` when `XMLHttpRequest` is unavailable
* DOM-API-dependent calls when required DOM globals are absent in the runtime

Most scalar/hash/array/boolean/string utility functions are designed to avoid throwing and instead normalize or return fallback values.

---

## Explicit Non-Guarantees

m7-js-lib does **not** guarantee:

* non-singleton instantiation support
* cross-bundle singleton unification when duplicate package copies are loaded
* stable internal/private implementation details
* behavior for undocumented options or unlisted internal helpers

---

## Forward Compatibility

Future versions may:

* add namespaces and functions
* add optional parameters to existing functions
* expand helper behavior where existing guarantees are preserved

Existing contract semantics defined above will not be weakened.

---

## Contract Navigation

* Entrypoint contract -> [../entrypoints-contract.md](../entrypoints-contract.md)
* API index -> [./INDEX.md](./INDEX.md)
* Modules index -> [./modules/INDEX.md](./modules/INDEX.md)
* Function index -> [./functions/INDEX.md](./functions/INDEX.md)

---

## Philosophy

> **Normalize early. Keep call sites linear. Preserve readability.**
