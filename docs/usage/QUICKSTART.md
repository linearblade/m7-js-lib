# Quick Start

## 1) Explicit lifecycle (recommended)

```js
import lib, { init } from "../../src/index.js";

init();

const tags = lib.array.to("a b c", /\s+/);
const enabled = lib.bool.yes("true");
```

Use this mode when import-time side effects are not desired.

## 2) Auto bootstrap (convenience)

```js
import lib from "../../src/auto.js";

const value = lib.number.toInt("42");
```

`auto.js` calls `init()` during import.

## 3) Extension posture

If you add new modules, attach them after core initialization and preserve singleton identity:

```js
import lib, { init } from "../../src/index.js";

init();
lib.myModule = makeMyModule(lib);
```

## Next

Read [Installation](./INSTALLATION.md), [Requirements](./REQUIREMENTS.md), and [Entrypoint Contract](../entrypoints-contract.md).
