# Subsystems

This map describes the primary subsystems installed onto `lib`.

## Bootstrap

* `_boot`: root/environment detection and `lib._env` installation.

## Primitive utilities

* `bool`: explicit intent boolean helpers.
* `array`: coercion and array shaping helpers.
* `hash`: object/path access and structural transforms.
* `number`: bounded numeric coercion helpers.
* `str`: string coercion and light text helpers.
* `func`: function lookup/wrapper/composition helpers.

## Cross-cutting utilities

* `utils`: shared classification/coercion aliases and helpers.

## DOM layer

* `dom`: element resolution, get/set helpers, filtering, and submodules (`create`, `append`).

## Call-shape helpers

* `args`: arguments-object and positional parsing helpers (legacy-adjacent support).

## Service and dependency helpers

* `service`: in-memory service registry with optional `start`/`stop` dispatch.
* `require`: dot-path dependency gate checks on `lib` or service roots.

## Transport

* `_http`: low-level XHR transport helper used for bootstrap-era internal needs.

## Notes

Function-level behavioral guarantees live in source JSDoc.
