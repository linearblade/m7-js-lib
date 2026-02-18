# About m7-js-lib

[README](../README.md) -> [Usage TOC](./usage/TOC.md) -> [Architecture Index](./architecture/INDEX.md) -> [API Index](./api/INDEX.md)

`m7-js-lib` is a normalization-first singleton utility runtime for frontend JavaScript.

It is intended to be the shared core for m7 browser libraries and to reduce repetitive defensive code patterns in application logic.

## Core Model

m7-js-lib follows a pragmatic model:

1. initialize one singleton core
2. attach focused utility namespaces
3. normalize/coerce broad input shapes into predictable outputs
4. allow higher-level libraries to compose on top of stable helper contracts

This design keeps call sites linear and integration surfaces durable.

## How It Works

### 1) Explicit bootstrap and singleton lifecycle

`src/index.js` exports `init()` and does not initialize on import.

`src/auto.js` imports `index.js` and immediately calls `init()` for convenience.

### 2) Coercion-first helper namespaces

Core modules (`bool`, `array`, `hash`, `number`, `str`, `func`, `utils`, `args`, `dom`, `require`, `service`) prioritize broad input acceptance and predictable output contracts.

### 3) Root-aware runtime behavior

Bootstrap installs `lib._env` and resolves root/environment behavior (`globalThis`, `window`, or `global`) where needed.

### 4) Modular composition order

Utility modules are installed in dependency order. Higher-level layers (`dom`, `service`, `require`, transport helpers) build on primitive layers.

## Design Priorities

* Singleton by intent.
* Readability and maintainability over optimization theater.
* Practical frontend performance.
* Predictable behavior under malformed/partial input.
* Ease of extension for other m7 modules.

## Compatibility

m7-js-lib follows an ES6+ module posture and targets modern JavaScript runtimes.

Compatibility notes:

* Requires ES module support.
* DOM helpers require browser DOM APIs.
* Core non-DOM helpers can run in non-browser runtimes where applicable.
* No third-party runtime dependency is required by default.

---

## See Also

* [Introduction](./usage/INTRODUCTION.md)
* [Quick Start](./usage/QUICKSTART.md)
* [Entrypoint Contract](./entrypoints-contract.md)
* [Philosophy](./philosophy.md)
* [What Makes m7-js-lib Different](./WHAT_MAKES_US_DIFFERENT.md)
* [README](../README.md)
