# System Overview

`m7-js-lib` is a singleton-oriented ES module runtime that composes utility namespaces onto one shared `lib` object.

## Lifecycle Flow

1. Module import creates `lib` and internal lifecycle state.
2. `init()` installs `_boot` and computes `lib._env`.
3. Primitive utility namespaces attach (`bool`, `array`, `hash`, `number`, `str`, `func`).
4. Cross-cutting helpers attach (`utils`).
5. DOM and service layers attach (`dom`, `service`, `require`, `args`).
6. Transport helper attaches (`_http`).
7. `_initialized` and internal state are updated to reflect success.

If bootstrap throws, partial enumerable keys are removed and initialization state is reset.

## Side-Effect Boundaries

* `src/index.js` is side-effect free at import time.
* `src/auto.js` intentionally performs import-time initialization.

## Concurrency Guarding

`init()` uses an in-progress guard and explicit error paths to prevent ambiguous or unsafe re-entrant initialization behavior.

## Architectural Intent

* deterministic singleton lifecycle
* normalization-first helper contracts
* extension-friendly base for higher-level m7 libraries
* practical performance with readable implementation
