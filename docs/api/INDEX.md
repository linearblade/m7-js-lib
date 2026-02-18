# API Index - m7-js-lib

[README](../../README.md) -> [API Index](./INDEX.md) -> [Modules Index](./modules/INDEX.md) -> [Function Index](./functions/INDEX.md)

This API reference is organized as a 3-level split:

1. Top-level API index (`docs/api/INDEX.md`)
2. Module references (`docs/api/modules/*`)
3. Individual function references (`docs/api/functions/<module>/<function>.md`)

## Primary Entry Points

* `src/index.js` -> explicit side-effect-free singleton entry
* `src/auto.js` -> convenience auto-init entry
* Singleton contract -> [../entrypoints-contract.md](../entrypoints-contract.md)
* LLM API contract -> [./M7_JS_LIB_API_CONTRACT.md](./M7_JS_LIB_API_CONTRACT.md)

## Module References

* [lib._boot](./modules/BOOT.md) - Environment bootstrap helpers for root resolution and `lib._env` installation.
* [lib._http](./modules/HTTP.md) - Low-level XHR transport helpers used by bootstrap/runtime internals.
* [lib.args](./modules/ARGS.md) - Arguments-object slicing and positional argument parsing utilities.
* [lib.array](./modules/ARRAY.md) - Array coercion and manipulation helpers for list normalization workflows.
* [lib.bool](./modules/BOOL.md) - Explicit boolean intent detection and conversion helpers.
* [lib.func](./modules/FUNC.md) - Function lookup, wrapping, and composition helpers.
* [lib.hash](./modules/HASH.md) - Plain-object utilities for deep path access, transforms, and filtering.
* [lib.number](./modules/NUMBER.md) - Numeric coercion and bounded conversion helpers.
* [lib.require](./modules/REQUIRE.md) - Dependency-gate helpers for required library paths and services.
* [lib.service](./modules/SERVICE.md) - In-memory service registry with conventional start/stop dispatch.
* [lib.str](./modules/STR.md) - String coercion and lightweight text utility helpers.
* [lib.utils](./modules/UTILS.md) - Cross-module normalization aliases plus shared classification helpers.
* [lib.dom](./modules/DOM.md) - DOM element resolution, attribute/property access, and helper entrypoints.
* [lib.dom.create](./modules/DOM_CREATE.md) - DOM element factory helpers for scripts, styles, and generic nodes.
* [lib.dom.append](./modules/DOM_APPEND.md) - DOM insertion and replacement helpers with position-based placement.

## Navigation

* Modules index -> [./modules/INDEX.md](./modules/INDEX.md)
* Function index -> [./functions/INDEX.md](./functions/INDEX.md)
* LLM API contract -> [./M7_JS_LIB_API_CONTRACT.md](./M7_JS_LIB_API_CONTRACT.md)
* Usage TOC -> [../usage/TOC.md](../usage/TOC.md)
* Architecture Index -> [../architecture/INDEX.md](../architecture/INDEX.md)
* Philosophy -> [../PHILOSOPHY.md](../PHILOSOPHY.md)

## Canonical Source

Per-function behavior contracts are source-of-truth in JSDoc blocks inside `src/lib/*` and `src/lib/dom/*`.
