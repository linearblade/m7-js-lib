# Module Surfaces

This document summarizes top-level namespaces attached to the `lib` singleton after `init()`.

## Entrypoint exports

From `src/index.js`:

* default export: `lib`
* named export: `lib`
* named export: `init`

From `src/auto.js`:

* default export: `lib`
* named export: `lib`
* named export: `init`

## Singleton fields and namespaces

After successful `init()`, `lib` includes:

* `_initialized` (non-enumerable lifecycle flag)
* `_boot` (environment bootstrap helpers)
* `_http` (low-level transport helpers)
* `bool`
* `array`
* `hash`
* `number`
* `str`
* `func`
* `utils`
* `dom`
* `args`
* `service`
* `require`

## Surface posture

* Module-level contracts are intentionally permissive and normalization-first.
* Detailed per-function contracts live in source JSDoc and are treated as canonical.
* `lib` identity is stable per loaded module instance.
