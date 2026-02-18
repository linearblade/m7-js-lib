# Installation

`m7-js-lib` is distributed as source ES modules in this repository.

## Local source usage

Import directly from `src`:

```js
import lib, { init } from "../../src/index.js";
init();
```

or:

```js
import lib from "../../src/auto.js";
```

## Build-system notes

* Preserve ESM module semantics.
* Avoid bundling duplicate copies of the library where singleton identity matters.
* Choose one entrypoint strategy (`index.js` explicit init, or `auto.js` auto-init) per integration boundary.

## Runtime dependencies

No third-party package dependency is required for core operation.

DOM-dependent helpers require browser DOM APIs.
