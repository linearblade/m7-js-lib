# m7-js-lib Entrypoint Contract (`index.js` and `auto.js`)

## Scope
This document is the normative contract for the two public entrypoints:

- `src/index.js`
- `src/auto.js`

If behavior in this document and code diverge, treat code as source of truth and update this document immediately.

## Library Purpose
`m7-js-lib` is a normalization-first utility runtime. It provides stable, defensive primitives that convert uncertain input into predictable shapes so downstream code can stay linear and resilient.

Core design intent:

- Prefer canonical coercion over repetitive defensive branching.
- Keep helper behavior predictable under malformed or partial input.
- Reserve strict failure for explicit opt-in boundaries.

## Singleton Intent (Non-Negotiable)
This library is a singleton by design and by intent.

- There is exactly one `lib` object per loaded module instance.
- The project does not provide or support a multi-instance factory.
- Reinitialization rebuilds the same singleton object; it does not create a second instance.

Non-singleton usage is out of scope for this package.

## Entrypoint: `src/index.js` (Side-Effect Free)
`index.js` is the explicit, side-effect-free entrypoint.

### Exports

- `default`: `lib` (singleton object reference)
- named: `lib`
- named: `init`

### Side-Effect Contract

- Importing `src/index.js` must not initialize the runtime.
- Initialization occurs only when `init()` is called.

### `init(opts)` Contract

Signature:

```js
init(opts = {})
```

Accepted options:

- `opts.force` (`boolean`): force rebuild of the singleton lifecycle.

Behavior:

1. If already initialized and `force !== true`, return `lib` immediately.
2. If initialization is in progress and `force !== true`, throw:
   - `"[lib.init] Initialization already in progress"`
3. If `force === true` while initialization is in progress, throw:
   - `"[lib.init] Cannot force re-init while initialization is in progress"`
4. If `force === true` and already initialized:
   - Clear existing enumerable keys on `lib`.
   - Reset internal initialized state.
5. Build runtime modules onto the existing `lib` reference.
6. On success:
   - Set internal initialized state to true.
   - Set non-enumerable `lib._initialized = true`.
   - Return `lib`.
7. On failure:
   - Clear partially built enumerable keys from `lib`.
   - Set `lib._initialized = false`.
   - Reset initialized state.
   - Rethrow original error.
8. Always clear the internal "initializing" guard in `finally`.

### `_initialized` Metadata

- `lib._initialized` exists and is non-enumerable.
- `false` before successful bootstrap.
- `true` after successful bootstrap.
- Resets to `false` if bootstrap fails or forced rebuild begins.

## Entrypoint: `src/auto.js` (Auto-Bootstrap)
`auto.js` is the convenience entrypoint with import-time initialization.

### Exports

- `default`: `lib`
- named: `lib`
- named: `init`

### Side-Effect Contract

- Importing `src/auto.js` immediately calls `init()`.
- This entrypoint is intentionally side-effectful.

## Consumer Guidance
Choose one entrypoint strategy per integration boundary.

- Use `src/index.js` when you need explicit lifecycle control.
- Use `src/auto.js` when you want import-time readiness.

Recommended examples:

```js
// Explicit lifecycle (recommended for shared libraries)
import lib, { init } from "./src/index.js";
init();
```

```js
// Auto-bootstrap (recommended for app entrypoints)
import lib from "./src/auto.js";
```

## Invariants and Limits

### Guaranteed

- Stable singleton object identity for a given loaded module instance.
- Idempotent `init()` when not forcing rebuild.
- Deterministic error behavior for re-entrant init.

### Not Guaranteed

- Cross-bundle singleton unification if package duplication occurs in build output.
- Compatibility with non-singleton instantiation patterns.

## Documentation Policy
Future user docs, architecture docs, and prose summaries must align with this contract.

Required language in downstream docs:

- "Singleton by intent"
- "`index.js` is side-effect free"
- "`auto.js` auto-initializes on import"

