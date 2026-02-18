# Requirements

## Runtime baseline

* ES6+ JavaScript runtime with ES module support.
* `globalThis`/`window`/`global` root availability for bootstrap root detection.

## Environment notes

* `lib.dom` and DOM helper modules require browser DOM APIs.
* Non-DOM helpers are usable in non-browser contexts where equivalent primitives exist.

## Lifecycle requirements

* `src/index.js` requires an explicit `init()` call before using attached modules.
* `src/auto.js` initializes automatically at import time.

## Contract requirements

* Treat the library as a singleton by intent.
* Do not implement multi-instance wrappers around `lib` if contract compatibility is required.
