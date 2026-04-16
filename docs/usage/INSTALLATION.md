# Installation

`m7-js-lib` is distributed as source ES modules in this repository, with optional versioned `dist/` bundles you can generate locally.

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

## Versioned dist bundles

Build both bundle sets from repo root:

```bash
npm run build
```

This emits:

* `dist/nomap/m7.bundle.v<version>.min.js`
* `dist/nomap/m7.auto.bundle.v<version>.min.js`
* `dist/map/m7.bundle.v<version>.min.js`
* `dist/map/m7.bundle.v<version>.min.js.map`
* `dist/map/m7.auto.bundle.v<version>.min.js`
* `dist/map/m7.auto.bundle.v<version>.min.js.map`

Use the explicit-lifecycle bundle when you want side-effect-free import:

```js
import lib, { init } from "../../dist/nomap/m7.bundle.v1.0.0.min.js";

init();
```

Use the auto-bootstrap bundle when you want import-time initialization:

```js
import lib from "../../dist/nomap/m7.auto.bundle.v1.0.0.min.js";
```

## Build-system notes

* Preserve ESM module semantics.
* Avoid bundling duplicate copies of the library where singleton identity matters.
* Choose one entrypoint strategy (`index.js` explicit init, or `auto.js` auto-init) per integration boundary.
* `npm run build` emits both `dist/nomap` and `dist/map`.

## Runtime dependencies

No third-party package dependency is required for core operation.

DOM-dependent helpers require browser DOM APIs.
